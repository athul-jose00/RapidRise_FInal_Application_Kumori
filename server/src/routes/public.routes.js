import express from "express";
import { publicShare } from "../controllers/share.controller.js";
import cloudinary from "../config/cloudinary.js";
import prisma from "../config/prisma.js";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const router = express.Router();

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

const streamCloudinaryDownload = async (res, file) => {
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

// Public access: view share info
router.get("/share/:token", publicShare);

// Public download endpoint by token
router.get("/share/:token/download", async (req, res) => {
  try {
    const { token } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { token } });
    if (!share)
      return res.status(404).json({ message: "Invalid or expired link" });
    if (share.expiresAt < new Date())
      return res.status(410).json({ message: "Link expired" });

    const file = await prisma.file.findUnique({ where: { id: share.fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!share.openedAt)
      await prisma.fileShare.update({
        where: { id: share.id },
        data: { openedAt: new Date() },
      });

    await streamCloudinaryDownload(res, file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
