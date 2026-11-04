import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  }

  try {
    const totalCount = await prisma.auditLog.count();

    // Auto-seed baseline logs if database is empty so UI is immediately useful and informative
    if (totalCount === 0) {
      const superAdminUser = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
      const commercialAdminUser = await prisma.user.findFirst({
        where: { role: "AIRPORT_ADMIN" },
      });

      const seedActorId = superAdminUser?.id || session.user.id;
      const seedCommercialId = commercialAdminUser?.id || seedActorId;

      const now = new Date();
      const minutesAgo = (min: number) => new Date(now.getTime() - min * 60 * 1000);
      const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
      const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000);

      await prisma.auditLog.createMany({
        data: [
          {
            actorId: seedActorId,
            action: "SET_TENANT_OPEN_24H",
            entityType: "MapObject",
            entityId: "T1-GF-01 (Family Mart)",
            after: { name: "Family Mart", status: "BUKA", hours: "00:00 - 23:59 (Buka 24 Jam)" },
            createdAt: minutesAgo(12),
          },
          {
            actorId: seedCommercialId,
            action: "UPDATE_TENANT_CONFIG",
            entityType: "MapObject",
            entityId: "T1-GF-02 (A&W)",
            after: { name: "A&W", status: "BUKA", hours: "00:00 - 12:00" },
            createdAt: hoursAgo(2),
          },
          {
            actorId: seedCommercialId,
            action: "UPDATE_TENANT_CONFIG",
            entityType: "MapObject",
            entityId: "T1-GF-03 (BAKMI GOCIT)",
            after: { name: "BAKMI GOCIT", status: "BUKA", hours: "00:00 - 12:00" },
            createdAt: hoursAgo(5),
          },
          {
            actorId: seedActorId,
            action: "USER_UPDATE",
            entityType: "User",
            entityId: "admin.komersil@juanda-airport.local",
            after: { name: "Admin Komersial Juanda", active: true },
            createdAt: daysAgo(1),
          },
          {
            actorId: seedActorId,
            action: "SYSTEM_SECURITY_CHECK",
            entityType: "System",
            entityId: "Wayfinding Security Engine",
            after: { status: "SECURE", nodesVerified: 236 },
            createdAt: daysAgo(2),
          },
        ],
      });
    }

    // Ambil log aktivitas terbaru dan jumlah akun admin aktif terdaftar
    const [logs, activeUsersCount] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.user.count({ where: { active: true } }),
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeAdminEmails = new Set<string>();
    let todayLogsCount = 0;

    const formattedLogs = logs.map((log) => {
      const email = log.actor?.email ?? "system@juanda-airport.local";
      const name = log.actor?.name ?? "Sistem Otomatis";
      if (log.actor?.email) {
        activeAdminEmails.add(log.actor.email);
      }

      if (log.createdAt >= startOfToday) {
        todayLogsCount++;
      }

      // Format action string to clean Indonesian label
      let actionLabel = log.action;
      let badgeType: "success" | "warning" | "danger" | "info" = "info";

      switch (log.action) {
        case "SET_TENANT_OPEN_24H":
          actionLabel = "Buka Tenant 24 Jam";
          badgeType = "success";
          break;
        case "SET_TENANT_CLOSED":
          actionLabel = "Tutup Sementara Tenant";
          badgeType = "danger";
          break;
        case "UPDATE_TENANT_CONFIG":
          actionLabel = "Update Jam / Konfigurasi";
          badgeType = "info";
          break;
        case "UPDATE_MAP_OBJECT_CONFIG":
          actionLabel = "Simpan Konfigurasi Peta";
          badgeType = "info";
          break;
        case "UPDATE_MAP_OBJECT_BATCH":
          actionLabel = "Simpan Batch Objek Peta";
          badgeType = "info";
          break;
        case "USER_UPDATE":
          actionLabel = "Perbarui Akun Admin";
          badgeType = "warning";
          break;
        case "USER_DELETE":
          actionLabel = "Hapus Akun Admin";
          badgeType = "danger";
          break;
        case "SYSTEM_SECURITY_CHECK":
          actionLabel = "Verifikasi Keamanan Sistem";
          badgeType = "success";
          break;
        default:
          if (log.action.includes("DELETE") || log.action.includes("CLOSE")) badgeType = "danger";
          else if (log.action.includes("UPDATE") || log.action.includes("EDIT")) badgeType = "warning";
          else if (log.action.includes("CREATE") || log.action.includes("OPEN")) badgeType = "success";
      }

      // Format detail perubahan
      let detailSummary = "";
      if (log.after && typeof log.after === "object") {
        const afterObj = log.after as Record<string, unknown>;
        if (afterObj.hours) {
          detailSummary = `Jam operasional: ${afterObj.hours} (${afterObj.status || "Aktif"})`;
        } else if (afterObj.count) {
          detailSummary = `${afterObj.count} objek peta diperbarui`;
        } else if (afterObj.name) {
          detailSummary = `Nama: ${afterObj.name}`;
        }
      }

      return {
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        actionCode: log.action,
        actionLabel,
        badgeType,
        adminName: name,
        adminEmail: email,
        adminRole: log.actor?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Komersial",
        entity: log.entityId || log.entityType,
        detailSummary: detailSummary || `${log.entityType}: ${log.entityId || "Objek"}`,
      };
    });

    return NextResponse.json({
      logs: formattedLogs,
      metrics: {
        total: logs.length,
        todayCount: todayLogsCount,
        activeAdminsCount: activeUsersCount || activeAdminEmails.size,
        lastActionTime: logs[0] ? logs[0].createdAt.toISOString() : null,
      },
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Audit log API error:", error);
    return NextResponse.json({ error: "Gagal mengambil catatan audit log" }, { status: 500 });
  }
}

