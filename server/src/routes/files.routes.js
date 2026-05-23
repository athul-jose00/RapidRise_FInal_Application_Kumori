import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
} from "../controllers/file.controller.js";

const router = express.Router();

// multiple files under 'files' field
router.post("/upload", authenticate, upload.array("file", 20), uploadFiles);
router.get("/", authenticate, listFiles);
router.get("/:id/download", authenticate, downloadFile);
router.delete("/:id", authenticate, deleteFile);

export default router;
