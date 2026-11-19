# Changelog
Semua perubahan penting pada proyek **ToDjuanda — Smart Airport Navigation System** didokumentasikan di berkas ini.

Format berkas mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mengadopsi [Semantic Versioning](https://semver.org/lang/id/).

---

## [2.0.0] - 2026-11-19 (Production Ready)

### Ditambahkan
- **Digital Twin 3D Terminal 1 Juanda**: Model 3D gabungan Lantai 1 (GF) dan Lantai 2 (FF) berbasis WebGL (Three.js & React Three Fiber).
- **Engine Navigasi Cerdas (Dijkstra Walkability)**:
  - Perhitungan rute pejalan kaki orthogonal tanpa menembus dinding atau pilar.
  - Dukungan jalur multi-lantai otomatis (naik/turun tangga & eskalator terarah).
  - Mode rute aksesibel khusus kursi roda / disabilitas.
  - Fitur bebas klik di sembarang area koridor jalan untuk menentukan titik awal navigasi.
  - Pemilihan spesifik pintu masuk/keluar gerai komersial sesuai 4 arah mata angin (Utara, Timur, Selatan, Barat).
- **Portal Manajemen Operasional Modern**:
  - Dukungan Role-Based Access Control (RBAC): Superadmin dan Admin Komersil.
  - Editor 3D langsung: konfigurasi status buka/tutup, jam operasional, warna objek 3D, dan foto gerai.
  - Search bar interaktif pencarian tenant dan kode blok kavling langsung pada kanvas peta 3D.
  - Responsivitas mobile penuh dengan navigasi *off-canvas drawer* di sisi kiri dan form adaptif.
  - Real-time Audit Logs untuk pencatatan riwayat keamanan dan aktivitas administratif.
- **Rangkaian Pengujian Otomatis**: 74 unit & integration tests mencakup algoritma Dijkstra, kalibrasi koordinat GLB, konektor eskalator, dan validasi CRUD.
- **Dokumentasi Lengkap Handover**:
  - `docs/deployment-runbook.md` (Panduan instalasi, konfigurasi server, dan troubleshooting).
  - `docs/api-reference.md` (Spesifikasi REST API lengkap).
  - `docs/uat-scenario.md` (Lembar uji fungsional UAT & draft Berita Acara Serah Terima).

### Diubah
- Migrasi database dari mock data lokal menjadi PostgreSQL serverless via Prisma ORM.
- Redesain tampilan antarmuka sign-in admin agar langsung proporsional di layar handphone tanpa perlu scroll.
- Pembaruan landing page dengan video showcase responsif dan tautan profil seluruh kontributor pengembang.

### Dihapus
- Berkas arsip magang lama (`legacy/v1/User Guide.pdf` berukuran 6,3 MB) untuk merampingkan ukuran repositori.

---

## [1.0.0] - Versi Awal (Legacy Prototipe)
- Prototipe 2D berbasis SVG dan grid matriks lantai statis.
- Simulasi rute dasar tanpa integrasi model 3D nyata.
- Penyimpanan data berbasis file lokal tanpa dukungan database relasional.
