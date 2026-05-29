import { getDocumentProxy, extractText } from "unpdf";
import { createWorker } from "tesseract.js";

const TEXT_MIME_PREFIX = "text/";
const PDF_MIME_TYPES = new Set(["application/pdf"]);

const safeBufferToUtf8 = (buffer) => {
  if (!buffer || buffer.length === 0) return "";
  return buffer.toString("utf8");
};

const buildEmptyResult = (sourceType, extraMetadata = {}) => ({
  content: "",
  metadata: {
    sourceType,
    extracted: false,
    empty: true,
    ...extraMetadata,
  },
});

const buildErrorResult = (sourceType, error, extraMetadata = {}) => ({
  content: "",
  metadata: {
    sourceType,
    extracted: false,
    error: error instanceof Error ? error.message : String(error),
    ...extraMetadata,
  },
});

/**
 * Extract text from a PDF buffer using unpdf.
 */
export const extractPdfContent = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    return buildEmptyResult("pdf");
  }

  // unpdf getDocumentProxy expects a Uint8Array
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const content = (text || "").trim();

  return {
    content,
    metadata: {
      sourceType: "pdf",
      extracted: true,
      empty: content.length === 0,
      pageCount: totalPages ?? null,
      wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
      info: null,
    },
  };
};

/**
 * Extract UTF-8 text from a plain text buffer.
 */
export const extractTextContent = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    return buildEmptyResult("text");
  }

  const content = safeBufferToUtf8(buffer).trimEnd();

  return {
    content,
    metadata: {
      sourceType: "text",
      extracted: true,
      empty: content.length === 0,
      wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
    },
  };
};

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 */
export const extractImageContent = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    return buildEmptyResult("image");
  }

  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(buffer);
    const content = (result.data.text || "").trim();
    const confidence = Number.isFinite(result.data.confidence)
      ? result.data.confidence
      : null;

    return {
      content,
      metadata: {
        sourceType: "image",
        extracted: true,
        empty: content.length === 0,
        ocrConfidence: confidence,
        wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
      },
    };
  } finally {
    await worker.terminate();
  }
};

/**
 * Route the buffer to the correct extractor based on MIME type.
 * Always returns a safe object and never throws for extraction failures.
 */
export const extractFileContent = async (buffer, mimeType) => {
  const normalizedMimeType = (mimeType || "").toLowerCase();

  try {
    if (!buffer || buffer.length === 0) {
      return buildEmptyResult("empty", { mimeType: normalizedMimeType });
    }

    if (PDF_MIME_TYPES.has(normalizedMimeType)) {
      return await extractPdfContent(buffer);
    }

    if (normalizedMimeType.startsWith(TEXT_MIME_PREFIX)) {
      return await extractTextContent(buffer);
    }

    if (normalizedMimeType.startsWith("image/")) {
      return await extractImageContent(buffer);
    }

    return buildErrorResult(
      "unknown",
      new Error(`Unsupported MIME type: ${mimeType || "unknown"}`),
      { mimeType: normalizedMimeType },
    );
  } catch (error) {
    return buildErrorResult(
      normalizedMimeType.startsWith("image/")
        ? "image"
        : normalizedMimeType === "application/pdf"
          ? "pdf"
          : normalizedMimeType.startsWith(TEXT_MIME_PREFIX)
            ? "text"
            : "unknown",
      error,
      { mimeType: normalizedMimeType },
    );
  }
};

/**
 * Find every case-insensitive occurrence of `query` inside `content`.
 * Returns the matched text, absolute position, and a 50-character context window.
 */
export const searchContent = (content, query, contextSize = 50) => {
  const source = typeof content === "string" ? content : "";
  const needle = typeof query === "string" ? query.trim() : "";

  if (!source || !needle) return [];

  const lowerSource = source.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const matches = [];
  let searchIndex = 0;

  while (searchIndex <= lowerSource.length) {
    const position = lowerSource.indexOf(lowerNeedle, searchIndex);
    if (position === -1) break;

    const matchEnd = position + needle.length;
    const contextStart = Math.max(0, position - contextSize);
    const contextEnd = Math.min(source.length, matchEnd + contextSize);
    const context = source.slice(contextStart, contextEnd);

    matches.push({
      match: source.slice(position, matchEnd),
      position,
      context,
      matchStart: position - contextStart,
      matchEnd: matchEnd - contextStart,
    });

    searchIndex = position + Math.max(1, needle.length);
  }

  return matches;
};

export default {
  extractFileContent,
  extractPdfContent,
  extractTextContent,
  extractImageContent,
  searchContent,
};
