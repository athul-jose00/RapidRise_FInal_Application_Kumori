import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetEmail } from "../utils/email.js";
import cloudinary from "../config/cloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|<>]/;

const durationToMs = (duration) => {
  const value = String(duration || "").trim();
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

// Short-lived access token
const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

// Create a refresh token and session record (7 days)
const generateRefreshToken = async (userId, ipAddress, userAgent) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(
    Date.now() + durationToMs(REFRESH_TOKEN_EXPIRES_IN),
  );

  await prisma.session.create({
    data: {
      userId,
      refreshToken: token,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  return token;
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!SPECIAL_CHAR_PATTERN.test(password)) {
    return "Password must include at least one special character";
  }

  return null;
};

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      dateOfBirth,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !dateOfBirth
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    // Issue access token and refresh session on register so client can stay logged in
    const accessToken = generateAccessToken(user);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");
    const refreshToken = await generateRefreshToken(
      user.id,
      ipAddress,
      userAgent,
    );

    return res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      },
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No account found for that email address" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ message: "Incorrect password. Please try again" });
    }

    // Issue access + refresh (create session)
    const accessToken = generateAccessToken(user);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");
    const refreshToken = await generateRefreshToken(
      user.id,
      ipAddress,
      userAgent,
    );

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All fields required" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(400).json({ message: "Old password incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res
        .status(200)
        .json({ message: "If that email exists, a reset was sent" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    try {
      await sendResetEmail(email, resetUrl);
    } catch (mailError) {
      console.error("Password reset email failed:", mailError);
      return res.status(502).json({
        message: "Reset token created, but the email could not be sent",
      });
    }

    return res.json({ message: "If that email exists, a reset was sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All fields required" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date())
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Exchange a refresh token for a new access token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session)
      return res.status(403).json({ message: "Invalid refresh token" });

    if (!session.isActive)
      return res.status(403).json({ message: "Session is no longer active" });

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res
        .status(403)
        .json({ message: "Refresh token expired, please login again" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) return res.status(403).json({ message: "User not found" });

    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    const accessToken = generateAccessToken(user);

    return res.status(200).json({ message: "Token refreshed", accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Logout: revoke a specific refresh token / session
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token is required" });

    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    await prisma.session.delete({ where: { id: session.id } });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await prisma.session.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Active sessions retrieved",
        sessions,
        totalSessions: sessions.length,
      });
  } catch (err) {
    console.error("Get sessions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId)
      return res.status(404).json({ message: "Session not found" });
    await prisma.session.delete({ where: { id: sessionId } });
    return res
      .status(200)
      .json({ success: true, message: "Session revoked successfully" });
  } catch (err) {
    console.error("Revoke session error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentRefreshToken } = req.body;
    if (!currentRefreshToken)
      return res
        .status(400)
        .json({ message: "Current refresh token required" });

    await prisma.session.deleteMany({
      where: { userId, refreshToken: { not: currentRefreshToken } },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "All other sessions revoked successfully",
      });
  } catch (err) {
    console.error("Revoke all sessions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "kumori-profiles",
        resource_type: "image",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ message: "Image upload failed" });
        }
        
        try {
          const user = await prisma.user.update({
            where: { id: userId },
            data: { profileImage: result.secure_url },
          });

          return res.status(200).json({
            message: "Profile image updated",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImage,
            }
          });
        } catch (dbError) {
          console.error("Database update error:", dbError);
          return res.status(500).json({ message: "Failed to update profile image in database" });
        }
      }
    );

    // Write the buffer to the upload stream
    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error("Profile image update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
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
};
