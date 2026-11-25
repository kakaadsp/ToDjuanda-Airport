# Notulensi & Laporan Presentasi Akhir Prototype ToDjuanda
**Demontrasi Fungsionalitas Web-GIS 3D Smart Airport Navigation kepada Mentor & Manajemen Airport Technology**  
Bandar Udara Internasional Juanda Surabaya (SUB) — PT Angkasa Pura Indonesia (InJourney Airports)

---

## 1. Informasi & Agenda Pelaksanaan

- **Kegiatan**: Presentasi dan Demonstrasi Tahap Akhir Prototype ToDjuanda v2.0
- **Waktu Pelaksanaan**: Rabu, 25 November 2026 | 09.30 – 11.45 WIB
- **Tempat**: Ruang Rapat Airport Technology & Innovation, Kantor Cabang Bandara Internasional Juanda
- **Pihak yang Hadir**:
  1. **Mentor Lapangan & Supervisor Teknis**: Tim Airport Technology (IT Division) Bandara Juanda.
  2. **Manajemen Operasional & Komersial**: Perwakilan Airport Commercial & Terminal Operations.
  3. **Tim Pengembang Mahasiswa**: Mahasiswa Pengembang Aplikasi ToDjuanda.

---

## 2. Struktur Materi & Skenario Live Demo yang Dipresentasikan

Presentasi dilakukan secara interaktif memadukan pemaparan arsitektur teknis dan simulasi *live demo* langsung pada server staging:

### A. Bagian 1: Inovasi Arsitektur Digital Twin 3D Web-GIS
- **Aksesibilitas Tanpa Instalasi (Zero App Barrier):** Penumpang tidak perlu mengunduh aplikasi mobile native (APK/App Store), cukup memindai QR code stiker di terminal untuk langsung membuka peta 3D interaktif di browser handphone (*Web-first approach*).
- **Akurasi Spasial Terkalibrasi:** Pemaparan integrasi model 3D `t1-gabungan.glb` yang telah dikalibrasi presisi dengan acuan geospasial Google Earth (panjang memanjang 648,57 m dan melintang 100,79 m).

### B. Bagian 2: Demonstrasi Alur Penumpang (Passenger Journey)
1. **Navigasi Multi-Lantai Otomatis (Lantai 1 ke Lantai 2):**  
   Mendemonstrasikan pemilihan rute dari *Drop Zone / Check-in Hall* Lantai 1 menuju *Boarding Gate 5* Lantai 2. Sistem secara otomatis mengarahkan penumpang menaiki eskalator satu arah (`EKS NAIK`) dengan petunjuk transisi visual dan teks: *"Naik eskalator ke Lantai 2"*.
2. **Mode Aksesibilitas Khusus (Kursi Roda & Lansia):**  
   Mendemonstrasikan pengaktifan opsi disabilitas (`accessibleOnly`). Rute secara cerdas menghindari seluruh tangga/eskalator dan memprioritaskan elevator (*LIFT*) dengan instruksi transisi ramah disabilitas.
3. **Pencarian Cepat Tenant & Fasilitas Publik:**  
   Pencarian instan menggunakan search bar cerdas untuk fasilitas umum (Mushola, Toilet, ATM, Baggage Wrap) dan gerai kuliner/ritel lengkap dengan info status operasional (*Buka/Tutup/24 Jam*).
4. **Playback Simulasi Hero Avatar 3D:**  
   Menampilkan karakter 3D berjalan menyusuri lintasan rute secara halus tanpa menembus dinding (*collision-free navigation*).

### C. Bagian 3: Demonstrasi Portal Manajemen Operasional (Admin Web)
1. **Peta Interaktif Editor:** Menampilkan pengaturan posisi pintu masuk gerai (Utara, Timur, Selatan, Barat) dan penyesuaian jam buka/tutup toko yang langsung terefleksi secara *real-time* ke tampilan peta penumpang.
2. **Role-Based Access Control (RBAC):** Menunjukkan isolasi wewenang `SUPER_ADMIN` dan `AIRPORT_ADMIN` guna mencegah manipulasi struktur graf rute oleh staf non-otoritas.
3. **Audit Trail Keamanan:** Menampilkan tabel riwayat aktivitas log operasional (`AuditLog`) yang mencatat setiap perubahan data secara transparan.

### D. Bagian 4: Pemaparan Pengujian Kualitas & Kesiapan Produksi
- **Ketahanan Trafik Puncak (Load Testing JMeter):** Kapasitas server melayani 500 pengguna serentak dengan throughput 83,4 req/s dan latensi rata-rata 88 ms tanpa error (Error Rate: 0,00%).
- **Efisiensi Database (EXPLAIN ANALYZE):** Alokasi B-Tree index pada tabel fasilitas memangkas waktu query hingga 95% (dari 1,91 ms ke 0,094 ms).
- **Keamanan Siber Standar OWASP:** Mitigasi Broken Access Control, proteksi Brute Force Login Guard, dan implementasi 9 HTTP Security Headers.
- **Kesiapan Staging & DRP:** Ketersediaan container Docker Multi-stage serta SOP Disaster Recovery Plan berbasis pencadangan `pg_dump`.

---

## 3. Umpan Balik (Feedback) & Evaluasi Manajemen Airport Technology

| Aspek Penilaian | Evaluasi Mentor & Manajemen | Tindak Lanjut / Rekomendasi |
|---|---|---|
| **Performa Rendering 3D** | Sangat baik. Model 3D terminal dapat dirender dengan mulus (60 FPS) pada perangkat mobile tanpa lag yang berarti. | Pertahankan optimasi Mode Lite untuk menghemat konsumsi kuota data penumpang. |
| **Akurasi Rute Navigasi** | Rute pejalan kaki sangat rapi, tidak menembus pilar/kios, dan aturan satu arah eskalator dipatuhi secara ketat. | Siap untuk tahap uji coba terbatas (*field pilot testing*) dengan QR code di area Gate 1–12. |
| **Keamanan & Tata Kelola Data** | Arsitektur RBAC dan pencatatan audit log dinilai telah memenuhi standar kepatuhan TI korporat InJourney. | Dokumen *Asset Inventory* dan *Disaster Recovery Plan* disetujui sebagai lampiran operasional resmi. |
| **Kelayakan Serah Terima (Handover)** | Prototype dinilai **Production-Ready** dan memenuhi seluruh spesifikasi fungsional maupun non-fungsional. | Dilanjutkan ke penandatanganan Berita Acara Serah Terima (BAST). |

---

## 4. Kesimpulan Hasil Presentasi

Presentasi tahap akhir prototype **ToDjuanda — Smart Airport Navigation System v2.0** berjalan dengan lancar dan sukses. Mentor lapangan serta manajemen divisi Airport Technology menyatakan bahwa prototype ini **diterima secara penuh** dengan predikat memuaskan, siap diintegrasikan pada ekosistem layanan digital Bandara Internasional Juanda.
