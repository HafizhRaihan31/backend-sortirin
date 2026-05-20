const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const {
  getAllRewards,
  tukarReward,
  getRiwayatReward,
  createReward,
  updateReward,
  deleteReward,
  getAllRewardLogs,
} = require("../controllers/rewardController");

// PUBLIC
router.get("/", getAllRewards);

router.post(
  "/tukar",
  authMiddleware,
  tukarReward
);

router.get(
  "/riwayat",
  authMiddleware,
  getRiwayatReward
);

router.post(
  "/",
  authMiddleware,
  upload.single("reward_image"),
  createReward
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("reward_image"),
  updateReward
);

router.delete(
  "/:id",
  authMiddleware,
  deleteReward
);

router.get(
  "/riwayat/all",
  authMiddleware,
  getAllRewardLogs
);

module.exports = router;