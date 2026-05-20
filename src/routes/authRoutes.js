const express = require("express");

const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get current user (butuh token)
router.get("/me", authMiddleware, getMe);

module.exports = router;