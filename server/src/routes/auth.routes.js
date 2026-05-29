import express from "express";
import {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  getAllSessions,
  revokeSession,
  revokeAllOtherSessions,
  updateProfileImage,
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/sessions", authenticate, getAllSessions);
router.delete("/sessions/:sessionId", authenticate, revokeSession);
router.post("/sessions/revoke-others", authenticate, revokeAllOtherSessions);
router.put("/profile-image", authenticate, upload.single("profileImage"), updateProfileImage);

export default router;
