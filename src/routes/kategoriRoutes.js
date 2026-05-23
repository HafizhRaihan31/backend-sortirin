const express = require("express");
const router = express.Router();

const { getAllKategori, getKategoriById } = require("../controllers/kategoriController");

// PUBLIC - frontend butuh ini untuk dropdown form transaksi
router.get("/", getAllKategori);
router.get("/:id", getKategoriById);

module.exports = router;