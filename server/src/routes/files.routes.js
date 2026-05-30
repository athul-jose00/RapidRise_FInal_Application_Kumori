import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
  getFileStatus,
} from "../controllers/file.controller.js";
import {
  listTrashedFiles,
  restoreFile,
  permanentlyDeleteFile,
  emptyTrash,
  bulkDeleteFiles,
  bulkPermanentlyDeleteFiles,
  bulkRestoreFiles,
} from "../controllers/file.controller.js";
import { searchFileContent } from "../controllers/search.controller.js";

const router = express.Router();

// multiple files under 'files' field
router.post("/upload", authenticate, upload.array("files", 20), uploadFiles);
router.get("/", authenticate, listFiles);
router.get("/trash", authenticate, listTrashedFiles);
router.delete("/trash/empty", authenticate, emptyTrash);
router.post("/bulk-delete", authenticate, bulkDeleteFiles);
router.post("/bulk-permanent", authenticate, bulkPermanentlyDeleteFiles);
router.post("/bulk-restore", authenticate, bulkRestoreFiles);
router.get("/:id/status", authenticate, getFileStatus);
router.get("/:fileId/search", authenticate, searchFileContent);
router.get("/:id/download", authenticate, downloadFile);
router.post("/:id/restore", authenticate, restoreFile);
router.delete("/:id/permanent", authenticate, permanentlyDeleteFile);
router.delete("/:id", authenticate, deleteFile);

export default router;
