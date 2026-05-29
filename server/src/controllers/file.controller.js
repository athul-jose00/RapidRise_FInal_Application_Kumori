import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import supabase from "../config/supabase.js";
import crypto from "crypto";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
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

const uploadBufferToSupabase = async (file, userId) => {
  if (!supabase) throw new Error("Supabase not configured");
  const bucket = process.env.SUPABASE_BUCKET_NAME || "files";
  const extension =
    path.extname(file.originalname || "").replace(/^\./, "") || "bin";
  const objectPath = `rapidrise/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  // create signed url for download access (short lived)
  const { data: urlData, error: urlErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60 * 60); // 1 hour

  if (urlErr) throw urlErr;

  return { path: objectPath, publicUrl: urlData?.signedUrl || null };
};

const saveBufferToLocal = async (file, userId) => {
  const extension =
    path.extname(file.originalname || "").replace(/^\./, "") || "bin";
  const objectPath = `rapidrise/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
  const uploadsRoot = path.join(process.cwd(), "server", "uploads");
  const fullPath = path.join(uploadsRoot, objectPath);
  await fsp.mkdir(path.dirname(fullPath), { recursive: true });
  await fsp.writeFile(fullPath, file.buffer);
  // publicUrl served via express static /uploads
  return { path: objectPath, publicUrl: `/uploads/${objectPath}` };
};

const normalizeUploadError = (err) => {
  const message = String(err?.message || err || "");

  if (err?.code === "LIMIT_FILE_SIZE") {
    return {
      status: 400,
      message: "File size too large. Please upload a smaller file.",
    };
  }

  if (
    message.toLowerCase().includes("upgrade your plan") ||
    message.toLowerCase().includes("file limit") ||
    message.toLowerCase().includes("file too large")
  ) {
    return {
      status: 400,
      message: "File size too large. Please upload a smaller file.",
    };
  }

  return { status: 500, message: "Upload error" };
};

const isPrematureCloseError = (err) =>
  err?.code === "ERR_STREAM_PREMATURE_CLOSE" ||
  err?.code === "ECONNRESET" ||
  String(err?.message || "").toLowerCase().includes("premature close");

const streamDownload = async (res, file, inline = false) => {
  const disposition = inline ? "inline" : "attachment";
  // If file stored locally
  if (file.storageBackend === "local" && file.storedFileName) {
    const fullPath = path.join(
      process.cwd(),
      "server",
      "uploads",
      file.storedFileName,
    );
    if (!fs.existsSync(fullPath)) throw new Error("Local file not found");

    const readStream = fs.createReadStream(fullPath);
    res.set("Content-Type", file.mimeType);
    res.set(
      "Content-Disposition",
      `${disposition}; filename="${file.originalFileName}"`,
    );
    res.set("Access-Control-Expose-Headers", "Content-Disposition");
    try {
      await pipeline(readStream, res);
    } catch (err) {
      if (!isPrematureCloseError(err)) throw err;
    }
    return;
  }

  // If file stored in Supabase, generate a signed URL and stream
  if (file.storageBackend === "supabase" && file.supabasePath) {
    const bucket = process.env.SUPABASE_BUCKET_NAME || "files";
    const { data: urlData, error: urlErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(file.supabasePath, 60 * 60);

    if (urlErr) throw urlErr;
    const signedUrl = urlData?.signedUrl;
    if (!signedUrl) throw new Error("Unable to generate Supabase signed URL");

    const response = await fetch(signedUrl);
    if (!response.ok || !response.body) {
      throw new Error(
        `Unable to download file from Supabase (${response.status})`,
      );
    }

    res.set("Content-Type", file.mimeType);
    res.set(
      "Content-Disposition",
      `${disposition}; filename="${file.originalFileName}"`,
    );
    res.set("Access-Control-Expose-Headers", "Content-Disposition");

    try {
      await pipeline(Readable.fromWeb(response.body), res);
    } catch (err) {
      if (!isPrematureCloseError(err)) throw err;
    }
    return;
  }

  // default: Cloudinary
  const downloadUrl = cloudinary.utils.private_download_url(
    file.cloudinaryPublicId,
    getDownloadFormat(file),
    {
      resource_type: file.cloudinaryResourceType || "raw",
      type: "upload",
      attachment: !inline,
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
    `${disposition}; filename="${file.originalFileName}"`,
  );
  res.set("Access-Control-Expose-Headers", "Content-Disposition");

  try {
    await pipeline(Readable.fromWeb(response.body), res);
  } catch (err) {
    if (!isPrematureCloseError(err)) throw err;
  }
};

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    // check user storage usage
    const userId = req.user.id;
    const agg = await prisma.file.aggregate({
      _sum: { fileSize: true },
      where: { userId, isTrashed: false },
    });
    const total = Number(agg._sum.fileSize ?? 0);
    const incomingTotal = req.files.reduce((s, f) => s + f.size, 0);
    if (total + incomingTotal > MAX_USER_STORAGE)
      return res.status(400).json({ message: "User storage quota exceeded" });

    const created = [];
    const hostedFlag = String(process.env.HOSTED || "true").toLowerCase();
    const hosted = hostedFlag !== "false" && hostedFlag !== "0";

    for (const f of req.files) {
      // choose backend based on mime type
      const docTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      let recordData = {
        userId,
        originalFileName: f.originalname,
        fileSize: BigInt(f.size),
        mimeType: f.mimetype,
      };

      if (!hosted) {
        // local storage
        const localRes = await saveBufferToLocal(f, userId);
        recordData = {
          ...recordData,
          storageBackend: "local",
          storedFileName: localRes.path,
          supabasePath: null,
          cloudinaryPublicId: null,
          cloudinaryResourceType: null,
          cloudinaryUrl: localRes.publicUrl || null,
        };
      } else if (docTypes.includes(f.mimetype)) {
        // upload to Supabase
        const supaRes = await uploadBufferToSupabase(f, userId);
        recordData = {
          ...recordData,
          storageBackend: "supabase",
          supabasePath: supaRes.path,
          storedFileName: supaRes.path,
          cloudinaryPublicId: null,
          cloudinaryResourceType: null,
          cloudinaryUrl: supaRes.publicUrl || null,
        };
      } else {
        const cloudinaryResult = await uploadBufferToCloudinary(f, userId);
        recordData = {
          ...recordData,
          storageBackend: "cloudinary",
          storedFileName: cloudinaryResult.public_id,
          cloudinaryPublicId: cloudinaryResult.public_id,
          cloudinaryResourceType: cloudinaryResult.resource_type || "raw",
          cloudinaryUrl: cloudinaryResult.secure_url,
        };
      }

      const record = await prisma.file.create({ data: recordData });

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
    const uploadError = normalizeUploadError(err);
    res.status(uploadError.status).json({ message: uploadError.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.q || "";

    const where = { userId, isTrashed: false };
    if (search)
      where.originalFileName = { contains: search, mode: "insensitive" };

    const [rows, count] = await Promise.all([
      prisma.file.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          shares: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fileContent: true,
        },
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

    const inline = req.query.inline === "true";
    await streamDownload(res, file, inline);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Download error" });
    }
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    // remove public shares so links no longer work
    try {
      await prisma.fileShare.deleteMany({ where: { fileId: id } });
    } catch (e) {
      console.error("Failed to delete related FileShare records", e);
    }

    // soft-delete: mark trashed and set trashedAt; keep cloudinary object for possible restore
    await prisma.file.update({
      where: { id },
      data: { isTrashed: true, trashedAt: new Date() },
    });
    res.json({ message: "File moved to trash" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete error" });
  }
};

const listTrashedFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.file.findMany({
      where: { userId, isTrashed: true },
      orderBy: { trashedAt: "desc" },
      include: {
        shares: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        fileContent: true,
      },
    });
    const files = rows.map((f) => ({ ...f, fileSize: Number(f.fileSize) }));
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "List trash error" });
  }
};

const restoreFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });
    if (!file.isTrashed)
      return res.status(400).json({ message: "File is not in trash" });

    // compute current used storage (exclude trashed)
    const agg = await prisma.file.aggregate({
      _sum: { fileSize: true },
      where: { userId: req.user.id, isTrashed: false },
    });
    const used = Number(agg._sum.fileSize ?? 0);
    const fileSize = Number(file.fileSize);
    if (used + fileSize > MAX_USER_STORAGE) {
      return res.status(400).json({
        message:
          "Restore would exceed your storage quota. Free space or upgrade first.",
      });
    }

    await prisma.file.update({
      where: { id },
      data: { isTrashed: false, trashedAt: null },
    });
    res.json({ message: "File restored" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Restore error" });
  }
};

const purgeFileAssets = async (file) => {
  try {
    await prisma.fileShare.deleteMany({ where: { fileId: file.id } });
  } catch (e) {
    console.error("Failed to delete related FileShare records", e);
  }

  try {
    await prisma.fileContent.deleteMany({ where: { fileId: file.id } });
  } catch (e) {
    console.error("Failed to delete related FileContent records", e);
  }

  try {
    await prisma.fileEmbedding.deleteMany({ where: { fileId: file.id } });
  } catch (e) {
    console.error("Failed to delete related FileEmbedding records", e);
  }

  if (file.storageBackend === "supabase" && file.supabasePath) {
    try {
      const bucket = process.env.SUPABASE_BUCKET_NAME || "files";
      await supabase.storage.from(bucket).remove([file.supabasePath]);
    } catch (e) {
      console.error("supabase delete error", e);
    }
  } else if (file.storageBackend === "local" && file.storedFileName) {
    try {
      const fullPath = path.join(
        process.cwd(),
        "server",
        "uploads",
        file.storedFileName,
      );
      await fsp.unlink(fullPath).catch(() => {});
    } catch (e) {
      console.error("local delete error", e);
    }
  } else if (file.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
        resource_type: file.cloudinaryResourceType || "raw",
      });
    } catch (e) {
      console.error("cloudinary delete error", e);
    }
  }
};

const permanentlyDeleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });
    if (!file.isTrashed)
      return res
        .status(400)
        .json({ message: "File must be in trash before permanent deletion" });

    await purgeFileAssets(file);
    await prisma.file.delete({ where: { id } });

    res.json({ message: "File permanently deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Permanent delete error" });
  }
};

export {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
  listTrashedFiles,
  restoreFile,
  permanentlyDeleteFile,
  streamDownload,
};
