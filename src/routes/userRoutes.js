const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPoin,
  getDashboard,
  updateProfile,
  getHistory,
} = require("../controllers/userController");

// ── USER YANG SEDANG LOGIN ────────────────────────────────
router.get("/dashboard", authMiddleware, getDashboard);
router.get("/history", authMiddleware, getHistory);
router.put(
  "/profile",
  authMiddleware,
  upload.single("profile_image"), // ← support upload foto
  updateProfile
);

// ── ADMIN ─────────────────────────────────────────────────
router.get("/", authMiddleware, adminMiddleware, getAllUsers);

// ── USER BY ID ────────────────────────────────────────────
router.get("/:id/poin", authMiddleware, getPoin);
router.get("/:id", authMiddleware, getUserById);

// ── CRUD (ADMIN) ──────────────────────────────────────────
router.post("/", createUser);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

module.exports = router;