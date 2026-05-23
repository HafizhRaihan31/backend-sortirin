const db = require("../config/db");

// GET /api/kategori
// Ambil semua kategori sampah (untuk dropdown di frontend)
const getAllKategori = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, category_name, description, poin_per_kg
       FROM kategori_sampah
       ORDER BY category_name ASC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/kategori/:id
const getKategoriById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, category_name, description, poin_per_kg
       FROM kategori_sampah
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
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

module.exports = { getAllKategori, getKategoriById };