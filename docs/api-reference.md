# Spesifikasi & Dokumentasi API
**ToDjuanda — Smart Airport Navigation System**  
Bandar Udara Internasional Juanda Surabaya (SUB) — InJourney Airports

---

## 1. Ikhtisar & Standar REST

Semua endpoint API disajikan melalui protokol HTTPS dan menggunakan format payload **JSON** (`Content-Type: application/json`).

### Ringkasan Kode Respon HTTP:
- `200 OK`: Permintaan berhasil diproses.
- `201 Created`: Entitas baru berhasil dibuat.
- `400 Bad Request`: Payload permintaan tidak valid atau format salah (Zod validation error).
- `401 Unauthorized`: Sesi admin tidak ditemukan atau token tidak valid.
- `403 Forbidden`: Pengguna tidak memiliki role yang sesuai (misal: Admin Komersil mengakses fitur Superadmin).
- `404 Not Found`: Entitas tidak ditemukan.
- `500 Internal Server Error`: Terjadi kesalahan pada server atau koneksi database.

---

## 2. Hak Akses & Matriks Autentikasi (RBAC)

Sistem menggunakan NextAuth (Credentials Provider) berbasis sesi JWT.

| Level Role | Hak Akses Utama |
|---|---|
| **Public (Tanpa Login)** | Pencarian rute wayfinding, membaca direktori tenant publik, akses peta 3D. |
| **AIRPORT_ADMIN (Admin Komersil)** | Mengelola jadwal operasional toko/fasilitas, konfigurasi pintu 3D, status buka/tutup tenant. |
| **SUPER_ADMIN (Super Administrator)** | Seluruh akses Admin Komersil + manajemen akun administrator, graph navigasi bandara, audit log keamanan. |

---

## 3. Endpoint Publik (Penumpang)

### A. Perhitungan Rute Navigasi (Wayfinding)
Menghitung rute terpendek dengan algoritma Dijkstra, navigasi lintas lantai, dan instruksi langkah pejalan kaki.

- **Method**: `POST`
- **URL**: `/api/route`
- **Header**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "terminal": "T1",
  "start": { "x": 12.5, "y": 0.0, "z": -45.2, "floor": "L1" },
  "destination": "T1-GF-COMM-01",
  "accessible": false
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "route": [
    { "x": 12.5, "y": 0.0, "z": -45.2, "floor": "L1" },
    { "x": 15.0, "y": 0.0, "z": -40.0, "floor": "L1" }
  ],
  "distanceMeters": 48.6,
  "estimatedTimeSeconds": 42,
  "steps": [
    { "instruction": "Mulai berjalan lurus ke arah koridor komersial", "distance": 18 },
    { "instruction": "Belok kanan di depan Family Mart", "distance": 30.6 }
  ],
  "requiresFloorChange": false
}
```

---

### B. Direktori Tenant Publik
Mengambil daftar tenant, restoran, ATM, dan fasilitas terminal yang aktif.

- **Method**: `GET`
- **URL**: `/api/tenants`
- **Query Parameters**:
  - `terminal` (opsional): `T1` | `T2` | `ALL` (default: `ALL`)
  - `category` (opsional): Kategori gerai (misal: `Makanan & Minuman`, `Retail`, `ATM`)
  - `status` (opsional): `ACTIVE` | `TEMPORARILY_CLOSED`
  - `search` (opsional): Kata kunci nama toko atau fasilitas
- **Response `200 OK`**:
```json
[
  {
    "id": "clx...",
    "name": "Family Mart",
    "spaceCode": "T1-GF-COMM-01",
    "terminal": "T1",
    "floor": "L1",
    "category": "Retail & Convenience",
    "status": "ACTIVE",
    "openTime": "00:00",
    "closeTime": "23:59",
    "photoUrl": "https://..."
  }
]
```

---

## 4. Endpoint Manajemen Operasional (Admin)

### A. Pengaturan Objek Model Peta 3D
Digunakan oleh portal admin untuk mengonfigurasi status kavling, warna 3D, arah pintu masuk, dan jadwal operasional gerai.

- **Method**: `GET` | `POST`
- **URL**: `/api/admin/map-objects`
- **Autentikasi**: Memerlukan sesi `AIRPORT_ADMIN` atau `SUPER_ADMIN`
- **Response GET `200 OK`**: Mengembalikan konfigurasi objek terdaftar dalam format dictionary objek `{ [objectName]: MapObjectConfig }`.

- **Method**: `PUT`
- **URL**: `/api/admin/map-objects/[name]`
- **Request Body**:
```json
{
  "objectName": "baggage wrap-01",
  "displayName": "Baggage Wrap 1",
  "entityType": "FACILITY",
  "occupancy": "OCCUPIED",
  "color": "#D8C7A7",
  "openTime": "08:00",
  "closeTime": "22:00",
  "entryDoors": [
    { "side": "NORTH", "open": true, "position": 50 }
  ],
  "photoUrl": "https://..."
}
```

---

### B. CRUD Data Tenant
- `POST /api/tenants`: Membuat entitas tenant baru. *(Admin Komersil & Superadmin)*
- `PATCH /api/tenants/[id]`: Memperbarui informasi atau status tenant. *(Admin Komersil & Superadmin)*
- `DELETE /api/tenants/[id]`: Menghapus data tenant dari sistem. *(Superadmin)*

---

### C. Manajemen Akun Administrator (Superadmin Khusus)
- **URL**: `/api/admin/users`
- **Autentikasi**: Wajib role `SUPER_ADMIN`
- `GET`: Mengambil seluruh daftar admin Juanda.
- `POST`: Mendaftarkan akun admin baru dengan password terenkripsi bcrypt.
- `PATCH`: Mengubah role admin atau mereset password akun.
- `DELETE`: Menghapus akun administrator.

---

### D. Audit Log & Keamanan Real-time
Merekam seluruh aktivitas penting (perubahan status toko, edit pintu 3D, pergantian role, aktivitas login).

- **Method**: `GET`
- **URL**: `/api/admin/audit-logs`
- **Autentikasi**: Memerlukan sesi `SUPER_ADMIN`
- **Response `200 OK`**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_01",
      "adminEmail": "superadmin@juanda-airport.com",
      "action": "UPDATE_MAP_OBJECT",
      "target": "T1-GF-COMM-01",
      "details": "Mengubah status Family Mart menjadi Buka 24 Jam",
      "createdAt": "2026-11-19T03:15:00.000Z"
    }
  ]
}
```
