"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Info, Maximize2, Minus, Plus, RotateCcw, ShieldAlert, Sparkles, X } from "lucide-react";
import { BaseMapLayer } from "@/components/map-layers/BaseMapLayer";
import { routeNodes, spaces, terminals } from "@/data/demo-wayfinding";

export interface GraphEdgeItem {
  id: string;
  label: string;
  from: string;
  to: string;
  floorId: string;
  floorCode?: string;
  toFloorCode?: string;
  type?: string;
  accessible?: boolean;
  distanceMeters?: number;
}

interface AdminNavigationGraphMapProps {
  availableEdges: GraphEdgeItem[];
  closures: GraphEdgeItem[];
  selectedEdgeId: string;
  onSelectEdge: (edgeId: string) => void;
  onToggleEdge: (edgeId: string, open: boolean) => Promise<void> | void;
  isToggling?: boolean;
}

const FLOOR_OPTIONS = [
  { code: "T1-L1", label: "Terminal 1 · Lantai 1", terminal: "T1" },
  { code: "T1-L2", label: "Terminal 1 · Lantai 2", terminal: "T1" },
  { code: "T2-L1", label: "Terminal 2 · Lantai 1", terminal: "T2" },
  { code: "T2-L2", label: "Terminal 2 · Lantai 2", terminal: "T2" },
] as const;

export function AdminNavigationGraphMap({
  availableEdges,
  closures,
  selectedEdgeId,
  onSelectEdge,
  onToggleEdge,
  isToggling = false,
}: AdminNavigationGraphMapProps) {
  const [activeFloorCode, setActiveFloorCode] = useState<string>("T1-L1");
  const [transform, setTransform] = useState<{ x: number; y: number; scale: number }>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; originX: number; originY: number } | null>(null);

  // Lookup map for fast node coordinates
  const nodeLookup = useMemo(() => {
    const map = new Map<string, { id: string; floorId: string; x: number; y: number; floorLabel?: string }>();
    for (const node of routeNodes) {
      map.set(node.id, node);
    }
    return map;
  }, []);

  // Set of closed edge IDs for fast lookup
  const closedEdgeIdSet = useMemo(() => {
    return new Set(closures.map((c) => c.id));
  }, [closures]);

  // Combined all edges
  const allEdges = useMemo(() => {
    const map = new Map<string, GraphEdgeItem>();
    for (const e of availableEdges) {
      map.set(e.id, e);
    }
    for (const c of closures) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [availableEdges, closures]);

  // Edges on current floor
  const currentFloorEdges = useMemo(() => {
    return allEdges.filter((edge) => {
      const fromNode = nodeLookup.get(edge.from);
      const toNode = nodeLookup.get(edge.to);
      const edgeFloor = edge.floorCode || fromNode?.floorId;
      const edgeToFloor = edge.toFloorCode || toNode?.floorId;
      return edgeFloor === activeFloorCode || edgeToFloor === activeFloorCode;
    });
  }, [allEdges, activeFloorCode, nodeLookup]);

  // Nodes on current floor
  const currentFloorNodes = useMemo(() => {
    return routeNodes.filter((node) => node.floorId === activeFloorCode);
  }, [activeFloorCode]);

  // Spaces on current floor
  const currentFloorSpaces = useMemo(() => {
    return spaces.filter((space) => space.floorId === activeFloorCode);
  }, [activeFloorCode]);

  // Count open vs closed on this floor
  const floorOpenCount = useMemo(() => {
    return currentFloorEdges.filter((e) => !closedEdgeIdSet.has(e.id)).length;
  }, [currentFloorEdges, closedEdgeIdSet]);

  const floorClosedCount = useMemo(() => {
    return currentFloorEdges.filter((e) => closedEdgeIdSet.has(e.id)).length;
  }, [currentFloorEdges, closedEdgeIdSet]);

  // Current floor blueprint config
  const terminalConfig = useMemo(() => {
    const termCode = activeFloorCode.startsWith("T2") ? "T2" : "T1";
    return terminals.find((t) => t.code === termCode);
  }, [activeFloorCode]);

  const floorMapConfig = useMemo(() => {
    return terminalConfig?.floorMaps[activeFloorCode];
  }, [terminalConfig, activeFloorCode]);

  // Currently selected edge data
  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return allEdges.find((e) => e.id === selectedEdgeId) ?? null;
  }, [selectedEdgeId, allEdges]);

  const isSelectedClosed = selectedEdge ? closedEdgeIdSet.has(selectedEdge.id) : false;

  // Pan & Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setTransform((prev) => {
      const newScale = Math.min(4.5, Math.max(0.6, Math.round((prev.scale + delta) * 100) / 100));
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // Pointer drag panning
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left mouse button only
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setTransform((prev) => ({
      ...prev,
      x: dragStartRef.current!.originX + dx,
      y: dragStartRef.current!.originY + dy,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if not supported
    }
  };

  return (
    <div
      className="admin-graph-map-container"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1px solid #dfe7e9",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        marginBottom: "24px",
      }}
    >
      {/* HEADER: Floor selector, stats, & zoom controls */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #eef2f5",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background: "#fafcfd",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Pilih Lantai Terminal:
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FLOOR_OPTIONS.map((opt) => {
              const isActive = activeFloorCode === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setActiveFloorCode(opt.code);
                    handleResetZoom();
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: isActive ? "1.5px solid #00a8bd" : "1px solid #cbd5e1",
                    background: isActive ? "#00a8bd" : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    fontSize: "12px",
                    fontWeight: "750",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 2px 8px rgba(0, 168, 189, 0.25)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status badges & Zoom tools */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontWeight: "700",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
              {floorOpenCount} Terbuka
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "12px",
                background: floorClosedCount > 0 ? "#fef2f2" : "#f8fafc",
                border: floorClosedCount > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                color: floorClosedCount > 0 ? "#991b1b" : "#64748b",
                fontWeight: "700",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: floorClosedCount > 0 ? "#dc2626" : "#94a3b8" }} />
              {floorClosedCount} Ditutup
            </span>
          </div>

          {/* Zoom Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => handleZoom(0.25)}
              title="Perbesar Peta (+)"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                color: "#334155",
                cursor: "pointer",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.25)}
              title="Perkecil Peta (-)"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                color: "#334155",
                cursor: "pointer",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Posisi & Zoom"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* SVG MAP CANVAS */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "440px",
          background: "#182830",
          overflow: "hidden",
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <svg
          viewBox="0 0 1000 700"
          style={{ width: "100%", height: "100%", display: "block" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Glow for emergency closed corridors */}
            <filter id="glow-closed" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ef4444" floodOpacity="0.85" />
            </filter>
            {/* Glow for selected corridor */}
            <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.9" />
            </filter>
          </defs>

          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            {/* Layer 1: Blueprint Background Image */}
            {floorMapConfig && (
              <BaseMapLayer
                asset={floorMapConfig.asset}
                label={activeFloorCode}
                imageWidth={floorMapConfig.imageWidth}
                imageHeight={floorMapConfig.imageHeight}
                crop={floorMapConfig.crop}
              />
            )}

            {/* Layer 2: Spaces (Stores/Rooms outlines for context) */}
            <g data-layer="spaces" opacity="0.45">
              {currentFloorSpaces.map((space) => {
                if (!space.polygon) return null;
                return (
                  <polygon
                    key={space.id}
                    points={space.polygon}
                    fill={space.mapColor || "#38bdf8"}
                    fillOpacity="0.2"
                    stroke="#0284c7"
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                  />
                );
              })}
            </g>

            {/* Layer 3: Corridor Edges (Open and Closed) */}
            <g data-layer="edges">
              {currentFloorEdges.map((edge) => {
                const fromNode = nodeLookup.get(edge.from);
                const toNode = nodeLookup.get(edge.to);
                if (!fromNode || !toNode) return null;

                const isClosed = closedEdgeIdSet.has(edge.id);
                const isSelected = selectedEdgeId === edge.id;

                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;

                return (
                  <g
                    key={edge.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEdge(edge.id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Invisible thick stroke for easy click hit detection */}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="transparent"
                      strokeWidth="16"
                    />

                    {/* Visible line */}
                    {isSelected ? (
                      /* Selected Edge Highlight */
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#f59e0b"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        filter="url(#glow-selected)"
                      />
                    ) : isClosed ? (
                      /* Emergency Closed Edge */
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#ef4444"
                        strokeWidth="4.5"
                        strokeDasharray="7 4"
                        strokeLinecap="round"
                        filter="url(#glow-closed)"
                      />
                    ) : (
                      /* Normal Open Walkway Edge */
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#00c4cc"
                        strokeWidth="2.2"
                        strokeOpacity="0.75"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Marker badge at midpoint for Closed Corridors */}
                    {isClosed && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <circle r="7.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                    )}

                    {/* Marker badge for Selected corridor */}
                    {isSelected && !isClosed && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Layer 4: Navigation Nodes dots */}
            <g data-layer="nodes" pointerEvents="none">
              {currentFloorNodes.map((node) => (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r="2.2"
                  fill="#38bdf8"
                  opacity="0.65"
                />
              ))}
            </g>
          </g>
        </svg>

        {/* On-map helper floating badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "14px",
            background: "rgba(15, 23, 42, 0.78)",
            backdropFilter: "blur(6px)",
            padding: "6px 12px",
            borderRadius: "10px",
            color: "#e2e8f0",
            fontSize: "11.5px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            pointerEvents: "none",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <Info size={13} style={{ color: "#38bdf8" }} />
          <span>Klik salah satu jalur pada peta untuk menutup atau membukanya. Tarik mouse untuk geser.</span>
        </div>
      </div>

      {/* SELECTED CORRIDOR INSPECTOR & ACTION PANEL */}
      <div
        style={{
          padding: "16px 20px",
          background: selectedEdge ? (isSelectedClosed ? "#fff1f2" : "#f0fdf4") : "#fafcfd",
          borderTop: "1px solid #eef2f5",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          transition: "background 0.2s ease",
        }}
      >
        {selectedEdge ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: isSelectedClosed ? "#fee2e2" : "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isSelectedClosed ? "#dc2626" : "#16a34a",
                  flexShrink: 0,
                }}
              >
                {isSelectedClosed ? <ShieldAlert size={22} /> : <CheckCircle2 size={22} />}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "14px", color: isSelectedClosed ? "#991b1b" : "#166534" }}>
                    {selectedEdge.label}
                  </strong>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10.5px",
                      fontWeight: "800",
                      background: isSelectedClosed ? "#dc2626" : "#16a34a",
                      color: "#ffffff",
                    }}
                  >
                    {isSelectedClosed ? "DITUTUP (DARURAT)" : "TERBUKA (A*)"}
                  </span>
                </div>
                <small style={{ color: "#64748b", fontSize: "12px" }}>
                  Lokasi: {selectedEdge.floorId || activeFloorCode} · Jarak: {selectedEdge.distanceMeters ?? 6} meter ·
                  Aksesibilitas: {selectedEdge.accessible !== false ? "Ramah Kursi Roda" : "Tangga / Non-Wheelchair"}
                </small>
              </div>
            </div>

            {/* Quick Toggle Action Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isSelectedClosed ? (
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => onToggleEdge(selectedEdge.id, true)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: isToggling ? "not-allowed" : "pointer",
                    boxShadow: "0 3px 12px rgba(22, 163, 74, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isToggling ? "Memproses..." : "Buka Kembali Jalur Ini"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => onToggleEdge(selectedEdge.id, false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: isToggling ? "not-allowed" : "pointer",
                    boxShadow: "0 3px 12px rgba(220, 38, 38, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{isToggling ? "Memproses..." : "Tutup / Blokir Jalur Ini"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectEdge("")}
                title="Batalkan pilihan"
                style={{
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b", fontSize: "12.5px" }}>
            <Sparkles size={16} style={{ color: "#00a8bd" }} />
            <span>
              Pilih salah satu garis lorong di peta atau pada menu dropdown di bawah untuk melihat detail atau mengubah status akses jalurnya.
            </span>
          </div>
        )}
      </div>

      {/* LEGEND BAR */}
      <div
        style={{
          padding: "10px 20px",
          background: "#ffffff",
          borderTop: "1px solid #eef2f5",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <strong style={{ color: "#1e293b", fontSize: "12px" }}>Legenda Peta:</strong>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "16px", height: "3px", background: "#00c4cc", borderRadius: "2px" }} />
          Jalur Terbuka (A* Aktif)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "16px", height: "3px", background: "#ef4444", border: "1px dashed #ef4444", borderRadius: "2px" }} />
          Jalur Ditutup (Emergency Closed)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "16px", height: "4px", background: "#f59e0b", borderRadius: "2px" }} />
          Jalur Terpilih
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", background: "rgba(56, 189, 248, 0.3)", border: "1px solid #0284c7", borderRadius: "2px" }} />
          Blok Fasilitas / Tenant
        </span>
      </div>
    </div>
  );
}

