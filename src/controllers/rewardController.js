const db = require("../config/db");

// GET ALL REWARDS
const getAllRewards = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        reward_name,
        description,
        image_url,
        point_cost,
        stock,
        created_at

      FROM reward

      ORDER BY point_cost ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("GET REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// TUKAR REWARD

const tukarReward = async (req, res) => {
  const user_id = req.user.id;

  const { reward_id } = req.body;

  try {
    // VALIDASI
    if (!reward_id) {
      return res.status(400).json({
        success: false,
        message: "reward_id wajib diisi",
      });
    }

    // CEK REWARD
    const rewardResult = await db.query(
      `
      SELECT *
      FROM reward
      WHERE id = $1
      `,
      [reward_id],
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan",
      });
    }

    const reward = rewardResult.rows[0];

    const pointCost = reward.point_cost;

    // CEK STOCK
    if (reward.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock reward habis",
      });
    }

    // CEK USER
    const userResult = await db.query(
      `
      SELECT total_points
      FROM users
      WHERE id = $1
      `,
      [user_id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const userPoints = userResult.rows[0].total_points;

    // CEK POIN
    if (userPoints < pointCost) {
      return res.status(400).json({
        success: false,
        message: "Poin tidak cukup",
      });
    }

    // TRANSACTION
    await db.query("BEGIN");

    // KURANGI POIN USER
    await db.query(
      `
      UPDATE users

      SET total_points =
      total_points - $1

      WHERE id = $2
      `,
      [pointCost, user_id],
    );

    // KURANGI STOCK
    await db.query(
      `
      UPDATE reward

      SET stock = stock - 1

      WHERE id = $1
      `,
      [reward_id],
    );

    // SIMPAN RIWAYAT
    await db.query(
      `
      INSERT INTO penukaran_reward
      (
        user_id,
        reward_id,
        points_used,
        status
      )

      VALUES
      ($1, $2, $3, 'success')
      `,
      [user_id, reward_id, pointCost],
    );

    await db.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Reward berhasil ditukar",

      data: {
        reward: reward.reward_name,

        points_used: pointCost,
      },
    });
  } catch (err) {
    await db.query("ROLLBACK");

    console.error("TUKAR REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// USER RIWAYAT REWARD

const getRiwayatReward = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `
      SELECT
        pr.id,
        r.reward_name,
        pr.points_used,
        pr.status,
        pr.redeemed_at

      FROM penukaran_reward pr

      JOIN reward r
      ON pr.reward_id = r.id

      WHERE pr.user_id = $1

      ORDER BY
      pr.redeemed_at DESC
      `,
      [user_id],
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("RIWAYAT REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ADMIN - GET ALL REWARD LOGS
const getAllRewardLogs = async (req, res) => {
  try {
    // ADMIN ONLY
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const result = await db.query(
      `
    SELECT
      pr.id,

      users.full_name AS user_name,

      users.email,

      r.reward_name,

      pr.points_used,

      pr.status,

      pr.redeemed_at

    FROM penukaran_reward pr

    JOIN users
    ON pr.user_id = users.id

    JOIN reward r
    ON pr.reward_id = r.id

    ORDER BY
    pr.redeemed_at DESC`,
    );

    res.status(200).json({
      success: true,

      data: result.rows,
    });
  } catch (err) {
    console.error("GET ALL REWARD LOGS ERROR:", err);

    res.status(500).json({
      success: false,

      message: "Server error",

      error: err.message,
    });
  }
};

// CREATE REWARD
const createReward = async (req, res) => {
  try {
    // ADMIN ONLY
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { reward_name, description, point_cost, stock } = req.body;

    // IMAGE DARI MULTER
    const image_url = req.file ? `/uploads/rewards/${req.file.filename}` : null;

    const result = await db.query(
      `
      INSERT INTO reward
      (
        reward_name,
        description,
        image_url,
        point_cost,
        stock
      )

      VALUES
      ($1, $2, $3, $4, $5)

      RETURNING *
      `,
      [reward_name, description, image_url, point_cost, stock],
    );

    res.status(201).json({
      success: true,
      message: "Reward berhasil dibuat",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// UPDATE REWARD
const updateReward = async (req, res) => {
  try {
    // ADMIN ONLY
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { id } = req.params;

    const { reward_name, description, point_cost, stock } = req.body;

    // CEK REWARD
    const rewardCheck = await db.query(
      `
        SELECT *
        FROM reward
        WHERE id = $1
        `,
      [id],
    );

    if (rewardCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reward tidak ditemukan",
      });
    }

    // IMAGE LAMA
    let image_url = rewardCheck.rows[0].image_url;

    // IMAGE BARU
    if (req.file) {
      image_url = `/uploads/rewards/${req.file.filename}`;
    }

    const result = await db.query(
      `
      UPDATE reward
      SET
        reward_name = $1,
        description = $2,
        image_url = $3,
        point_cost = $4,
        stock = $5
      WHERE id = $6
      RETURNING *
      `,
      [reward_name, description, image_url, point_cost, stock, id],
    );

    res.status(200).json({
      success: true,
      message: "Reward berhasil diupdate",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("UPDATE REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// DELETE REWARD

const deleteReward = async (req, res) => {
  try {
    // ADMIN ONLY
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { id } = req.params;

    await db.query(
      `
      DELETE FROM reward
      WHERE id = $1
      `,
      [id],
    );
    res.status(200).json({
      success: true,
      message: "Reward berhasil dihapus",
    });
  } catch (err) {
    console.error("DELETE REWARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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
