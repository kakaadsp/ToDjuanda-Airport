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
  terminal: string;
  floor?: string;
  floorCode?: string;
  spaceCode?: string;
  status: string;
  hours?: string;
};

export function DashboardAnalytics({ tenants }: { tenants: TenantAnalyticsRow[] }) {
  const [selectedTerminal, setSelectedTerminal] = useState<"ALL" | "T1" | "T2">("ALL");

  // Filtered tenants by selected terminal
  const filteredTenants = useMemo(() => {
    if (selectedTerminal === "ALL") return tenants;
    return tenants.filter((t) => t.terminal === selectedTerminal);
  }, [tenants, selectedTerminal]);

  // Operational metrics
  const activeCount = filteredTenants.filter((tenant) => tenant.status === "ACTIVE" || tenant.status === "WALKWAY").length;
  const closedCount = filteredTenants.filter((tenant) => tenant.status === "TEMPORARILY_CLOSED").length;
  const inactiveCount = closedCount;
  const activePercent = filteredTenants.length ? Math.round((activeCount / filteredTenants.length) * 100) : 0;

  // Category composition
  const categoryRows = useMemo(() => {
    const counts = filteredTenants.reduce<Record<string, number>>((result, tenant) => {
      const cat = tenant.category || "Lainnya";
      result[cat] = (result[cat] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTenants]);

  const maxCategory = Math.max(1, ...categoryRows.map(([, count]) => count));
  const topCategory = categoryRows[0] || ["-", 0];
  const topCategoryPercent = filteredTenants.length
    ? Math.round((Number(topCategory[1]) / filteredTenants.length) * 100)
    : 0;

  // Terminal & Floor distribution
  const floorBreakdown = useMemo(() => {
    const floors = [
      { id: "T1-L1", label: "Terminal 1 • Lantai 1", terminal: "T1", floor: "Lantai 1" },
      { id: "T1-L2", label: "Terminal 1 • Lantai 2", terminal: "T1", floor: "Lantai 2" },
      { id: "T2-L1", label: "Terminal 2 • Lantai 1", terminal: "T2", floor: "Lantai 1" },
      { id: "T2-L2", label: "Terminal 2 • Lantai 2", terminal: "T2", floor: "Lantai 2" },
    ];

    return floors
      .filter((f) => selectedTerminal === "ALL" || f.terminal === selectedTerminal)
      .map((f) => {
        const matching = tenants.filter(
          (t) => t.terminal === f.terminal && (t.floor?.includes(f.floor.slice(-1)) || t.floorCode?.includes(f.floor.slice(-1)))
        );
        const active = matching.filter((t) => t.status === "ACTIVE").length;
        return {
          ...f,
          total: matching.length,
          active,
          inactive: matching.length - active,
        };
      });
  }, [tenants, selectedTerminal]);

  // Estimated space occupancy (based on standard airport terminal commercial block allotment)
  const totalCommercialCapacity = selectedTerminal === "ALL" ? 36 : 18;
  const occupiedSpaces = filteredTenants.length;
  const occupancyPercent = Math.min(100, Math.round((occupiedSpaces / totalCommercialCapacity) * 100));

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
              { id: "ALL", label: "Semua Terminal" },
              { id: "T1", label: "Terminal 1" },
              { id: "T2", label: "Terminal 2" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTerminal(tab.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: "750",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: selectedTerminal === tab.id ? "#ffffff" : "transparent",
                color: selectedTerminal === tab.id ? "#00a8bd" : "#64748b",
                boxShadow: selectedTerminal === tab.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
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
        {/* KPI 1: TOTAL TENANT */}
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
              Total Tenant Komersial
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
                {filteredTenants.length}
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Unit Usaha</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", fontWeight: "700", color: "#334155" }}>
                {selectedTerminal === "ALL" ? `${tenants.filter((t) => t.terminal === "T1").length} T1 • ${tenants.filter((t) => t.terminal === "T2").length} T2` : selectedTerminal}
              </span>
              <span>Terdata di Wayfinding</span>
            </div>
          </div>
        </div>

        {/* KPI 2: OPERASIONAL AKTIF */}
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
              Status Operasional
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
                {activePercent}%
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Aktif Buka</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ color: "#10b981", fontWeight: "700" }}>{activeCount} Beroperasi</span>
              <span>•</span>
              <span style={{ color: inactiveCount > 0 ? "#e11d48" : "#94a3b8", fontWeight: "700" }}>{inactiveCount} Tutup Sementara</span>
            </div>
          </div>
        </div>

        {/* KPI 3: TINGKAT OKUPANSI */}
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
              Tingkat Okupansi Ruang
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
                {occupancyPercent}%
              </strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Kavling Terisi</span>
            </div>
            <div style={{ marginTop: "10px" }}>
              <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${occupancyPercent}%`, background: "#2563eb", borderRadius: "999px" }} />
              </div>
              <span style={{ display: "block", fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                {occupiedSpaces} dari ~{totalCommercialCapacity} unit kavling terpakai
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: KATEGORI UNGGULAN */}
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
              Kategori Terbanyak
            </span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#faf5ff",
                color: "#9333ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={20} />
            </div>
          </div>
          <div>
            <strong style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {topCategory[0]}
            </strong>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#faf5ff", color: "#7e22ce", fontWeight: "750" }}>
                {topCategory[1]} Tenant
              </span>
              <span>{topCategoryPercent}% dari total komersial</span>
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
                "--chart-value": `${activePercent * 3.6}deg`,
                width: "124px",
                height: "124px",
              } as React.CSSProperties}
              role="img"
              aria-label={`${activePercent} persen tenant aktif`}
            >
              <div>
                <strong style={{ fontSize: "20px" }}>{activePercent}%</strong>
                <span style={{ fontSize: "10px" }}>Aktif</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <strong style={{ color: "#0f172a" }}>{activeCount} Unit</strong>
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b", paddingLeft: "18px" }}>
                  Buka & Siap Melayani ({activePercent}%)
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                  <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                  <strong style={{ color: "#0f172a" }}>{inactiveCount} Unit</strong>
                </div>
                <span style={{ fontSize: "11.5px", color: "#64748b", paddingLeft: "18px" }}>
                  Tutup Sementara ({100 - activePercent}%)
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
              const pct = filteredTenants.length ? Math.round((count / filteredTenants.length) * 100) : 0;
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
                      <strong style={{ color: "#0f172a" }}>{row.total}</strong> tenant ({row.active} aktif)
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
            Data dianalisis secara terintegrasi dengan direktori wayfinding penumpang di Terminal 1 dan Terminal 2 Bandara Internasional Juanda untuk memastikan informasi gerai selalu mutakhir bagi calon penumpang.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <strong style={{ fontSize: "22px", color: "#00a8bd", display: "block", fontWeight: "850" }}>
              {activePercent}%
            </strong>
            <span style={{ fontSize: "11.5px", color: "#9eb4ba" }}>Service Reliability</span>
          </div>
        </div>
      </div>
    </div>
  );
}
