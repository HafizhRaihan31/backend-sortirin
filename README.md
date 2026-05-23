# Backend Sortirin — Panduan Setup & Endpoint

## 📦 Install Dependency Baru

```bash
npm install axios form-data
```

---

## ⚙️ Environment Variables (.env)

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sortirin_db
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your_jwt_secret_key

# URL API AI dari tim AI (wajib diisi setelah deploy)
AI_API_URL=https://your-ai-api.onrender.com

NODE_ENV=development
PORT=5000
```

---

## 🗄️ Update Database

Jalankan file `update_database.sql` di pgAdmin untuk menambahkan kategori **Kardus** dan **Residu**, serta menghapus **Organik**.

---

## 📁 File yang Diubah / Ditambah

| File | Status | Keterangan |
|---|---|---|
| `src/controllers/klasifikasiController.js` | ✅ BARU | Inti fitur scan sampah AI |
| `src/routes/klasifikasiRoutes.js` | ✅ BARU | Routes untuk scan |
| `src/controllers/kategoriController.js` | ✅ BARU | GET semua kategori sampah |
| `src/routes/kategoriRoutes.js` | ✅ BARU | Routes untuk kategori |
| `src/controllers/riwayatPoinController.js` | ✅ BARU | GET riwayat poin user |
| `src/routes/riwayatPoinRoutes.js` | ✅ BARU | Routes untuk riwayat poin |
| `src/middleware/errorHandler.js` | ✅ BARU | Global error handler + 404 |
| `src/middleware/uploadMiddleware.js` | 🔄 UPDATE | Support folder klasifikasi & profiles |
| `src/controllers/transaksiController.js` | 🔄 UPDATE | Tambah insert riwayat_poin |
| `src/controllers/rewardController.js` | 🔄 UPDATE | Tambah insert riwayat_poin |
| `src/controllers/userController.js` | 🔄 UPDATE | Tambah upload foto profil |
| `src/routes/userRoutes.js` | 🔄 UPDATE | Tambah upload.single di /profile |
| `src/app.js` | 🔄 UPDATE | Tambah route baru + error handler |

---

## 🛠️ Alur Fitur Scan Sampah

```
User upload gambar
       ↓
POST /api/klasifikasi/scan
       ↓
Backend simpan gambar ke /uploads/klasifikasi/
       ↓
Backend forward gambar ke AI API
       ↓
AI balas: { kategori: "Plastik", confidence: "95.23%" }
       ↓
Backend mapping label → kategori DB
       ↓
Backend simpan hasil ke tabel `klasifikasi`
       ↓
Response ke user (termasuk kategori & poin_per_kg)
       ↓
User input berat sampah
       ↓
POST /api/klasifikasi/confirm
       ↓
Backend hitung poin (berat × poin_per_kg)
       ↓
Simpan ke transaksi_sampah + update total_points + riwayat_poin
       ↓
Response: poin didapat ✅
```

---

## 📋 Daftar Endpoint Lengkap

### 🔐 Auth
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register user baru |
| POST | `/api/auth/login` | ❌ | Login, dapat token |
| GET | `/api/auth/me` | ✅ | Info user login |

### 👤 Users
| Method | Endpoint | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/api/users/dashboard` | ✅ | User | Dashboard user login |
| GET | `/api/users/history` | ✅ | User | Riwayat transaksi |
| PUT | `/api/users/profile` | ✅ | User | Update profil/password/foto |
| GET | `/api/users` | ✅ | Admin | Semua user |
| GET | `/api/users/:id` | ✅ | Admin | User by ID |
| POST | `/api/users` | ❌ | - | Buat user |
| PUT | `/api/users/:id` | ✅ | Admin | Update user |
| DELETE | `/api/users/:id` | ✅ | Admin | Hapus user |
| GET | `/api/users/:id/poin` | ✅ | - | Poin user |

### 🗑️ Klasifikasi
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/klasifikasi/scan` | ✅ | Upload gambar → klasifikasi AI |
| POST | `/api/klasifikasi/confirm` | ✅ | Konfirmasi berat → dapat poin |
| GET | `/api/klasifikasi/history` | ✅ | Riwayat scan sendiri |
| GET | `/api/klasifikasi/all` | ✅ Admin | Semua riwayat klasifikasi |

### 🏷️ Kategori Sampah
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/kategori` | ❌ | Semua kategori sampah |
| GET | `/api/kategori/:id` | ❌ | Detail kategori |

### 💸 Transaksi
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/transaksi` | ✅ | Tambah transaksi manual |
| GET | `/api/transaksi/all` | ✅ Admin | Semua transaksi |

### 🎁 Rewards
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/rewards` | ❌ | Daftar reward |
| POST | `/api/rewards/tukar` | ✅ | Tukar reward |
| GET | `/api/rewards/riwayat` | ✅ | Riwayat tukar sendiri |
| GET | `/api/rewards/riwayat/all` | ✅ Admin | Semua riwayat tukar |
| POST | `/api/rewards` | ✅ Admin | Buat reward |
| PUT | `/api/rewards/:id` | ✅ Admin | Update reward |
| DELETE | `/api/rewards/:id` | ✅ Admin | Hapus reward |

### 🪙 Riwayat Poin
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/riwayat-poin` | ✅ | Riwayat poin sendiri + summary |
| GET | `/api/riwayat-poin/all` | ✅ Admin | Semua riwayat poin |

---

## 🧪 Contoh Request Scan Sampah

### 1. Scan (upload gambar)
```
POST /api/klasifikasi/scan
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  image: [file gambar]
```

Response:
```json
{
  "success": true,
  "message": "Gambar berhasil diklasifikasi",
  "data": {
    "klasifikasi_id": "uuid-xxx",
    "kategori": "Plastik",
    "kategori_id": 1,
    "poin_per_kg": 100,
    "prediction_label": "Plastik",
    "ai_confidence": "95.23%",
    "image_url": "/uploads/klasifikasi/xxx.jpg"
  }
}
```

### 2. Konfirmasi berat
```
POST /api/klasifikasi/confirm
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "klasifikasi_id": "uuid-xxx",
  "berat": 2.5
}
```

Response:
```json
{
  "success": true,
  "message": "Sampah berhasil dikonfirmasi, poin ditambahkan!",
  "data": {
    "transaksi_id": 1,
    "kategori": "Plastik",
    "berat": 2.5,
    "poin_didapat": 250,
    "prediction_label": "Plastik",
    "ai_confidence": "95.23%"
  }
}
```

---

## ⚠️ Catatan untuk Tim

### Untuk Tim AI
- Deploy API ke **Render** (gratis): https://render.com
- Setelah deploy, kasih URL ke backend developer untuk diisi di `AI_API_URL`
- Endpoint yang dipakai: `POST /predict` dengan body `multipart/form-data`, field `file`
- Response yang diharapkan: `{ "kategori": "Plastik", "confidence": "95.23%" }`

### Kategori Sampah (sesuai label model AI)
| Kategori | Poin/kg |
|---|---|
| Plastik | 100 |
| Kertas | 50 |
| Kaca | 80 |
| Logam | 120 |
| Kardus | 40 |
| Residu | 5 |

> **Catatan:** Kategori **Organik** dihapus dari database karena tidak dikenali model AI.