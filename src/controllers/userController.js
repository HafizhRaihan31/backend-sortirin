const pool = require("../config/db");
const bcrypt = require("bcrypt");

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: result.rows,
    });

  } catch (error) {

    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET USER BY ID
const getUserById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points,
        created_at
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

    console.error(
      "GET USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// CREATE USER
const createUser = async (req, res) => {
  try {

    const {
      full_name,
      email,
      password,
      profile_image,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap",
      });
    }

    // CHECK EMAIL
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

    // HASH PASSWORD
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // INSERT USER
    const result = await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        email,
        password_hash,
        profile_image
      )
      VALUES ($1, $2, $3, $4)

      RETURNING
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points,
        created_at
      `,
      [
        full_name,
        email,
        hashedPassword,
        profile_image || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: result.rows[0],
    });

  } catch (error) {

    console.error(
      "CREATE USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE USE
const updateUser = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      full_name,
      email,
      profile_image,
      role,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        profile_image = $3,
        role = $4
      WHERE id = $5

      RETURNING
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points,
        created_at
      `,
      [
        full_name,
        email,
        profile_image || null,
        role,
        id,
      ]
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

    console.error(
      "UPDATE USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING *
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
      message: "User berhasil dihapus",
    });

  } catch (error) {

    console.error(
      "DELETE USER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET USER POINTS
const getPoin = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT total_points
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
      message: "Poin user",
      data: result.rows[0],
    });

  } catch (error) {

    console.error(
      "GET POIN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET DASHBOARD USER LOGIN
const getDashboard = async (req, res) => {
  try {

    const id = req.user.id;

    const userResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points,
        created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const totalScanResult = await pool.query(
      `
      SELECT COUNT(*) AS total_scan
      FROM transaksi_sampah
      WHERE user_id = $1
      `,
      [id]
    );

    const historyResult = await pool.query(
      `
      SELECT
        kategori_id,
        poin_didapat,
        created_at
      FROM transaksi_sampah
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Dashboard berhasil diambil",

      data: {
        user: userResult.rows[0],

        total_scan:
          Number(
            totalScanResult.rows[0].total_scan
          ) || 0,

        history:
          historyResult.rows || [],
      },
    });

  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {

    const id = req.user.id;

    const {
      full_name,
      email,
      current_password,
      new_password,
      confirm_password,
    } = req.body;

    const userResult = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = userResult.rows[0];

    let hashedPassword =
      user.password_hash;

    if (
      current_password ||
      new_password ||
      confirm_password
    ) {

      if (
        !current_password ||
        !new_password ||
        !confirm_password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Semua field password wajib diisi",
        });
      }

      const isMatch =
        await bcrypt.compare(
          current_password,
          user.password_hash
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Password lama salah",
        });
      }

      if (
        new_password !==
        confirm_password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Konfirmasi password tidak cocok",
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password minimal 6 karakter",
        });
      }

      hashedPassword =
        await bcrypt.hash(
          new_password,
          10
        );
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        password_hash = $3
      WHERE id = $4

      RETURNING
        id,
        full_name,
        email,
        role,
        profile_image,
        total_points
      `,
      [
        full_name,
        email,
        hashedPassword,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message:
        "Profile berhasil diupdate",
      data: result.rows[0],
    });

  } catch (error) {

    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET HISTORY
const getHistory = async (req, res) => {
  try {

    const id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        kategori_id,
        berat,
        poin_didapat,
        status,
        created_at

      FROM transaksi_sampah

      WHERE user_id = $1

      ORDER BY created_at DESC
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Riwayat berhasil diambil",
      data: result.rows || [],
    });

  } catch (error) {

    console.error(
      "GET HISTORY ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
  getDashboard,
  updateProfile,
  getHistory,
};