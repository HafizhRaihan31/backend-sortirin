# 🗑️ Backend Sortirin

Backend REST API untuk aplikasi **Sortirin** — platform bank sampah digital dengan klasifikasi sampah berbasis AI.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: node-postgres (pg)
- **Auth**: JWT (jsonwebtoken)
- **Upload**: Multer
- **AI Integration**: Axios → Railway (FastAPI)
- **Password Hashing**: bcrypt

---

## 🚀 Cara Menjalankan

### 1. Clone repository
```bash
git clone https://github.com/username/backend-sortirin.git
cd backend-sortirin
```

### 2. Install dependency
```bash
npm install
```

### 3. Setup environment variables
Buat file `.env` di root project:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sortirin_db
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your_random_secret_key

AI_API_URL=https://klasifikasi-sampah-api-production.up.railway.app

NODE_ENV=development
PORT=5000
```

> Generate JWT_SECRET yang aman:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Setup database
Buat database `sortirin_db` di PostgreSQL, lalu jalankan file migration:
```bash
# Di pgAdmin: jalankan file migration.sql
# Atau via psql:
psql -U postgres -d sortirin_db -f migration.sql
```

### 5. Jalankan server
```bash
# Development
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:5000`

---

## 🛠️ Alur Fitur Scan Sampah

```
User upload gambar
       ↓
POST /api/klasifikasi/scan
       ↓
Backend simpan gambar ke /uploads/klasifikasi/
       ↓
Backend forward gambar ke AI API (Railway)
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
    "image_url": "/uploads/klasifikasi/xxx.jpg",
    "instruksi": "Pastikan foto hanya berisi satu jenis sampah untuk hasil klasifikasi yang akurat"
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

## 🗃️ Struktur Database

| Tabel | Keterangan |
|---|---|
| `users` | Data user & total poin |
| `kategori_sampah` | Kategori sampah & poin per kg |
| `klasifikasi` | Hasil scan AI per user |
| `transaksi_sampah` | Riwayat transaksi sampah |
| `reward` | Daftar reward yang tersedia |
| `penukaran_reward` | Riwayat penukaran reward |
| `riwayat_poin` | Riwayat poin masuk & keluar |

### Kategori Sampah (sesuai label model AI)
| Kategori | Poin/kg |
|---|---|
| Plastik | 100 |
| Kertas | 50 |
| Kaca | 80 |
| Logam | 120 |
| Kardus | 40 |
| Residu | 5 |

---

## 🔗 URL Terkait

| Layanan | URL |
|---|---|
| AI API | https://klasifikasi-sampah-api-production.up.railway.app |
| AI Docs | https://klasifikasi-sampah-api-production.up.railway.app/docs |
| Dashboard DS | https://dashboardpengolahansampah-fvwzbqyqs7zgmdcwvevjda.streamlit.app |
| FE vercel | https://sortirin.app/ |
