# Buku Panduan Pengguna (User Manual)
**ToDjuanda — Smart Airport Navigation System (Versi 2.0)**  
Bandar Udara Internasional Juanda Surabaya (SUB) — PT Angkasa Pura Indonesia (InJourney Airports)

---

## 1. Pendahuluan

**ToDjuanda** adalah platform *Digital Twin 3D Web-GIS* navigasi dalam ruangan (*indoor wayfinding*) yang dirancang khusus untuk memandu penumpang di Terminal 1 Bandara Internasional Juanda serta menyediakan portal terintegrasi bagi staf operasional dan pengelola komersial bandara.

Panduan ini dibagi ke dalam dua bagian utama:
1. **Panduan Penumpang (Passenger Guide):** Untuk pengguna publik/penumpang yang mengakses peta 3D melalui smartphone atau Kiosk.
2. **Panduan Administrator (Admin Staff Guide):** Untuk staf operasional dan komersial bandara yang mengelola data tenant, jam layanan, fasilitas, dan keamanan.

---

## 2. Bagian 1: Panduan Pengguna Penumpang (Passenger Guide)

### A. Membuka Peta Navigasi 3D
1. Penumpang cukup memindai **QR Code Wayfinding** yang terpasang pada pilar informasi, counter check-in, atau banner di Terminal 1 Juanda.
2. Peta akan otomatis terbuka di browser ponsel (Chrome, Safari, Edge) tanpa perlu mengunduh aplikasi tambahan (*Zero App Barrier*).
3. URL alternatif: `https://todjuanda.juanda-airport.com` (atau domain yang ditentukan pengelola).

### B. Mengontrol Tampilan Peta 3D Digital Twin
- **Geser / Putar (Orbit):** Sentuh layar dengan satu jari dan geser untuk memutar sudut pandang terminal.
- **Perbesar / Perkecil (Zoom):** Gunakan gerakan cubit (*pinch to zoom*) dua jari untuk mendekatkan atau menjauhkan tampilan.
- **Geser Bidang (Pan):** Sentuh dengan dua jari dan geser secara bersamaan untuk menggeser area lantai.
- **Pilih Lantai:** Tekan tombol **Lantai 1 (GF)** atau **Lantai 2 (FF)** pada panel kontrol untuk beralih denah lantai.
- **Mode Lite (Hemat Kuota):** Tekan tombol **Mode Lite** untuk mengaktifkan tampilan performa tinggi yang menghemat baterai ponsel dan konsumsi data internet.

### C. Mencari Tenant & Fasilitas Publik
1. Tekan tombol **Cari (Search)** atau ikon kaca pembesar pada layar utama.
2. Ketik nama destinasi yang dituju, misalnya:
   - Gerai Makanan/Minuman: *"A&W"*, *"Roti O"*, *"Kopi Juanda"*
   - Fasilitas Ibadah: *"Mushola"*, *"Tempat Sholat"*
   - Fasilitas Layanan: *"Toilet"*, *"Nursery Room"*, *"ATM"*, *"Baggage Wrap"*
   - Gate Keberangkatan: *"Gate 1"*, *"Gate 5"*, *"Ruang Tunggu"*
3. Ketuk nama gerai/fasilitas dari daftar hasil pencarian. Kamera 3D akan otomatis mengarahkan fokus ke lokasi tersebut.

### D. Menjalankan Rute Navigasi Pejalan Kaki
1. Setelah destinasi dipilih, tekan tombol **"Rute ke Sini"** atau **"Mulai Navigasi"**.
2. Garis hijau berpendar (*glowing wayfinding line*) akan muncul di atas lantai koridor memandu penumpang dari posisi awal menuju destinasi.
3. Karakter pemandu 3D (*Hero Avatar*) akan memperagakan simulasi jalan dengan informasi:
   - **Jarak Tempuh:** (contoh: *71 meter*)
   - **Estimasi Waktu Jalan:** (contoh: *1 menit pada kecepatan normal 1,35 m/detik*)
4. **Navigasi Lintas Lantai (L1 ke L2):**  
   Jika destinasi berada di lantai berbeda (misal dari Check-in L1 ke Gate Keberangkatan L2), sistem akan memandu ke eskalator naik terdekat dengan instruksi: *"Naik eskalator ke Lantai 2"*.

### E. Mode Aksesibilitas Khusus (Kursi Roda & Lansia)
1. Pada menu opsi rute, aktifkan tombol centang **"Mode Ramah Disabilitas / Kursi Roda"** (`accessibleOnly`).
2. Rute navigasi secara otomatis akan **menghindari eskalator dan tangga**, serta mengalihkan jalur secara eksklusif ke **LIFT** terdekat lengkap dengan petunjuk transisi ramah disabilitas.

---

## 3. Bagian 2: Panduan Pengguna Administrator (Admin Staff Guide)

### A. Masuk ke Portal Operasional
1. Akses halaman login staf di `/auth/signin`.
2. Masukkan alamat email terdaftar (misal: `superadmin@juanda-airport.com` atau `admin.komersil@juanda-airport.com`) dan kata sandi yang telah ditetapkan.
3. Tekan tombol **"Masuk ke Portal"**. Sistem dilengkapi proteksi *Login Guard* yang membatasi maksimal 8 kali kesalahan kata sandi.

### B. Dashboard Analitik Operasional
Halaman utama menampilkan ringkasan data real-time:
- Jumlah total tenant komersial aktif.
- Tingkat okupansi kavling ruang usaha di Terminal 1.
- Filter sebaran status operasional tenant per lantai (Lantai 1 dan Lantai 2).

### C. Pengelolaan Peta Terminal & Konfigurasi Tenant
1. Masuk ke menu **"Peta Terminal"** di bilah menu sebelah kiri (buka hamburger menu jika menggunakan smartphone).
2. **Mencari Kavling/Tenant:** Gunakan kotak pencarian (*live search bar*) di bagian atas untuk menemukan kavling secara instan.
3. **Mengatur Status Operasional:**  
   Pilih status toko: **Buka**, **Buka 24 Jam**, atau **Tutup**. Tentukan rentang jam buka dan tutup jika terjadwal.
4. **Mengatur Posisi Pintu Gerai (4 Arah Mata Angin):**  
   Aktifkan pintu masuk yang tersedia (Utara, Timur, Selatan, Barat) dan atur posisi persentase geser pintu. Rute navigasi penumpang akan otomatis mengarah ke pintu yang aktif.
5. Tekan tombol **"Simpan Perubahan"**. Data langsung tersinkronisasi ke tampilan peta penumpang tanpa perlu me-reload aplikasi.

### D. Audit Log & Keamanan Akses (Khusus Superadmin)
1. Masuk ke menu **"Audit Logs & Log Keamanan"**.
2. Superadmin dapat memantau seluruh riwayat aktivitas mutasi data secara transparan:
   - Nama aktor/staf pelaksana.
   - Jenis tindakan (`UPDATE_TENANT_CONFIG`, `USER_LOGIN`, `SET_TENANT_OPEN_24H`).
   - Objek kavling yang dimodifikasi beserta snapshot data sebelum dan sesudah perubahan.
3. Masuk ke menu **"Akun & Role Administrator"** untuk mendaftarkan staf baru atau menonaktifkan akun yang sudah tidak bertugas.

---

## 4. Bantuan Teknis & Kontak Dukungan

Bila terjadi kendala teknis operasional server atau perubahan tata letak terminal:
- **Unit Penanggung Jawab:** Divisi Airport Technology & IT Infrastructure Bandara Juanda
- **Lokasi Kantor:** Gedung Administrasi Bandara Internasional Juanda, Sidoarjo, Jawa Timur
- **Dokumen Teknis Terkait:**
  * Panduan Deployment: `docs/deployment-runbook.md`
  * Prosedur Pencadangan/DRP: `docs/disaster-recovery-plan.md`
  * Referensi API: `docs/api-reference.md`
