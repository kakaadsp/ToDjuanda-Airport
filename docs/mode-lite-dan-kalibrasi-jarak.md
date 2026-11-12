# Mode Lite, hero, kalibrasi jarak, dan kecepatan simulasi

## Acuan jarak

Sumber: tiga screenshot pemilik proyek (Google Earth dan garis korespondensi
pada peta). Jarak dianggap benar sesuai instruksi: memanjang 648,57 m dan
melintang 100,79 m. Tidak ada verifikasi lapangan.

Koordinat menggunakan world space GLB aktual `public/models/t1-gabungan.glb`.
Garis memanjang tidak mencakup sayap paling barat, sehingga panjang bounding
box seluruh gedung (sekitar 650 unit) tidak dipakai sebagai rentang acuan.

| Arah | Awal model (X,Y,Z) | Akhir model (X,Y,Z) | Rentang unit | Meter/unit |
|---|---|---|---|---|
| Memanjang X | (-226.655048539, 0, -15) | (301.945309315, 0, -15) | 528.600357854 | 1.226957171639 |
| Melintang Z | (-42, 0, -39.035394101) | (-42, 0, 39.035257859) | 78.070651960 | 1.291010097516 |

Landmark X: tepi barat hall utama (`tembok_pilar_196`) sampai tepi timur
(`tembok_pilar_123`). Landmark Z: tepi landside `area_visitor` sampai tepi apron
`area_merah`, di bagian tengah. Korespondensi titik ke screenshot adalah
perkiraan visual, bukan hasil pengukuran koordinat geodetik. Banyak digit
desimal di atas berasal dari geometri GLB, bukan tingkat ketelitian screenshot.

Perbedaan faktor X/Z menunjukkan proporsi model tidak persis sama dengan acuan.
Gunakan metrik anisotropik, bukan merata-ratakan faktor atau mengubah model:

`meter = sqrt((dx*1.226957171639)^2 + dy^2 + (dz*1.291010097516)^2)`

Y tetap 1 meter/unit: screenshot hanya mengukur bidang horizontal. Kedua lantai
memakai kalibrasi horizontal yang sama. Angka acuan tidak cukup untuk menjamin
ketepatan absolut seluruh bagian gedung atau posisi geografis.

`distance-calibration.ts` menjadi sumber skala. `createRouteMetrics` menyimpan
jarak kumulatif dalam meter, sambil mempertahankan posisi dalam unit model.
Petunjuk langkah, jarak tersisa, ETA, panjang rute, sampling simulasi, dan progres
proyeksi GPS mengikuti metrik tersebut. Kecepatan jalan normal tetap 1,35 m/detik.
Kecepatan simulasi 1x/1,5x/2x tidak mengubah estimasi waktu jalan normal.

Konversi GPS mempertahankan titik origin geografis, rotasi, dan registrasi awal
yang sudah ada; hanya displacement yang menggunakan kebalikan faktor X/Z baru.
Nilai lama 0,81 dipakai hanya untuk mempertahankan anchor awal, bukan sebagai
meter/unit navigasi. Sistem izin lokasi dan hook pembacaan GPS tidak diubah.
Registrasi absolut GPS dan lingkungan luar tidak dikalibrasi ulang dari
screenshot karena tidak ada koordinat lintang/bujur titik ujung yang disertakan.

## Mode Lite

- Tombol Lite pada kontrol peta, dengan status aktif dan preferensi lokal.
- DPR 1 dibanding maksimum 1,75: sekitar 67% lebih sedikit piksel pada perangkat
  yang sebelumnya memakai maksimum itu; bukan klaim peningkatan FPS 67%.
- Eksterior/pesawat tidak dipasang ketika Lite aktif. Jika Lite dipilih sebelum
  peta dibuka, data eksterior tidak diminta oleh komponen eksterior.
- Satu lantai dirender; kontrol semua lantai disembunyikan selama Lite.
- Label tenant umum disembunyikan kecuali pilihan aktif; fasilitas penting tetap.
- Lampu arah tambahan dan sebagian efek panel dimatikan.
- Model terminal, metadata pencarian, penghalang, dan mesin rute tetap sama.

Lite ini mengurangi beban render. Model terminal utama masih diunduh lengkap;
ini belum merupakan aset terminal low-poly terpisah atau mode navigasi 2D.
Memori cache aset yang sudah pernah dimuat tidak otomatis seluruhnya dihapus.
Peningkatan FPS/baterai perlu pengukuran pada HP sasaran.

## Hero dan simulasi

- Hero dimuat saat rute tersedia; tidak dipreload di beranda.
- GLB runtime memakai satu material berbasis vertex color dan satu primitive
  skinned (3.584 segitiga), tanpa tekstur eksternal atau bayangan.
- Posisi/arah mengikuti progres rute. Kamera simulasi mengikuti dari belakang
  agar hero terlihat; kamera peta umum tidak diubah.
- Idle tidak memicu render terus-menerus. Walk dianimasikan selama simulasi
  berjalan pada Normal maupun Lite. Skala avatar menyesuaikan meter/unit peta,
  dengan ukuran visual 65% dari versi awal.
- Hero dan label mengikuti sampel rute setiap frame melalui ref bersama dengan
  controller, sementara pembaruan teks/progres React tetap dibatasi 100 ms.
  Posisi tetap di polyline rute; rotasi hero dan kamera dihaluskan saat belokan.
- Tombol 1x, 1,5x, 2x ada di panel rute. Mengganti kecepatan tidak mereset progres.
- Generator sumber: `scripts/create-navigation-hero.py`. Setelah regenerasi,
  jalankan `scripts/optimize-navigation-hero.py` dengan Blender untuk membuat
  GLB runtime satu primitive. Sumber blend tetap mudah diedit dengan material asli.

## Berkas implementasi

- `src/lib/map3d/distance-calibration.ts`: faktor, referensi, kecepatan.
- `src/lib/map3d/route-guidance.ts`: metrik dan progres GPS dalam meter.
- `src/lib/map3d/multi-floor-route.ts`: panjang rute hasil dalam meter.
- `src/lib/map3d/passenger-geolocation.ts`: displacement GPS yang konsisten.
- `src/components/map3d/AirportWayfinding.tsx`: integrasi empat fitur.
- `src/components/map3d/NavigationHero.tsx`: avatar ringan.
- `src/components/map3d/GridRouteLayer.tsx`: marker/label ketika hero aktif.
- `src/components/map3d/RoutePlaybackController.tsx`: kecepatan dan kamera hero.
- `src/components/map3d/SceneModel.tsx`: filter label Lite.
- `src/components/map3d/FloorSwitcher.tsx`: pilihan satu lantai dalam Lite.
- `src/components/map3d/viewer.css`: gaya kontrol baru yang terbatas pada peta.
- `public/models/navigation-hero.glb`: aset avatar runtime yang dioptimalkan.
- `scripts/optimize-navigation-hero.py`: optimasi avatar.
- `tests/map3d-distance-calibration.test.ts`: pengujian acuan, GLB, GPS, dan kecepatan.
- Tiga tes lama untuk geolocation, langkah rute, dan snapping diperbarui karena
  satu unit model sekarang tidak lagi dianggap satu meter.

Model terminal, halaman lain, dan alur izin GPS tidak diubah. `AGENTS.md` sudah
berubah sebelum pekerjaan ini; bukan perubahan implementasi fitur ini.

## Hasil pemeriksaan

- TypeScript: lulus.
- Build produksi: lulus.
- Tes terarah kalibrasi, langkah rute, GPS, dan snapping: 14/14 lulus.
- Seluruh suite: 63/64 lulus. Satu tes lama meminta minimal tiga eskalator naik,
  sedangkan allowlist konektor yang sudah ada membatasi ke dua. Kegagalan sama
  direproduksi menggunakan implementasi `multi-floor-route.ts` awal dari HEAD.
  Aturan konektor dan tes tersebut tidak diubah di pekerjaan ini.
- Lint seluruh repo masih memiliki temuan yang sudah ada (antara lain efek React
  di komponen peta dan header). Pemeriksaan komponen baru tidak menemukan error.
- Browser automation tidak berhasil diinisialisasi; interaksi visual serta
  performa pada HP menengah/bawah belum diverifikasi. Tidak ada klaim FPS hasil uji.
- Tidak melakukan commit atau push.
