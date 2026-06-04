const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transaksiRoutes = require("./routes/transaksiRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const klasifikasiRoutes = require("./routes/klasifikasiRoutes");
const kategoriRoutes = require("./routes/kategoriRoutes");
const riwayatPoinRoutes = require("./routes/riwayatPoinRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const { generalLimiter, authLimiter, scanLimiter } = require("./middleware/rateLimiter");

const app = express();
app.set("trust proxy", 1);
// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors({
  origin: [
    "https://sortirin.vercel.app",
    "http://sortirin.oxidilily.online",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITER GLOBAL ───────────────────────────────────
app.use(generalLimiter);

// ── STATIC FILES ──────────────────────────────────────────
app.use("/uploads", express.static(path.resolve("uploads")));

// ── ROUTES ────────────────────────────────────────────────
// Auth: hanya login yang kena rate limit ketat
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/klasifikasi", scanLimiter, klasifikasiRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/riwayat-poin", riwayatPoinRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend Sortirin Running 🚀",
    version: "1.0.0",
  });
});

// ── 404 & ERROR HANDLER (harus paling bawah) ─────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
