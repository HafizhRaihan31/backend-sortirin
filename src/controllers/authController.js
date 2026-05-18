const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, profile_image } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
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
      RETURNING id, full_name, email, profile_image, total_points
      `,
      [full_name, email, hashedPassword, profile_image || null]
    );

    res.status(201).json({
      success: true,
      message: "Register berhasil",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password salah",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    delete user.password_hash;

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      token,
      data: user,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET PROFILE
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, profile_image, total_points FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};