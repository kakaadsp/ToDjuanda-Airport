<div align="center">

<img src="public/Logo-ToDjuanda/Logo.png" alt="ToDjuanda Logo" width="140" />

# ToDjuanda — Smart Airport Navigation System

**Sistem Navigasi Cerdas & Indoor Wayfinding 3D Berbasis Web**  
**Bandar Udara Internasional Juanda Surabaya (SUB) — InJourney Airports**

<br/>

https://github.com/kakaadsp/ToDjuanda-Airport/raw/main/public/media/todjuanda.mp4

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Digital%20Twin-000000?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Database on Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E699?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
[![Tests](https://img.shields.io/badge/Tests-74%20Passing-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-Educational%20%26%20Research-orange?style=for-the-badge)](#lisensi--hak-cipta)

<br/>

[🗺️ Fitur Utama](#-fitur-utama) · [🏗️ Arsitektur](#-arsitektur--teknologi) · [🚀 Instalasi](#-panduan-instalasi--menjalankan-lokal) · [☁️ Deploy](#-deploy-ke-vercel-gratis) · [👥 Kontributor](#-tim-pengembang--kontributor)

</div>

---

## 📖 Ringkasan Proyek

**ToDjuanda Smart Airport Navigation System** adalah platform navigasi dalam ruangan (*indoor wayfinding*) berbasis web 3D interaktif yang dirancang khusus untuk memandu penumpang di **Bandar Udara Internasional Juanda Surabaya (SUB)**.

Melalui visualisasi **Digital Twin 3D**, penumpang dapat menelusuri denah Terminal 1 secara multi-lantai, mencari lokasi *boarding gate*, konter *check-in*, fasilitas umum (mushola, toilet, ATM, baggage claim), hingga tenant komersial, serta mendapatkan panduan rute navigasi langkah-demi-langkah (*step-by-step turn guidance*) yang memperhitungkan eskalator, tangga, dan jarak tempuh riil.

Sistem ini terintegrasi penuh dengan **Portal Administrasi Bandara** berbasis RBAC yang memungkinkan pengelola bandara memperbarui direktori tenant, status fasilitas, serta menyinkronkan metadata objek peta 3D ke database PostgreSQL secara *real-time*.

---

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 🗺️ Peta 3D Digital Twin Interaktif
- Model GLB multi-lantai Terminal 1 (GF + FF)
- Peralihan antar lantai tanpa reload
- Visualisasi apron & pesawat realistis
- Orbit kontrol responsif (mobile, tablet, kiosk)

### 🧭 Mesin Navigasi Cerdas
- **Dijkstra Multi-Floor Route Engine**
- Konektor vertikal arah-tertentu (eskalator + tangga)
- Estimasi waktu tempuh nyata (ETA)
- Panduan rute langkah-demi-langkah (*Passenger Roadmap*)

</td>
<td width="50%">

### 🔍 Pencarian & Direktori Fasilitas
- Pencarian omni *autocomplete* instan
- Filter kategori: F&B, Ritel, ATM, Mushola, Medis
- Jadwal penerbangan & gate keberangkatan

### 🛡️ Portal Manajemen Admin
- Sinkronisasi objek peta 3D ke PostgreSQL
- **RBAC** dua tingkat: Super Admin & Airport Admin
- Audit log terpadu untuk seluruh mutasi data
- Direktori peta dengan status operasional real-time

</td>
</tr>
</table>

---

## 🏗️ Arsitektur & Teknologi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / BROWSER                              │
│   [ Public Wayfinding UI ]           [ Admin Management Portal ]        │
│   · Three.js / React Three Fiber     · Tenant & Facility Editor         │
│   · Walkable Grid & Dijkstra         · 3D Map Object Synchronizer       │
│   · Step-by-step Route Guidance      · Audit Log & RBAC Dashboard       │
└──────────────────────────┬──────────────────────┬───────────────────────┘
                           │  Next.js App Router   │
                           │  (RSC + Server Actions│)
┌──────────────────────────▼──────────────────────▼───────────────────────┐
│                        SERVER / API LAYER                               │
│   [ Route Handlers ]         [ Auth.js Session ]    [ Zod Validator ]   │
│   · /api/route               · JWT (8h expiry)      · Input sanitasi    │
│   · /api/tenants             · bcryptjs (12 rounds) · RBAC middleware   │
│   · /api/facilities          · Permission matrix    · Audit logger      │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │  Prisma ORM
┌──────────────────────────▼──────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL / Neon)                        │
│   Users · Tenants · Facilities · MapObjects · Sessions · AuditLogs      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stack Teknologi

| Layer | Teknologi | Versi |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.1 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **3D Engine** | Three.js + React Three Fiber | Latest |
| **ORM** | Prisma | 7.9.1 |
| **Database** | PostgreSQL (Neon Cloud) | 15+ |
| **Auth** | Auth.js (NextAuth v5) | 5.x |
| **Validation** | Zod | Latest |
| **Hosting** | Vercel | — |

---

## 📁 Struktur Proyek

```
smart-airport-navigation-system/
├── public/
│   ├── Logo-ToDjuanda/       # Logo & brand assets
│   ├── media/                # Video simulasi (todjuanda.mp4)
│   ├── models/               # Model 3D GLB (t1-gabungan.glb)
│   ├── navigation/           # SVG navigation graph
│   └── exterior/             # Data eksterior bandara
├── prisma/
│   └── schema.prisma         # Skema database
├── src/
│   ├── app/                  # Next.js App Router (pages + API routes)
│   │   ├── (public)/         # Halaman publik (wayfinding)
│   │   ├── admin/            # Portal admin (protected)
│   │   └── api/              # REST API endpoints
│   ├── components/
│   │   ├── wayfinding/       # Komponen peta 3D & navigasi
│   │   └── admin/            # Komponen dashboard admin
│   ├── lib/
│   │   ├── map3d/            # Routing, walkable grid, konektor
│   │   ├── authorization.ts  # Server-side RBAC engine
│   │   ├── dijkstra.ts       # Algoritma rute terpendek
│   │   └── prisma.ts         # Prisma singleton instance
│   └── types/                # Kontrak tipe TypeScript
└── tests/                    # Unit & integrasi test (74 test)
```

---

## 🚀 Panduan Instalasi & Menjalankan (Lokal)

### Prasyarat
- **Node.js** v20.x atau lebih baru
- **NPM** v10.x atau lebih baru
- **PostgreSQL** 15+ (lokal atau cloud — direkomendasikan: [Neon](https://neon.tech))

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

| Halaman | URL |
|---|---|
| 🗺️ Wayfinding Map | `http://localhost:3000/map` |
| 🏠 Beranda | `http://localhost:3000/` |
| 🔐 Portal Admin | `http://localhost:3000/admin` |

---

## ☁️ Deploy ke Vercel (Gratis)

### Stack Hosting

| Layer | Platform | Free Tier |
|---|---|---|
| App Hosting | [Vercel](https://vercel.com) | 100 GB bandwidth/bulan, unlimited deploy |
| Database | [Neon](https://neon.tech) | 512 MB storage, auto-suspend |

### Langkah Deploy

**1. Siapkan Database Neon**
- Daftar di [neon.tech](https://neon.tech) → Buat project baru, region: **Asia Pacific (Singapore)**
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
- Daftar di [vercel.com](https://vercel.com) → **Add New Project** → Import `kakaadsp/ToDjuanda-Airport`
- Tambahkan Environment Variables:

| Variable | Nilai |
|---|---|
| `DATABASE_URL` | Neon Pooled connection string |
| `DIRECT_URL` | Neon Direct connection string |
| `AUTH_SECRET` | Hasil `npx auth secret` |
| `AUTH_URL` | `https://[nama-project].vercel.app` |
| `SEED_ADMIN_PASSWORD` | Password admin (min 12 karakter) |

- Klik **Deploy** (estimasi 3–5 menit)
- Setelah deploy: update `AUTH_URL` dengan URL production, lalu **Redeploy**

> Setiap `git push` ke `main` akan memicu auto-deploy di Vercel.

---

## 🛠️ Perintah Pengembangan

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Build produksi
npm run typecheck    # Validasi tipe TypeScript
npm run lint         # ESLint
npm test             # Automated test suite (74 tests)
npm run seed         # Seed data database
```

---

## 🔐 Model Keamanan

| Aspek | Implementasi |
|---|---|
| **RBAC di API** | Setiap mutasi memverifikasi permission (`MANAGE_MAP_OBJECTS`, `MANAGE_TENANTS`, dll.) |
| **Password Hashing** | bcryptjs salt round 12 |
| **Session JWT** | Kedaluwarsa otomatis setelah 8 jam |
| **Input Validation** | Zod schema validation di sisi server |
| **XSS Prevention** | Data tenant dirender sebagai plain text |

---

## 👥 Tim Pengembang & Kontributor

<div align="center">

<table>
<tr>
  <td align="center" width="140">
    <img src="https://github.com/identicons/naufal.png" width="64" height="64" style="border-radius:50%" alt="Naufal" /><br/>
    <b>Naufal</b><br/>
    <sub>🧊 3D Digital Twin<br/>& Scene Architecture</sub>
  </td>
  <td align="center" width="140">
    <img src="https://github.com/identicons/fatih.png" width="64" height="64" style="border-radius:50%" alt="Fatih" /><br/>
    <b>Fatih</b><br/>
    <sub>⚙️ Full-Stack Engineering<br/>& Project Lead</sub>
  </td>
  <td align="center" width="140">
    <img src="https://github.com/identicons/aqilla.png" width="64" height="64" style="border-radius:50%" alt="Aqilla" /><br/>
    <b>Aqilla</b><br/>
    <sub>🎨 3D Asset Modeling<br/>& Pipeline Optimization</sub>
  </td>
  <td align="center" width="140">
    <img src="https://github.com/identicons/kaka.png" width="64" height="64" style="border-radius:50%" alt="Kaka" /><br/>
    <b>Kaka</b><br/>
    <sub>🧭 Wayfinding Engine<br/>& Walkability Routing</sub>
  </td>
</tr>
<tr>
  <td align="center" width="140">
    <img src="https://github.com/identicons/vero.png" width="64" height="64" style="border-radius:50%" alt="Vero" /><br/>
    <b>Vero</b><br/>
    <sub>🎀 UI/UX Design<br/>& Frontend Experience</sub>
  </td>
  <td align="center" width="140">
    <img src="https://github.com/identicons/alvino.png" width="64" height="64" style="border-radius:50%" alt="Alvino" /><br/>
    <b>Alvino</b><br/>
    <sub>🔐 Backend Services<br/>RBAC & API Development</sub>
  </td>
  <td align="center" width="140">
    <img src="https://github.com/identicons/ragil.png" width="64" height="64" style="border-radius:50%" alt="Ragil" /><br/>
    <b>Ragil</b><br/>
    <sub>🧪 Data Engineering<br/>QA & Testing</sub>
  </td>
  <td align="center" width="140">
    <br/>
    <br/>
    <sub><i>+1 contributor<br/>welcome! 🚀</i></sub>
  </td>
</tr>
</table>

</div>

---

## 📄 Lisensi & Hak Cipta

Dibuat untuk keperluan pengembangan dan inovasi navigasi cerdas **Bandar Udara Internasional Juanda (PT Angkasa Pura Indonesia / InJourney Airports)**.

Seluruh model 3D, logo, dan data tata letak merupakan hak milik masing-masing pemegang hak cipta dan digunakan untuk keperluan riset serta implementasi sistem navigasi bandara.

---

<div align="center">

<img src="public/Logo-ToDjuanda/Logo.png" alt="ToDjuanda" width="60" />

<sub>Dibangun dengan ❤️ untuk meningkatkan pengalaman perjalanan jutaan penumpang di Bandara Internasional Juanda Surabaya.</sub>

<br/><br/>

<a href="https://github.com/kakaadsp/ToDjuanda-Airport">⭐ Beri Bintang di GitHub</a> &nbsp;·&nbsp;
<a href="https://github.com/kakaadsp/ToDjuanda-Airport/issues">🐛 Laporkan Bug</a> &nbsp;·&nbsp;
<a href="https://github.com/kakaadsp/ToDjuanda-Airport/pulls">🔧 Kontribusi</a>

</div>
