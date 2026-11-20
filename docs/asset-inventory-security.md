# Dokumen Asset Inventory Keamanan & Laporan Mitigasi Risiko Siber
**Standar Keamanan Informasi Berbasis ISO/IEC 27001, NIST CSF (ID.AM), dan CIS Controls**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Pendahuluan & Tujuan Dokumen

Dalam ekosistem infrastruktur penting seperti bandara internasional, sistem informasi publik dan portal operasional wajib memiliki kontrol visibilitas penuh terhadap seluruh aset digital. 

Dokumen ini menyajikan:
1. **Daftar Inventaris Aset Keamanan (Cybersecurity Asset Inventory)** untuk mengidentifikasi seluruh komponen perangkat lunak, basis data, infrastruktur jaringan, dan data sensitif pada sistem ToDjuanda.
2. **Laporan Hardening Arsitektur Server** yang telah diterapkan guna memitigasi potensi serangan siber (*Cyber Threats Mitigation*).
3. **Klasifikasi Kritisitas Aset** berpedoman pada prinsip *Confidentiality, Integrity, and Availability* (CIA Triad).

---

## 2. Inventarisasi Aset Keamanan (Security Asset Inventory)

### A. Aset Perangkat Lunak & Aplikasi (Software & Application Assets)

| ID Aset | Nama Aset | Versi / Lingkungan | Fungsi & Peran | Klasifikasi Kritisitas | Penanggung Jawab |
|---|---|---|---|:---:|---|
| **SW-01** | Next.js Server App | v15 (Node.js 20 LTS) | Core Web Application (Frontend 3D + REST API) | **High (Kritis)** | Fullstack Engineer |
| **SW-02** | NextAuth.js Module | v5.0-beta | Identity & Session Management (JWT Strategy) | **High (Kritis)** | Security Lead |
| **SW-03** | Three.js WebGL Engine | v0.160+ | Rendering Visual Peta 3D Terminal 1 di Browser | **Medium** | Frontend Lead |
| **SW-04** | A-Star / Dijkstra Engine | Internal (`src/lib/`) | Algoritma komputasi rute navigasi pejalan kaki | **High (Kritis)** | Algorithm Engineer |
| **SW-05** | Prisma ORM Client | v5.x | Database Abstraction Layer & Parameterized Queries | **High (Kritis)** | Backend Engineer |
| **SW-06** | Apache JMeter Suite | v5.6.3 | Test Harness Uji Beban & Evaluasi Skalabilitas | **Low (Testing)** | QA Engineer |

---

### B. Aset Data & Informasi (Data Assets & CIA Triad)

| ID Data | Nama Aset Data | Format & Penyimpanan | Kerahasiaan (C) | Integritas (I) | Ketersediaan (A) | Mitigasi Keamanan |
|---|---|---|:---:|:---:|:---:|---|
| **DT-01** | Kredensial Staf Administrator | PostgreSQL (`User` Table) | **Tinggi (Secret)** | **Kritis** | **Tinggi** | Hash Bcrypt Salt 10, sanitasi API, anti-timing attack |
| **DT-02** | Denah Geometri 3D Terminal 1 | File GLB (`public/models/`) | Publik | **Kritis** | **Tinggi** | Integritas SHA-256, static cache header |
| **DT-03** | Graf Navigasi & Konektor Rute | PostgreSQL & TS Static Grid | Internal | **Kritis** | **Kritis** | Proteksi otorisasi server RBAC (`can()`) |
| **DT-04** | Direktori Tenant & Jam Operasional | PostgreSQL (`Tenant`, `Space`) | Publik | **Tinggi** | **Tinggi** | Indeks database B-Tree, audit log mutasi |
| **DT-05** | Jejak Audit Operasional | PostgreSQL (`AuditLog` Table) | **Tinggi (Internal)** | **Kritis** | **Tinggi** | Append-only logging, actor tracking, IP capture |

---

### C. Aset Infrastruktur & Jaringan (Infrastructure & Network Assets)

| ID Infra | Komponen | Spesifikasi / Konfigurasi | Lokasi / Penyedia | Kontrol Keamanan |
|---|---|---|---|---|
| **INF-01** | Primary Host Server | Linux / Containerized Node.js Environment | Cloud / On-Premise Bandara | Firewall OS, Port 80/443 Only, SSH Key Only |
| **INF-02** | Relational Database Host | Managed PostgreSQL Server (Neon Serverless) | Dedicated Cloud Region | TLS/SSL Enforced (`sslmode=require`), IP Whitelist |
| **INF-03** | DNS & CDN Edge Gateway | Reverse Proxy & Anycast DNS | Cloudflare / Edge Network | DDoS Protection, WAF, Auto SSL Certificate |
| **INF-04** | Digital Wayfinding Kiosk | Kiosk Layar Sentuh Publik | Terminal 1 Juanda (Ground Floor) | Kiosk Mode (Browser Lock), Disabled USB/DevTools |

---

## 3. Implementasi Hardening Security Arsitektur Server

Hardening keamanan server telah diimplementasikan secara aktif melalui konfigurasi `next.config.ts` dan middleware aplikasi:

### A. HTTP Security Headers (Pertahanan Lapisan Aplikasi)
Setiap respons HTTP yang dikirimkan server ToDjuanda telah diinjeksi dengan header keamanan ketat:

1. **Information Disclosure Prevention (`poweredByHeader: false`):**  
   Menghapus header bawaan `X-Powered-By: Next.js` agar penyerang tidak dapat mendeteksi versi framework dan mencari celah kerentanan yang diketahui (*Known Vulnerabilities*).
2. **Content-Security-Policy (CSP):**  
   Membatasi eksekusi skrip hanya dari sumber terpercaya (`'self'`), menonaktifkan `<object>` dan plugin berbahaya (`object-src 'none'`), serta melarang situs lain membingkai aplikasi dalam iframe (`frame-ancestors 'none'`) untuk mencegah **Clickjacking**.
3. **X-Frame-Options: `DENY`:**  
   Menolak segala upaya penyematan portal admin pada frame atau iframe pihak ketiga.
4. **X-Content-Type-Options: `nosniff`:**  
   Mencegah browser melakukan manipulasi tipe MIME (MIME-sniffing attack) terhadap aset gambar dan GLB.
5. **Strict-Transport-Security (HSTS):**  
   `max-age=63072000; includeSubDomains; preload` — Memaksa seluruh komunikasi browser penumpang dan admin menggunakan enkripsi HTTPS modern selama 2 tahun ke depan.
6. **Permissions-Policy:**  
   `camera=(), microphone=(), geolocation=(self)` — Mematikan izin akses kamera dan mikrofon hardware secara global pada browser, serta membatasi geolokasi hanya pada domain bandara resmi.
7. **Cross-Origin-Opener-Policy: `same-origin`:**  
   Mengisolasi konteks browsing dari tab/jendela lain untuk mencegah serangan *Spectre* dan pencurian data lintas jendela.

---

### B. Proteksi Database & Parameterized Execution
- **Pemberantasan SQL Injection (SQLi):** Seluruh komunikasi ke database PostgreSQL menggunakan Prisma ORM dengan *Parameterized Queries* dan *Prepared Statements*. Nilai masukan pengguna tidak pernah digabungkan secara mentah (*raw string concatenation*).
- **Transport Layer Security (TLS):** Jalur koneksi database mewajibkan enkripsi TLS 1.3 (`sslmode=require`).

---

### C. Proteksi Autentikasi & Brute Force
- **Login Guard Rate Limiting:** Pembatasan maksimal 8 kali percobaan login gagal per 15 menit (`src/lib/login-guard.ts`).
- **Timing Attack Mitigation:** Komputasi hash konstan pada akun tidak terdaftar di `src/lib/auth.ts`.
- **Role-Based Access Control (RBAC):** Pemisahan tegas wewenang `SUPER_ADMIN` dan `AIRPORT_ADMIN` di `src/lib/authorization.ts`.

---

## 4. Matriks Mitigasi Risiko Siber (Cyber Risk Assessment Matrix)

| Skenario Ancaman (Threat) | Tingkat Dampak | Probabilitas | Tindakan Hardening yang Diterapkan | Status Risiko Residual |
|---|:---:|:---:|---|:---:|
| **1. Serangan DDoS pada Endpoint Rute Navigasi** | Tinggi | Sedang | Optimasi A-Star path compaction, rate limiting, dan static cache. | **Low (Terkendali)** |
| **2. Pembajakan Sesi Admin / Credential Theft** | Kritis | Rendah | NextAuth JWT (8 jam), HttpOnly Cookie, SameSite=Lax, Login Guard. | **Low (Terkendali)** |
| **3. Eksploitasi Clickjacking pada Portal Admin** | Sedang | Rendah | Header `X-Frame-Options: DENY` dan CSP `frame-ancestors 'none'`. | **Sangat Rendah** |
| **4. Modifikasi Graf Rute Ilegal (Sabotase Peta)** | Kritis | Rendah | Validasi otorisasi server-side `can("MANAGE_ROUTE_GRAPH")` & AuditLog. | **Low (Terkendali)** |
| **5. SQL Injection pada Query Fasilitas** | Kritis | Sangat Rendah | Parameterized Query Prisma ORM & Skema validasi Zod. | **Nol / Kebal** |

---

## 5. Kesimpulan & Rekomendasi Pemeliharaan

1. Seluruh aset sistem ToDjuanda telah terpetakan dan diklasifikasikan dengan matriks CIA Triad yang jelas.
2. Hardening arsitektur server telah terpasang di level kode dan konfigurasi HTTP, memenuhi standar audit keamanan instansi pemerintah dan pengelola bandara.
3. Direkomendasikan pembaruan (*patching*) berkala pada dependensi npm menggunakan `npm audit` setiap kuartal guna memastikan seluruh pustaka bebas dari kerentanan *Common Vulnerabilities and Exposures* (CVE).
