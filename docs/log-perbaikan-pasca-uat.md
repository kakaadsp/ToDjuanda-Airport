# Log Perbaikan Pasca UAT (Post-UAT Hotfixes & POI Data Updates)
**Tindak Lanjut Masukan Operasional Angkasa Pura I & Pemutakhiran Atribut Data Fasilitas**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Latar Belakang & Tujuan

Berdasarkan hasil sesi *User Acceptance Testing* (UAT) dan verifikasi lapangan di Terminal 1 Bandara Internasional Juanda bersama tim operasional dan divisi Airport Technology PT Angkasa Pura I, terdapat beberapa catatan masukan (*feedback*) terkait kenyamanan penggunaan antarmuka pada perangkat mobile serta kebutuhan penyelarasan atribut data fasilitas publik (POI).

Dokumen ini mencatat seluruh tindakan perbaikan kilat (*hotfixes*), refaktorisasi antarmuka, dan pemutakhiran atribut data fasilitas yang telah diselesaikan untuk mencapai status *Production-Ready*.

---

## 2. Matriks Log Masukan & Hotfixes Antarmuka (UI/UX)

| ID Tiket | Modul / Komponen | Masukan dari Pihak Operasional | Solusi & Hotfix yang Diimplementasikan | Berkas Terdampak | Status |
|---|---|---|---|---|:---:|
| **HF-01** | Navigasi Admin Mobile | Menu navigasi admin pada smartphone berada di tengah atas dan menutupi kartu analitik saat halaman di-scroll. | Merefaktor navigasi mobile menjadi *off-canvas drawer* responsif di sebelah kiri dengan tombol toggle hamburger yang mudah dijangkau satu tangan. | `src/components/admin/AdminDashboardClient.tsx`, `src/app/globals.css` | **SELESAI (CLOSED)** |
| **HF-02** | Peta Terminal Admin | Pengelola kesulitan mencari letak kavling toko tertentu di dalam kanvas 3D yang luas tanpa alat bantu pencarian. | Menambahkan bilah pencarian langsung (*live search bar*) dengan menu dropdown otomatis untuk mencari tenant, kavling, atau nomor blok dengan fitur *camera focus*. | `src/components/admin/AdminMapPanel.tsx` | **SELESAI (CLOSED)** |
| **HF-03** | Form Pintu Tenant | Input konfigurasi 4 pintu gerai (Utara, Timur, Selatan, Barat) mengalami pemotongan teks (*clipping*) pada viewport layar 402x874 px. | Memperbaiki tata letak form menjadi *responsive fluid grid*, menyelaraskan posisi checkbox status pintu, dan menghilangkan *horizontal scrollbar*. | `src/components/admin/AdminMapPanel.tsx`, `src/app/globals.css` | **SELESAI (CLOSED)** |
| **HF-04** | Modal Dialog Mobile | Modal tutorial dan search overlay terasa kaku saat ditutup pada perangkat sentuh (*touchscreen*). | Menambahkan *backdrop click dismiss* yang lebih responsif dan menyempurnakan transisi CSS fade-in modal. | `src/components/wayfinding/SearchOverlayModal.tsx` | **SELESAI (CLOSED)** |

---

## 3. Pemutakhiran Atribut Data Fasilitas POI Final (Point of Interest)

Dilakukan sinkronisasi data master fasilitas bandara pada `src/data/demo-wayfinding.ts` dan skema basis data operasional:

### A. Daftar Pemutakhiran Atribut Fasilitas Kritis:

| Kode Fasilitas | Nama Fasilitas | Kategori | Penyesuaian Atribut Final | Posisi Pintu & Anchor Node |
|---|---|---|---|---|
| **T1-L1-MUS-01** | Mushola Al-Ikhlas | `prayer` | Status operasional: **Buka 24 Jam**, label dwibahasa, icon SVG vektor murni. | Terhubung ke `T1-L1_MUS1-NODE` (1,2 m di depan pintu masuk). |
| **T1-L1-MUS-02** | Mushola Ar-Rahman | `prayer` | Status operasional: **Buka 24 Jam**, penambahan info fasilitas wudhu & mukena. | Terhubung ke `T1-L1_MUS2-NODE` (bebas rintangan pilar). |
| **T1-L1-SRV-01** | Baggage Wrap 1 | `service` | Kode blok: `baggage wrap-01`, jam operasional: `08:00 - 22:00 WIB`, layanan wrapping koper. | Pintu Utama sisi Selatan, terhubung ke koridor publik. |
| **T1-L1-SRV-02** | Baggage Wrap 2 | `service` | Kode blok: `baggage wrap-02`, jam operasional: `08:00 - 22:00 WIB`, dekat area check-in barat. | Pintu Utama sisi Barat, terhubung ke koridor publik. |
| **T1-L1-FAC-01** | Toilet & Nursery Room | `facility` | Label dwibahasa: *Toilet & Ruang Laktasi*, penanda fasilitas ramah disabilitas. | Anchor node terkalibrasi di depan selasar toilet umum. |
| **T1-L1-INF-01** | Customer Service Info | `service` | Jam layanan: **24 Jam Operasional**, kontak informasi bandara Juanda. | Anchor node terpasang di tengah selasar kedatangan. |

### B. Validasi Titik Anchor Navigasi (*Snapping Validation*):
- Seluruh `anchorNodeId` fasilitas dipastikan berada tepat pada permukaan lantai terbuka (*walkable floor mesh*), berada di luar dinding pembatas, dan memiliki jarak minimum 1 meter dari daun pintu guna menjamin rute navigasi yang terbentuk dapat langsung dimasuki oleh pejalan kaki tanpa memotong geometri bangunan.

---

## 4. Hasil Verifikasi Ulang Pasca-Hotfix (Regression Testing)

1. **Uji Regresi Otomatis (Automated Test Suite):**
   - Rangkaian pengujian unit dan integrasi dijalankan ulang melalui `npm test`:  
     **Hasil: 74/74 Unit Test LULUS (100% Pass Rate, 0 Failures)**.
2. **Uji Antarmuka Mobile Responsif:**
   - Diverifikasi pada resolusi layar smartphone (402 x 874 px) pada Chrome DevTools:  
     * Drawer navigasi admin di sisi kiri membuka dan menutup dengan mulus.
     * Tidak ada elemen UI yang terpotong secara horizontal (*zero horizontal overflow*).
     * Bilah pencarian kavling di peta terminal dapat menemukan gerai secara instan.
3. **Kesiapan Serah Terima:**  
   Pihak operasional Angkasa Pura I telah memvalidasi seluruh hotfix dan menyatakan bahwa sistem siap 100% untuk digunakan pada tahap operasional publik.
