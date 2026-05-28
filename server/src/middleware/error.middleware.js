const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  const message = String(err?.message || "");
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size too large. Please upload a smaller file.",
    });
  }

  if (
    message.toLowerCase().includes("upgrade your plan") ||
    message.toLowerCase().includes("file limit") ||
    message.toLowerCase().includes("file too large")
  ) {
    return res.status(400).json({
      message: "File size too large. Please upload a smaller file.",
    });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
};

export default errorHandler;
