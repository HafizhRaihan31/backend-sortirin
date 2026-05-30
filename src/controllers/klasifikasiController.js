const db = require("../config/db");
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Mapping label AI ke nama kategori di database
// Update ini setelah diskusi sama tim DS/AI
const LABEL_TO_KATEGORI = {
  Kaca: "Kaca",
  Kardus: "Kardus",   // pastikan ada di DB
  Kertas: "Kertas",
  Logam: "Logam",
  Plastik: "Plastik",
  Residu: "Residu",   // pastikan ada di DB
};

// POST /api/klasifikasi/scan
const scanSampah = async (req, res, next) => {
  const user_id = req.user.id;

  // Cek apakah ada file yang diupload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Gambar wajib diupload",
    });
  }

  const imagePath = req.file.path;
  const imageUrl = `/uploads/klasifikasi/${req.file.filename}`;

  try {
    // ── 1. KIRIM GAMBAR KE AI ──────────────────────────────
    const AI_URL = process.env.AI_API_URL; // contoh: https://your-ai.onrender.com

    if (!AI_URL) {
      throw new Error("AI_API_URL belum dikonfigurasi di environment");
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post(`${AI_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 detik timeout
    });

    const { kategori: predictionLabel, confidence: aiConfidence } =
      aiResponse.data;

    // ── 2. MAPPING LABEL AI → KATEGORI DB ─────────────────
    const kategoriName = LABEL_TO_KATEGORI[predictionLabel];

    if (!kategoriName) {
      return res.status(422).json({
        success: false,
        message: `Label AI "${predictionLabel}" tidak dikenali sistem`,
        ai_result: { predictionLabel, aiConfidence },
      });
    }

    // ── 3. AMBIL DATA KATEGORI DARI DB ────────────────────
    const kategoriResult = await db.query(
      "SELECT id, category_name, poin_per_kg FROM kategori_sampah WHERE category_name = $1",
      [kategoriName]
    );

    if (kategoriResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Kategori "${kategoriName}" tidak ditemukan di database. Hubungi admin.`,
        ai_result: { predictionLabel, aiConfidence },
      });
    }

    const kategori = kategoriResult.rows[0];

    // Parse confidence: "95.23%" → 95.23
    const confidenceValue = parseFloat(aiConfidence.replace("%", ""));

    // ── 4. SIMPAN HASIL KLASIFIKASI ───────────────────────
    const klasifikasiResult = await db.query(
      `INSERT INTO klasifikasi
        (user_id, category_id, image_url, prediction_label, ai_confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, kategori.id, imageUrl, predictionLabel, confidenceValue]
    );

    const klasifikasi = klasifikasiResult.rows[0];

    // ── 5. RESPONSE KE USER ───────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Gambar berhasil diklasifikasi",
      data: {
        klasifikasi_id: klasifikasi.id,
        kategori: kategori.category_name,
        kategori_id: kategori.id,
        poin_per_kg: kategori.poin_per_kg,
        prediction_label: predictionLabel,
        ai_confidence: aiConfidence,
        image_url: imageUrl,
        catatan:
          "Konfirmasi berat sampah untuk mendapatkan poin. Gunakan endpoint POST /api/transaksi/confirm",
      },
    });
  } catch (error) {
    // Hapus file jika terjadi error saat memanggil AI
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Error dari axios (AI tidak bisa dihubungi)
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "Layanan AI sedang tidak tersedia. Coba lagi nanti.",
      });
    }

    if (error.response) {
      return res.status(502).json({
        success: false,
        message: "AI mengembalikan error",
        detail: error.response.data,
      });
    }

    next(error);
  }
};

// POST /api/klasifikasi/confirm
// Setelah user scan, user input berat → dapat poin
const konfirmasiSampah = async (req, res, next) => {
  const user_id = req.user.id;
  const { klasifikasi_id, berat } = req.body;

  if (!klasifikasi_id || !berat) {
    return res.status(400).json({
      success: false,
      message: "klasifikasi_id dan berat wajib diisi",
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
    // ── 1. CEK KLASIFIKASI MILIK USER INI ─────────────────
    const klasifikasiResult = await db.query(
      `SELECT k.*, ks.poin_per_kg, ks.category_name
       FROM klasifikasi k
       JOIN kategori_sampah ks ON k.category_id = ks.id
       WHERE k.id = $1 AND k.user_id = $2`,
      [klasifikasi_id, user_id]
    );

    if (klasifikasiResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data klasifikasi tidak ditemukan",
      });
    }

    const klasifikasi = klasifikasiResult.rows[0];
    const poinDidapat = Math.round(berat * klasifikasi.poin_per_kg);

    // ── 2. SIMPAN TRANSAKSI + UPDATE POIN (ATOMIC) ────────
    await db.query("BEGIN");

    // Simpan transaksi sampah
    const transaksiResult = await db.query(
      `INSERT INTO transaksi_sampah
        (user_id, kategori_id, berat, poin_didapat, status)
       VALUES ($1, $2, $3, $4, 'approved')
       RETURNING *`,
      [user_id, klasifikasi.category_id, berat, poinDidapat]
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
        `Scan sampah: ${klasifikasi.category_name} ${berat} kg`,
      ]
    );

    await db.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Sampah berhasil dikonfirmasi, poin ditambahkan!",
      data: {
        transaksi_id: transaksiResult.rows[0].id,
        kategori: klasifikasi.category_name,
        berat: berat,
        poin_didapat: poinDidapat,
        prediction_label: klasifikasi.prediction_label,
        ai_confidence: `${klasifikasi.ai_confidence}%`,
      },
    });
  } catch (error) {
    await db.query("ROLLBACK");
    next(error);
  }
};

// GET /api/klasifikasi/history
// Riwayat scan user yang sedang login
const getRiwayatKlasifikasi = async (req, res, next) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT
        k.id,
        ks.category_name AS kategori,
        k.prediction_label,
        k.ai_confidence,
        k.image_url,
        k.created_at
       FROM klasifikasi k
       JOIN kategori_sampah ks ON k.category_id = ks.id
       WHERE k.user_id = $1
       ORDER BY k.created_at DESC`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/klasifikasi/all  (ADMIN)
// Semua riwayat klasifikasi semua user
const getAllKlasifikasi = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const result = await db.query(
      `SELECT
        k.id,
        u.full_name AS user_name,
        u.email,
        ks.category_name AS kategori,
        k.prediction_label,
        k.ai_confidence,
        k.image_url,
        k.created_at
       FROM klasifikasi k
       JOIN users u ON k.user_id = u.id
       JOIN kategori_sampah ks ON k.category_id = ks.id
       ORDER BY k.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanSampah,
  konfirmasiSampah,
  getRiwayatKlasifikasi,
  getAllKlasifikasi,
};