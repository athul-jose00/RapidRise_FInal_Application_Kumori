import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  searchFiles,
  advancedSearch,
} from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", authenticate, searchFiles);
router.post("/advanced", authenticate, advancedSearch);

export default router;
