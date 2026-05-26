const db = require("../config/db");

// GET /api/rewards
const getAllRewards = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, reward_name, description, image_url, point_cost, stock, created_at
       FROM reward
       WHERE is_active = true
       ORDER BY point_cost ASC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/rewards/tukar
const tukarReward = async (req, res, next) => {
  const user_id = req.user.id;
  const { reward_id } = req.body;

  if (!reward_id) {
    return res.status(400).json({
      success: false,
      message: "reward_id wajib diisi",
    });
  }

  try {
    // Cek reward ada, aktif, dan stock cukup
    const rewardResult = await db.query(
      "SELECT * FROM reward WHERE id = $1 AND is_active = true",
      [reward_id]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan",
      });
    }

    const reward = rewardResult.rows[0];

    if (reward.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock reward habis",
      });
    }

    // Cek poin user
    const userResult = await db.query(
      "SELECT total_points FROM users WHERE id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const userPoints = userResult.rows[0].total_points;

    if (userPoints < reward.point_cost) {
      return res.status(400).json({
        success: false,
        message: `Poin tidak cukup. Poin kamu: ${userPoints}, dibutuhkan: ${reward.point_cost}`,
      });
    }

    // Atomic transaction
    await db.query("BEGIN");

    // Kurangi poin user
    await db.query(
      "UPDATE users SET total_points = total_points - $1 WHERE id = $2",
      [reward.point_cost, user_id]
    );

    // Kurangi stock reward
    await db.query(
      "UPDATE reward SET stock = stock - 1 WHERE id = $1",
      [reward_id]
    );

    // Simpan penukaran
    await db.query(
      `INSERT INTO penukaran_reward (user_id, reward_id, points_used, status)
       VALUES ($1, $2, $3, 'success')`,
      [user_id, reward_id, reward.point_cost]
    );

    // Simpan ke riwayat_poin (poin berkurang = negatif)
    await db.query(
      `INSERT INTO riwayat_poin (user_id, points, description)
       VALUES ($1, $2, $3)`,
      [
        user_id,
        -reward.point_cost,
        `Penukaran reward: ${reward.reward_name}`,
      ]
    );

    await db.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Reward berhasil ditukar!",
      data: {
        reward: reward.reward_name,
        points_used: reward.point_cost,
        sisa_poin: userPoints - reward.point_cost,
      },
    });
  } catch (err) {
    await db.query("ROLLBACK");
    next(err);
  }
};

// GET /api/rewards/riwayat
const getRiwayatReward = async (req, res, next) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT
        pr.id,
        r.reward_name,
        r.image_url,
        pr.points_used,
        pr.status,
        pr.redeemed_at
       FROM penukaran_reward pr
       JOIN reward r ON pr.reward_id = r.id
       WHERE pr.user_id = $1
       ORDER BY pr.redeemed_at DESC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/rewards/riwayat/all  (ADMIN)
const getAllRewardLogs = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const result = await db.query(
      `SELECT
        pr.id,
        users.full_name AS user_name,
        users.email,
        r.reward_name,
        pr.points_used,
        pr.status,
        pr.redeemed_at
       FROM penukaran_reward pr
       JOIN users ON pr.user_id = users.id
       JOIN reward r ON pr.reward_id = r.id
       ORDER BY pr.redeemed_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/rewards  (ADMIN)
const createReward = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { reward_name, description, point_cost, stock } = req.body;

    if (!reward_name || !point_cost || !stock) {
      return res.status(400).json({
        success: false,
        message: "reward_name, point_cost, dan stock wajib diisi",
      });
    }

    const image_url = req.file
      ? `/uploads/rewards/${req.file.filename}`
      : null;

    const result = await db.query(
      `INSERT INTO reward (reward_name, description, image_url, point_cost, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [reward_name, description, image_url, point_cost, stock]
    );

    res.status(201).json({
      success: true,
      message: "Reward berhasil dibuat",
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rewards/:id  (ADMIN)
const updateReward = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { id } = req.params;
    const { reward_name, description, point_cost, stock } = req.body;

    const rewardCheck = await db.query(
      "SELECT * FROM reward WHERE id = $1",
      [id]
    );

    if (rewardCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan",
      });
    }

    const image_url = req.file
      ? `/uploads/rewards/${req.file.filename}`
      : rewardCheck.rows[0].image_url;

    const result = await db.query(
      `UPDATE reward
       SET reward_name = $1, description = $2, image_url = $3, point_cost = $4, stock = $5
       WHERE id = $6
       RETURNING *`,
      [reward_name, description, image_url, point_cost, stock, id]
    );

    res.status(200).json({
      success: true,
      message: "Reward berhasil diupdate",
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rewards/:id  (ADMIN)
// Soft delete - reward tidak benar-benar dihapus
// supaya riwayat penukaran user tetap aman
const deleteReward = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { id } = req.params;

    const result = await db.query(
      "UPDATE reward SET is_active = false WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reward berhasil dihapus",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRewards,
  tukarReward,
  getRiwayatReward,
  getAllRewardLogs,
  createReward,
  updateReward,
  deleteReward,
};