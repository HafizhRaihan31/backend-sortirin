const db = require("../config/db");

exports.tambahTransaksi = async (req, res) => {
  const { kategori_id, berat } = req.body;
  const user_id = req.user.id;

  if (!kategori_id || !berat) {
    return res.status(400).json({
      success: false,
      message: "kategori_id dan berat wajib diisi",
    });
  }

  try {
    const kategori = await db.query(
      "SELECT poin_per_kg FROM kategori_sampah WHERE id = $1",
      [kategori_id]
    );

    if (kategori.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const poin = berat * kategori.rows[0].poin_per_kg;

    await db.query(
      `INSERT INTO transaksi_sampah
      (user_id, kategori_id, berat, poin_didapat, status)
      VALUES ($1, $2, $3, $4, 'approved')`,
      [user_id, kategori_id, berat, poin]
    );

    await db.query(
      "UPDATE users SET total_points = total_points + $1 WHERE id = $2",
      [poin, user_id]
    );

    res.json({
      success: true,
      message: "Transaksi berhasil",
      data: { poin },
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};