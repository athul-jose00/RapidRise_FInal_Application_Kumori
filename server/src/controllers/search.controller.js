import prisma from "../config/prisma.js";
import { searchContent } from "../utils/content-extractor.js";
import {
  cosineSimilarity,
  embedSearchQuery,
  semanticMatchThreshold,
} from "../utils/semantic-indexer.js";

const MAX_PAGE_SIZE = 100;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "via",
]);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSearchTerm = (term) =>
  typeof term === "string" ? term.trim() : "";

const tokenizeSearchTerm = (term) =>
  normalizeSearchTerm(term)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildTextMatchFilter = (query) => ({
  OR: [
    {
      content: {
        contains: query,
        mode: "insensitive",
      },
    },
    {
      searchIndex: {
        contains: query,
        mode: "insensitive",
      },
    },
  ],
});

const buildKeywordWhere = (userId, query, tokens, filters = {}) => {
  const orClauses = [
    {
      originalFileName: {
        contains: query,
        mode: "insensitive",
      },
    },
    {
      fileContent: {
        is: buildTextMatchFilter(query),
      },
    },
  ];

  for (const token of tokens) {
    orClauses.push({
      originalFileName: {
        contains: token,
        mode: "insensitive",
      },
    });
    orClauses.push({
      fileContent: {
        is: buildTextMatchFilter(token),
      },
    });
  }

  const where = {
    userId,
    OR: orClauses,
  };

  const fileTypes = normalizeList(filters.fileTypes);
  if (fileTypes.length > 0) {
    where.mimeType = { in: fileTypes.map((type) => type.toLowerCase()) };
  }

  const fromDate = parseDateValue(filters?.dateRange?.from);
  const toDate = parseDateValue(filters?.dateRange?.to);
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  return where;
};

const getEmbeddingVector = (fileEmbedding) => {
  if (!fileEmbedding || !Array.isArray(fileEmbedding.vector)) {
    return [];
  }

  return fileEmbedding.vector
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
};

const getKeywordMatches = (file, query) => {
  const matches = [];
  const normalizedQuery = query.toLowerCase();

  if (
    typeof file.originalFileName === "string" &&
    file.originalFileName.toLowerCase().includes(normalizedQuery)
  ) {
    const fileName = file.originalFileName;
    const matchIndex = fileName.toLowerCase().indexOf(normalizedQuery);

    matches.push({
      type: "fileName",
      match: fileName,
      position: matchIndex,
      context: fileName,
      matchStart: matchIndex,
      matchEnd: matchIndex + normalizedQuery.length,
    });
  }

  const content = file.fileContent?.content || file.fileContent?.searchIndex || "";
  const contentMatches = searchContent(content, query).map((match) => ({
    type: "content",
    ...match,
  }));

  matches.push(...contentMatches);

  return matches;
};

const getSemanticMatch = (file, queryEmbedding, hasKeywordMatches = false) => {
  const fileVector = getEmbeddingVector(file.fileEmbedding);

  if (fileVector.length === 0 || queryEmbedding.length === 0) {
    return null;
  }

  const score = cosineSimilarity(queryEmbedding, fileVector);
  const effectiveThreshold = hasKeywordMatches
    ? semanticMatchThreshold
    : Math.min(semanticMatchThreshold, 0.28);

  if (!Number.isFinite(score) || score < effectiveThreshold) {
    return null;
  }

  return {
    type: "semantic",
    score,
    model: file.fileEmbedding?.model || null,
    inputType: file.fileEmbedding?.inputType || null,
    embeddingKind: file.fileEmbedding?.embeddingKind || null,
  };
};

const buildBaseWhere = (userId, filters = {}) => {
  const where = {
    userId,
  };

  const fileTypes = normalizeList(filters.fileTypes);
  if (fileTypes.length > 0) {
    where.mimeType = { in: fileTypes.map((type) => type.toLowerCase()) };
  }

  const fromDate = parseDateValue(filters?.dateRange?.from);
  const toDate = parseDateValue(filters?.dateRange?.to);
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  return where;
};

const buildFileSearchPayload = ({
  file,
  query,
  queryEmbedding,
  maxMatches = 5,
}) => {
  const keywordMatches = getKeywordMatches(file, query);
  const semanticMatch = getSemanticMatch(
    file,
    queryEmbedding,
    keywordMatches.length > 0,
  );
  const matches = [...keywordMatches, ...(semanticMatch ? [semanticMatch] : [])];

  if (matches.length === 0) {
    return null;
  }

  const keywordScore = keywordMatches.some((match) => match.type === "fileName")
    ? 1
    : keywordMatches.length > 0
      ? 0.9
      : 0;
  const semanticScore = semanticMatch?.score || 0;
  const relevanceScore = Math.max(keywordScore, semanticScore);

  return {
    id: file.id,
    originalFileName: file.originalFileName,
    mimeType: file.mimeType,
    fileSize: Number(file.fileSize),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    semanticScore: semanticMatch?.score || null,
    relevanceScore,
    matchedBy: matches.map((match) => match.type),
    matchCount: matches.length,
    matches: matches.slice(0, maxMatches),
  };
};

const getSearchResults = async ({
  userId,
  query,
  page = 1,
  limit = 20,
  filters = {},
  previewMatches = 5,
}) => {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) {
    const error = new Error("Search query is required");
    error.status = 400;
    throw error;
  }

  const currentPage = parsePositiveInt(page, 1);
  const pageSize = Math.min(parsePositiveInt(limit, 20), MAX_PAGE_SIZE);
  const skip = (currentPage - 1) * pageSize;
  const tokens = tokenizeSearchTerm(normalizedQuery);

  let queryEmbedding = [];
  try {
    queryEmbedding = (await embedSearchQuery(normalizedQuery)) || [];
  } catch (error) {
    console.error("Failed to embed search query", {
      query: normalizedQuery,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const keywordWhere = buildKeywordWhere(userId, normalizedQuery, tokens, filters);

  let files = await prisma.file.findMany({
    where: keywordWhere,
    include: {
      fileContent: {
        select: {
          content: true,
          searchIndex: true,
          wordCount: true,
          pageCount: true,
          ocrConfidence: true,
          language: true,
          extractedAt: true,
        },
      },
      fileEmbedding: {
        select: {
          model: true,
          inputType: true,
          embeddingKind: true,
          dimensions: true,
          vector: true,
        },
      },
    },
  });

  if (files.length === 0) {
    files = await prisma.file.findMany({
      where: buildBaseWhere(userId, filters),
      include: {
        fileContent: {
          select: {
            content: true,
            searchIndex: true,
            wordCount: true,
            pageCount: true,
            ocrConfidence: true,
            language: true,
            extractedAt: true,
          },
        },
        fileEmbedding: {
          select: {
            model: true,
            inputType: true,
            embeddingKind: true,
            dimensions: true,
            vector: true,
          },
        },
      },
    });
  }

  const results = files
    .map((file) =>
      buildFileSearchPayload({
        file,
        query: normalizedQuery,
        queryEmbedding,
        maxMatches: previewMatches,
      }),
    )
    .filter(Boolean)
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  return {
    query: normalizedQuery,
    page: currentPage,
    pageSize,
    total: results.length,
    totalPages: Math.max(1, Math.ceil(results.length / pageSize)),
    files: results.slice(skip, skip + pageSize),
  };
};

const searchFiles = async (req, res) => {
  try {
    const results = await getSearchResults({
      userId: req.user.id,
      query: req.query.q,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json(results);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || "Search failed",
    });
  }
};

const searchFileContent = async (req, res) => {
  try {
    const { fileId } = req.params;
    const query = normalizeSearchTerm(req.query.q);

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        fileContent: {
          select: {
            content: true,
            searchIndex: true,
            wordCount: true,
            pageCount: true,
            ocrConfidence: true,
            language: true,
            extractedAt: true,
          },
        },
        fileEmbedding: {
          select: {
            model: true,
            inputType: true,
            embeddingKind: true,
            dimensions: true,
            vector: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    let queryEmbedding = [];
    try {
      queryEmbedding = (await embedSearchQuery(query)) || [];
    } catch (error) {
      console.error("Failed to embed file search query", {
        fileId,
        query,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const payload = buildFileSearchPayload({
      file,
      query,
      queryEmbedding,
      maxMatches: 20,
    });

    return res.json({
      file: {
        id: file.id,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        fileSize: Number(file.fileSize),
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
      query,
      semanticScore: payload?.semanticScore || null,
      relevanceScore: payload?.relevanceScore || 0,
      matchCount: payload?.matchCount || 0,
      matchedBy: payload?.matchedBy || [],
      matches: payload?.matches || [],
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "File search failed",
    });
  }
};

const advancedSearch = async (req, res) => {
  try {
    const query = normalizeSearchTerm(req.body?.query);
    const filters = req.body?.filters || {};

    const results = await getSearchResults({
      userId: req.user.id,
      query,
      page: 1,
      limit: MAX_PAGE_SIZE,
      filters,
      previewMatches: 5,
    });

    return res.json({
      query,
      filters,
      total: results.total,
      totalPages: results.totalPages,
      files: results.files,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Advanced search failed",
    });
  }
};

export { searchFiles, searchFileContent, advancedSearch };
