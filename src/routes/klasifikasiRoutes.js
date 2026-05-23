const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  scanSampah,
  konfirmasiSampah,
  getRiwayatKlasifikasi,
  getAllKlasifikasi,
} = require("../controllers/klasifikasiController");

// USER - Upload gambar sampah → diklasifikasi AI
router.post(
  "/scan",
  authMiddleware,
  upload.single("image"),
  scanSampah
);

// USER - Konfirmasi berat setelah scan → dapat poin
router.post(
  "/confirm",
  authMiddleware,
  konfirmasiSampah
);

// USER - Riwayat scan sendiri
router.get(
  "/history",
  authMiddleware,
  getRiwayatKlasifikasi
);

// ADMIN - Semua riwayat klasifikasi
router.get(
  "/all",
  authMiddleware,
  getAllKlasifikasi
);

module.exports = router;