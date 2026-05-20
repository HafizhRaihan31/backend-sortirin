const express = require("express");

const {
  tambahTransaksi,
  getAllTrashLogs,
} = require(
  "../controllers/transaksiController"
);

const authMiddleware =
  require("../middleware/authMiddleware");

const router = express.Router();

// USER - TAMBAH TRANSAKSI
router.post(
  "/",
  authMiddleware,
  tambahTransaksi
);

// ADMIN - ALL TRASH LOGS
router.get(
  "/all",
  authMiddleware,
  getAllTrashLogs
);


module.exports = router;