# Runbook Deployment & Operasional
**ToDjuanda — Smart Airport Navigation System**  
Bandar Udara Internasional Juanda Surabaya (SUB) — InJourney Airports

---

## 1. Ikhtisar Sistem & Kebutuhan Lingkungan

Sistem Navigasi ToDjuanda dibangun dengan arsitektur modern Next.js App Router dan 3D Digital Twin berbasis WebGL (Three.js / React Three Fiber).

### Spesifikasi Server / Host Minimal:
- **Node.js**: v20.x LTS atau lebih tinggi
- **Database**: PostgreSQL v15+ (Didukung: Neon Serverless PostgreSQL, Supabase, AWS RDS, atau PostgreSQL lokal)
- **RAM**: Minimal 1 GB (Rekomendasi: 2 GB untuk build Three.js & Prisma engine)
- **Storage**: Minimal 2 GB ruang kosong untuk build cache & aset GLB
- **Browser Klien**: Chrome 90+, Safari 15+, Firefox 90+, Edge 90+ (Mendukung WebGL 2.0)

---

## 2. Konfigurasi Environment Variables (`.env`)

Salin file `.env.example` menjadi `.env` di root direktori proyek:

```bash
cp .env.example .env
```

Isi variabel lingkungan berikut:

| Variabel | Tipe / Contoh | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?schema=public` | URL koneksi PostgreSQL pooled (Prisma ORM) |
| `AUTH_SECRET` | String acak 32+ karakter | Secret key untuk enkripsi session JWT NextAuth |
| `AUTH_URL` | `https://todjuanda-airport.vercel.app` atau `http://localhost:3000` | URL domain publik aplikasi |
| `SEED_ADMIN_PASSWORD` | String minimal 12 karakter | Password inisialisasi akun Superadmin saat seeding |
| `IMAGE_STORAGE_PROVIDER` | `unconfigured` atau `google-drive` / `s3` | Adapter penyimpanan foto eksternal |

> **Perhatian Keamanan**: Jangan pernah commit file `.env` atau mengekspos `AUTH_SECRET` dan password database ke repository publik.

---

## 3. Langkah Instalasi & Deployment dari Nol

### A. Deployment di Cloud (Vercel — Rekomendasi)
1. Fork atau hubungkan repository GitHub `kakaadsp/ToDjuanda-Airport` ke akun Vercel.
2. Tambahkan Environment Variables di Vercel Dashboard (*Settings > Environment Variables*):
   - `DATABASE_URL` (dari Neon PostgreSQL)
   - `AUTH_SECRET` (generate dengan `openssl rand -base64 32`)
   - `AUTH_URL`
   - `SEED_ADMIN_PASSWORD`
3. Vercel akan otomatis menjalankan:
   ```bash
   npm run build
   ```
   *(Build script sudah mengikutsertakan `prisma generate` via lifecycle `postinstall`).*
4. Deploy selesai dan sistem langsung aktif.

---

### B. Deployment Self-Hosted (VPS / Server On-Premise Bandara)

Jalankan perintah berikut pada terminal server Linux (Ubuntu/Debian):

```bash
# 1. Clone repository
git clone https://github.com/kakaadsp/ToDjuanda-Airport.git
cd ToDjuanda-Airport

# 2. Install dependensi
npm install --frozen-lockfile

# 3. Generate Prisma Client
npx prisma generate

# 4. Sinkronisasi skema database
npx prisma db push

# 5. (Opsional) Inisialisasi Akun Superadmin Awal
npm run seed

# 6. Kompilasi aplikasi untuk produksi
npm run build

# 7. Jalankan server dengan process manager (PM2)
npm install -g pm2
pm2 start npm --name "todjuanda-app" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 4. Prosedur Maintenance Database (Prisma PostgreSQL)

### A. Backup Database (PostgreSQL Dump)
```bash
pg_dump "DATABASE_URL" -F c -b -v -f backup_todjuanda_$(date +%Y%m%d_%H%M%S).dump
```

### B. Restore Database
```bash
pg_restore -d "DATABASE_URL" -v backup_todjuanda_YYYYMMDD_HHMMSS.dump
```

### C. Pembaruan Skema Database (Migrasi)
Jika terdapat penambahan tabel atau kolom baru pada `prisma/schema.prisma`:
```bash
npx prisma db push
```
atau untuk migrasi terlacak:
```bash
npx prisma migrate dev --name <nama_migrasi>
```

---

## 5. Prosedur Pembaruan Model 3D Terminal (`.glb`)

Model 3D gabungan Terminal 1 Juanda disimpan pada direktori:
```
public/models/t1-gabungan.glb
```

**Aturan Standar saat Export dari Blender/3D software:**
1. **Pusat Koordinat (Origin):** Pertahankan origin model sesuai kalibrasi Google Earth Juanda T1 (lihat `docs/mode-lite-dan-kalibrasi-jarak.md`).
2. **Penamaan Objek Mesh:**
   - Gunakan format `T1-GF-COMM-XX` untuk toko lantai 1 (Ground Floor).
   - Gunakan format `T1-FF-COMM-XX` untuk toko lantai 2 (First Floor).
   - Gunakan prefix `tembok_` atau `pillar_` untuk rintangan navigasi.
   - Pintu masuk diberi awalan `DOOR__`.
3. Setelah menimpa file `t1-gabungan.glb`, jalankan pengujian regresi:
   ```bash
   npm test
   ```
   *Seluruh 74 unit test validasi GLB akan otomatis memastikan jalur pejalan kaki, tangga, eskalator, dan deteksi lantai tetap utuh.*

---

## 6. Panduan Troubleshooting (FAQ Tim IT)

### 1. Masalah: Layar 3D Peta Hitam / Model Tidak Muncul di Klien
- **Penyebab**: Perangkat klien menonaktifkan akselerasi perangkat keras (*Hardware Acceleration*) pada browser, atau WebGL diblokir oleh ekstensi browser.
- **Solusi**: 
  - Pastikan opsi *"Use hardware acceleration when available"* pada browser aktif.
  - Sistem ToDjuanda telah dilengkapi mode fallback otomatis (*Mode Lite*) yang dapat diaktifkan manual oleh pengguna melalui tombol kompas/lite di kontrol peta kanan bawah.

### 2. Masalah: Gagal Login Admin ("Sign In Error")
- **Penyebab**: Hash kata sandi pada database tidak cocok, atau koneksi database pooled terputus.
- **Solusi**:
  - Jalankan script reset/seed:
    ```bash
    npm run seed
    ```
  - Cek log koneksi pada Neon / PostgreSQL dashboard.

### 3. Masalah: Port 3000 Bentrok saat Start
- **Solusi**: Ubah port saat menjalankan Next.js:
  ```bash
  PORT=3001 npm start
  ```
  atau sesuaikan di file konfigurasi Nginx reverse proxy.
