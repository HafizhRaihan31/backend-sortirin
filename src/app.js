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

const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES ──────────────────────────────────────────
app.use("/uploads", express.static(path.resolve("uploads")));

// ── ROUTES ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/klasifikasi", klasifikasiRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/riwayat-poin", riwayatPoinRoutes);

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