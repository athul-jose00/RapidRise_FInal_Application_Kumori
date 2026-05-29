import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import prisma from "./config/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import filesRoutes from "./routes/files.routes.js";
import searchRoutes from "./routes/search.routes.js";
import sharesRoutes from "./routes/shares.routes.js";
import publicRoutes from "./routes/public.routes.js";
import errorHandler from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    crossOriginOpenerPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    exposedHeaders: ["Content-Disposition"],
  }),
);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Serve uploaded files statically (downloads use controllers to enforce auth/access)
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "server", "uploads")),
);

app.get("/", (req, res) => res.send("RapidRise File Sharing API"));

app.use("/api/auth", authRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/shares", sharesRoutes);
app.use("/public", publicRoutes);

// central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// process-level handlers to log unhandled errors for easier debugging
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  // allow process to exit so nodemon can restart with fresh state
  process.exit(1);
});

const start = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma connected");
    const server = app.listen(PORT);
    server.on("error", (err) => {
      console.error("Server listen error:", err && err.stack ? err.stack : err);
      if (err && err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("Prisma connect error:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
};

start();
