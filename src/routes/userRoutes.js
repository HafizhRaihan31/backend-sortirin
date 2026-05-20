const express = require("express");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

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

const router = express.Router();

// DASHBOARD USER LOGIN
router.get(
  "/dashboard",
  authMiddleware,
  getDashboard
);

// HISTORY USER LOGIN
router.get(
  "/history",
  authMiddleware,
  getHistory
);

// UPDATE PROFILE USER LOGIN
router.put(
  "/profile",
  authMiddleware,
  updateProfile
);

// GET ALL USERS
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

// GET USER POINTS
router.get(
  "/:id/poin",
  authMiddleware,
  getPoin
);

// GET USER BY ID
router.get(
  "/:id",
  authMiddleware,
  getUserById
);

// CREATE USER
router.post(
  "/",
  createUser
);

// UPDATE USER
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateUser
);

// DELETE USER
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteUser
);

module.exports = router;