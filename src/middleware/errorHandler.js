// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
//  Taruh ini paling bawah di app.js:
//  app.use(errorHandler);
// ─────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  // Log error di server (jangan tampil ke user di production)
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error(`[${new Date().toISOString()}] ERROR`);
  console.error(`Route  : ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Tentukan status code
  const statusCode = err.statusCode || err.status || 500;

  // Jangan bocorkan detail error di production
  const isDev = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    success: false,
    message: err.message || "Terjadi kesalahan pada server",
    ...(isDev && { stack: err.stack }),
  });
};

// ─────────────────────────────────────────────
//  404 HANDLER
//  Taruh sebelum errorHandler di app.js:
//  app.use(notFound);
// ─────────────────────────────────────────────

const notFound = (req, res, next) => {
  const err = new Error(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFound };