const express = require("express");
const router = express.Router();

const {
  getAllRewards,
  tukarReward,
  getRiwayatReward,
} = require("../controllers/rewardController");

const authMiddleware = require("../middleware/authMiddleware");

// PUBLIC
router.get("/", getAllRewards);

// PROTECTED (JWT)
router.post("/tukar", authMiddleware, tukarReward);
router.get("/riwayat", authMiddleware, getRiwayatReward);

module.exports = router;