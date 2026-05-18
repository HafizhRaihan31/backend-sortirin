const express = require("express");

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPoin,
  getDashboard, 
} = require("../controllers/userController");

const router = express.Router();

// 🔹 GET semua user
router.get("/", getAllUsers);

// 🔹 GET poin user (harus di atas)
router.get("/:id/poin", getPoin);

// 🔹 GET dashboard user (harus di atas juga)
router.get("/:id/dashboard", getDashboard);

// 🔹 GET user by id (paling bawah dari dynamic route)
router.get("/:id", getUserById);

// 🔹 CREATE user
router.post("/", createUser);

// 🔹 UPDATE user
router.put("/:id", updateUser);

// 🔹 DELETE user
router.delete("/:id", deleteUser);

module.exports = router;