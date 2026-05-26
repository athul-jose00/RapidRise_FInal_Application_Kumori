import https from "node:https";

const COHERE_API_KEY = process.env.COHERE_API_KEY || "";
const COHERE_EMBED_MODEL = process.env.COHERE_EMBED_MODEL || "embed-v4.0";
const COHERE_EMBED_DIMENSION = Number.parseInt(
  process.env.COHERE_EMBED_DIMENSION || "1024",
  10,
);
const COHERE_BASE_URL = process.env.COHERE_BASE_URL || "https://api.cohere.com/v1/embed";
const COHERE_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
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

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

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
            reject(new Error(`Cohere response was not valid JSON: ${error.message}`));
            return;
          }

          if (response.statusCode && response.statusCode >= 400) {
            const message =
              parsedBody?.message || parsedBody?.error || `Cohere request failed with status ${response.statusCode}`;
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
  if (buffer && isImageMimeType(mimeType) && buffer.length <= COHERE_IMAGE_SIZE_LIMIT) {
    return {
      embedding: await embedRequest({
        model: COHERE_EMBED_MODEL,
        images: [
          `data:${mimeType.toLowerCase()};base64,${buffer.toString("base64")}`,
        ],
        input_type: "image",
        output_dimension: COHERE_EMBED_DIMENSION,
        embedding_types: ["float"],
      }),
      embeddingKind: "image",
      inputType: "image",
    };
  }

  const semanticText = [originalFileName, extractedContent]
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
    embeddingKind: isImageMimeType(mimeType) ? "image-text-fallback" : "text",
    inputType: "search_document",
  };
};

export const cosineSimilarity = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) {
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