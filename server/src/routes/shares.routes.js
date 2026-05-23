import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { createShare, listShares } from "../controllers/share.controller.js";

const router = express.Router();

router.post("/", authenticate, createShare);
router.get("/", authenticate, listShares);

export default router;
