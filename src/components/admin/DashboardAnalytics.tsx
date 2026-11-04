"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  PieChart,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";

export type TenantAnalyticsRow = {
  id?: string;
  name?: string;
  category: string;
  entityType?: "TENANT" | "FACILITY";
  terminal: string;
  floor?: string;
  floorCode?: string;
  spaceCode?: string;
  status: string;
  hours?: string;
};

// Deteksi apakah suatu objek denah adalah fasilitas & layanan publik
function isFacilityItem(tenant: TenantAnalyticsRow): boolean {
  if (tenant.entityType === "FACILITY") return true;
  const name = `${tenant.name || ""} ${tenant.spaceCode || ""}`.toLowerCase();
  const cat = (tenant.category || "").toLowerCase();
  return (
    cat.includes("fasilitas") ||
    cat.includes("toilet") ||
    cat.includes("mushola") ||
    cat.includes("musala") ||
    cat.includes("atm") ||
    /(?:avsec|toilet|mushola|musala|nursery|restroom|atm|gate|door|taman|baggage|layanan|informasi|kesehatan|karantina|inspection)/i.test(name)
  );
}

export function DashboardAnalytics({ tenants }: { tenants: TenantAnalyticsRow[] }) {
  const [selectedFloor, setSelectedFloor] = useState<"ALL" | "L1" | "L2">("ALL");

  // Filtered tenants by selected floor (Terminal 1)
  const filteredTenants = useMemo(() => {
    if (selectedFloor === "ALL") return tenants;
    return tenants.filter(
      (t) =>
        t.floor?.includes(selectedFloor === "L1" ? "1" : "2") ||
        t.floorCode?.includes(selectedFloor === "L1" ? "GF" : "FF")
    );
  }, [tenants, selectedFloor]);

  // 1. Pisahkan Tenant Komersial (Unit Usaha) vs Fasilitas & Layanan Publik
  const commercialSpaces = useMemo(() => filteredTenants.filter((t) => !isFacilityItem(t)), [filteredTenants]);
  const facilitySpaces = useMemo(() => filteredTenants.filter((t) => isFacilityItem(t)), [filteredTenants]);

  // Metrik Komersial
  const commTotal = commercialSpaces.length;
  const commOccupied = commercialSpaces.filter((t) => t.status !== "WALKWAY").length;
  const commVacant = commercialSpaces.filter((t) => t.status === "WALKWAY").length;
  const commActive = commercialSpaces.filter((t) => t.status === "ACTIVE").length;
  const commClosed = commercialSpaces.filter((t) => t.status === "TEMPORARILY_CLOSED").length;
  const commOccupancyPercent = commTotal > 0 ? Math.round((commOccupied / commTotal) * 100) : 0;
  const commActivePercent = commOccupied > 0 ? Math.round((commActive / commOccupied) * 100) : 0;

  // Metrik Fasilitas & Layanan Publik
  const facilityTotal = facilitySpaces.length;
  const facilityActive = facilitySpaces.filter((t) => t.status === "ACTIVE" || t.status === "WALKWAY").length;
  const facilityClosed = facilitySpaces.filter((t) => t.status === "TEMPORARILY_CLOSED").length;
  const facilityActivePercent = facilityTotal > 0 ? Math.round((facilityActive / facilityTotal) * 100) : 0;

  // Total yang membutuhkan atensi (tutup sementara)
  const inactiveCount = commClosed + facilityClosed;

  // Category composition (Murni untuk gerai komersial)
  const categoryRows = useMemo(() => {
    const counts = commercialSpaces.reduce<Record<string, number>>((result, tenant) => {
      const cat = tenant.category || "Komersial Lainnya";
      result[cat] = (result[cat] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [commercialSpaces]);

  const maxCategory = Math.max(1, ...categoryRows.map(([, count]) => count));
  const topCategory = categoryRows[0] || ["-", 0];
  const topCategoryPercent = commOccupied > 0
    ? Math.round((Number(topCategory[1]) / commOccupied) * 100)
    : 0;

  // Floor distribution in Terminal 1 (Breakdown per Lantai)
  const floorBreakdown = useMemo(() => {
    const floors = [
      { id: "T1-L1", label: "Terminal 1 • Lantai 1 (Ground Floor)", terminal: "T1", floor: "Lantai 1" },
      { id: "T1-L2", label: "Terminal 1 • Lantai 2 (First Floor)", terminal: "T1", floor: "Lantai 2" },
    ];

    return floors
      .filter((f) => selectedFloor === "ALL" || (selectedFloor === "L1" ? f.floor === "Lantai 1" : f.floor === "Lantai 2"))
      .map((f) => {
        const matching = tenants.filter(
          (t) => t.floor?.includes(f.floor.slice(-1)) || t.floorCode?.includes(f.floor.slice(-1))
        );
        const commMatching = matching.filter((t) => !isFacilityItem(t));
        const facMatching = matching.filter((t) => isFacilityItem(t));
        const commOccupiedCount = commMatching.filter((t) => t.status !== "WALKWAY").length;
        const commVacantCount = commMatching.filter((t) => t.status === "WALKWAY").length;
        const commActiveCount = commMatching.filter((t) => t.status === "ACTIVE").length;
        const facActiveCount = facMatching.filter((t) => t.status === "ACTIVE" || t.status === "WALKWAY").length;
        const occRate = commMatching.length ? Math.round((commOccupiedCount / commMatching.length) * 100) : 0;
        return {
          ...f,
          total: matching.length,
          commTotal: commMatching.length,
          commOccupied: commOccupiedCount,
          commVacant: commVacantCount,
          commActive: commActiveCount,
          facTotal: facMatching.length,
          facActive: facActiveCount,
          occRate,
        };
      });
  }, [tenants, selectedFloor]);

  // Inactive or special status tenants requiring operational attention
  const attentionTenants = useMemo(() => {
    return filteredTenants.filter((t) => t.status === "TEMPORARILY_CLOSED" || (t.hours && t.hours.toLowerCase().includes("tutup")));
  }, [filteredTenants]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* HEADER SECTION & QUICK FILTERS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16px",
          paddingBottom: "4px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "#e0f7fa",
                color: "#007b8b",
              }}
            >
              <Sparkles size={12} />
              Operational Intelligence
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>• Bandara Internasional Juanda</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
            Dashboard Analitik Operasional
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            Pemantauan performa sebaran tenant, okupansi unit ruang, dan status operasional komersial bandara secara *real-time*.
          </p>
        </div>

        {/* TERMINAL SELECTOR TABS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px",
            background: "#f1f5f9",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          {(
            [
              { id: "ALL", label: "Semua Lantai (T1)" },
              { id: "L1", label: "Lantai 1 (GF)" },
              { id: "L2", label: "Lantai 2 (FF)" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFloor(tab.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: "750",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: selectedFloor === tab.id ? "#ffffff" : "transparent",
                color: selectedFloor === tab.id ? "#00a8bd" : "#64748b",
                boxShadow: selectedFloor === tab.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP EXECUTIVE KPI STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {/* KPI 1: TENANT KOMERSIAL */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "750", color: "#64748b", textTransform: "uppercase" }}>
              Tenant Komersial
            </span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#e0f7fa",
                color: "#00a8bd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={20} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "28px", fontWeight: "850", color: "#0f172a" }}>
                {commOccupied}
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Unit Usaha</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", fontWeight: "700", color: "#334155" }}>
                Terminal 1 • Bandara Juanda
              </span>
              <span>{commActive} Buka • {commClosed} Tutup</span>
            </div>
          </div>
        </div>

        {/* KPI 2: OKUPANSI KAVLING KOMERSIAL */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "750", color: "#64748b", textTransform: "uppercase" }}>
              Okupansi Ruang Komersial
            </span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={20} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "28px", fontWeight: "850", color: "#2563eb" }}>
                {commOccupancyPercent}%
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Kavling Terisi</span>
            </div>
            <div style={{ marginTop: "10px" }}>
              <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${commOccupancyPercent}%`, background: "#2563eb", borderRadius: "999px" }} />
              </div>
              <span style={{ display: "block", fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                {commVacant > 0
                  ? `${commOccupied} dari ${commTotal} kavling terpakai (${commVacant} jalan/kosong)`
                  : `${commOccupied} dari ${commTotal} kavling terisi penuh`}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: FASILITAS & LAYANAN PUBLIK */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "750", color: "#64748b", textTransform: "uppercase" }}>
              Fasilitas & Layanan Publik
            </span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#f5f3ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "28px", fontWeight: "850", color: "#7c3aed" }}>
                {facilityTotal}
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Titik Layanan</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#ede9fe", fontWeight: "750", color: "#6d28d9" }}>
                {facilityActivePercent}% Siap Melayani
              </span>
              <span>{facilityActive} Aktif • {facilityClosed} Pemeliharaan</span>
            </div>
          </div>
        </div>

        {/* KPI 4: STATUS OPERASIONAL TENANT */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "750", color: "#64748b", textTransform: "uppercase" }}>
              Reliabilitas Gerai
            </span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "28px", fontWeight: "850", color: "#10b981" }}>
                {commActivePercent}%
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Aktif Beroperasi</span>
            </div>
            <div style={{ marginTop: "10px" }}>
              <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${commActivePercent}%`, background: "#10b981", borderRadius: "999px" }} />
              </div>
              <span style={{ display: "block", fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                {commActive} dari {commOccupied} gerai buka normal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MID ROW: ANALYTICS CHARTS & BREAKDOWN */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px",
        }}
      >
        {/* CHART 1: DONUT STATUS OPERASIONAL */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>Rasio Status Operasional</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Tingkat keaktifan toko & layanan hari ini</span>
            </div>
            <CheckCircle2 size={18} style={{ color: "#00a8bd" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flex: 1, padding: "10px 0" }}>
            <div
              className="donut-chart"
              style={{
                "--chart-value": `${commActivePercent * 3.6}deg`,
                width: "124px",
                height: "124px",
              } as React.CSSProperties}
              role="img"
              aria-label={`${commActivePercent} persen tenant komersial aktif`}
            >
              <div>
                <strong style={{ fontSize: "20px" }}>{commActivePercent}%</strong>
                <span style={{ fontSize: "10px" }}>Aktif</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <strong style={{ color: "#0f172a" }}>{commActive} Unit Komersial</strong>
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b", paddingLeft: "18px" }}>
                  Gerai Buka ({commActivePercent}%)
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                  <strong style={{ color: "#0f172a" }}>{commClosed} Unit</strong>
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b", paddingLeft: "18px" }}>
                  Tutup Sementara ({100 - commActivePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: SEBARAN KATEGORI */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>Distribusi Kategori Tenant</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Komposisi jenis gerai komersial</span>
            </div>
            <PieChart size={18} style={{ color: "#00a8bd" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "center" }}>
            {categoryRows.map(([cat, count], idx) => {
              const pct = commOccupied > 0 ? Math.round((count / commOccupied) * 100) : 0;
              const barWidth = Math.round((count / maxCategory) * 100);
              const colors = ["#00a8bd", "#0284c7", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
              const currentColor = colors[idx % colors.length];

              return (
                <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "650", color: "#334155" }}>{cat}</span>
                    <span style={{ color: "#64748b", fontSize: "11.5px" }}>
                      <strong style={{ color: "#0f172a" }}>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: "7px", width: "100%", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barWidth}%`, background: currentColor, borderRadius: "999px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: SEBARAN TERMINAL & LANTAI */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>Sebaran per Lantai Terminal</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Kepadatan tenant di tiap tingkat bangunan</span>
            </div>
            <BarChart3 size={18} style={{ color: "#00a8bd" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "center" }}>
            {floorBreakdown.map((row) => {
              const maxTenants = Math.max(1, ...floorBreakdown.map((r) => r.total));
              const width = Math.round((row.total / maxTenants) * 100);

              return (
                <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                      <MapPin size={13} style={{ color: "#00a8bd" }} />
                      {row.label}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                      <strong style={{ color: "#0f172a" }}>{row.commOccupied}</strong>/{row.commTotal} tenant komersial ({row.occRate}% terisi{row.commVacant > 0 ? `, ${row.commVacant} jalan` : ""}) &bull; <strong style={{ color: "#7c3aed" }}>{row.facTotal}</strong> fasilitas
                    </span>
                  </div>
                  <div style={{ height: "8px", width: "100%", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${width}%`, background: "linear-gradient(90deg, #00a8bd, #0284c7)", borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUICK ATTENTION & MONITORING TABLE */}
      {attentionTenants.length > 0 ? (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "16px",
            padding: "18px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <AlertCircle size={18} style={{ color: "#d97706" }} />
            <strong style={{ color: "#92400e", fontSize: "14px" }}>
              Perhatian Operasional: {attentionTenants.length} Tenant Berstatus Tutup / Jam Layanan Terbatas
            </strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {attentionTenants.map((t, idx) => (
              <div
                key={t.id || idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #fef3c7",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong style={{ color: "#1e293b", fontSize: "13px", display: "block" }}>{t.name || "Tenant"}</strong>
                  <span style={{ color: "#64748b", fontSize: "11px" }}>
                    {t.terminal} • {t.floor || "L1"} • {t.spaceCode || "-"}
                  </span>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "#fee2e2",
                    color: "#dc2626",
                  }}
                >
                  TUTUP
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
          <span style={{ fontSize: "13px", color: "#166534", fontWeight: "650" }}>
            Seluruh tenant terdata saat ini berstatus operasional aktif dan siap melayani penumpang di bandara.
          </span>
        </div>
      )}

      {/* STRATEGIC OPERATIONAL INSIGHT CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #142328 0%, #1a3b44 100%)",
          borderRadius: "16px",
          padding: "24px 26px",
          color: "#ffffff",
          boxShadow: "0 8px 24px rgba(20, 35, 40, 0.15)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div style={{ maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ color: "#75e7f1", fontSize: "11px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              InJourney Airports Commercial Insights
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: "800" }}>
            {inactiveCount > 0
              ? `Tingkatkan utilisasi: ${inactiveCount} unit usaha butuh pembaruan jadwal operasional`
              : "Performa komersial optimal dengan tingkat keaktifan penuh"}
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#9eb4ba", lineHeight: 1.5 }}>
            Data dianalisis secara terintegrasi dengan direktori wayfinding penumpang di Terminal 1 Bandara Internasional Juanda untuk memastikan informasi gerai selalu mutakhir bagi calon penumpang.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <strong style={{ fontSize: "22px", color: "#00a8bd", display: "block", fontWeight: "850" }}>
              {commActivePercent}%
            </strong>
            <span style={{ fontSize: "11.5px", color: "#9eb4ba" }}>Service Reliability</span>
          </div>
        </div>
      </div>
    </div>
  );
}
