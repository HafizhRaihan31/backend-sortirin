const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getLeaderboard, getMyRank } = require("../controllers/leaderboardController");

// PUBLIC - siapapun bisa lihat leaderboard
router.get("/", getLeaderboard);

// AUTH - posisi user yang sedang login
router.get("/me", authMiddleware, getMyRank);

module.exports = router;