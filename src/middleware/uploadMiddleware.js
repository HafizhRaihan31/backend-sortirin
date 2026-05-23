const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── HELPER: Buat folder jika belum ada ───────────────────
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ── STORAGE ENGINE ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan folder berdasarkan route
    let folder = "uploads/misc";

    if (req.baseUrl.includes("rewards")) {
      folder = "uploads/rewards";
    } else if (req.baseUrl.includes("klasifikasi")) {
      folder = "uploads/klasifikasi";
    } else if (req.baseUrl.includes("users")) {
      folder = "uploads/profiles";
    }

    ensureDir(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

// ── FILE FILTER: Hanya gambar ─────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP"),
      false
    );
  }
};

// ── EXPORT MULTER INSTANCE ────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5MB
  },
});

module.exports = upload;