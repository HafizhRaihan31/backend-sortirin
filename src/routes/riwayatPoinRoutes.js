const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getRiwayatPoin, getAllRiwayatPoin } = require("../controllers/riwayatPoinController");

// USER - Riwayat poin sendiri
router.get("/", authMiddleware, getRiwayatPoin);

// ADMIN - Semua riwayat poin
router.get("/all", authMiddleware, getAllRiwayatPoin);

module.exports = router;