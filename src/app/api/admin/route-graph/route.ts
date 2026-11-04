import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";

async function autoSeedEdgesIfEmpty() {
  const edgeCount = await prisma.routeEdge.count();
  if (edgeCount > 0) return;

  const floors = await prisma.floor.findMany({
    include: {
      terminal: true,
      routeNodes: true,
    },
  });

  const createdEdges: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    distanceMeters: number;
    type: "WALKWAY" | "LIFT" | "ESCALATOR" | "STAIRS";
    direction: "BIDIRECTIONAL";
    publicAccess: boolean;
    accessible: boolean;
    active: boolean;
    status: "ACTIVE";
  }> = [];

  const existingPairs = new Set<string>();

  for (const floor of floors) {
    const nodes = floor.routeNodes;
    for (const node of nodes) {
      const neighbors = nodes
        .filter((other) => other.id !== node.id)
        .map((other) => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.hypot(dx, dy);
          return { other, dist };
        })
        .sort((a, b) => a.dist - b.dist);

      const toConnect = neighbors.slice(0, 3).filter((n) => n.dist <= 120);

      for (const { other, dist } of toConnect) {
        const pairKey = [node.id, other.id].sort().join("---");
        if (existingPairs.has(pairKey)) continue;
        existingPairs.add(pairKey);

        const edgeId = `edge-${node.code}-${other.code}`.toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 30) + `-${Math.random().toString(36).slice(2, 6)}`;
        createdEdges.push({
          id: edgeId,
          fromNodeId: node.id,
          toNodeId: other.id,
          distanceMeters: Math.max(1, Math.round(dist * 0.35 * 10) / 10),
          type: "WALKWAY",
          direction: "BIDIRECTIONAL",
          publicAccess: true,
          accessible: true,
          active: true,
          status: "ACTIVE",
        });
      }
    }
  }

  // Connectors between floors
  const t1L1 = floors.find((f) => f.code === "T1-L1");
  const t1L2 = floors.find((f) => f.code === "T1-L2");
  if (t1L1 && t1L2) {
    const pairs = findVerticalPairs(t1L1.routeNodes, t1L2.routeNodes, 4);
    pairs.forEach((p, idx) => {
      const type = idx === 0 ? "LIFT" : idx === 1 ? "ESCALATOR" : "STAIRS";
      createdEdges.push({
        id: `connector-t1-${type.toLowerCase()}-${idx}`,
        fromNodeId: p.node1.id,
        toNodeId: p.node2.id,
        distanceMeters: 6.0,
        type,
        direction: "BIDIRECTIONAL",
        publicAccess: true,
        accessible: type === "LIFT",
        active: true,
        status: "ACTIVE",
      });
    });
  }

  const t2L1 = floors.find((f) => f.code === "T2-L1");
  const t2L2 = floors.find((f) => f.code === "T2-L2");
  if (t2L1 && t2L2) {
    const pairs = findVerticalPairs(t2L1.routeNodes, t2L2.routeNodes, 3);
    pairs.forEach((p, idx) => {
      const type = idx === 0 ? "LIFT" : idx === 1 ? "ESCALATOR" : "STAIRS";
      createdEdges.push({
        id: `connector-t2-${type.toLowerCase()}-${idx}`,
        fromNodeId: p.node1.id,
        toNodeId: p.node2.id,
        distanceMeters: 6.0,
        type,
        direction: "BIDIRECTIONAL",
        publicAccess: true,
        accessible: type === "LIFT",
        active: true,
        status: "ACTIVE",
      });
    });
  }

  if (createdEdges.length > 0) {
    await prisma.routeEdge.createMany({
      data: createdEdges,
      skipDuplicates: true,
    });
  }
}

function findVerticalPairs(nodes1: any[], nodes2: any[], count: number) {
  const result: Array<{ node1: any; node2: any; dist: number }> = [];
  for (const n1 of nodes1) {
    for (const n2 of nodes2) {
      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      result.push({ node1: n1, node2: n2, dist });
    }
  }
  result.sort((a, b) => a.dist - b.dist);
  const used1 = new Set();
  const used2 = new Set();
  const filtered: Array<{ node1: any; node2: any; dist: number }> = [];
  for (const item of result) {
    if (used1.has(item.node1.id) || used2.has(item.node2.id)) continue;
    used1.add(item.node1.id);
    used2.add(item.node2.id);
    filtered.push(item);
    if (filtered.length >= count) break;
  }
  return filtered;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_ROUTE_GRAPH")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  try {
    await autoSeedEdgesIfEmpty();

    const [nodes, edges, connectors, accessibleEdges, closures, availableEdges] = await Promise.all([
      prisma.routeNode.count({ where: { active: true } }),
      prisma.routeEdge.count({ where: { active: true } }),
      prisma.routeEdge.count({ where: { active: true, type: { in: ["STAIRS", "LIFT", "ESCALATOR"] } } }),
      prisma.routeEdge.count({ where: { active: true, accessible: true } }),
      prisma.routeEdge.findMany({
        where: { active: false },
        orderBy: { updatedAt: "desc" },
        take: 500,
        include: { fromNode: { include: { floor: true } }, toNode: { include: { floor: true } } },
      }),
      prisma.routeEdge.findMany({
        where: { active: true },
        orderBy: { updatedAt: "desc" },
        take: 1000,
        include: { fromNode: { include: { floor: true } }, toNode: { include: { floor: true } } },
      }),
    ]);

    const formatEdgeLabel = (edge: any) => {
      const fromLabel = edge.fromNode.label ?? edge.fromNode.code;
      const toLabel = edge.toNode.label ?? edge.toNode.code;
      const typeLabel = edge.type === "LIFT" ? " [Lift]" : edge.type === "ESCALATOR" ? " [Eskalator]" : edge.type === "STAIRS" ? " [Tangga]" : "";
      return `${fromLabel} ↔ ${toLabel}${typeLabel}`;
    };

    return NextResponse.json({
      metrics: {
        nodes,
        edges,
        connectors,
        accessiblePercent: edges ? Math.round((accessibleEdges / edges) * 100) : 0,
      },
      closures: closures.map((edge) => ({
        id: edge.id,
        label: formatEdgeLabel(edge),
        from: edge.fromNode.code,
        to: edge.toNode.code,
        floorId: edge.fromNode.floor?.label ?? edge.fromNode.floor?.code ?? "Lantai 1",
        floorCode: edge.fromNode.floor?.code ?? "T1-L1",
        toFloorCode: edge.toNode.floor?.code ?? edge.fromNode.floor?.code ?? "T1-L1",
        type: edge.type,
        accessible: edge.accessible,
        distanceMeters: edge.distanceMeters,
      })),
      availableEdges: availableEdges.map((edge) => ({
        id: edge.id,
        label: formatEdgeLabel(edge),
        from: edge.fromNode.code,
        to: edge.toNode.code,
        floorId: edge.fromNode.floor?.label ?? edge.fromNode.floor?.code ?? "Lantai 1",
        floorCode: edge.fromNode.floor?.code ?? "T1-L1",
        toFloorCode: edge.toNode.floor?.code ?? edge.fromNode.floor?.code ?? "T1-L1",
        type: edge.type,
        accessible: edge.accessible,
        distanceMeters: edge.distanceMeters,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Route graph error:", error);
    return NextResponse.json({ error: "Gagal mengambil data navigation graph" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_ROUTE_GRAPH")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });
  const body = await request.json().catch(() => null) as { edgeId?: string; active?: boolean } | null;
  if (!body?.edgeId || typeof body.active !== "boolean") return NextResponse.json({ error: "Data edge tidak valid" }, { status: 400 });
  try {
    const existing = await prisma.routeEdge.findUnique({
      where: { id: body.edgeId },
      include: { fromNode: { include: { floor: true } }, toNode: { include: { floor: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Edge graph tidak ditemukan" }, { status: 404 });
    const edge = await prisma.$transaction(async (tx) => {
      const updated = await tx.routeEdge.update({
        where: { id: existing.id },
        data: { active: body.active, status: body.active ? "ACTIVE" : "TEMPORARILY_CLOSED" },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: body.active ? "ROUTE_EDGE_REOPEN" : "ROUTE_EDGE_CLOSE",
          entityType: "RouteEdge",
          entityId: existing.id,
          before: { active: existing.active },
          after: { active: updated.active },
        },
      });
      return updated;
    });

    const formatEdgeLabel = (edge: any) => {
      const fromLabel = edge.fromNode.label ?? edge.fromNode.code;
      const toLabel = edge.toNode.label ?? edge.toNode.code;
      return `${fromLabel} ↔ ${toLabel}`;
    };

    return NextResponse.json({
      edge: {
        id: edge.id,
        active: edge.active,
        label: formatEdgeLabel(existing),
        floorId: existing.fromNode.floor?.label ?? existing.fromNode.floor?.code ?? "Lantai 1",
        floorCode: existing.fromNode.floor?.code ?? "T1-L1",
        toFloorCode: existing.toNode.floor?.code ?? existing.fromNode.floor?.code ?? "T1-L1",
        type: existing.type,
        accessible: existing.accessible,
        distanceMeters: existing.distanceMeters,
      },
    });
  } catch (error) {
    console.error("Update edge error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status edge" }, { status: 500 });
  }
}
