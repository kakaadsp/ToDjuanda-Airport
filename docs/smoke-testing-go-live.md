# Laporan Smoke Testing & Prosedur Verifikasi Go-Live
**Validasi Kelayakan Rilis Server Staging Paska-Deployment (Build Verification Testing)**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Latar Belakang & Konsep Go-Live

Dalam siklus rilis perangkat lunak tingkat instansi (*enterprise airport software*), transisi dari tahap pengembangan menuju tahap operasional aktif (*Go-Live*) memerlukan mekanisme gerbang mutu (*quality gate*) yang ketat. 

**Smoke Testing** (juga dikenal sebagai *Build Verification Testing* atau BVT) adalah serangkaian pengujian cepat terhadap alur-alur paling mendasar dan kritis pada sistem paska-deployment. Tujuannya adalah memastikan bahwa seluruh konfigurasi lingkungan server staging (variabel lingkungan, koneksi database, routing WebGL, dan firewall) telah terpasang dengan benar sebelum pengguna publik atau staf bandara dialihkan ke sistem baru.

---

## 2. Matriks Uji Smoke Testing Paska-Deployment

Pengujian mencakup 7 skenario kritis (*critical test cases*) yang merepresentasikan integritas penuh sistem ToDjuanda:

| ID Uji | Komponen Target | Metode & Endpoint | Kriteria Keberhasilan (Expected) | Status Evaluasi |
|---|---|---|---|:---:|
| **TC-01** | Web Application Core | `GET /` | HTTP 200 OK, dokumen HTML utama berhasil dirender. | **LULUS (PASS)** |
| **TC-02** | 3D Digital Twin Model | `HEAD /models/t1-gabungan.glb` | HTTP 200 OK, berkas GLB 3D dapat diunduh tanpa error CORS. | **LULUS (PASS)** |
| **TC-03** | Database Connectivity | `GET /api/tenants?terminal=T1` | HTTP 200 OK, Prisma ORM berhasil mengambil direktori gerai. | **LULUS (PASS)** |
| **TC-04** | A-Star / Dijkstra Engine | `POST /api/route` | HTTP 200 OK, kalkulasi rute menghasilkan array segmen valid. | **LULUS (PASS)** |
| **TC-05** | Security Access Control | `GET /api/admin/users` | **HTTP 401 Unauthorized**, proteksi API privat terbukti aktif. | **LULUS (PASS)** |
| **TC-06** | Auth Portal Interface | `GET /auth/signin` | HTTP 200 OK, formulir login kredensial tampil sempurna. | **LULUS (PASS)** |
| **TC-07** | HTTP Security Headers | `GET /` (Header Check) | Header `X-Frame-Options: DENY` & `X-Content-Type-Options: nosniff` aktif. | **LULUS (PASS)** |

---

## 3. Otomatisasi Smoke Testing (`scripts/smoke-test.mjs`)

Untuk memastikan pengujian dapat dijalankan secara cepat dan berulang setiap kali ada pipeline deployment baru, telah dibuat skrip otomatisasi Node.js pada `scripts/smoke-test.mjs`.

### Cara Menjalankan Pengujian:

```bash
# Menjalankan smoke test terhadap server staging lokal / container:
node scripts/smoke-test.mjs http://localhost:3000

# Atau terhadap URL staging remote:
node scripts/smoke-test.mjs https://staging-todjuanda.juanda-airport.com
```

### Log Hasil Eksekusi Otomatis:
```text
[SMOKE TEST] Memulai pengujian paska-deployment pada target: http://localhost:3000

✔ [PASS] TC-01: Verifikasi Respons Server & Halaman Utama (Homepage) (42ms - HTTP 200)
✔ [PASS] TC-02: Verifikasi Integritas Aset Peta 3D Digital Twin (GLB Model) (18ms - HTTP 200)
✔ [PASS] TC-03: Verifikasi API Direktori Tenant & Konektivitas Database (65ms - HTTP 200)
✔ [PASS] TC-04: Verifikasi Core Routing Engine Navigasi (POST /api/route) (84ms - HTTP 200)
✔ [PASS] TC-05: Verifikasi Proteksi Endpoint Privat Admin (Broken Access Control Check) (12ms - HTTP 401)
✔ [PASS] TC-06: Verifikasi Halaman Autentikasi Staf (/auth/signin) (25ms - HTTP 200)
✔ [PASS] TC-07: Verifikasi Injeksi HTTP Security Headers (15ms - HTTP 200)

========================================================
Hasil Smoke Testing: 7 LULUS | 0 GAGAL (Total: 7)
========================================================
[GO-LIVE READY] Sistem staging dinyatakan stabil dan siap rilis ke produksi!
```

---

## 4. Kriteria Kelulusan & Keputusan Go-Live (*Go / No-Go Decision*)

1. **Kriteria "GO" (Rilis Disetujui):**
   - Tingkat kelulusan Smoke Testing wajib mencapai **100% (7/7 Pass)**.
   - Tidak ada error 500 (*Internal Server Error*) pada endpoint basis data.
   - Latensi respons paska-deployment berada di bawah 200 ms untuk seluruh API utama.
2. **Kriteria "NO-GO" (Rilis Dibatalkan & Rollback):**
   - Model 3D GLB gagal termuat (HTTP 404/500).
   - Koneksi database terputus (*connection timeout*).
   - Endpoint privat admin dapat diakses tanpa otentikasi (kegagalan keamanan kritis).

---

## 5. Kesimpulan

Pelaksanaan Smoke Testing pada server staging ToDjuanda berhasil memvalidasi bahwa seluruh konfigurasi container, database pooling, model 3D, dan otorisasi keamanan beroperasi secara harmonis tanpa ada celah kritis. Sistem dinyatakan **memenuhi syarat penuh untuk implementasi Go-Live** di Bandara Internasional Juanda.
