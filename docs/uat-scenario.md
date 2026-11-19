# Lembar Skenario & Hasil Pengujian UAT
**User Acceptance Testing (UAT) — ToDjuanda Smart Airport Navigation System**  
Bandar Udara Internasional Juanda Surabaya (SUB) — InJourney Airports

---

## 1. Informasi Pengujian
- **Sistem yang Diuji**: ToDjuanda — Smart Airport Navigation System (v2.0)
- **Target Pengguna**: Penumpang Terminal 1 Juanda & Staf Administrator Operasional
- **Metode**: Pengujian Fungsional Black-Box & Verifikasi Lapangan (*Walkability Validation*)
- **Lingkungan Uji**: Google Chrome Mobile (Android/iOS), Desktop Browser, Resolusi Handphone (402 x 874)

---

## 2. Matriks Skenario Pengujian (UAT Test Cases)

| ID | Modul / Fitur | Skenario Uji | Hasil yang Diharapkan | Status |
|---|---|---|---|:---:|
| **UAT-01** | Navigasi 3D | Memilih titik awal pintu masuk dan destinasi toko (misal: A&W) di Lantai 1. | Rute 3D hijau berpendar muncul menyusuri koridor jalan tanpa menembus dinding pembatas. | **LULUS (PASS)** |
| **UAT-02** | Rute Lintas Lantai | Mencari rute dari Check-in (Lantai 1) menuju Gate Keberangkatan (Lantai 2). | Rute mengarahkan penumpang naik menggunakan eskalator/tangga yang tepat sesuai arah arus. | **LULUS (PASS)** |
| **UAT-03** | Mode Kursi Roda | Mengaktifkan opsi rute aksesibel / disabilitas. | Rute menghindari tangga biasa dan memprioritaskan lift/rambu ramah kursi roda. | **LULUS (PASS)** |
| **UAT-04** | Pin Titik Jalan Bebas | Mengklik sembarang area lantai terbuka pada peta 3D. | Titik koordinat klik dijadikan titik awal kustom yang valid untuk kalkulasi rute. | **LULUS (PASS)** |
| **UAT-05** | Direktori & Search | Mengetik nama tenant atau fasilitas pada search bar (misal: "Baggage" atau "ATM"). | Hasil muncul secara instan, lengkap dengan info lantai dan status operasional gerai. | **LULUS (PASS)** |
| **UAT-06** | Pemilihan Pintu Tenant | Mengklik salah satu pintu arah mata angin (Utara/Timur/Selatan/Barat) pada tenant. | Titik mulai navigasi terpasang tepat pada pintu gerai yang dipilih oleh pengguna. | **LULUS (PASS)** |
| **UAT-07** | Login Portal Admin | Mengakses `/auth/signin` pada perangkat mobile (402x874). | Formulir masuk langsung tampil rapi di tengah layar tanpa perlu scroll vertikal. | **LULUS (PASS)** |
| **UAT-08** | Navbar Admin Mobile | Menekan tombol menu navigasi pada dashboard admin di handphone. | Sidebar muncul sebagai drawer halus dari sebelah kiri tanpa menutupi dashboard secara permanen. | **LULUS (PASS)** |
| **UAT-09** | Konfigurasi Peta 3D | Mengubah jadwal toko menjadi "Buka 24 Jam" dan menyimpan perubahan. | Perubahan tersimpan di database PostgreSQL dan langsung terrefleksi pada tampilan 3D penumpang. | **LULUS (PASS)** |
| **UAT-10** | RBAC Superadmin | Akun Admin Komersil mencoba mengakses menu Akun Administrator. | Akses ditolak dan hanya Superadmin yang diizinkan mengelola kredensial admin. | **LULUS (PASS)** |

---

## 3. Format Berita Acara Serah Terima (BAST)

```
BERITA ACARA SERAH TERIMA SISTEM (BAST)
Nomor: BAST/TODJUANDA/2026/XI/001

Pada hari ini, ...................., tanggal ...... bulan .................... tahun 2026,
bertempat di Kantor Pengelola Bandar Udara Internasional Juanda Surabaya,
telah dilaksanakan serah terima hasil pengembangan perangkat lunak:

Nama Proyek : ToDjuanda — Smart Airport Navigation System
Versi       : 2.0.0 (Production Ready)
Lingkup     : Digital Twin 3D Terminal 1, Engine Navigasi Dijkstra,
              Portal Manajemen Operasional Komersil & Superadmin,
              dan Dokumentasi Teknis Lengkap.

PIHAK PERTAMA (Tim Pengembang) menyerahkan seluruh source code, berkas aset,
database migration script, dan dokumentasi operasional kepada PIHAK KEDUA (Pengelola Bandara).

PIHAK KEDUA telah melakukan verifikasi dan uji coba fungsional (UAT)
dengan hasil SELURUH FITUR UTAMA DINYATAKAN LULUS DAN SIAP DIGUNAKAN.


PIHAK PERTAMA,                                    PIHAK KEDUA,
Tim Pengembang ToDjuanda                          Pengelola Bandara Juanda


( ..................................... )         ( ..................................... )
```
