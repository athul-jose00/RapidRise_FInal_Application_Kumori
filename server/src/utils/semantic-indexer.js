import https from "node:https";

const COHERE_API_KEY = process.env.COHERE_API_KEY || "";
const COHERE_EMBED_MODEL = process.env.COHERE_EMBED_MODEL || "embed-v4.0";
const COHERE_EMBED_DIMENSION = Number.parseInt(
  process.env.COHERE_EMBED_DIMENSION || "1024",
  10,
);
const COHERE_BASE_URL =
  process.env.COHERE_BASE_URL || "https://api.cohere.com/v1/embed";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS || "gemini-1.5-flash,gemini-2.0-flash"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models";
const COHERE_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
const GEMINI_IMAGE_SIZE_LIMIT = Number.parseInt(
  process.env.GEMINI_IMAGE_SIZE_LIMIT || String(10 * 1024 * 1024),
  10,
);
const SEMANTIC_MATCH_THRESHOLD = Number.parseFloat(
  process.env.COHERE_SEMANTIC_THRESHOLD || "0.35",
);
const QUERY_EMBED_CACHE_TTL_MS = Number.parseInt(
  process.env.COHERE_QUERY_CACHE_TTL_MS || String(5 * 60 * 1000),
  10,
);
const queryEmbeddingCache = new Map();

const isImageMimeType = (mimeType) =>
  typeof mimeType === "string" && mimeType.toLowerCase().startsWith("image/");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeEmbedding = (embedding) => {
  if (!Array.isArray(embedding)) return null;

  const normalized = embedding.map((value) => Number(value));
  return normalized.every(Number.isFinite) ? normalized : null;
};

const extractEmbeddingVector = (responseBody) => {
  const embeddings = responseBody?.embeddings;

  if (Array.isArray(embeddings?.float) && embeddings.float.length > 0) {
    return normalizeEmbedding(embeddings.float[0]);
  }

  if (Array.isArray(embeddings) && embeddings.length > 0) {
    return normalizeEmbedding(embeddings[0]);
  }

  if (Array.isArray(responseBody?.embeddings?.[0])) {
    return normalizeEmbedding(responseBody.embeddings[0]);
  }

  return null;
};

const postJson = (url, payload) =>
  new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
      (response) => {
        let responseText = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseText += chunk;
        });
        response.on("end", () => {
          let parsedBody;

          try {
            parsedBody = responseText ? JSON.parse(responseText) : {};
          } catch (error) {
            reject(
              new Error(`Cohere response was not valid JSON: ${error.message}`),
            );
            return;
          }

          if (response.statusCode && response.statusCode >= 400) {
            const message =
              parsedBody?.message ||
              parsedBody?.error ||
              `Cohere request failed with status ${response.statusCode}`;
            reject(new Error(message));
            return;
          }

          resolve(parsedBody);
        });
      },
    );

    request.on("error", reject);
    request.write(requestBody);
    request.end();
  });

const postJsonWithApiKey = (url, apiKey, payload) =>
  new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const request = https.request(
      `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
      (response) => {
        let responseText = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseText += chunk;
        });
        response.on("end", () => {
          let parsedBody;

          try {
            parsedBody = responseText ? JSON.parse(responseText) : {};
          } catch (error) {
            reject(
              new Error(`Gemini response was not valid JSON: ${error.message}`),
            );
            return;
          }

          if (response.statusCode && response.statusCode >= 400) {
            const message =
              parsedBody?.error?.message ||
              parsedBody?.message ||
              `Gemini request failed with status ${response.statusCode}`;
            reject(new Error(message));
            return;
          }

          resolve(parsedBody);
        });
      },
    );

    request.on("error", reject);
    request.write(requestBody);
    request.end();
  });

const buildGeminiUrl = (modelName) =>
  `${GEMINI_BASE_URL}/${modelName}:generateContent`;

const isRetryableGeminiError = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  return /high demand|quota|rate limit|resource exhausted|temporarily unavailable|service unavailable|internal error|unavailable/i.test(
    message,
  );
};

const embedRequest = async (payload) => {
  if (!COHERE_API_KEY) {
    throw new Error("COHERE_API_KEY is required for semantic search");
  }

  const responseBody = await postJson(COHERE_BASE_URL, payload);
  const embedding = extractEmbeddingVector(responseBody);

  if (!embedding) {
    throw new Error("Cohere did not return an embedding vector");
  }

  return embedding;
};

const extractGeminiText = (responseBody) =>
  responseBody?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim() || "";

const parseLabelList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const LABEL_KEYWORDS = [
  ["animal", /\b(animal|horse|dog|cat|bird|cow|sheep|goat|wildlife|pet)\b/],
  [
    "nature",
    /\b(nature|forest|tree|trees|grass|field|meadow|landscape|outdoor|sunlight)\b/,
  ],
  ["wildlife", /\b(wildlife|horse|deer|bird|fox|wolf|elephant|lion|tiger)\b/],
  ["person", /\b(person|people|man|woman|boy|girl|portrait|face)\b/],
  [
    "vehicle",
    /\b(vehicle|car|truck|bus|bike|bicycle|motorcycle|train|airplane)\b/,
  ],
  [
    "document",
    /\b(document|text|paper|receipt|invoice|form|letter|page|screenshot)\b/,
  ],
  ["food", /\b(food|meal|dish|fruit|vegetable|drink|coffee|tea|dessert)\b/],
  [
    "building",
    /\b(building|house|home|architecture|city|street|room|interior)\b/,
  ],
  ["water", /\b(water|ocean|sea|lake|river|beach|shore|wave)\b/],
  ["outdoor", /\b(outdoor|outside|field|forest|mountain|trail|park|garden)\b/],
];

const LABEL_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "around",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "natural",
  "of",
  "on",
  "or",
  "over",
  "scene",
  "the",
  "through",
  "to",
  "with",
]);

const deriveFallbackLabels = ({
  caption,
  originalFileName,
  extractedContent,
}) => {
  const sourceText = [caption, originalFileName, extractedContent]
    .filter(isNonEmptyString)
    .join(" ")
    .toLowerCase();

  if (!sourceText) return [];

  const labels = [];

  for (const [label, pattern] of LABEL_KEYWORDS) {
    if (pattern.test(sourceText)) {
      labels.push(label);
    }
  }

  const tokens = sourceText
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !LABEL_STOP_WORDS.has(token));

  for (const token of tokens) {
    if (!labels.includes(token)) {
      labels.push(token);
    }

    if (labels.length >= 10) break;
  }

  return labels.slice(0, 10);
};

const safeParseJson = (value) => {
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const parseGeminiCaptionText = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return { caption: null, labels: [] };

  const captionMatch = text.match(/caption\s*[:=]\s*(.+?)(?:\n|$)/i);
  const labelsMatch = text.match(/labels\s*[:=]\s*(.+?)(?:\n|$)/i);

  const caption = captionMatch?.[1]?.trim() || null;
  const labels = parseLabelList(labelsMatch?.[1] || []);

  return { caption, labels };
};

const generateImageCaptionWithModel = async ({
  buffer,
  mimeType,
  originalFileName,
  modelName,
}) => {
  const prompt = [
    "You are generating searchable image metadata.",
    'Return ONLY valid JSON with this shape: {"caption": string, "labels": string[] }',
    "Rules:",
    "- caption should be concise and describe the main subject and scene",
    "- labels should contain 5 to 10 broad search-friendly tags",
    "- include broader concepts when useful, for example animal, wildlife, beach, nature, vehicle, person, document",
    "- do not add markdown, code fences, or extra commentary",
    `Original file name: ${originalFileName || "unknown"}`,
  ].join("\n");

  const responseBody = await postJsonWithApiKey(
    buildGeminiUrl(modelName),
    GEMINI_API_KEY,
    {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType.toLowerCase(),
                data: buffer.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    },
  );

  const rawText = extractGeminiText(responseBody);
  const parsedJson = safeParseJson(rawText) || {};
  const parsedText = parseGeminiCaptionText(rawText);
  const caption = isNonEmptyString(parsedJson.caption)
    ? parsedJson.caption.trim()
    : parsedText.caption || rawText;
  const labels =
    parseLabelList(parsedJson.labels).length > 0
      ? parseLabelList(parsedJson.labels)
      : parsedText.labels;

  const fallbackLabels =
    labels.length > 0
      ? labels
      : deriveFallbackLabels({
          caption,
          originalFileName,
          extractedContent: "",
        });

  return {
    caption,
    labels: fallbackLabels,
    rawText,
    model: modelName,
  };
};

export const generateImageCaption = async ({
  buffer,
  mimeType,
  originalFileName,
}) => {
  if (!buffer || !isImageMimeType(mimeType) || buffer.length === 0) {
    return null;
  }

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for image captions");
  }

  if (buffer.length > GEMINI_IMAGE_SIZE_LIMIT) {
    throw new Error("Image is too large for Gemini captioning");
  }

  const modelCandidates = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS]
    .map((model) => model.trim())
    .filter(Boolean)
    .filter((model, index, list) => list.indexOf(model) === index);

  let lastError = null;
  for (const modelName of modelCandidates) {
    try {
      return await generateImageCaptionWithModel({
        buffer,
        mimeType,
        originalFileName,
        modelName,
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }

      console.error("Gemini caption model failed, trying fallback", {
        modelName,
        fileName: originalFileName,
        mimeType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw lastError || new Error("Gemini caption generation failed");
};

export const embedSearchQuery = async (query) => {
  if (!isNonEmptyString(query)) return null;

  const cacheKey = query.trim().toLowerCase();
  const cached = queryEmbeddingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.embedding;
  }

  const embedding = await embedRequest({
    model: COHERE_EMBED_MODEL,
    texts: [query.trim()],
    input_type: "search_query",
    output_dimension: COHERE_EMBED_DIMENSION,
    embedding_types: ["float"],
  });

  queryEmbeddingCache.set(cacheKey, {
    embedding,
    expiresAt: Date.now() + QUERY_EMBED_CACHE_TTL_MS,
  });

  return embedding;
};

export const embedFileSemanticContent = async ({
  buffer,
  mimeType,
  extractedContent,
  originalFileName,
}) => {
  let captionData = null;

  if (
    buffer &&
    isImageMimeType(mimeType) &&
    buffer.length <= COHERE_IMAGE_SIZE_LIMIT
  ) {
    try {
      captionData = await generateImageCaption({
        buffer,
        mimeType,
        originalFileName,
      });
    } catch (error) {
      console.error("Gemini image caption failed", {
        fileName: originalFileName,
        mimeType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const semanticText = [
    originalFileName,
    captionData?.caption,
    Array.isArray(captionData?.labels) ? captionData.labels.join(" ") : "",
    extractedContent,
  ]
    .filter(isNonEmptyString)
    .map((value) => value.trim())
    .join("\n\n");

  if (!semanticText) {
    return null;
  }

  return {
    embedding: await embedRequest({
      model: COHERE_EMBED_MODEL,
      texts: [semanticText],
      input_type: "search_document",
      output_dimension: COHERE_EMBED_DIMENSION,
      embedding_types: ["float"],
    }),
    embeddingKind: isImageMimeType(mimeType) ? "image-caption" : "text",
    inputType: "search_document",
    caption: captionData?.caption || null,
    labels: Array.isArray(captionData?.labels) ? captionData.labels : [],
  };
};

export const cosineSimilarity = (left, right) => {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length === 0 ||
    right.length === 0
  ) {
    return 0;
  }

  const length = Math.min(left.length, right.length);
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = Number(left[index]);
    const rightValue = Number(right[index]);

    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
      continue;
    }

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

export const semanticMatchThreshold = SEMANTIC_MATCH_THRESHOLD;

export default {
  embedSearchQuery,
  embedFileSemanticContent,
  cosineSimilarity,
  semanticMatchThreshold,
};
