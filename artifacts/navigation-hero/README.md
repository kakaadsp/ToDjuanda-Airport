# Navigation Hero — ToDjuanda

Karakter penumpang low-poly orisinal: jaket biru, ransel oranye, kartu penumpang.

## File

- `navigation-hero.blend`: sumber model, skeleton, dua animasi, kamera, dan studio pratinjau.
- `../../public/models/navigation-hero.glb`: aset untuk Three.js / React Three Fiber.
- `navigation-hero-preview.png`: render pose diam.
- `navigation-hero-walk.png`: render salah satu pose berjalan.
- `../../scripts/create-navigation-hero.py`: generator Python untuk Blender.

## Spesifikasi

- 1 mesh karakter, 12 tulang, 3.584 segitiga; tanpa tekstur eksternal.
- Skala meter, tinggi sekitar 1,76 m, origin pada permukaan tanah di antara kaki.
- Blender: Z ke atas, wajah menghadap -Y. GLB: Y ke atas, wajah menghadap +Z.
- `Idle`: loop 64 frame pada 24 fps (sekitar 2,67 detik).
- `Walk`: loop 32 frame pada 24 fps (sekitar 1,33 detik).
- Kedua animasi bergerak di tempat tanpa perpindahan root. Skeleton menggunakan bobot rigid per bagian; cocok untuk karakter bergaya low-poly, bukan deformasi manusia realistis.
- Lantai studio, lampu, dan kamera hanya ada dalam `.blend`, tidak diekspor ke GLB.

## Membuka dan mengubah

Buka `.blend` di Blender. Pilih `NavigationHero`, buka workspace Animation,
lalu pilih action `Idle` atau `Walk` di Action Editor. Tekan Space untuk memutar.
Warna dapat diedit pada material objek `TravelerMesh`.

Generator diuji dengan Blender 5.2.1. Jalankan dari folder proyek:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python scripts/create-navigation-hero.py
```

Generator membangun ulang dan menimpa hasil hero pada lokasi yang sama.
Simpan salinan dengan nama berbeda jika sudah mengedit manual di Blender.

## Menggunakan di web

URL aset: `/models/navigation-hero.glb`. Muat dengan `useGLTF`, dan akses klip
`Idle`/`Walk` melalui `useAnimations`. Gunakan `SkeletonUtils.clone` bila
menampilkan beberapa instance karakter.

Posisi grup avatar mengikuti posisi rute/GPS. Untuk arah rute `[dx, dy, dz]`,
rotasi Y adalah `Math.atan2(dx, dz)` karena karakter menghadap +Z.
Putar `Walk` saat pengguna bergerak dan crossfade ke `Idle` saat berhenti.
Kecepatan klip dapat disesuaikan dengan kecepatan perjalanan yang tervalidasi.

Aset ini belum dipasang sebagai pengganti marker di website, dan tidak
menambahkan logika GPS. Perlu uji performa serta skala pada perangkat target
saat integrasi.
