const express = require("express");

const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 PUBLIC ROUTES
// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// 🔹 PROTECTED ROUTES
// Get current user (butuh token)
router.get("/me", authMiddleware, getMe);

module.exports = router;