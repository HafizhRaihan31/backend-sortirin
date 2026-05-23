const pool = require("../config/db");
const bcrypt = require("bcrypt");

// GET ALL USERS (ADMIN)
const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, profile_image, total_points, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// GET USER BY ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, email, role, profile_image, total_points, created_at
       FROM users WHERE id = $1`,
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
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// CREATE USER
const createUser = async (req, res, next) => {
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
      `INSERT INTO users (full_name, email, password_hash, profile_image)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, profile_image, total_points, created_at`,
      [full_name, email, hashedPassword, profile_image || null]
    );

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE USER (ADMIN)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, profile_image, role } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, profile_image = $3, role = $4
       WHERE id = $5
       RETURNING id, full_name, email, role, profile_image, total_points, created_at`,
      [full_name, email, profile_image || null, role, id]
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
    next(error);
  }
};

// DELETE USER (ADMIN)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
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
    next(error);
  }
};

// GET USER POINTS
const getPoin = async (req, res, next) => {
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
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// GET DASHBOARD USER LOGIN
const getDashboard = async (req, res, next) => {
  try {
    const id = req.user.id;

    const userResult = await pool.query(
      `SELECT id, full_name, email, role, profile_image, total_points, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const totalScanResult = await pool.query(
      "SELECT COUNT(*) AS total_scan FROM transaksi_sampah WHERE user_id = $1",
      [id]
    );

    const historyResult = await pool.query(
      `SELECT
        ts.id,
        ks.category_name AS kategori,
        ts.berat,
        ts.poin_didapat,
        ts.created_at
       FROM transaksi_sampah ts
       JOIN kategori_sampah ks ON ts.kategori_id = ks.id
       WHERE ts.user_id = $1
       ORDER BY ts.created_at DESC
       LIMIT 5`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Dashboard berhasil diambil",
      data: {
        user: userResult.rows[0],
        total_scan: Number(totalScanResult.rows[0].total_scan) || 0,
        history: historyResult.rows || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE USER LOGIN (+ upload foto)
const updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { full_name, email, current_password, new_password, confirm_password } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = userResult.rows[0];

    // ── Foto profil: pakai yang baru jika ada upload ──────
    const profile_image = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : user.profile_image;

    // ── Ganti password jika diisi ─────────────────────────
    let hashedPassword = user.password_hash;

    if (current_password || new_password || confirm_password) {
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Semua field password wajib diisi",
        });
      }

      const isMatch = await bcrypt.compare(current_password, user.password_hash);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Password lama salah",
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Konfirmasi password tidak cocok",
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password minimal 6 karakter",
        });
      }

      hashedPassword = await bcrypt.hash(new_password, 10);
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, password_hash = $3, profile_image = $4
       WHERE id = $5
       RETURNING id, full_name, email, role, profile_image, total_points`,
      [full_name, email, hashedPassword, profile_image, id]
    );

    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// GET HISTORY TRANSAKSI USER LOGIN
const getHistory = async (req, res, next) => {
  try {
    const id = req.user.id;

    const result = await pool.query(
      `SELECT
        ts.id,
        ks.category_name AS kategori,
        ts.berat,
        ts.poin_didapat,
        ts.status,
        ts.created_at
       FROM transaksi_sampah ts
       JOIN kategori_sampah ks ON ts.kategori_id = ks.id
       WHERE ts.user_id = $1
       ORDER BY ts.created_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Riwayat berhasil diambil",
      data: result.rows || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPoin,
  getDashboard,
  updateProfile,
  getHistory,
};