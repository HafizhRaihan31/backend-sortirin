const pool = require("../config/db");
const bcrypt = require("bcrypt");

// 🔹 GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, profile_image, total_points, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: result.rows,
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔹 GET USER BY ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id, full_name, email, profile_image, total_points, created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data user ditemukan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔹 CREATE USER
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, profile_image } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (full_name, email, password_hash, profile_image)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, profile_image, total_points, created_at
      `,
      [full_name, email, hashedPassword, profile_image || null]
    );

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔹 UPDATE USER
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, profile_image } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET full_name = $1,
          email = $2,
          profile_image = $3
      WHERE id = $4
      RETURNING id, full_name, email, profile_image, total_points, created_at
      `,
      [full_name, email, profile_image || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔹 DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔹 GET POIN USER
const getPoin = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT total_points FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Poin user",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET POIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 🔥 TAMBAHAN (BIAR ROUTE TIDAK ERROR)
const getDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT full_name, total_points, created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Dashboard user",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPoin,
  getDashboard, // 🔥 WAJIB ADA
};