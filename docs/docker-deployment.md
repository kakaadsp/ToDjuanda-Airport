# Panduan Deployment Staging Menggunakan Docker & Docker Compose
**Konfigurasi Multi-Stage Build & Orkestrasi Lingkungan Staging Bandara**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Latar Belakang & Tujuan

Untuk memastikan aplikasi navigasi bandara ToDjuanda dapat diuji secara terisolasi, konsisten, dan identik dengan lingkungan produksi (*production parity*), disiapkan konfigurasi containerisasi menggunakan **Docker** dan **Docker Compose**.

Tujuan konfigurasi container:
1. **Multi-Stage Build:** Mengurangi ukuran image container, mempercepat proses kompilasi (*build time*), dan memisahkan dependensi pengembangan (*dev dependencies*) dari image akhir.
2. **Hardening Keamanan Container:** Menjalankan aplikasi dengan user non-root khusus (`nextjs:nodejs` UID 1001) untuk memitigasi risiko eskalasi hak akses (*container breakout*).
3. **Orkestrasi Lingkungan Staging:** Menghubungkan aplikasi Next.js dengan basis data PostgreSQL 16 secara terisolasi dalam satu jaringan privat (`todjuanda-network`) dengan persistensi data volume.

---

## 2. Arsitektur Multi-Stage Build (`Dockerfile`)

Proses kompilasi dan build container dibagi ke dalam 4 tahap (*stages*) terstruktur:

```
[ Stage 1: base (node:20-alpine + libc6-compat + openssl) ]
                          |
                          v
[ Stage 2: deps (npm ci + Prisma Client Engine) ]
                          |
                          v
[ Stage 3: builder (npx prisma generate + npm run build) ]
                          |
                          v
[ Stage 4: runner (User non-root: nextjs UID 1001 + Healthcheck) ]
```

### Rincian Tiap Stage:
1. **Stage 1 (`base`):**  
   Menggunakan basis image minimalis `node:20-alpine`. Ditambahkan pustaka `libc6-compat` dan `openssl` untuk menjamin kompatibilitas mesin biner Prisma ORM pada distribusi Alpine Linux.
2. **Stage 2 (`deps`):**  
   Menginstal seluruh pustaka dependensi via `npm ci` berdasarkan `package-lock.json` untuk menjamin konsistensi versi paket secara deterministik.
3. **Stage 3 (`builder`):**  
   Menjalankan `npx prisma generate` dan kompilasi webpack produksi `npm run build`. Seluruh artefak statis dan halaman SSR di-bundle ke dalam direktori `.next`.
4. **Stage 4 (`runner`):**  
   Hanya menyalin berkas yang diperlukan untuk menjalankan aplikasi (`.next`, `public`, `node_modules`, `package.json`, dan `prisma`). Dilengkapi user non-root `nextjs` dan *healthcheck* otomatis melalui probe HTTP:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
     CMD wget -qO- http://localhost:3000/ || exit 1
   ```

---

## 3. Orkestrasi Staging (`docker-compose.yml`)

File `docker-compose.yml` menyediakan dua layanan mandiri:

1. **Layanan `postgres`:**
   - Image resmi `postgres:16-alpine`.
   - Menggunakan volume `postgres_staging_data` agar data tidak hilang saat container di-restart.
   - Dilengkapi *Healthcheck* `pg_isready` untuk memastikan database siap menerima koneksi sebelum aplikasi dijalankan.
2. **Layanan `app`:**
   - Dibangun otomatis menggunakan `Dockerfile`.
   - Dikonfigurasi dengan `depends_on: postgres (condition: service_healthy)` untuk mencegah error koneksi database saat start awal.
   - Terhubung pada port `3000:3000`.

---

## 4. Panduan Eksekusi di Server Staging

### A. Menjalankan Lingkungan Staging:
```bash
# 1. Build image dan jalankan seluruh container di background:
docker compose up -d --build

# 2. Melihat status container yang sedang berjalan:
docker compose ps

# 3. Memantau log aplikasi secara real-time:
docker compose logs -f app
```

### B. Inisialisasi Skema & Data Awal Database Staging:
Setelah container aktif, jalankan sinkronisasi skema Prisma dan seeding data awal:
```bash
# Sinkronisasi tabel Prisma:
docker compose exec app npx prisma db push

# Seeding akun administrator dan data awal:
docker compose exec app npm run seed
```

### C. Menghentikan Lingkungan Staging:
```bash
# Menghentikan container tanpa menghapus data volume:
docker compose down

# Menghentikan container dan membersihkan data volume:
docker compose down -v
```

---

## 5. Ringkasan Manfaat Teknis

- **Isolasi Penuh:** Tidak memerlukan instalasi Node.js atau PostgreSQL secara manual di server host staging.
- **Reproducibility:** Tim developer, QA, dan staf operasional bandara dapat menjalankan lingkungan staging dengan satu perintah (`docker compose up -d`).
- **Security Compliant:** Mematuhi standar keamanan CIS Docker Benchmark melalui implementasi non-root container runner dan image Alpine minimal.
