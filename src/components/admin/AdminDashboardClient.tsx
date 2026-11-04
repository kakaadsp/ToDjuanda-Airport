"use client";

import {
  useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Activity,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock,
  FileSpreadsheet,
  FileClock,
  FileText,
  LogOut,
  Map,
  MapPinned,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Tags,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { AdminRole } from "@/types";
// @ts-ignore
type SheetData = any;
import { AdminMapPanel } from "@/components/admin/AdminMapPanel";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { MapStage } from "@/components/wayfinding/MapStage";
import { spaces } from "@/data/demo-wayfinding";
import { defaultMapObjectConfig, fetchMapObjectConfigsFromDb, readMapObjectConfigs, writeMapObjectConfigs, type MapObjectConfig, type MapObjectConfigByName } from "@/lib/map3d/admin-object-config";
import type { TerminalCode } from "@/types";

type TenantRow = {
  id: string; name: string; category: string; terminal: TerminalCode; floor: string; floorCode?: string; spaceCode: string; status: string; hours: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapObjectCategory(config: MapObjectConfig) {
  const value = `${config.objectName} ${config.displayName}`;
  if (/(?:^|[-_ ])(?:TL|TOILET)(?:$|[-_ ])/i.test(value)) return "Toilet";
  if (/(?:^|[-_ ])ATM(?:$|[-_ ])/i.test(value)) return "ATM";
  if (/(?:^|[-_ ])MUS(?:$|[-_ ])|MUSH?OL/i.test(value)) return "Mushola";
  if (/(?:AVSEC|BAGGAGE|GATE|DOOR|INFORMASI|LAYANAN)/i.test(value)) return "Fasilitas & Layanan";
  return config.entityType === "TENANT" ? "Komersial" : "Fasilitas Umum";
}

function mapConfigsToDirectory(configs: MapObjectConfigByName): TenantRow[] {
  return Object.values(configs)
    .filter((config) => config.displayName.trim() || /(?:ATM|TOILET|T1-(?:GF|FF)-)/i.test(config.objectName))
    .map((config) => {
      const floorCode = /-FF-/i.test(config.objectName) ? "FF" : "GF";
      const terminal = /^T2-/i.test(config.objectName) ? "T2" : "T1";
      return {
        id: config.objectName,
        name: config.displayName.trim() || config.objectName,
        category: mapObjectCategory(config),
        terminal,
        floor: floorCode === "FF" ? "Lantai 2" : "Lantai 1",
        floorCode,
        spaceCode: config.objectName,
        status: config.occupancy === "WALKABLE" ? "TEMPORARILY_CLOSED" : "ACTIVE",
        hours: config.openTime || config.closeTime ? `${config.openTime || "--:--"} - ${config.closeTime || "--:--"}` : "Belum diatur",
      } satisfies TenantRow;
    })
    .sort((a, b) => a.spaceCode.localeCompare(b.spaceCode, "id-ID", { numeric: true }));
}

const INITIAL_USERS: AdminUserRow[] = [
  { id: "fallback-super-admin", name: "Super Administrator Juanda", email: "superadmin@juanda-airport.local", role: "SUPER_ADMIN" as AdminRole, status: "ACTIVE" },
  { id: "fallback-commercial-admin", name: "Admin Komersil Juanda", email: "admin.komersil@juanda-airport.local", role: "AIRPORT_ADMIN" as AdminRole, status: "ACTIVE" },
];

type AuditLogRow = {
  id: string;
  createdAt: string;
  actionCode: string;
  actionLabel: string;
  badgeType: "success" | "warning" | "danger" | "info";
  adminName: string;
  adminEmail: string;
  adminRole: string;
  entity: string;
  detailSummary: string;
};

type AuditMetrics = {
  total: number;
  todayCount: number;
  activeAdminsCount: number;
  lastActionTime: string | null;
};

function formatAuditTime(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).replace(/\./g, ":");
  } catch {
    return iso;
  }
}

function formatUserDate(iso?: string) {
  if (!iso) return "Tersimpan";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AdminDashboardClient({
  user,
}: {
  user: { name: string | null; email: string | null; role: AdminRole };
}) {
  const activeRole = user.role;
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Signout error:", e);
    } finally {
      window.location.href = "/auth/signin";
    }
  };
  const [mapObjectToEdit, setMapObjectToEdit] = useState<string | null>(null);
  const [mapEditNonce, setMapEditNonce] = useState(0);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>(INITIAL_USERS);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "AIRPORT_ADMIN" as AdminRole });
  const [newAdminError, setNewAdminError] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editingPassword, setEditingPassword] = useState("");
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showTenantPlacement, setShowTenantPlacement] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"excel" | "pdf" | null>(null);
  const [reportFilters, setReportFilters] = useState({ terminal: "ALL", category: "ALL", status: "ALL" });
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    entity: "tenant" | "user";
    id: string;
    name: string;
    currentStatus: string;
  } | null>(null);

  // Real-time Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditMetrics, setAuditMetrics] = useState<AuditMetrics>({ total: 0, todayCount: 0, activeAdminsCount: 0, lastActionTime: null });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("ALL");

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data audit");
      const data = await res.json() as { logs: AuditLogRow[]; metrics: AuditMetrics };
      if (Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
      if (data.metrics) {
        setAuditMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === "SUPER_ADMIN" && activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeRole, activeTab]);

  // New Tenant Form state
  const [newTenant, setNewTenant] = useState({
    name: "",
    category: "Kuliner & F&B",
    terminal: "T1",
    floor: "Lantai 1",
    spaceCode: "",
    hours: "07:00 - 21:00",
  });

  useEffect(() => {
    const applyConfigs = (configs: MapObjectConfigByName) => setTenants(mapConfigsToDirectory(configs));
    const cachedConfigs = readMapObjectConfigs();
    fetchMapObjectConfigsFromDb().then((databaseConfigs) => applyConfigs({ ...cachedConfigs, ...databaseConfigs })).catch(() => applyConfigs(cachedConfigs));
    const handleConfigChange = (event: Event) => applyConfigs((event as CustomEvent<MapObjectConfigByName>).detail ?? readMapObjectConfigs());
    window.addEventListener("todjuanda-map-config-change", handleConfigChange);
    return () => window.removeEventListener("todjuanda-map-config-change", handleConfigChange);
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal mengambil data akun");
      const payload = (await response.json()) as { users?: AdminUserRow[] };
      if (Array.isArray(payload.users)) setUsers(payload.users);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === "SUPER_ADMIN") {
      fetchUsers();
    }
  }, [activeRole, activeTab]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setNewAdminError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = (await res.json()) as { user?: AdminUserRow; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "Gagal membuat akun");
      setUsers((current) => [data.user!, ...current]);
      setShowAddUserModal(false);
      setNewAdmin({ name: "", email: "", password: "", role: "AIRPORT_ADMIN" });
      fetchAuditLogs();
    } catch (err) {
      setNewAdminError(err instanceof Error ? err.message : "Gagal membuat akun");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const occupiedSpaceCodes = useMemo(() => new Set(tenants.map((tenant) => tenant.spaceCode).filter(Boolean)), [tenants]);
  const placementFloorId = `${newTenant.terminal}-${newTenant.floor.endsWith("2") ? "L2" : "L1"}`;
  const availableTenantBlocks = useMemo(
    () => spaces.filter((space) => space.terminal === newTenant.terminal && space.floorId === placementFloorId && space.type === "TENANT" && !occupiedSpaceCodes.has(space.code)),
    [newTenant.terminal, occupiedSpaceCodes, placementFloorId],
  );

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.spaceCode) return;
    const requestBody = { ...newTenant, status: "ACTIVE" };
    let created: TenantRow;
    try {
      const response = await fetch("/api/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) throw new Error("Gagal menyimpan tenant");
      const payload = await response.json() as { tenant: TenantRow };
      created = payload.tenant;
    } catch {
      // Tetap membuat pengalaman editor bisa dipakai saat database lokal belum aktif.
      created = { id: `local-${Date.now()}`, name: newTenant.name, category: newTenant.category, terminal: newTenant.terminal as TerminalCode, floor: newTenant.floor, spaceCode: newTenant.spaceCode, status: "ACTIVE", hours: newTenant.hours };
    }
    setTenants((current) => [created, ...current]);
    const cachedConfigs = readMapObjectConfigs();
    writeMapObjectConfigs({
      ...cachedConfigs,
      [newTenant.spaceCode]: {
        ...(cachedConfigs[newTenant.spaceCode] ?? defaultMapObjectConfig(newTenant.spaceCode)),
        objectName: newTenant.spaceCode,
        displayName: newTenant.name,
        entityType: "TENANT",
      },
    });
    setNewTenant({ name: "", category: "Kuliner & F&B", terminal: "T1", floor: "Lantai 1", spaceCode: "", hours: "07:00 - 21:00" });
    setShowAddTenantModal(false);
    setShowTenantPlacement(false);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    if (pendingStatusChange.entity === "tenant") {
      setTenants(
        tenants.map((tenant) =>
          tenant.id === pendingStatusChange.id
            ? { ...tenant, status: tenant.status === "ACTIVE" ? "TEMPORARILY_CLOSED" : "ACTIVE" }
            : tenant
        )
      );
    } else {
      const nextActive = pendingStatusChange.currentStatus !== "ACTIVE";
      try {
        const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pendingStatusChange.id, active: nextActive }) });
        if (!response.ok) throw new Error("user update failed");
        const payload = await response.json() as { user?: (typeof INITIAL_USERS)[number] };
        if (payload.user) setUsers((current) => current.map((account) => account.id === payload.user?.id ? payload.user : account));
      } catch {
        // Jangan mengubah UI jika status database gagal disimpan.
      }
    }
    setPendingStatusChange(null);
  };

  const saveEditedUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser || savingUser) return;
    setSavingUser(true);
    setUserActionError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          password: editingPassword || undefined,
        }),
      });
      const payload = (await response.json()) as { user?: AdminUserRow; error?: string };
      if (!response.ok || !payload.user) throw new Error(payload.error ?? "Gagal memperbarui akun");
      setUsers((current) => current.map((account) => (account.id === payload.user?.id ? payload.user! : account)));
      setEditingUser(null);
      setEditingPassword("");
      fetchAuditLogs();
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Gagal memperbarui akun");
    } finally {
      setSavingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser || savingUser) return;
    setSavingUser(true);
    setUserActionError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingUser.id }),
      });
      const payload = (await response.json()) as { deletedId?: string; error?: string };
      if (!response.ok || !payload.deletedId) throw new Error(payload.error ?? "Gagal menghapus akun");
      setUsers((current) => current.filter((account) => account.id !== payload.deletedId));
      setDeletingUser(null);
      fetchAuditLogs();
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Gagal menghapus akun");
    } finally {
      setSavingUser(false);
    }
  };

  const tenantCategories = [...new Set(tenants.map((tenant) => tenant.category))].sort();
  const reportTenants = tenants.filter((tenant) => {
    const matchesTerminal = reportFilters.terminal === "ALL" || tenant.terminal === reportFilters.terminal;
    const matchesCategory = reportFilters.category === "ALL" || tenant.category === reportFilters.category;
    const matchesStatus = reportFilters.status === "ALL" || tenant.status === reportFilters.status;
    return matchesTerminal && matchesCategory && matchesStatus;
  });
  const filteredTenants = reportTenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.spaceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        log.adminName.toLowerCase().includes(q) ||
        log.adminEmail.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.actionLabel.toLowerCase().includes(q) ||
        log.detailSummary.toLowerCase().includes(q);

      const matchCat =
        auditCategoryFilter === "ALL" ||
        (auditCategoryFilter === "TENANT" && (log.actionCode.includes("TENANT") || log.actionCode.includes("MAP_OBJECT"))) ||
        (auditCategoryFilter === "USER" && (log.actionCode.includes("USER") || log.actionCode.includes("SECURITY")));

      return matchSearch && matchCat;
    });
  }, [auditLogs, auditSearch, auditCategoryFilter]);

  const exportFilterSummary = [
    `Terminal: ${reportFilters.terminal === "ALL" ? "Semua" : reportFilters.terminal}`,
    `Kategori: ${reportFilters.category === "ALL" ? "Semua" : reportFilters.category}`,
    `Status: ${reportFilters.status === "ALL" ? "Semua" : reportFilters.status === "ACTIVE" ? "Buka" : "Tutup Sementara"}`,
  ].join(" | ");

  const tenantReportRows = reportTenants.map((tenant, index) => ({
    No: index + 1,
    "Nama Bangunan": tenant.name,
    Kategori: tenant.category,
    Terminal: tenant.terminal,
    Lantai: tenant.floor,
    "Space Code": tenant.spaceCode,
    "Jam Operasional": tenant.hours,
    Status: tenant.status === "ACTIVE" ? "Buka" : "Tutup Sementara",
  }));
  const exportTenantExcel = async () => {
    setExportingFormat("excel");
    try {
      // @ts-ignore
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const mergedRow = (value: string, style: Record<string, unknown> = {}) => [
        { value, columnSpan: 8, ...style }, null, null, null, null, null, null, null,
      ];
      const tableHeader = (value: string) => ({
        value,
        fontWeight: "bold" as const,
        backgroundColor: "#00A8BD",
        textColor: "#FFFFFF",
        align: "center" as const,
        alignVertical: "center" as const,
        height: 24,
      });
      const sheetData: SheetData = [
        mergedRow("INJOURNEY AIRPORTS — BANDARA INTERNASIONAL JUANDA", {
          fontWeight: "bold",
          fontSize: 16,
          backgroundColor: "#142328",
          textColor: "#FFFFFF",
          height: 30,
          alignVertical: "center",
        }),
        mergedRow("DIREKTORI BANGUNAN PETA TERMINAL", { fontWeight: "bold", fontSize: 12, height: 24 }),
        mergedRow(`Tanggal ekspor: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}`),
        mergedRow(`Filter laporan: ${exportFilterSummary}`),
        mergedRow(`Jumlah data: ${tenantReportRows.length} objek peta`),
        [null, null, null, null, null, null, null, null],
        ["No", "Nama Bangunan", "Kategori", "Terminal", "Lantai", "Kode Objek", "Jam Operasional", "Status"].map(tableHeader),
        ...tenantReportRows.map((row, index) => [
          { value: row.No, type: Number, align: "center" as const, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Nama Bangunan"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Kategori, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Terminal, align: "center" as const, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Lantai, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Space Code"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row["Jam Operasional"], backgroundColor: index % 2 ? "#F3F7F8" : undefined },
          { value: row.Status, backgroundColor: index % 2 ? "#F3F7F8" : undefined },
        ]),
      ];
      const excelFile = writeXlsxFile(sheetData, {
        columns: [
          { width: 6 }, { width: 28 }, { width: 22 }, { width: 10 },
          { width: 14 }, { width: 16 }, { width: 22 }, { width: 20 },
        ],
        sheet: "Direktori Peta",
      });
      await excelFile.toFile(`direktori-peta-terminal-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportingFormat(null);
    }
  };

  const exportTenantPdf = async () => {
    setExportingFormat("pdf");
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        // @ts-ignore
        import("jspdf"),
        // @ts-ignore
        import("jspdf-autotable"),
      ]);
      const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      document.setFillColor(20, 35, 40);
      document.rect(0, 0, 297, 31, "F");
      document.setTextColor(255, 255, 255);
      document.setFontSize(10);
      document.setFont("helvetica", "bold");
      document.text("INJOURNEY AIRPORTS", 14, 10);
      document.setFontSize(17);
      document.text("Direktori Bangunan Peta Terminal", 14, 20);
      document.setFontSize(9);
      document.setFont("helvetica", "normal");
      document.text("Bandara Internasional Juanda", 14, 26);
      document.setFontSize(9);
      document.setTextColor(94, 111, 117);
      document.text(`Tanggal ekspor: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}`, 14, 38);
      document.text(`Filter: ${exportFilterSummary}`, 14, 43);
      document.text(`Jumlah data: ${reportTenants.length} objek`, 240, 38);
      autoTable(document, {
        startY: 48,
        head: [["No", "Nama Bangunan", "Kategori", "Lokasi", "Kode Objek", "Jam Operasional", "Status"]],
        body: reportTenants.map((tenant, index) => [
          index + 1,
          tenant.name,
          tenant.category,
          `${tenant.terminal} - ${tenant.floor}`,
          tenant.spaceCode,
          tenant.hours,
          tenant.status === "ACTIVE" ? "Buka" : "Tutup Sementara",
        ]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [0, 168, 189], textColor: 255 },
        alternateRowStyles: { fillColor: [243, 247, 248] },
        margin: { left: 14, right: 14 },
        didDrawPage: ({ pageNumber }: { pageNumber: number }) => {
          document.setFontSize(8);
          document.setTextColor(94, 111, 117);
          document.text(`Halaman ${pageNumber}`, 283, 200, { align: "right" });
        },
      });
      document.save(`direktori-peta-terminal-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <main className="admin-dashboard-root">
      {/* Admin Top Header Navigation */}
      <header className="admin-header-bar">
        <div className="admin-header-left">
          <Link href="/" className="admin-brand-link">
            <Image src="/injourney-airports.png" width={180} height={52} priority alt="InJourney Airports" />
          </Link>
          <div className="admin-header-divider" />
          <div className="admin-title-block">
            <strong>PORTAL MANAJEMEN OPERASIONAL</strong>
            <small>Bandara Internasional Juanda</small>
          </div>
        </div>

        <div className="admin-header-right">
          <span className="session-role-badge">
            {activeRole === "SUPER_ADMIN" ? <ShieldCheck size={14} /> : <Store size={14} />}
            {activeRole === "SUPER_ADMIN" ? "Superadmin" : "Admin Komersil"}
          </span>
        </div>
      </header>

      <div className="admin-body-container" data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}>
        {/* Sidebar Controls */}
        <aside className="admin-sidebar-nav" aria-label="Navigasi Menu Admin">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {activeRole === "SUPER_ADMIN" ? "SA" : "AK"}
            </div>
            <div className="user-info">
              <strong>{user.name ?? (activeRole === "SUPER_ADMIN" ? "Super Administrator" : "Admin Komersil")}</strong>
              <small>{user.email ?? "Akun admin Juanda"}</small>
            </div>
            <button
              type="button"
              className="sidebar-collapse-badge-btn"
              onClick={() => setIsSidebarCollapsed(true)}
              title="Geser / Sembunyikan Menu"
              aria-label="Sembunyikan Menu"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <nav className="nav-menu-list">
            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 size={18} />
              <span>Ringkasan Dashboard</span>
            </button>
            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "map"}
              onClick={() => setActiveTab("map")}
            >
              <MapPinned size={18} />
              <span>Peta Terminal</span>
            </button>

            <button
              type="button"
              className="nav-item"
              data-active={activeTab === "tenants"}
              onClick={() => setActiveTab("tenants")}
            >
              <Store size={18} />
              <span>Direktori Peta</span>
            </button>

            {activeRole === "AIRPORT_ADMIN" && (
              <>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "spaces"}
                  onClick={() => setActiveTab("spaces")}
                >
                  <Building2 size={18} />
                  <span>Alokasi Space & Ruang</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "facilities"}
                  onClick={() => setActiveTab("facilities")}
                >
                  <Map size={18} />
                  <span>Fasilitas & POI Bandara</span>
                </button>
              </>
            )}

            {activeRole === "SUPER_ADMIN" && (
              <>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                >
                  <Users size={18} />
                  <span>Akun & Role Administrator</span>
                </button>
                <button
                  type="button"
                  className="nav-item"
                  data-active={activeTab === "audit"}
                  onClick={() => setActiveTab("audit")}
                >
                  <FileClock size={18} />
                  <span>Audit Logs & Log Keamanan</span>
                </button>
              </>
            )}
          </nav>

          <div className="sidebar-bottom-actions">
            <button
              type="button"
              className="sidebar-signout-button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Keluar dari akun admin"
              style={{
                width: "100%",
                minHeight: "46px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "0 16px",
                borderRadius: "12px",
                border: "none",
                background: "#e02424",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "800",
                cursor: loggingOut ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(224, 36, 36, 0.3)",
                opacity: loggingOut ? 0.75 : 1,
              }}
            >
              <LogOut size={18} />
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="admin-main-view">
          {isSidebarCollapsed && (
            <div className="admin-sidebar-reopen-row">
              <button
                type="button"
                className="admin-sidebar-reopen-btn"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Buka Menu Navigasi"
                aria-label="Buka Menu Navigasi"
              >
                <PanelLeftOpen size={20} />
              </button>
            </div>
          )}
          {/* Dashboard Header Bar */}
          <div className="view-banner">
            <div>
              <span className="badge-role-pill">
                {activeRole === "SUPER_ADMIN" ? "SUPERADMIN DASHBOARD" : "ADMIN KOMERSIL DASHBOARD"}
              </span>
              <h1>
                {activeRole === "SUPER_ADMIN"
                  ? "Manajemen Sistem & Keamanan Wayfinding"
                  : "Kelola Direktori Bangunan & Fasilitas Peta Bandara Juanda"}
              </h1>
              <p>
                {activeRole === "SUPER_ADMIN"
                  ? "Pusat kendali hak akses pengguna, pemantauan graph rute A*, serta audit log log aktivitas sistem."
                  : "Kelola nama, kategori, kode objek, dan jam operasional langsung dari model terminal."}
              </p>
            </div>
          </div>

          {/* Dynamic Content Views */}
          {activeTab === "overview" && <DashboardAnalytics tenants={tenants} />}

          {activeTab === "map" && <AdminMapPanel initialObjectName={mapObjectToEdit} focusNonce={mapEditNonce} />}

          {/* AIRPORT ADMIN: TENANTS TAB */}
          {activeTab === "tenants" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Direktori Bangunan Peta Terminal</h2>
                  <p>Daftar commercial, toilet, ATM, dan fasilitas yang sudah dikonfigurasi pada model terminal</p>
                </div>
                <div className="box-actions">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode objek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={() => setActiveTab("map")}>
                    <MapPinned size={16} /> Kelola di Peta
                  </button>
                </div>
              </div>

              <div className="report-command-bar" aria-label="Filter direktori bangunan peta">
                <div className="report-command-header">
                  <div className="report-command-title">
                    <span><SlidersHorizontal size={18} /></span>
                    <div>
                      <small>DIREKTORI OBJEK PETA</small>
                      <strong>Atur data sebelum diekspor</strong>
                    </div>
                  </div>
                  <div className="report-command-actions">
                    <div className="report-command-count" aria-live="polite">
                      <strong>{reportTenants.length}</strong>
                      <span>objek siap diekspor</span>
                    </div>
                    <div className="export-action-group" aria-label="Ekspor direktori objek peta">
                      <button
                        type="button"
                        className="btn-export excel"
                        onClick={exportTenantExcel}
                        disabled={exportingFormat !== null || !reportTenants.length}
                      >
                        <FileSpreadsheet size={16} />
                        {exportingFormat === "excel" ? "Menyiapkan..." : "Excel"}
                      </button>
                      <button
                        type="button"
                        className="btn-export pdf"
                        onClick={exportTenantPdf}
                        disabled={exportingFormat !== null || !reportTenants.length}
                      >
                        <FileText size={16} />
                        {exportingFormat === "pdf" ? "Menyiapkan..." : "PDF"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="report-command-controls">
                  <div className="report-filter-control">
                    <span className="report-control-label"><Building2 size={13} /> Terminal</span>
                    <div className="report-segmented" aria-label="Filter terminal">
                      {[
                        { value: "ALL", label: "Semua" },
                        { value: "T1", label: "T1" },
                        { value: "T2", label: "T2" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={reportFilters.terminal === option.value}
                          aria-pressed={reportFilters.terminal === option.value}
                          onClick={() => setReportFilters({ ...reportFilters, terminal: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="report-filter-control">
                    <span className="report-control-label"><CirclePlay size={13} /> Status</span>
                    <div className="report-segmented status" aria-label="Filter status">
                      {[
                        { value: "ALL", label: "Semua" },
                        { value: "ACTIVE", label: "Buka" },
                        { value: "TEMPORARILY_CLOSED", label: "Tutup" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={reportFilters.status === option.value}
                          aria-pressed={reportFilters.status === option.value}
                          onClick={() => setReportFilters({ ...reportFilters, status: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="report-filter-control report-category-control">
                    <span className="report-control-label"><Tags size={13} /> Kategori</span>
                    <select
                      value={reportFilters.category}
                      onChange={(event) => setReportFilters({ ...reportFilters, category: event.target.value })}
                    >
                      <option value="ALL">Semua kategori</option>
                      {tenantCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="report-reset-button"
                    onClick={() => setReportFilters({ terminal: "ALL", category: "ALL", status: "ALL" })}
                    disabled={reportFilters.terminal === "ALL" && reportFilters.category === "ALL" && reportFilters.status === "ALL"}
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>

                <div className="report-filter-summary">
                  <span>Filter aktif</span>
                  {reportFilters.terminal === "ALL" && reportFilters.category === "ALL" && reportFilters.status === "ALL" ? (
                    <strong>Semua bangunan dan fasilitas peta ditampilkan</strong>
                  ) : (
                    <div>
                      {reportFilters.terminal !== "ALL" && <i>Terminal {reportFilters.terminal.slice(1)}</i>}
                      {reportFilters.category !== "ALL" && <i>{reportFilters.category}</i>}
                      {reportFilters.status !== "ALL" && <i>{reportFilters.status === "ACTIVE" ? "Status Buka" : "Tutup Sementara"}</i>}
                    </div>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Bangunan / Lokasi</th>
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Kode Objek Peta</th>
                      <th>Jam Operasional</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.name}</strong>
                        </td>
                        <td>
                          <span className="badge-cat">{t.category}</span>
                        </td>
                        <td>
                          {t.terminal} • {t.floor}
                        </td>
                        <td>
                          <code>{t.spaceCode}</code>
                        </td>
                        <td>{t.hours}</td>
                        <td>
                          <span className={`status-pill ${t.status === "ACTIVE" ? "active" : "closed"}`}>
                            {t.status === "ACTIVE" ? "BUKA" : "TUTUP SEMENTARA"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status-action-button ${t.status === "ACTIVE" ? "deactivate" : "activate"}`}
                            onClick={() => { setMapObjectToEdit(t.spaceCode); setMapEditNonce((n) => n + 1); setActiveTab("map"); }}
                            aria-label={`Edit ${t.name} pada peta terminal`}
                          >
                            <MapPinned size={15} />
                            <span>Edit di peta</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredTenants.length && (
                      <tr>
                        <td colSpan={7} className="table-empty-result">
                          Belum ada objek peta yang sesuai. Beri nama objek melalui Editor Lokasi 3D terlebih dahulu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AIRPORT ADMIN: SPACES TAB */}
          {activeRole === "AIRPORT_ADMIN" && activeTab === "spaces" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Alokasi Ruang & Unit Space Terminal</h2>
                  <p>Pemetaan unit polygon ruang visual terhadap tenant dan fungsi publik</p>
                </div>
              </div>

              <div className="space-grid-container">
                {["T1-L1", "T1-L2", "T2-L1", "T2-L2"].map((floor) => (
                  <div key={floor} className="floor-space-card">
                    <h3>
                      <Building2 size={18} /> {floor.replace("-", " • ")}
                    </h3>
                    <div className="space-chips-list">
                      {tenants
                        .filter((t) => `${t.terminal}-${t.floor.endsWith("1") ? "L1" : "L2"}` === floor)
                        .map((t) => (
                          <div key={t.id} className="space-item-pill">
                            <code>{t.spaceCode}</code>
                            <strong>{t.name}</strong>
                            <small>{t.category}</small>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AIRPORT ADMIN: FACILITIES TAB */}
          {activeRole === "AIRPORT_ADMIN" && activeTab === "facilities" && (
            <div className="content-box">
              <div className="box-header">
                <div className="box-title">
                  <h2>Status POI & Fasilitas Bandara</h2>
                  <p>Pengelolaan toilet, musala, ATM center, lift, dan gate bandara</p>
                </div>
              </div>

              <div className="facility-status-list">
                {[
                  { name: "Toilet Publik Utama T1-L1", type: "Toilet", status: "ACTIVE" },
                  { name: "Mushola Al-Ikhlas T1-L1", type: "Musala", status: "ACTIVE" },
                  { name: "ATM Center Mandiri/BCA T1-L1", type: "ATM", status: "ACTIVE" },
                  { name: "Boarding Gate 01 - 08 T1-L2", type: "Gate", status: "ACTIVE" },
                  { name: "Toilet Keberangkatan T2-L2", type: "Toilet", status: "MAINTENANCE" },
                ].map((fac, idx) => (
                  <div key={idx} className="facility-row-card">
                    <div>
                      <strong>{fac.name}</strong>
                      <span className="badge-cat">{fac.type}</span>
                    </div>
                    <span className={`status-pill ${fac.status === "ACTIVE" ? "active" : "closed"}`}>
                      {fac.status === "ACTIVE" ? "SIAP DIGUNAKAN" : "PERBAIKAN / MAINTENANCE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPERADMIN: USERS TAB */}
          {activeRole === "SUPER_ADMIN" && activeTab === "users" && (
            <div className="content-box">
              <div className="box-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                <div className="box-title">
                  <h2>Akun & Hak Akses Administrator</h2>
                  <p>Pusat kendali akun resmi pengelola bandara, otorisasi peran, dan kredensial login portal</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewAdminError(null);
                      setNewAdmin({ name: "", email: "", password: "", role: "AIRPORT_ADMIN" });
                      setShowAddUserModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#00a8bd",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "750",
                      cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(0, 168, 189, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <UserPlus size={16} />
                    <span>Tambah Admin Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: usersLoading ? "wait" : "pointer",
                    }}
                    title="Perbarui daftar akun dari database"
                  >
                    <RefreshCw size={14} style={{ animation: usersLoading ? "spin 1s linear infinite" : "none" }} />
                    <span>{usersLoading ? "Memuat..." : "Muat Ulang"}</span>
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "280px" }}>Administrator</th>
                      <th style={{ width: "180px" }}>Role Hak Akses</th>
                      <th style={{ width: "140px" }}>Status Akun</th>
                      <th style={{ width: "160px" }}>Terdaftar Pada</th>
                      <th style={{ width: "240px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.email === user.email;
                      const initials = u.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "AD";

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  background: u.role === "SUPER_ADMIN" ? "#00a8bd" : "#0284c7",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ display: "block", color: "#0f172a", fontSize: "13.5px" }}>
                                  {u.name}
                                </strong>
                                <span style={{ display: "block", color: "#64748b", fontSize: "11.5px" }}>
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "800",
                                background: u.role === "SUPER_ADMIN" ? "#ede9fe" : "#e0f2fe",
                                color: u.role === "SUPER_ADMIN" ? "#6d28d9" : "#0369a1",
                                border: u.role === "SUPER_ADMIN" ? "1px solid #ddd6fe" : "1px solid #bae6fd",
                              }}
                            >
                              <Shield size={12} />
                              {u.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN KOMERSIAL"}
                            </span>
                          </td>

                          <td>
                            <span className={`status-pill ${u.status === "ACTIVE" ? "active" : "closed"}`}>
                              {u.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#475569" }}>
                              <Calendar size={13} style={{ color: "#94a3b8" }} />
                              <span>{formatUserDate(u.createdAt)}</span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-user-actions" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {isSelf ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "5px 12px",
                                    borderRadius: "8px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    color: "#166534",
                                    fontSize: "12px",
                                    fontWeight: "750",
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  Akun Saat Ini
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={`status-action-button ${u.status === "ACTIVE" ? "deactivate" : "activate"}`}
                                    onClick={() => setPendingStatusChange({ entity: "user", id: u.id, name: u.name, currentStatus: u.status })}
                                    aria-label={`${u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"} akun ${u.name}`}
                                    style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                  >
                                    {u.status === "ACTIVE" ? <CirclePause size={13} /> : <CirclePlay size={13} />}
                                    <span>{u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-user-action edit"
                                    onClick={() => {
                                      setUserActionError(null);
                                      setEditingPassword("");
                                      setEditingUser({ ...u });
                                    }}
                                    aria-label={`Edit akun ${u.name}`}
                                    style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                  >
                                    <Pencil size={13} /> Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-user-action delete"
                                    onClick={() => {
                                      setUserActionError(null);
                                      setDeletingUser(u);
                                    }}
                                    aria-label={`Hapus akun ${u.name}`}
                                    style={{ padding: "5px 10px", fontSize: "11.5px" }}
                                  >
                                    <Trash2 size={13} /> Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan Terintegrasi dengan Audit Logs */}
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                <Clock size={14} style={{ color: "#00a8bd", flexShrink: 0 }} />
                <span>
                  <strong>Keamanan Akun:</strong> Rekam jejak waktu setiap kali administrator berhasil login atau mengubah data tersimpan otomatis di menu <strong>Audit Logs & Log Keamanan</strong>.
                </span>
              </div>
            </div>
          )}

          {/* SUPERADMIN: AUDIT LOGS TAB */}
          {activeRole === "SUPER_ADMIN" && activeTab === "audit" && (
            <div className="content-box">
              <div className="box-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                <div className="box-title">
                  <h2>Audit Logs & Rekam Jejak Keamanan</h2>
                  <p>Catatan real-time setiap perubahan status tenant, jam operasional, dan akun oleh administrator</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={auditLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: auditLoading ? "wait" : "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                  title="Perbarui data audit log dari database"
                >
                  <RefreshCw size={15} style={{ animation: auditLoading ? "spin 1s linear infinite" : "none" }} />
                  <span>{auditLoading ? "Memuat..." : "Muat Ulang Data"}</span>
                </button>
              </div>

              {/* STATS CARDS RINGKASAN */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "750", textTransform: "uppercase" }}>Total Log Tercatat</span>
                    <Activity size={16} style={{ color: "#00a8bd" }} />
                  </div>
                  <strong style={{ fontSize: "22px", color: "#0f172a", fontWeight: "800" }}>{auditMetrics.total}</strong>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Aktivitas di sistem</span>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "750", textTransform: "uppercase" }}>Aktivitas Hari Ini</span>
                    <Clock size={16} style={{ color: "#16a34a" }} />
                  </div>
                  <strong style={{ fontSize: "22px", color: "#16a34a", fontWeight: "800" }}>{auditMetrics.todayCount}</strong>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Tindakan dalam 24 jam</span>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "750", textTransform: "uppercase" }}>Admin Aktif</span>
                    <Users size={16} style={{ color: "#4f46e5" }} />
                  </div>
                  <strong style={{ fontSize: "22px", color: "#4f46e5", fontWeight: "800" }}>{auditMetrics.activeAdminsCount}</strong>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Administrator beroperasi</span>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "750", textTransform: "uppercase" }}>Aksi Terakhir</span>
                    <ShieldCheck size={16} style={{ color: "#ea580c" }} />
                  </div>
                  <strong style={{ fontSize: "13px", color: "#1e293b", fontWeight: "800", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {auditMetrics.lastActionTime ? formatAuditTime(auditMetrics.lastActionTime) : "Belum ada"}
                  </strong>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>Pembaruan sistem</span>
                </div>
              </div>

              {/* FILTER & SEARCH CONTROLS */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "14px 18px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "16px",
                }}
              >
                <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Cari nama admin, email, nama tenant (misal: Family Mart)..."
                    style={{
                      width: "100%",
                      minHeight: "40px",
                      paddingLeft: "36px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      color: "#1e293b",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[
                    { id: "ALL", label: "Semua Aktivitas" },
                    { id: "TENANT", label: "Tenant & Fasilitas" },
                    { id: "USER", label: "Akun & Keamanan" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAuditCategoryFilter(cat.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: auditCategoryFilter === cat.id ? "1.5px solid #00a8bd" : "1px solid #cbd5e1",
                        background: auditCategoryFilter === cat.id ? "#00a8bd" : "#ffffff",
                        color: auditCategoryFilter === cat.id ? "#ffffff" : "#475569",
                        fontSize: "12px",
                        fontWeight: "750",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MODERN AUDIT LOGS TABLE */}
              <div className="table-responsive" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "180px" }}>Waktu Audit</th>
                      <th style={{ width: "260px" }}>Admin</th>
                      <th style={{ width: "210px" }}>Tindakan (Action)</th>
                      <th>Entitas & Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.length > 0 ? (
                      filteredAuditLogs.map((log) => {
                        const initials = log.adminName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "AD";

                        return (
                          <tr key={log.id} style={{ transition: "background 0.12s ease" }}>
                            {/* Waktu Audit */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Clock size={13} style={{ color: "#64748b", flexShrink: 0 }} />
                                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155" }}>
                                  {formatAuditTime(log.createdAt)}
                                </span>
                              </div>
                            </td>

                            {/* Admin Info (Nama + Email Unik) */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "50%",
                                    background: log.adminRole === "Super Admin" ? "#00a8bd" : "#0284c7",
                                    color: "#ffffff",
                                    fontSize: "12px",
                                    fontWeight: "800",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {initials}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ display: "block", color: "#0f172a", fontSize: "13px", lineHeight: "1.3" }}>
                                    {log.adminName}
                                  </strong>
                                  <span style={{ display: "block", color: "#64748b", fontSize: "11.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {log.adminEmail}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Tindakan (Action Badge) */}
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "5px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: "800",
                                  background:
                                    log.badgeType === "success"
                                      ? "#dcfce7"
                                      : log.badgeType === "danger"
                                      ? "#fee2e2"
                                      : log.badgeType === "warning"
                                      ? "#fef3c7"
                                      : "#e0f2fe",
                                  color:
                                    log.badgeType === "success"
                                      ? "#166534"
                                      : log.badgeType === "danger"
                                      ? "#991b1b"
                                      : log.badgeType === "warning"
                                      ? "#92400e"
                                      : "#0369a1",
                                  border:
                                    log.badgeType === "success"
                                      ? "1px solid #bbf7d0"
                                      : log.badgeType === "danger"
                                      ? "1px solid #fecaca"
                                      : log.badgeType === "warning"
                                      ? "1px solid #fde68a"
                                      : "1px solid #bae6fd",
                                }}
                              >
                                {log.badgeType === "success" && <CheckCircle2 size={13} />}
                                {log.badgeType === "danger" && <AlertTriangle size={13} />}
                                {log.badgeType === "info" && <Activity size={13} />}
                                {log.badgeType === "warning" && <FileClock size={13} />}
                                <span>{log.actionLabel}</span>
                              </span>
                            </td>

                            {/* Entitas & Detail */}
                            <td>
                              <div>
                                <strong style={{ display: "block", color: "#1e293b", fontSize: "13px" }}>
                                  {log.entity}
                                </strong>
                                <small style={{ color: "#64748b", fontSize: "11.5px" }}>
                                  {log.detailSummary}
                                </small>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "36px 20px" }}>
                          <FileClock size={32} style={{ color: "#cbd5e1", margin: "0 auto 10px auto", display: "block" }} />
                          <strong style={{ display: "block", color: "#475569", fontSize: "14px", marginBottom: "4px" }}>
                            {auditLoading ? "Memuat catatan audit dari database..." : "Tidak ada catatan audit yang cocok"}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {auditSearch ? "Coba kata kunci pencarian yang berbeda" : "Aktivitas terbaru akan otomatis muncul di sini saat konfigurasi diperbarui."}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Enterprise status confirmation */}
      {pendingStatusChange && (
        <div className="modal-overlay" onClick={() => setPendingStatusChange(null)}>
          <div className="admin-modal-card status-confirmation-card" onClick={(event) => event.stopPropagation()}>
            <div className={`status-confirmation-icon ${pendingStatusChange.currentStatus === "ACTIVE" ? "deactivate" : "activate"}`}>
              {pendingStatusChange.currentStatus === "ACTIVE" ? <CirclePause size={24} /> : <CirclePlay size={24} />}
            </div>
            <div className="status-confirmation-copy">
              <span>KONFIRMASI PERUBAHAN STATUS</span>
              <h3>
                {pendingStatusChange.currentStatus === "ACTIVE"
                  ? pendingStatusChange.entity === "tenant" ? "Tutup tenant sementara?" : "Nonaktifkan akun?"
                  : pendingStatusChange.entity === "tenant" ? "Aktifkan tenant kembali?" : "Aktifkan akun kembali?"}
              </h3>
              <p>
                Status <strong>{pendingStatusChange.name}</strong> akan diperbarui. Pastikan perubahan ini sudah sesuai dengan kondisi operasional.
              </p>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setPendingStatusChange(null)}>Batal</button>
              <button
                type="button"
                className={`status-confirm-button ${pendingStatusChange.currentStatus === "ACTIVE" ? "deactivate" : "activate"}`}
                onClick={confirmStatusChange}
              >
                {pendingStatusChange.currentStatus === "ACTIVE"
                  ? pendingStatusChange.entity === "tenant" ? "Ya, tutup sementara" : "Ya, nonaktifkan"
                  : "Ya, aktifkan kembali"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="modal-overlay" onClick={() => setShowAddTenantModal(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Tenant Komersil Baru</h3>
              <button type="button" onClick={() => setShowAddTenantModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTenant} className="admin-form">
              <label>
                <span>Nama Tenant / Toko</span>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kopi Kenangan"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
              </label>
              <label>
                <span>Kategori</span>
                <select
                  value={newTenant.category}
                  onChange={(e) => setNewTenant({ ...newTenant, category: e.target.value })}
                >
                  <option value="Kuliner & F&B">Kuliner & F&B</option>
                  <option value="Toko & Fashion">Toko & Fashion</option>
                  <option value="Kantor & Layanan">Kantor & Layanan</option>
                  <option value="Mushola">Mushola</option>
                </select>
              </label>
              <div className="form-row">
                <label>
                  <span>Terminal</span>
                  <select
                    value={newTenant.terminal}
                    onChange={(e) => setNewTenant({ ...newTenant, terminal: e.target.value })}
                  >
                    <option value="T1">Terminal 1</option>
                    <option value="T2">Terminal 2</option>
                  </select>
                </label>
                <label>
                  <span>Lantai</span>
                  <select
                    value={newTenant.floor}
                    onChange={(e) => setNewTenant({ ...newTenant, floor: e.target.value })}
                  >
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                  </select>
                </label>
              </div>
              <label>
                <span>Blok peta tenant</span>
                <input
                  type="text"
                  readOnly
                  placeholder="Pilih blok kosong di peta"
                  value={newTenant.spaceCode}
                />
                <small>{newTenant.spaceCode ? `Blok terpilih: ${newTenant.spaceCode}` : "Blok harus dipilih dari peta agar tidak bertabrakan dengan tenant lain."}</small>
              </label>
              <button
                type="button"
                className="btn-secondary tenant-map-picker-button"
                onClick={() => { setShowAddTenantModal(false); setShowTenantPlacement(true); }}
                disabled={!availableTenantBlocks.length}
              >
                Pilih blok di peta ({availableTenantBlocks.length} tersedia)
              </button>
              <label>
                <span>Jam Operasional</span>
                <input
                  type="text"
                  value={newTenant.hours}
                  onChange={(e) => setNewTenant({ ...newTenant, hours: e.target.value })}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTenantModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={!newTenant.spaceCode}>
                  Simpan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTenantPlacement && (
        <div className="modal-overlay" onClick={() => setShowTenantPlacement(false)}>
          <div className="admin-modal-card admin-tenant-placement-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Pilih blok kosong di peta</h3>
                <p>{newTenant.terminal} · {newTenant.floor} · hanya blok tenant yang belum terisi</p>
              </div>
              <button type="button" onClick={() => setShowTenantPlacement(false)}><X size={18} /></button>
            </div>
            {availableTenantBlocks.length ? (
              <div className="admin-tenant-placement-map">
                <MapStage
                  terminal={newTenant.terminal as TerminalCode}
                  floorId={placementFloorId}
                  spaces={availableTenantBlocks}
                  selectedId={availableTenantBlocks.find((space) => space.code === newTenant.spaceCode)?.id ?? null}
                  route={null}
                  fromId={null}
                  toId={null}
                  currentId={null}
                  onSelect={(space) => {
                    setNewTenant((current) => ({ ...current, spaceCode: space.code }));
                    setShowTenantPlacement(false);
                    setShowAddTenantModal(true);
                  }}
                  overview
                />
              </div>
            ) : <p className="admin-empty-state">Tidak ada blok tenant kosong untuk terminal dan lantai ini.</p>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowTenantPlacement(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => { if (!creatingAdmin) setShowAddUserModal(false); }}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div>
                <h3>Tambah Administrator Baru</h3>
                <p>Buat akun baru untuk mengelola portal operasional bandara.</p>
              </div>
              <button type="button" onClick={() => setShowAddUserModal(false)} disabled={creatingAdmin}>
                <X size={18} />
              </button>
            </div>
            <form className="admin-form" onSubmit={handleCreateAdmin}>
              <label>
                <span>Nama Lengkap</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Misal: Budi Santoso"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </label>

              <label>
                <span>Email Login</span>
                <input
                  type="email"
                  required
                  placeholder="Misal: budi@juanda-airport.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </label>

              <label>
                <span>Peran Hak Akses</span>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminRole })}
                >
                  <option value="AIRPORT_ADMIN">Admin Komersial (Kelola Tenant, Fasilitas, & Peta 3D)</option>
                  <option value="SUPER_ADMIN">Super Admin (Akses Penuh Manajemen Sistem & Akun)</option>
                </select>
              </label>

              <label>
                <span>Kata Sandi Awal (Minimal 8 Karakter)</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter aman"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </label>

              {newAdminError && (
                <p className="admin-user-action-error" role="alert">
                  {newAdminError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={creatingAdmin}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={creatingAdmin}>
                  {creatingAdmin ? "Menyimpan..." : "Buat Akun Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={() => { if (!savingUser) setEditingUser(null); }}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div><h3>Edit Akun Administrator</h3><p>Perubahan langsung disimpan ke database dan aktif saat login berikutnya.</p></div>
              <button type="button" onClick={() => setEditingUser(null)} disabled={savingUser}><X size={18} /></button>
            </div>
            <form className="admin-form" onSubmit={saveEditedUser}>
              <label><span>Nama administrator</span><input required minLength={2} value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} /></label>
              <label><span>Email login</span><input required type="email" value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} /></label>
              <label>
                <span>Hak akses</span>
                <select
                  value={editingUser.role}
                  onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value as AdminRole })}
                  disabled={editingUser.email === user.email}
                >
                  <option value="AIRPORT_ADMIN">Admin Komersial (Kelola Tenant, Fasilitas, & Peta 3D)</option>
                  <option value="SUPER_ADMIN">Super Admin (Akses Penuh Manajemen Sistem & Akun)</option>
                </select>
              </label>
              <label><span>Password baru (opsional)</span><input type="password" minLength={8} value={editingPassword} onChange={(event) => setEditingPassword(event.target.value)} placeholder="Kosongkan jika password tidak diubah" /></label>
              {userActionError && <p className="admin-user-action-error" role="alert">{userActionError}</p>}
              <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setEditingUser(null)} disabled={savingUser}>Batal</button><button type="submit" className="btn-primary" disabled={savingUser}>{savingUser ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="modal-overlay" onClick={() => { if (!savingUser) setDeletingUser(null); }}>
          <div className="admin-modal-card status-confirmation-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="status-confirmation-icon deactivate"><Trash2 size={24} /></div>
            <div className="status-confirmation-copy"><span>KONFIRMASI HAPUS AKUN</span><h3>Hapus Akun Administrator?</h3><p>Akun <strong>{deletingUser.name}</strong> ({deletingUser.email}) akan dihapus permanen dari database dan tidak dapat digunakan lagi.</p></div>
            {userActionError && <p className="admin-user-action-error" role="alert">{userActionError}</p>}
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setDeletingUser(null)} disabled={savingUser}>Batal</button><button type="button" className="status-confirm-button deactivate" onClick={confirmDeleteUser} disabled={savingUser}>{savingUser ? "Menghapus..." : "Ya, hapus akun"}</button></div>
          </div>
        </div>
      )}

    </main>
  );
}
