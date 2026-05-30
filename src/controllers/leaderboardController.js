const db = require("../config/db");

// GET /api/leaderboard
// Top 10 user berdasarkan total poin
const getLeaderboard = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rank,
        id,
        full_name,
        profile_image,
        total_points
       FROM users
       WHERE role = 'user'
       AND total_points > 0
       ORDER BY total_points DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaderboard/me
// Posisi user yang sedang login di leaderboard
const getMyRank = async (req, res, next) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT rank, total_points FROM (
        SELECT
          id,
          total_points,
          ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rank
        FROM users
        WHERE role = 'user'
      ) ranked
      WHERE id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { rank: null, total_points: 0 },
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard, getMyRank };