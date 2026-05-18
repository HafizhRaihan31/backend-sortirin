const express = require("express");

const { tambahTransaksi } = require("../controllers/transaksiController"); 

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 tambah transaksi (pakai JWT)
router.post("/", authMiddleware, tambahTransaksi);

module.exports = router;