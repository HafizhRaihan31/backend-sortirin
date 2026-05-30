const rateLimit = require("express-rate-limit");

// ── GENERAL LIMITER ───────────────────────────────────────
// Semua endpoint: max 500 request per 15 menit per IP
// Cukup untuk user aktif tanpa kena limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 500 : 1000,
  message: {
    success: false,
    message: "Terlalu banyak request, coba lagi dalam 15 menit",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── AUTH LIMITER ──────────────────────────────────────────
// Login: max 20 request per 15 menit per IP
// Cukup untuk user yang salah password beberapa kali
// tapi tetap mencegah brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 100,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login, coba lagi dalam 15 menit",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── SCAN LIMITER ──────────────────────────────────────────
// Scan sampah: max 50 request per 15 menit per IP
// Cukup untuk user yang scan berkali-kali
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 50 : 200,
  message: {
    success: false,
    message: "Terlalu banyak scan, coba lagi dalam 15 menit",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, scanLimiter };