const db = require("../config/db");

// GET /api/riwayat-poin
// Riwayat poin user yang sedang login (masuk & keluar)
const getRiwayatPoin = async (req, res, next) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, points, description, created_at
       FROM riwayat_poin
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    // Hitung total poin masuk & keluar
    const totalMasuk = result.rows
      .filter((r) => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0);

    const totalKeluar = result.rows
      .filter((r) => r.points < 0)
      .reduce((sum, r) => sum + Math.abs(r.points), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_masuk: totalMasuk,
          total_keluar: totalKeluar,
        },
        riwayat: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/riwayat-poin/all  (ADMIN)
const getAllRiwayatPoin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const result = await db.query(
      `SELECT
        rp.id,
        u.full_name AS user_name,
        u.email,
        rp.points,
        rp.description,
        rp.created_at
       FROM riwayat_poin rp
       JOIN users u ON rp.user_id = u.id
       ORDER BY rp.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRiwayatPoin, getAllRiwayatPoin };