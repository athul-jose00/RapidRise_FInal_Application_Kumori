import express from "express";
import { publicShare } from "../controllers/share.controller.js";
import prisma from "../config/prisma.js";
import { streamDownload } from "../controllers/file.controller.js";

const router = express.Router();

const isPrematureCloseError = (err) =>
  err?.code === "ERR_STREAM_PREMATURE_CLOSE" ||
  err?.code === "ECONNRESET" ||
  String(err?.message || "")
    .toLowerCase()
    .includes("premature close");

// Public access: view share info
router.get("/share/:token", publicShare);

// Public download endpoint by token
router.get("/share/:token/download", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    const { token } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { token } });
    if (!share)
      return res.status(404).json({ message: "Invalid or expired link" });
    if (share.revokedAt)
      return res
        .status(410)
        .json({ message: "This share link has been revoked" });
    if (share.expiresAt < new Date())
      return res.status(410).json({ message: "Link expired" });

    const file = await prisma.file.findUnique({ where: { id: share.fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!share.openedAt)
      await prisma.fileShare.update({
        where: { id: share.id },
        data: { openedAt: new Date() },
      });

    const inline = req.query.inline === "true";
    await streamDownload(res, file, inline);
  } catch (err) {
    if (!isPrematureCloseError(err)) console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

export default router;
