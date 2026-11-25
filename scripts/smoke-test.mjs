#!/usr/bin/env node
/**
 * ==============================================================================
 * Automated Smoke Testing Suite — ToDjuanda Smart Airport Navigation System
 * Digunakan untuk Build Verification Testing (BVT) Paska-Deployment di Staging/Go-Live
 * ==============================================================================
 */

const BASE_URL = process.env.TARGET_URL || process.argv[2] || "http://localhost:3000";

console.log("\x1b[36m%s\x1b[0m", `[SMOKE TEST] Memulai pengujian paska-deployment pada target: ${BASE_URL}\n`);

const tests = [
  {
    name: "TC-01: Verifikasi Respons Server & Halaman Utama (Homepage)",
    endpoint: "/",
    method: "GET",
    expectedStatus: 200,
    validate: (res, body) => body.includes("<html") || body.includes("ToDjuanda"),
  },
  {
    name: "TC-02: Verifikasi Integritas Aset Peta 3D Digital Twin (GLB Model)",
    endpoint: "/models/t1-gabungan.glb",
    method: "HEAD",
    expectedStatus: 200,
    validate: (res) => {
      const type = res.headers.get("content-type");
      return !type || type.includes("model") || type.includes("octet-stream") || type.includes("application");
    },
  },
  {
    name: "TC-03: Verifikasi API Direktori Tenant & Konektivitas Database",
    endpoint: "/api/tenants?terminal=T1&status=ACTIVE",
    method: "GET",
    expectedStatus: 200,
    validate: (res, body) => {
      try {
        const json = JSON.parse(body);
        return Array.isArray(json.tenants);
      } catch {
        return false;
      }
    },
  },
  {
    name: "TC-04: Verifikasi Core Routing Engine Navigasi (POST /api/route)",
    endpoint: "/api/route",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startNodeId: "T1-ENTRANCE-NODE",
      endNodeId: "T1-L1_FNB1-NODE",
      walkingSpeedMetersPerMinute: 60,
    }),
    expectedStatus: 200,
    validate: (res, body) => {
      try {
        const json = JSON.parse(body);
        return json.route && json.route.totalDistanceMeters > 0 && Array.isArray(json.route.nodes);
      } catch {
        return false;
      }
    },
  },
  {
    name: "TC-05: Verifikasi Proteksi Endpoint Privat Admin (Broken Access Control Check)",
    endpoint: "/api/admin/users",
    method: "GET",
    expectedStatus: 401,
    validate: (res, body) => {
      try {
        const json = JSON.parse(body);
        return json.error === "Autentikasi diperlukan";
      } catch {
        return false;
      }
    },
  },
  {
    name: "TC-06: Verifikasi Halaman Autentikasi Staf (/auth/signin)",
    endpoint: "/auth/signin",
    method: "GET",
    expectedStatus: 200,
    validate: (res, body) => body.includes("<form") || body.includes("password") || body.includes("email"),
  },
  {
    name: "TC-07: Verifikasi Injeksi HTTP Security Headers",
    endpoint: "/",
    method: "GET",
    expectedStatus: 200,
    validate: (res) => {
      const xFrame = res.headers.get("x-frame-options");
      const xContent = res.headers.get("x-content-type-options");
      return (xFrame === "DENY" || xFrame === "SAMEORIGIN") && xContent === "nosniff";
    },
  },
];

async function runSmokeTests() {
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const url = `${BASE_URL.replace(/\/$/, "")}${t.endpoint}`;
    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: t.method,
        headers: t.headers || {},
        body: t.body || undefined,
      });

      const latency = Date.now() - startTime;
      let bodyText = "";
      if (t.method !== "HEAD") {
        bodyText = await res.text();
      }

      const statusMatch = res.status === t.expectedStatus;
      const contentMatch = t.validate ? t.validate(res, bodyText) : true;

      if (statusMatch && contentMatch) {
        console.log(`\x1b[32m✔ [PASS]\x1b[0m ${t.name} (${latency}ms - HTTP ${res.status})`);
        passed++;
      } else {
        console.log(
          `\x1b[31m✖ [FAIL]\x1b[0m ${t.name} (${latency}ms - Expected HTTP ${t.expectedStatus}, got ${res.status})`
        );
        failed++;
      }
    } catch (err) {
      console.log(`\x1b[31m✖ [ERROR]\x1b[0m ${t.name} - Hubungan jaringan gagal: ${err.message}`);
      failed++;
    }
  }

  console.log("\n========================================================");
  console.log(`Hasil Smoke Testing: \x1b[32m${passed} LULUS\x1b[0m | \x1b[31m${failed} GAGAL\x1b[0m (Total: ${tests.length})`);
  console.log("========================================================");

  if (failed === 0) {
    console.log("\x1b[32m[GO-LIVE READY] Sistem staging dinyatakan stabil dan siap rilis ke produksi!\x1b[0m\n");
    process.exit(0);
  } else {
    console.log("\x1b[31m[BLOCKED] Ditemukan kegagalan konfigurasi paska-deployment. Periksa log server!\x1b[0m\n");
    process.exit(1);
  }
}

runSmokeTests();
