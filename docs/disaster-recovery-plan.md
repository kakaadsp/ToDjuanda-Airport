# Laporan & Prosedur Disaster Recovery Plan (DRP)
**Pemeliharaan Sistem & Pencadangan Basis Data PostgreSQL Menggunakan pg_dump ke Berkas .sql**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Latar Belakang & Tujuan

Sebagai sistem navigasi publik di Bandara Internasional Juanda, ketersediaan (*availability*) dan integritas (*integrity*) basis data operasional merupakan hal yang sangat krusial. Basis data PostgreSQL ToDjuanda mengelola data vital bandara, seperti:
- **Akun & Peran Administrator** (`User`)
- **Topologi Graf Navigasi & Konektor Antarlantai** (`RouteNode`, `RouteEdge`)
- **Direktori Tenant Komersial & Jam Layanan** (`Tenant`, `Space`, `OperationalHour`)
- **Fasilitas Umum & Ruang Pelayanan** (`Facility`, `SpaceAssignment`)
- **Jejak Audit Keamanan Operasional** (`AuditLog`)

Jika terjadi kegagalan sistem (*hardware failure*), bencana tak terduga (*disaster*), atau korupsi data (*data corruption*), tim IT bandara harus dapat memulihkan seluruh layanan dalam waktu singkat tanpa kehilangan data kritis. Dokumen ini menyajikan panduan resmi pencadangan menggunakan `pg_dump` ke berkas `.sql` serta simulasi *Disaster Recovery Plan* (DRP).

---

## 2. Parameter Sasaran Pemulihan (RTO & RPO)

Sesuai standar pemeliharaan infrastruktur teknologi informasi bandara:

| Parameter | Definisi | Target ToDjuanda | Justifikasi Operasional |
|---|---|:---:|---|
| **Recovery Time Objective (RTO)** | Batas waktu maksimal pemulihan sistem sejak insiden dideklarasikan hingga kembali beroperasi. | **&le; 30 Menit** | Meminimalkan gangguan layanan navigasi bagi penumpang di terminal. |
| **Recovery Point Objective (RPO)** | Batas toleransi maksimal data yang hilang (dihitung dari jeda pencadangan terakhir). | **&le; 4 Jam** | Jadwal pencadangan otomatis berkala (*cron job*) setiap 4 jam atau harian pada jam sepi penerbangan (02.00 WIB). |

---

## 3. Prosedur Pencadangan (Backup) Menggunakan `pg_dump` ke Berkas `.sql`

Tool `pg_dump` adalah utilitas resmi PostgreSQL untuk mengekstraksi seluruh skema tabel, relasi, constraint, indeks, dan isi data menjadi berkas teks perintah SQL (*plain-text SQL script*).

### A. Perintah Standar Pencadangan (Plain-Text SQL):
```bash
# Format Plain-Text (.sql) dengan instruksi pembersihan tabel otomatis
pg_dump "$DATABASE_URL" \
  --format=plain \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --encoding=UTF8 \
  --file="backup_todjuanda_$(date +%Y%m%d_%H%M%S).sql"
```

**Penjelasan Flag Perintah:**
- `--format=plain`: Menghasilkan berkas teks `.sql` berisikan perintah DDL (`CREATE TABLE`, `CREATE INDEX`) dan DML (`INSERT INTO` / `COPY`) yang *human-readable* dan dapat diedit atau diperiksa dengan text editor.
- `--clean`: Menambahkan instruksi `DROP TABLE IF EXISTS` sebelum pembuatan tabel baru agar tidak terjadi bentrok saat proses restore.
- `--if-exists`: Mencegah error jika tabel yang akan di-drop belum ada di database pemulihan.
- `--no-owner` & `--no-acl`: Meniadakan ketergantungan hak kepemilikan (*user ownership*) tertentu sehingga file `.sql` dapat di-restore ke akun pengguna atau server database lain tanpa kendala izin akses (*permission denied*).

### B. Otomatisasi Pencadangan (PowerShell Script untuk Windows Server):
Simpan skrip berikut sebagai `scripts/backup-db.ps1`:
```powershell
# Script Pencadangan Otomatis PostgreSQL ToDjuanda
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "./backups"
$OutputFile = "$BackupDir/todjuanda_backup_$Timestamp.sql"

if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir }

Write-Host "[INFO] Memulai pencadangan database ToDjuanda..." -ForegroundColor Cyan
pg_dump $env:DATABASE_URL --format=plain --clean --if-exists --no-owner --file=$OutputFile

if ($LASTEXITCODE -eq 0) {
    $Hash = (Get-FileHash -Path $OutputFile -Algorithm SHA256).Hash
    Write-Host "[SUCCESS] Pencadangan berhasil: $OutputFile" -ForegroundColor Green
    Write-Host "[INTEGRITY] SHA-256 Checksum: $Hash" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Pencadangan gagal!" -ForegroundColor Red
}
```

---

## 4. Prosedur Pemulihan (Restoration) Menggunakan `psql`

Karena berkas hasil pencadangan berformat `.sql` (*plain-text*), proses *restore* dijalankan menggunakan utilitas `psql`:

```bash
# Mengeksekusi berkas cadangan ke database target
psql "$DATABASE_URL" -f "backup_todjuanda_YYYYMMDD_HHMMSS.sql"
```

*(Jika menggunakan target database lokal baru)*:
```bash
# 1. Buat database baru jika belum ada
createdb -U postgres todjuanda_recovery

# 2. Impor berkas .sql cadangan
psql -U postgres -d todjuanda_recovery -f "backup_todjuanda_YYYYMMDD_HHMMSS.sql"
```

---

## 5. Alur Simulasi Disaster Recovery Plan (DRP)

Simulasi DRP dilakukan untuk memvalidasi kesiapan tim operasional dalam menghadapi kondisi darurat sistem:

```
+-----------------------------------------------------------------------------------+
| 1. Deteksi & Deklarasi Insiden (Database Rusak / Server Cloud Crash)             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. Verifikasi Integritas Berkas Cadangan (.sql Checksum SHA-256 & Size)          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. Provisioning Server / Database Standby (Neon DR Branch / Local PostgreSQL)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. Eksekusi Pemulihan Database via psql (Restorasi Skema & Data Lengkap)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 5. Verifikasi Integritas Data & Health Check (Login Admin, Rute 3D, Tenant)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 6. Pengalihan Koneksi Sistem (Update DATABASE_URL & Go-Live)                     |
+-----------------------------------------------------------------------------------+
```

### Rincian Skenario Simulasi:
1. **Fase 1: Deteksi Bencana (Menit 00:00)**  
   Simulasi kegagalan operasional di mana tabel database mengalami kerusakan akibat kesalahan migrasi atau kegagalan node server. Status sistem: *DOWN*.
2. **Fase 2: Verifikasi Berkas Cadangan (Menit 05:00)**  
   Tim mengambil berkas `.sql` cadangan terakhir, memverifikasi keutuhan berkas melalui *checksum* SHA-256, dan memastikan ukuran file sesuai kapasitas historis.
3. **Fase 3: Eksekusi Restorasi (Menit 10:00)**  
   Mengeksekusi perintah `psql "$DATABASE_URL" -f backup_todjuanda.sql`. Proses migrasi ulang skema dan injeksi kembali data memakan waktu ~3 menit.
4. **Fase 4: Uji Integritas Pasca-Pemulihan (Menit 15:00)**  
   Melakukan uji validasi kesehatan sistem:
   - Memastikan seluruh tabel utama (`User`, `Tenant`, `Facility`, `RouteNode`, `RouteEdge`) terisi data lengkap.
   - Menguji otentikasi login akun Superadmin (`POST /api/auth/callback/credentials`).
   - Menguji endpoint rute pejalan kaki (`POST /api/route`) berjalan normal (HTTP 200).
5. **Fase 5: Sistem Kembali Beroperasi Normal (Menit 20:00)**  
   Sistem ToDjuanda berhasil dipulihkan secara penuh dengan **Recovery Time: 20 Menit** (memenuhi batas SLA RTO $\le 30$ Menit) dan **Data Loss: 0%** (RPO terpenuhi).

---

## 6. Kesimpulan & Rekomendasi Pemeliharaan

1. Prosedur pencadangan menggunakan `pg_dump` ke berkas `.sql` terbukti andal, portabel, dan kompatibel dengan berbagai lingkungan PostgreSQL.
2. Format teks `.sql` memudahkan inspeksi manual dan menjamin restorasi yang cepat menggunakan perintah `psql`.
3. Simulasi *Disaster Recovery Plan* berhasil membuktikan bahwa sistem ToDjuanda memiliki ketahanan tinggi (*high resilience*) dan siap menghadapi insiden kritis di lingkungan bandara.
