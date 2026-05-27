import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { extractFileContent } from "../utils/content-extractor.js";
import { embedFileSemanticContent } from "../utils/semantic-indexer.js";

const MAX_USER_STORAGE = 1 * 1024 * 1024 * 1024; // 1 GB

const getDownloadFormat = (file) => {
  const extension = path
    .extname(file.originalFileName || "")
    .slice(1)
    .toLowerCase();
  if (extension) return extension;

  const mimeType = (file.mimeType || "").toLowerCase();
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "text/plain") return "txt";

  return "bin";
};

const uploadBufferToCloudinary = (file, userId) =>
  new Promise((resolve, reject) => {
    const publicId = `rapidrise/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "rapidrise/files",
        public_id: publicId,
        use_filename: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    uploadStream.end(file.buffer);
  });

const streamDownload = async (res, file) => {
  const downloadUrl = cloudinary.utils.private_download_url(
    file.cloudinaryPublicId,
    getDownloadFormat(file),
    {
      resource_type: file.cloudinaryResourceType || "raw",
      type: "upload",
      attachment: true,
    },
  );

  const response = await fetch(downloadUrl);
  if (!response.ok || !response.body) {
    throw new Error(
      `Unable to download file from Cloudinary (${response.status})`,
    );
  }

  res.set("Content-Type", file.mimeType);
  res.set(
    "Content-Disposition",
    `attachment; filename="${file.originalFileName}"`,
  );
  res.set("Access-Control-Expose-Headers", "Content-Disposition");

  await pipeline(Readable.fromWeb(response.body), res);
};

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    // check user storage usage
    const userId = req.user.id;
    const agg = await prisma.file.aggregate({
      _sum: { fileSize: true },
      where: { userId },
    });
    const total = Number(agg._sum.fileSize ?? 0);
    const incomingTotal = req.files.reduce((s, f) => s + f.size, 0);
    if (total + incomingTotal > MAX_USER_STORAGE)
      return res.status(400).json({ message: "User storage quota exceeded" });

    const created = [];
    for (const f of req.files) {
      const cloudinaryResult = await uploadBufferToCloudinary(f, userId);
      const record = await prisma.file.create({
        data: {
          userId,
          originalFileName: f.originalname,
          storedFileName: cloudinaryResult.public_id,
          cloudinaryPublicId: cloudinaryResult.public_id,
          cloudinaryResourceType: cloudinaryResult.resource_type || "raw",
          cloudinaryUrl: cloudinaryResult.secure_url,
          fileSize: BigInt(f.size),
          mimeType: f.mimetype,
        },
      });

      let contentIndexed = false;
      let extractionError = null;
      let semanticIndexed = false;
      let semanticIndexError = null;
      let semanticCaption = null;
      let semanticLabels = [];
      const extracted = await extractFileContent(f.buffer, f.mimetype);

      try {
        const extractedContent = extracted?.content || "";
        const searchIndex = extractedContent.trim().toLowerCase();
        const hasExtractableText = extractedContent.trim().length > 0;

        if (hasExtractableText) {
          await prisma.fileContent.create({
            data: {
              fileId: record.id,
              content: extractedContent,
              searchIndex,
              wordCount: extracted?.metadata?.wordCount ?? null,
              pageCount: extracted?.metadata?.pageCount ?? null,
              ocrConfidence: extracted?.metadata?.ocrConfidence ?? null,
              language: extracted?.metadata?.language ?? null,
            },
          });
        } else {
          extractionError = new Error(
            "No extractable text found for this file",
          );
        }

        contentIndexed = hasExtractableText;
      } catch (error) {
        extractionError = error;
        console.error("Content extraction failed", {
          fileId: record.id,
          fileName: record.originalFileName,
          mimeType: record.mimeType,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        const semanticResult = await embedFileSemanticContent({
          buffer: f.buffer,
          mimeType: f.mimetype,
          extractedContent: extracted?.content || "",
          originalFileName: record.originalFileName,
        });

        if (semanticResult?.embedding) {
          semanticCaption = semanticResult.caption || null;
          semanticLabels = Array.isArray(semanticResult.labels)
            ? semanticResult.labels
            : [];

          await prisma.fileEmbedding.upsert({
            where: { fileId: record.id },
            create: {
              fileId: record.id,
              model: process.env.COHERE_EMBED_MODEL || "embed-v4.0",
              inputType: semanticResult.inputType,
              embeddingKind: semanticResult.embeddingKind,
              caption: semanticCaption,
              labels: semanticLabels,
              dimensions: Array.isArray(semanticResult.embedding)
                ? semanticResult.embedding.length
                : null,
              vector: semanticResult.embedding,
            },
            update: {
              model: process.env.COHERE_EMBED_MODEL || "embed-v4.0",
              inputType: semanticResult.inputType,
              embeddingKind: semanticResult.embeddingKind,
              caption: semanticCaption,
              labels: semanticLabels,
              dimensions: Array.isArray(semanticResult.embedding)
                ? semanticResult.embedding.length
                : null,
              vector: semanticResult.embedding,
            },
          });

          semanticIndexed = true;
        }
      } catch (error) {
        semanticIndexError = error;
        console.error("Semantic embedding failed", {
          fileId: record.id,
          fileName: record.originalFileName,
          mimeType: record.mimeType,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      created.push({
        id: record.id,
        originalFileName: record.originalFileName,
        fileSize: Number(record.fileSize),
        mimeType: record.mimeType,
        createdAt: record.createdAt,
        downloadUrl: `/api/files/${record.id}/download`,
        contentIndexed,
        semanticIndexed,
        caption: semanticCaption,
        labels: semanticLabels,
        contentIndexError: extractionError
          ? extractionError instanceof Error
            ? extractionError.message
            : String(extractionError)
          : null,
        semanticIndexError: semanticIndexError
          ? semanticIndexError instanceof Error
            ? semanticIndexError.message
            : String(semanticIndexError)
          : null,
      });
    }

    res.status(201).json({
      message: "Files uploaded",
      files: created,
      contentIndexed: created.some((file) => file.contentIndexed),
      semanticIndexed: created.some((file) => file.semanticIndexed),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload error" });
  }
};

const listFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.q || "";

    const where = { userId };
    if (search)
      where.originalFileName = { contains: search, mode: "insensitive" };

    const [rows, count] = await Promise.all([
      prisma.file.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.file.count({ where }),
    ]);

    const files = rows.map((f) => ({ ...f, fileSize: Number(f.fileSize) }));

    res.json({ files, total: count, page, pageSize: limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "List error" });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    await streamDownload(res, file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download error" });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    if (file.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
          resource_type: file.cloudinaryResourceType || "raw",
        });
      } catch (e) {
        console.error("cloudinary delete error", e);
      }
    }
    // remove dependent records first to avoid FK constraint errors
    try {
      await prisma.fileShare.deleteMany({ where: { fileId: id } });
    } catch (e) {
      console.error("Failed to delete related FileShare records", e);
    }
    try {
      await prisma.fileContent.deleteMany({ where: { fileId: id } });
    } catch (e) {
      console.error("Failed to delete related FileContent records", e);
    }
    try {
      await prisma.fileEmbedding.deleteMany({ where: { fileId: id } });
    } catch (e) {
      console.error("Failed to delete related FileEmbedding records", e);
    }

    await prisma.file.delete({ where: { id } });
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete error" });
  }
};

export { uploadFiles, listFiles, downloadFile, deleteFile };
