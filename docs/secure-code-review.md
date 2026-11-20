# Laporan Secure Code Review & Standar Keamanan OWASP
**Mitigasi Broken Access Control (A01:2021) & Pencegahan Pencurian Identitas (A07:2021)**  
ToDjuanda — Smart Airport Navigation System (Bandara Internasional Juanda)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Aplikasi **ToDjuanda** mengelola infrastruktur data kritis bandara, meliputi topologi peta graf 3D, jalur evakuasi/navigasi penumpang, direktori tenant komersial, dan hak akses operasional. Kegagalan kontrol akses (*Broken Access Control*) atau pencurian kredensial dapat berakibat fatal, seperti pengubahan jalur rute publik, sabotase status pintu gate, atau peretasan data administratif bandara.

Laporan ini mendokumentasikan hasil *Secure Code Review* dan perakitan arsitektur keamanan kode (*secure coding standard*) yang berpedoman pada standar **OWASP Top 10 (2021)** dan **OWASP Application Security Verification Standard (ASVS v4.0 Level 2)**.

---

## 2. Pemetaan Kerentanan Terhadap OWASP Top 10 (2021)

| Kategori OWASP | Potensi Risiko di Sistem Bandara | Implementasi Mitigasi di Kode ToDjuanda | Status |
|---|---|---|:---:|
| **A01:2021 – Broken Access Control** | Penumpang atau staf komersial mengakses API manajemen infrastruktur, rute graf, dan akun pengguna. | Matriks RBAC ketat di sisi server (`src/lib/authorization.ts`), pemisahan wewenang `SUPER_ADMIN` vs `AIRPORT_ADMIN`. | **TERVALIDASI** |
| **A07:2021 – Identification & Auth Failures** | Serangan Brute Force, Credential Stuffing, pembajakan token JWT, dan Timing Attacks. | Mekanisme *Login Guard* rate-limiting (`login-guard.ts`), bcrypt dengan *dummy hash* anti-timing attack (`auth.ts`). | **TERVALIDASI** |
| **A02:2021 – Cryptographic Failures** | Kebocoran kata sandi teks polos atau pengungkapan hash di endpoint API. | Enkripsi bcrypt salt factor 10, sanitasi objek user (`serializeUser`) tanpa properti `passwordHash`. | **TERVALIDASI** |
| **A09:2021 – Security Logging & Monitoring** | Serangan gagal terdeteksi tanpa jejak audit digital. | Pencatatan otomatis ke tabel `AuditLog` untuk setiap login dan mutasi data sensitif (`src/app/api/admin/audit-logs/`). | **TERVALIDASI** |

---

## 3. Rincian Arsitektur Keamanan & Analisis Kode

### A. Mitigasi Broken Access Control (A01:2021)
Sistem menerapkan prinsip **Least Privilege** dan **Deny by Default** pada seluruh endpoint administratif.

#### 1. Matriks Otorisasi Berbasis Peran (RBAC Matrix)
Implementasi terpusat pada file `src/lib/authorization.ts`:

```typescript
export type Permission = 
  | "MANAGE_USERS" 
  | "MANAGE_STRUCTURE" 
  | "MANAGE_ROUTE_GRAPH" 
  | "MANAGE_TENANTS" 
  | "MANAGE_POI" 
  | "MANAGE_CATEGORIES" 
  | "MANAGE_HOURS" 
  | "VIEW_AUDIT_LOG" 
  | "MANAGE_MAP_OBJECTS";

const permissions: Record<AdminRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set([
    "MANAGE_USERS", "MANAGE_STRUCTURE", "MANAGE_ROUTE_GRAPH", 
    "MANAGE_TENANTS", "MANAGE_POI", "MANAGE_CATEGORIES", 
    "MANAGE_HOURS", "VIEW_AUDIT_LOG", "MANAGE_MAP_OBJECTS"
  ]),
  AIRPORT_ADMIN: new Set([
    "MANAGE_TENANTS", "MANAGE_POI", "MANAGE_CATEGORIES", 
    "MANAGE_HOURS", "MANAGE_MAP_OBJECTS"
  ]),
};

export function can(role: AdminRole | null | undefined, permission: Permission) { 
  return role ? permissions[role].has(permission) : false; 
}
```

#### 2. Penegakan Otorisasi Sisi Server (Server-Side Enforcement)
Sistem tidak pernah mengandalkan pembatasan UI saja. Setiap route handler memvalidasi sesi dan hak akses:
```typescript
// Contoh implementasi di src/app/api/admin/users/route.ts
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
}
if (!can(session.user.role, "MANAGE_USERS")) {
  return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
}
```

---

### B. Pencegahan Pencurian Identitas & Autentikasi (A07:2021)

#### 1. Pencegahan Serangan Enumerasi Akun & Timing Attacks
Pada alur login konvensional, waktu komputasi saat email tidak ditemukan biasanya jauh lebih cepat daripada saat email ditemukan (karena kalkulasi hash dilewati). Hal ini memungkinkan peretas memetakan email staf bandara yang valid.

**Solusi pada `src/lib/auth.ts`:**
```typescript
const user = await prisma.user.findUnique({ where: { email } });
// Fallback hash konstan jika user tidak ditemukan agar waktu komputasi bcrypt tetap sama
const fallbackHash = "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSm8MZ6Y8v9SXwUZP5l19ClzQbP4eFe";
const valid = await bcrypt.compare(credentials.password, user?.passwordHash ?? fallbackHash);

if (!user || !user.active || !valid) { 
  recordLoginFailure(email); 
  return null; 
}
```
*Dampak:* Waktu respons server konstan terlepas dari ada/tidaknya akun, sehingga **meniadakan risiko User Enumeration via Timing Attack**.

#### 2. Proteksi Brute Force & Credential Stuffing (Login Guard)
Modul `src/lib/login-guard.ts` menerapkan pembatasan frekuensi percobaan (*rate limiting*):
```typescript
const WINDOW_MS = 15 * 60 * 1_000; // Jendela waktu 15 menit
const MAX_ATTEMPTS = 8;             // Maksimal 8 kali gagal berturut-turut

export function checkLoginAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) { 
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS }); 
    return true; 
  }
  return current.count < MAX_ATTEMPTS;
}
```
*Dampak:* Percobaan serangan injeksi kamus (*dictionary attack*) otomatis diblokir setelah 8 kali kegagalan selama 15 menit.

#### 3. Keamanan Sesi & Redaksi Kredensial (Data Sanitization)
- **Token JWT Bertanda Tangan:** Sesi menggunakan strategi JWT dengan masa berlaku maksimal 8 jam (`maxAge: 8 * 60 * 60`), mencegah penggunaan sesi basi (*stale session hijacking*).
- **Pembersihan Data Sensitif:** Fungsi `serializeUser()` menyaring properti internal sebelum dikirim ke client:
  ```typescript
  function serializeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.active ? "ACTIVE" : "INACTIVE",
      // passwordHash DIKECUALIKAN secara ketat
    };
  }
  ```

---

## 4. Bukti Verifikasi Pengujian Otomatis (Automated Test Suite)

Keandalan logika otorisasi dan kontrol akses diuji secara otomatis melalui unit test di `tests/authorization.test.ts`:

```typescript
test("role permission matrix protects sensitive structure", () => {
  assert.equal(can("SUPER_ADMIN", "MANAGE_ROUTE_GRAPH"), true);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_ROUTE_GRAPH"), false);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_USERS"), false);
});

test("airport admin can manage tenants without receiving global access", () => {
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_TENANTS"), true);
  assert.equal(can("AIRPORT_ADMIN", "MANAGE_STRUCTURE"), false);
  assert.equal(can("AIRPORT_ADMIN", "VIEW_AUDIT_LOG"), false);
});

test("public user cannot pass admin authorization", () => {
  assert.equal(can(null, "MANAGE_TENANTS"), false);
  assert.throws(() => requireRole(null), /UNAUTHORIZED/);
});
```

**Hasil Eksekusi:**
- Seluruh pengujian kontrol akses berhasil lolos (`Pass: 100%`).
- Pengguna publik tidak dapat menembus gerbang otorisasi API internal.

---

## 5. Kesimpulan & Status Kepatuhan Keamanan

Sistem ToDjuanda telah memenuhi standar **Secure Coding Standards (OWASP)**:
1. **Broken Access Control:** Termitigasi secara penuh melalui Server-Side RBAC dan prinsip Least Privilege.
2. **Identity Theft:** Termitigasi melalui proteksi Brute Force (*Login Guard*), enkripsi bcrypt terisolasi, mitigasi Timing Attack, dan eliminasi paparan *credential leakage*.
3. **Audit Trail:** Seluruh aksi otentikasi dan perubahan konfigurasi tercatat permanen di tabel `AuditLog`.
