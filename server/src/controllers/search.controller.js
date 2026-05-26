import prisma from "../config/prisma.js";
import { searchContent } from "../utils/content-extractor.js";

const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSearchTerm = (term) =>
  typeof term === "string" ? term.trim() : "";

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildContentFilter = (query) => ({
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

const buildFileNameFilter = (query) => ({
  originalFileName: {
    contains: query,
    mode: "insensitive",
  },
});

const buildMatches = (file, query) => {
  const matches = [];
  const normalizedQuery = query.toLowerCase();

  if (
    typeof file.originalFileName === "string" &&
    file.originalFileName.toLowerCase().includes(normalizedQuery)
  ) {
    matches.push({
      type: "fileName",
      match: file.originalFileName,
      position: file.originalFileName.toLowerCase().indexOf(normalizedQuery),
      context: file.originalFileName,
      matchStart: file.originalFileName.toLowerCase().indexOf(normalizedQuery),
      matchEnd:
        file.originalFileName.toLowerCase().indexOf(normalizedQuery) +
        normalizedQuery.length,
    });
  }

  const content =
    file.fileContent?.content || file.fileContent?.searchIndex || "";
  const contentMatches = searchContent(content, query).map((match) => ({
    type: "content",
    ...match,
  }));

  matches.push(...contentMatches);

  return matches;
};

const buildBaseWhere = (userId, query, filters = {}) => {
  const where = {
    userId,
    OR: [
      buildFileNameFilter(query),
      {
        fileContent: {
          is: buildContentFilter(query),
        },
      },
    ],
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

const buildFileSearchPayload = (file, query, maxMatches = 5) => {
  const matches = buildMatches(file, query);

  return {
    id: file.id,
    originalFileName: file.originalFileName,
    mimeType: file.mimeType,
    fileSize: Number(file.fileSize),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
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

  const where = buildBaseWhere(userId, normalizedQuery, filters);

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.file.count({ where }),
  ]);

  const results = files.map((file) =>
    buildFileSearchPayload(file, normalizedQuery, previewMatches),
  );

  return {
    query: normalizedQuery,
    page: currentPage,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    files: results,
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
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const matches = buildMatches(file, query);

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
      matchCount: matches.length,
      matches,
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
