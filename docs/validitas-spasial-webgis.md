# Laporan Analisis Validitas Spasial Web-GIS & Evaluasi Rute Aksesibilitas
**Pengujian Skenario Navigasi Multi-Lantai, Konektor Vertikal (Lift/Eskalator), dan Integritas Spasial 3D**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Latar Belakang & Tujuan Analisis

Sistem navigasi dalam ruangan (*Indoor Web-GIS Wayfinding*) pada Terminal 1 Bandara Internasional Juanda memiliki kompleksitas spasial tinggi karena menggabungkan:
- **Dua Tingkat Lantai Operasional:** Lantai 1 (Ground Floor / GF - Keberangkatan & Kedatangan) dan Lantai 2 (First Floor / FF - Ruang Tunggu Keberangkatan / Boarding Gate 1–12).
- **Konektor Vertikal:** Eskalator satu arah naik (`EKS NAIK`), eskalator turun (`EKS TURUN`), tangga darurat/manual (`TANGGA`), dan elevator/lift penumpang.
- **Kebutuhan Aksesibilitas Khusus (PRM - *Persons with Reduced Mobility*):** Penumpang prioritas, pengguna kursi roda, lansia, dan orang tua dengan kereta bayi yang wajib dialihkan ke rute ramah disabilitas (tanpa tangga/eskalator).

Laporan ini memvalidasi akurasi data koordinat spasial, integritas proyeksi metrik, aturan arah konektor vertikal, dan validitas rute aksesibilitas pada sistem ToDjuanda.

---

## 2. Format & Karakteristik Data Koordinat Spasial

Sistem ToDjuanda mengintegrasikan tiga format data koordinat spasial:

| Format Data | File / Sumber | Sistem Koordinat | Karakteristik & Fungsi |
|---|---|---|---|
| **1. 3D glTF / GLB Binary** | `public/models/t1-gabungan.glb` | Cartesian 3D World Space $(X, Y, Z)$ | Geometri fisik terminal, mesh lantai pijak (`area_visitor`), dinding, pilar, tangga, dan eskalator berdimensi riil. |
| **2. 2D Orthogonal Grid JSON** | `src/data/map/T1_gabungan.json` | Matrix Integer $(R, C)$ $[100 \times 300]$ | Matriks sel navigasi diskret beresolusi tinggi, menyimpan batas ruang kavling tenant (`room: { r1, c1, r2, c2 }`). |
| **3. Vector SVG Map** | `public/map/juanda-terminal-1.svg` | Bidang Vektor $9820 \times 1875$ px | Representasi visual denah 2D Web-GIS dengan proyeksi langsung ke koordinat canvas. |

### Kalibrasi Jarak Anisotropik (World Metric Calibration)
Dikalibrasi terhadap acuan bentang fisik Google Earth (panjang memanjang $648,57\text{ m}$ dan melintang $100,79\text{ m}$):
$$\text{Jarak (Meter)} = \sqrt{(\Delta X \cdot 1.226957)^2 + (\Delta Y)^2 + (\Delta Z \cdot 1.291010)^2}$$
- **Sumbu $X$ (Memanjang):** $1\text{ unit model} \approx 1,226957\text{ meter}$.
- **Sumbu $Z$ (Melintang):** $1\text{ unit model} \approx 1,291010\text{ meter}$.
- **Sumbu $Y$ (Elevasi Vertikal):** $1\text{ unit model} = 1,000000\text{ meter}$.
- **Elevasi Antarlantai:** Lantai 1 berada pada $Y \approx 0,0\text{ m}$ dan Lantai 2 berada pada $Y \approx 3,0\text{ m}$ ($\Delta Y \approx 3,0\text{ meter}$).

---

## 3. Logika Deteksi Bidang Jalan & Konektor Vertikal

### A. Deteksi Bidang Pijak (*Walkable Floor Surface*)
- Permukaan jalan dideteksi dari bidang mendatar dengan kemiringan vertikal $\Delta Y < 12\text{ cm}$.
- Rute pejalan kaki otomatis diisolasi di dalam gedung: area apron luar (`area_merah`) dipisahkan secara ketat dari lantai sirkulasi publik (`area_visitor`).
- Algoritma snapping memastikan seluruh titik rute berada di atas sel lantai yang terbuka (*open walkable grid*).

### B. Validasi Arah Konektor Antarlantai (`detectFloorConnectors`)
Aturan arah gerak vertikal ditegakkan berdasarkan inspeksi geometri dan penamaan konektor:
1. **Eskalator Satu Arah Naik (`EKS NAIK`):**  
   Hanya mengizinkan transisi arah $L1 \rightarrow L2$ (`direction = "up"`). Dilarang keras digunakan untuk arah turun.
2. **Eskalator Satu Arah Turun (`EKS TURUN`):**  
   Hanya mengizinkan transisi arah $L2 \rightarrow L1$ (`direction = "down"`). Dilarang keras digunakan untuk arah naik.
3. **Tangga Manual (`TANGGA`):**  
   Mengizinkan transisi dua arah bolak-balik (`direction = "both"`).
4. **Eliminasi Konektor Ambigual:**  
   Eskalator tanpa penanda arah `NAIK` atau `TURUN` otomatis diabaikan dari graf pencarian rute demi keselamatan pejalan kaki.

---

## 4. Evaluasi Skenario Rute Navigasi Multi-Lantai & Aksesibilitas

### Skenario 1: Penumpang Umum dari Check-in (Lantai 1) menuju Boarding Gate (Lantai 2)
* **Titik Awal:** Check-in Hall Lantai 1 ($Y = 0\text{ m}$).
* **Titik Tujuan:** Gate 5 Lantai 2 ($Y = 3\text{ m}$).
* **Hasil Evaluasi:**
  - Sistem menghasilkan rute multi-lantai yang valid.
  - Rute di Lantai 1 menuju titik awal eskalator naik (`bottomLanding`), menaiki eskalator miring, lalu keluar di `topLanding` Lantai 2.
  - Menghasilkan instruksi audio/teks transisi: *"Naik eskalator ke Lantai 2"*.
  - Elevasi akhir rute terbukti berada pada $Y > 2,5\text{ m}$.

### Skenario 2: Penumpang Kedatangan dari Gate 3 (Lantai 2) menuju Baggage Claim (Lantai 1)
* **Titik Awal:** Gate 3 Lantai 2.
* **Titik Tujuan:** Baggage Claim B1 Lantai 1.
* **Hasil Evaluasi:**
  - Sistem memilih jalur `EKS TURUN` atau `TANGGA`.
  - Terbukti **tidak pernah merekomendasikan eskalator naik** untuk perjalanan turun (*directional safety verified*).

### Skenario 3: Penumpang Prioritas / Kursi Roda (*Accessible Only Routing*)
* **Kriteria:** Penumpang mengaktifkan opsi rute ramah disabilitas (`accessibleOnly: true`).
* **Hasil Evaluasi:**
  - Tangga dan eskalator otomatis dieksklusikan dari bobot graf Dijkstra/A*.
  - Sistem mengalokasikan rute eksklusif menuju **LIFT** (`type: "LIFT"`).
  - Menghasilkan instruksi konektor khusus: *"Gunakan lift dari Lantai 1 ke Lantai 2"*.

---

## 5. Bukti Pengujian Otomatis (Automated Test Suite)

Validitas spasial Web-GIS dan rute aksesibilitas diuji secara berkala melalui test suite berikut:

1. **`tests/map3d-multi-floor.test.ts`:**
   - Memvalidasi pembagian kelompok lantai $L1$ dan $L2$ pada file `public/models/t1-gabungan.glb`.
   - Memvalidasi elevasi bertingkat $\Delta Y \approx 3\text{ meter}$.
   - Memvalidasi penegakan arah satu arah eskalator (`EKS NAIK` tidak boleh dipakai turun).
   - Memvalidasi posisi pesawat parkir di garbarata tanpa tumpang-tindih.
2. **`tests/dijkstra.test.ts`:**
   - Memvalidasi rute aksesibilitas lift dengan instruksi transisi lantai resmi.
3. **`tests/route-snapping-akurasi-1.test.ts`:**
   - Memvalidasi proyeksi Akurasi 1.0 pada tikungan dan tanjakan vertikal eskalator 3D.

**Status Hasil Eksekusi:**
- Seluruh 74 unit test pengujian spasial, multi-lantai, dan rute aksesibilitas berstatus **PASS (100% Lulus)**.

---

## 6. Kesimpulan

Data koordinat spasial Web-GIS pada ToDjuanda (format GLB, Grid JSON, dan SVG) telah tervalidasi secara matematis dan geometris. Sistem berhasil menjamin keamanan arah lalu lintas pejalan kaki pada eskalator serta menyediakan rute aksesibilitas lift yang inklusif bagi seluruh penumpang bandara.
