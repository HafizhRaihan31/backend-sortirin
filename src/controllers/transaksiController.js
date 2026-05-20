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

// ADMIN - GET ALL TRASH LOGS
exports.getAllTrashLogs =
  async (req, res) => {

    try {

      // ADMIN ONLY
      if (
        req.user.role !== "admin"
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Akses ditolak",

        });
      }

      const result =
  await db.query(
    `
    SELECT
      ts.id,

      users.full_name
      AS user_name,

      users.email,

      ks.category_name
      AS waste_category,

      ts.berat,

      ts.poin_didapat,

      ts.status,

      ts.created_at

    FROM transaksi_sampah ts

    JOIN users
    ON ts.user_id = users.id

    JOIN kategori_sampah ks
    ON ts.kategori_id = ks.id

    ORDER BY
    ts.created_at DESC
    `
  );

      res.status(200).json({

        success: true,

        data:
          result.rows,

      });

    } catch (err) {

      console.error(
        "GET ALL TRASH LOGS ERROR:",
        err
      );

      res.status(500).json({

        success: false,

        message:
          "Server error",

        error:
          err.message,

      });
    }
};