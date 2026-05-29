import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { createShare, listShares, revokeShare, deleteShare, restoreShare } from "../controllers/share.controller.js";

const router = express.Router();

router.post("/", authenticate, createShare);
router.get("/", authenticate, listShares);
router.delete("/:id", authenticate, revokeShare);
router.delete("/:id/permanent", authenticate, deleteShare);
router.post("/:id/restore", authenticate, restoreShare);

export default router;
