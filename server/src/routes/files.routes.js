import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
} from "../controllers/file.controller.js";
import {
  listTrashedFiles,
  restoreFile,
  permanentlyDeleteFile,
} from "../controllers/file.controller.js";
import { searchFileContent } from "../controllers/search.controller.js";

const router = express.Router();

// multiple files under 'files' field
router.post("/upload", authenticate, upload.array("files", 20), uploadFiles);
router.get("/", authenticate, listFiles);
router.get("/trash", authenticate, listTrashedFiles);
router.get("/:fileId/search", authenticate, searchFileContent);
router.get("/:id/download", authenticate, downloadFile);
router.post("/:id/restore", authenticate, restoreFile);
router.delete("/:id/permanent", authenticate, permanentlyDeleteFile);
router.delete("/:id", authenticate, deleteFile);

export default router;
