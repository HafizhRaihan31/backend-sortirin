const db = require("../config/db");

// POST /api/transaksi
// Tambah transaksi manual (tanpa scan AI)
exports.tambahTransaksi = async (req, res, next) => {
  const { kategori_id, berat } = req.body;
  const user_id = req.user.id;

  if (!kategori_id || !berat) {
    return res.status(400).json({
      success: false,
      message: "kategori_id dan berat wajib diisi",
    });
  }

  if (berat <= 0) {
    return res.status(400).json({
      success: false,
      message: "Berat harus lebih dari 0",
    });
  }

  if (berat > 100) {
    return res.status(400).json({
      success: false,
      message: "Berat maksimal 100 kg per transaksi",
    });
  }

  try {
    // Cek kategori
    const kategori = await db.query(
      "SELECT id, category_name, poin_per_kg FROM kategori_sampah WHERE id = $1",
      [kategori_id]
    );

    if (kategori.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const { category_name, poin_per_kg } = kategori.rows[0];
    const poinDidapat = Math.round(berat * poin_per_kg);

    // Atomic transaction
    await db.query("BEGIN");

    // Simpan transaksi
    const transaksiResult = await db.query(
      `INSERT INTO transaksi_sampah
        (user_id, kategori_id, berat, poin_didapat, status)
       VALUES ($1, $2, $3, $4, 'approved')
       RETURNING *`,
      [user_id, kategori_id, berat, poinDidapat]
    );

    // Update total poin user
    await db.query(
      "UPDATE users SET total_points = total_points + $1 WHERE id = $2",
      [poinDidapat, user_id]
    );

    // Simpan ke riwayat_poin
    await db.query(
      `INSERT INTO riwayat_poin (user_id, points, description)
       VALUES ($1, $2, $3)`,
      [
        user_id,
        poinDidapat,
        `Transaksi sampah: ${category_name} ${berat} kg`,
      ]
    );

    await db.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Transaksi berhasil ditambahkan",
      data: {
        transaksi_id: transaksiResult.rows[0].id,
        kategori: category_name,
        berat,
        poin_didapat: poinDidapat,
      },
    });
  } catch (err) {
    await db.query("ROLLBACK");
    next(err);
  }
};

// GET /api/transaksi/all  (ADMIN)
exports.getAllTrashLogs = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const result = await db.query(
      `SELECT
        ts.id,
        users.full_name AS user_name,
        users.email,
        ks.category_name AS waste_category,
        ts.berat,
        ts.poin_didapat,
        ts.status,
        ts.created_at
       FROM transaksi_sampah ts
       JOIN users ON ts.user_id = users.id
       JOIN kategori_sampah ks ON ts.kategori_id = ks.id
       ORDER BY ts.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};