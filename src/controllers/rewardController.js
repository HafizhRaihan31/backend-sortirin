const db = require("../config/db");

// 🔹 GET semua reward
const getAllRewards = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, reward_name, description, image_url, point_cost, stock, created_at
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

// 🔹 TUKAR REWARD (PAKAI JWT)
const tukarReward = async (req, res) => {
  const user_id = req.user.id; // dari JWT
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
      "SELECT * FROM reward WHERE id = $1",
      [reward_id]
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

    // CEK POIN
    if (userPoints < pointCost) {
      return res.status(400).json({
        success: false,
        message: "Poin tidak cukup",
      });
    }

    //  TRANSACTION
    await db.query("BEGIN");

    // KURANGI POIN USER
    await db.query(
      "UPDATE users SET total_points = total_points - $1 WHERE id = $2",
      [pointCost, user_id]
    );

    // KURANGI STOCK
    await db.query(
      "UPDATE reward SET stock = stock - 1 WHERE id = $1",
      [reward_id]
    );

    // SIMPAN RIWAYAT
    await db.query(
      `
      INSERT INTO penukaran_reward
      (user_id, reward_id, points_used, status)
      VALUES ($1, $2, $3, 'success')
      `,
      [user_id, reward_id, pointCost]
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

// 🔹 RIWAYAT REWARD (PAKAI JWT)
const getRiwayatReward = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(`
      SELECT 
        pr.id,
        r.reward_name,
        pr.points_used,
        pr.status,
        pr.redeemed_at
      FROM penukaran_reward pr
      JOIN reward r ON pr.reward_id = r.id
      WHERE pr.user_id = $1
      ORDER BY pr.redeemed_at DESC
    `, [user_id]);

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

module.exports = {
  getAllRewards,
  tukarReward,
  getRiwayatReward,
};