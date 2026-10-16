# Juanda Smart Airport Navigation & Indoor Wayfinding System

<div align="center">

![Juanda Wayfinding Banner](public/map/juanda-terminal-1.png)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Digital%20Twin-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Database on Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E699?style=for-the-badge)](https://neon.tech)

**Sistem Navigasi Cerdas & Indoor Wayfinding 3D Berbasis Web untuk Bandar Udara Internasional Juanda (SUB) — InJourney Airports**

[Fitur Utama](#fitur-utama) | [Arsitektur](#arsitektur--teknologi) | [Instalasi Lokal](#panduan-instalasi--menjalankan-lokal) | [Deploy Vercel](#deploy-ke-vercel-gratis) | [Tim](#tim-pengembang--kontributor)

</div>

---

## Ringkasan Proyek

**Juanda Smart Airport Navigation System** adalah platform navigasi dalam ruangan (*indoor wayfinding*) berbasis web 3D interaktif yang dirancang khusus untuk memandu penumpang di **Bandar Udara Internasional Juanda Surabaya (SUB)**.

Melalui visualisasi *Digital Twin 3D*, penumpang dapat menelusuri denah Terminal 1 (Lantai Dasar / *Ground Floor* dan Lantai 2 / *First Floor*), mencari lokasi *boarding gate*, konter *check-in*, fasilitas umum (mushola, toilet, ruang laktasi, ATM, baggage claim), hingga tenant komersial, serta mendapatkan panduan rute navigasi langkah-demi-langkah (*step-by-step turn guidance*) yang memperhitungkan eskalator, tangga, dan jarak tempuh riil.

Sistem ini terintegrasi penuh dengan **Portal Administrasi Bandara** terproteksi yang memungkinkan pengelola bandara memperbarui direktori tenant, status fasilitas, serta menyinkronkan metadata objek peta 3D secara langsung ke database PostgreSQL secara *real-time*.

---

## Fitur Utama

### 1. Peta 3D Digital Twin Interaktif (Terminal 1)
- **Model 3D Multi-Lantai Terpadu**: Model GLB gabungan (`t1-gabungan.glb`) mencakup Lantai 1 (GF) dan Lantai 2 (FF) dengan sinkronisasi elevasi presisi berdasarkan struktur pilar bandara.
- **Peralihan Lantai Mulus (Floor Switcher)**: Beralih antara Lantai 1, Lantai 2, atau Seluruh Gedung tanpa reload.
- **Apron & Pesawat Realistis**: Visualisasi area apron dengan model pesawat pada setiap garbarata.
- **Kamera & Orbit Kontrol Responsif**: Dukungan navigasi sentuh untuk mobile, tablet, desktop, dan layar kiosk.

### 2. Mesin Navigasi & Algoritma Rute Antarlantai
- **Dijkstra Multi-Floor Route Engine**: Rute terpendek berbasis walkable grid dengan dukungan multi-lantai.
- **Konektor Vertikal Arah-Tertentu**: Eskalator searah dan tangga dengan instruksi kontekstual.
- **Estimasi Waktu Tempuh (ETA)**: Jarak riil dalam meter dan estimasi waktu berjalan (72 m/menit).
- **Passenger Roadmap**: Panduan alur penumpang dari pintu masuk hingga gate keberangkatan.

### 3. Pencarian & Direktori Fasilitas
- **Pencarian Cepat (Omni-search)**: Autocomplete instan untuk gate, tenant F&B, toko ritel, dan fasilitas.
- **Filter Berdasarkan Kategori**: Restoran, Kafe, Belanja, ATM, Toilet, Mushola, Medis, Layanan Informasi.
- **Jadwal Keberangkatan**: Nomor penerbangan, maskapai, waktu terbang, status, dan gate tujuan.

### 4. Portal Manajemen Admin
- **Sinkronisasi Objek Peta 3D (Map Object Config)**: Edit nama, kategori, jam operasional, foto, dan status langsung ke PostgreSQL.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Akses penuh ke seluruh sistem termasuk manajemen user dan audit log.
  - **Airport Admin**: Pengelolaan harian tenant, POI, jam operasional, dan konfigurasi peta.
- **Audit Logging**: Rekam jejak seluruh mutasi data untuk akuntabilitas operasional.

---

## Arsitektur & Teknologi

```
+------------------------------------------------------------------------+
|                          CLIENT / BROWSER                              |
|   [ Public Wayfinding UI ]          [ Admin Management Portal ]        |
|   - Three.js / React Three Fiber    - Tenant & Facility Editor         |
|   - Walkable Grid & Dijkstra        - 3D Map Object Synchronizer       |
|   - Zustand State Store             - RBAC Security Guard              |
+-------------------^----------------------------------^-----------------+
                    |  REST API / Server Actions       |
                    v                                  v
+------------------------------------------------------------------------+
|               NEXT.JS APP ROUTER (Deployed on Vercel)                  |
|   - /api/route              Perhitungan Rute & Graph                   |
|   - /api/admin/map-objects  Sync Konfigurasi Objek 3D                  |
|   - /api/tenants/[id]       Mutasi Direktori Tenant                    |
|   - /api/auth               Autentikasi Session via Auth.js            |
+-----------------------------------^------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                        DOMAIN & DATA LAYER                             |
|   - Authorization Engine    can(role, PERMISSION)                      |
|   - Validation Layer        Zod Schema Enforcement                     |
|   - Prisma ORM Client       PostgreSQL Object-Relational Model         |
+-----------------------------------^------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|         POSTGRESQL DATABASE — Neon Serverless (ap-southeast-1)         |
|   - MapObjectConfig   - Tenant & Space     - AuditLog                  |
|   - RouteNode & Edge  - Facility & Category - Admin User & Account     |
+------------------------------------------------------------------------+
```

### Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components & optimasi streaming |
| **Pustaka UI** | React 19 + TypeScript 5 | Antarmuka deklaratif type-safe |
| **Mesin 3D** | Three.js + React Three Fiber + Drei | Render model GLB performa tinggi |
| **Animasi** | GSAP + @gsap/react | Micro-interactions dan transisi halus |
| **Desain** | Tailwind CSS 4 | Glassmorphism, responsif, tema bandara modern |
| **State** | Zustand | State store global ringan |
| **Database** | PostgreSQL 15+ + Prisma 7 | Relational DB dengan migrasi otomatis |
| **DB Hosting** | Neon | PostgreSQL serverless, free tier 512 MB, ap-southeast-1 |
| **App Hosting** | Vercel | Auto-deploy dari GitHub, edge network global, free tier |
| **Autentikasi** | Auth.js (NextAuth v5) + bcryptjs | JWT session, bcrypt cost 12 |
| **Validasi** | Zod | Schema validation ketat di sisi server |
| **Ikonografi** | Lucide React | Ikon modern konsisten |

---

## Struktur Repositori

```
ToDjuanda-Airport/
├── prisma/
│   ├── schema.prisma        # Source of truth model data Prisma
│   └── seed.ts              # Script seeding data demo & admin awal
├── public/
│   ├── airlines/            # Logo maskapai (Garuda, Lion, Citilink, dll.)
│   ├── models/
│   │   └── t1-gabungan.glb  # Model 3D Terminal 1 (GF + FF)
│   └── map/                 # Aset visual referensi denah Juanda
├── scripts/
│   └── dev-network.mjs      # Server dev yang bind ke IP jaringan lokal
├── src/
│   ├── app/
│   │   ├── (public)/        # Halaman publik: beranda, map, help
│   │   ├── admin/           # Dashboard portal administrasi
│   │   ├── api/             # Route handler: route, map-objects, tenants, auth
│   │   └── auth/signin/     # Halaman login admin
│   ├── components/
│   │   ├── admin/           # Admin Map Panel, Tenant Editor, POI Manager
│   │   ├── map3d/           # AirportWayfinding, SceneModel, FloorSwitcher, Apron
│   │   ├── wayfinding/      # HomeHero, HelpPage, PassengerRoadmap, Search
│   │   └── site/            # Header, Footer, Navbar
│   ├── lib/
│   │   ├── map3d/           # Routing, walkable grid, connectors
│   │   ├── authorization.ts # Server-side RBAC engine
│   │   ├── dijkstra.ts      # Algoritma rute terpendek
│   │   └── prisma.ts        # Prisma singleton instance
│   └── types/               # Kontrak tipe TypeScript
└── tests/                   # Unit & integrasi test
```

---

## Panduan Instalasi & Menjalankan (Lokal)

### Prasyarat
- Node.js v20.x atau lebih baru
- NPM v10.x atau lebih baru
- PostgreSQL 15+ (lokal atau cloud — direkomendasikan: [Neon](https://neon.tech))

### Langkah 1: Clone Repositori
```bash
git clone https://github.com/kakaadsp/ToDjuanda-Airport.git
cd ToDjuanda-Airport
```

### Langkah 2: Instalasi Dependensi
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variable
```bash
cp .env.example .env
```

Edit file `.env`:
```env
# Koneksi Database PostgreSQL (Pooled — untuk runtime query)
DATABASE_URL="postgresql://postgres:password@localhost:5432/jua_wayfinding?schema=public"

# Koneksi Direct — wajib untuk prisma db push/migrate (terutama di Neon)
DIRECT_URL="postgresql://postgres:password@localhost:5432/jua_wayfinding?schema=public"

# Generate dengan: npx auth secret
AUTH_SECRET="kunci-rahasia-anda"
AUTH_URL="http://localhost:3000"

# Password admin pertama (min 12 karakter)
SEED_ADMIN_PASSWORD="AdminJuanda2026!"
```

### Langkah 4: Migrasi & Seeding Database
```bash
npx prisma db push
npm run seed
```

### Langkah 5: Jalankan Dev Server
```bash
npm run dev
```

- Wayfinding Map: `http://localhost:3000/map`
- Beranda: `http://localhost:3000/`
- Portal Admin: `http://localhost:3000/admin`

---

## Deploy ke Vercel (Gratis)

### Stack Hosting

| Layer | Platform | Free Tier |
|---|---|---|
| App Hosting | [Vercel](https://vercel.com) | 100 GB bandwidth/bulan, unlimited deploy |
| Database | [Neon](https://neon.tech) | 512 MB storage, auto-suspend |

### Langkah Deploy

**1. Siapkan Database Neon**
- Daftar di [neon.tech](https://neon.tech) (bisa login via GitHub)
- Buat project baru, region: **Asia Pacific (Singapore)**
- Ambil dua connection string dari Connection Details:
  - Tab **Pooled** → `DATABASE_URL`
  - Tab **Direct** → `DIRECT_URL`
- Jalankan dari terminal lokal:
  ```bash
  npx prisma db push
  npm run seed
  ```

**2. Generate AUTH_SECRET**
```bash
npx auth secret
```

**3. Import & Deploy di Vercel**
- Daftar di [vercel.com](https://vercel.com) → Add New Project → Import `kakaadsp/ToDjuanda-Airport`
- Tambahkan Environment Variables:

| Variable | Nilai |
|---|---|
| `DATABASE_URL` | Neon Pooled connection string |
| `DIRECT_URL` | Neon Direct connection string |
| `AUTH_SECRET` | Hasil `npx auth secret` |
| `AUTH_URL` | `https://[nama-project].vercel.app` |
| `SEED_ADMIN_PASSWORD` | Password admin (min 12 karakter) |

- Klik **Deploy** (estimasi 3-5 menit)
- Setelah deploy: update `AUTH_URL` dengan URL production dari Vercel, lalu Redeploy.

> Setiap `git push` ke `main` akan memicu auto-deploy di Vercel.

---

## Perintah Pengembangan

```bash
npm run dev          # Dev server
npm run build        # Build produksi
npm run typecheck    # Validasi tipe TypeScript
npm run lint         # ESLint
npm test             # Automated test suite
npm run seed         # Seed data database
```

---

## Model Keamanan

1. **RBAC di level API**: Setiap mutasi memverifikasi permission spesifik (`MANAGE_MAP_OBJECTS`, `MANAGE_TENANTS`, dll.) — bukan hanya hide tombol di UI.
2. **Password Hashing**: bcryptjs salt round 12.
3. **Session JWT**: Kedaluwarsa otomatis setelah 8 jam.
4. **Zod Validation**: Semua input API divalidasi ketat di sisi server.
5. **XSS Prevention**: Data tenant dirender sebagai plain text.

---

## Tim Pengembang & Kontributor

<div align="center">

| Kontributor | Peran |
|---|---|
| **Naufal** | 3D Digital Twin & Scene Architecture |
| **Fatih** | Full-Stack Engineering & Project Lead |
| **Aqilla** | 3D Asset Modeling & Pipeline Optimization |
| **Kaka** | Wayfinding Engine & Walkability Routing |
| **Vero** | UI/UX Design & Frontend Experience |
| **Alvino** | Backend Services, RBAC & API Development |
| **Ragil** | Data Engineering, Quality Assurance & Testing |

</div>

---

## Lisensi & Hak Cipta

Dibuat untuk keperluan pengembangan dan inovasi navigasi cerdas **Bandar Udara Internasional Juanda (PT Angkasa Pura Indonesia / InJourney Airports)**.

Seluruh model 3D, logo, dan data tata letak merupakan hak milik masing-masing pemegang hak cipta dan digunakan untuk keperluan riset serta implementasi sistem navigasi bandara.

---

<div align="center">
  <sub>Dibangun dengan dedikasi untuk meningkatkan pengalaman perjalanan jutaan penumpang di Bandara Internasional Juanda Surabaya.</sub>
</div>