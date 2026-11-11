"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { AlertCircle, Check, CheckCircle2, Clock, Image as ImageIcon, Layers3, MapPin, Minus, Plus, RotateCcw, Save, XCircle } from "lucide-react";
import { MapStage } from "@/components/wayfinding/MapStage";
import { floors, spaces } from "@/data/demo-wayfinding";
import type { MapSpace, TerminalCode } from "@/types";
import { SceneModel, type SceneBounds, type SceneObjectRecord } from "@/components/map3d/SceneModel";
import type { SelectedObject } from "@/lib/map3d/object-metadata";
import { FLOOR_LABELS, type FloorId } from "@/lib/map3d/floors";
import { TERMINAL_MODEL_URL } from "@/lib/map3d/assets";
import {
  COMMERCIAL_CATEGORIES,
  defaultMapObjectConfig,
  fetchMapObjectConfigsFromDb,
  getMapObjectPhotoUrl,
  inferCommercialCategory,
  readMapObjectConfigs,
  saveMapObjectConfigToDb,
  writeMapObjectConfigs,
  type MapObjectConfig,
  type MapObjectConfigByName,
  type MapObjectDoorSide,
  type MapObjectOccupancy,
} from "@/lib/map3d/admin-object-config";

function LegacyAdminMapPanel() {
  const [terminal, setTerminal] = useState<TerminalCode>("T1");
  const [floorId, setFloorId] = useState("T1-L1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const terminalFloors = floors.filter((floor) => floor.terminal === terminal);
  const visibleSpaces = useMemo(
    () => spaces.filter((space) => space.floorId === floorId),
    [floorId]
  );
  const selected = spaces.find((space) => space.id === selectedId) ?? null;

  const selectTerminal = (nextTerminal: TerminalCode) => {
    setTerminal(nextTerminal);
    setFloorId(`${nextTerminal}-L1`);
    setSelectedId(null);
  };

  const selectSpace = (space: MapSpace) => {
    setSelectedId(space.id);
  };

  return (
    <div className="content-box admin-map-box">
      <div className="box-header admin-map-header">
        <div className="box-title">
          <h2>Peta Terminal Interaktif</h2>
          <p>Pantau ruang, tenant, dan fasilitas tanpa keluar dari portal admin.</p>
        </div>

        <div className="admin-map-selectors" aria-label="Pilih area peta">
          <div className="admin-map-selector-group" aria-label="Pilih terminal">
            {(["T1"] as TerminalCode[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={terminal === item}
                onClick={() => selectTerminal(item)}
              >
                Terminal {item.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-map-selector-group" aria-label="Pilih lantai">
            {terminalFloors.map((floor) => (
              <button
                key={floor.id}
                type="button"
                aria-pressed={floorId === floor.id}
                onClick={() => {
                  setFloorId(floor.id);
                  setSelectedId(null);
                }}
              >
                {floor.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-map-summary">
        <span><Layers3 size={15} /> {terminal} &bull; {floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</span>
        <strong>{visibleSpaces.length} lokasi ditampilkan</strong>
      </div>

      <div className="admin-map-canvas">
        <MapStage
          terminal={terminal}
          floorId={floorId}
          spaces={visibleSpaces}
          selectedId={selectedId}
          route={null}
          fromId={null}
          toId={null}
          currentId={null}
          onSelect={selectSpace}
        />
      </div>

      <div className="admin-map-selection" data-empty={!selected}>
        <span className="admin-map-selection-icon"><MapPin size={18} /></span>
        {selected ? (
          <div>
            <small>LOKASI TERPILIH</small>
            <strong>{selected.tenant?.name ?? selected.label}</strong>
            <span>{selected.code} &bull; {selected.category} &bull; {selected.status === "ACTIVE" ? "Aktif" : "Tidak aktif"}</span>
          </div>
        ) : (
          <div>
            <strong>Pilih lokasi pada peta</strong>
            <span>Klik area ruang atau ikon POI untuk melihat ringkasannya.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCamera({
  bounds,
  controlRef,
  focusTarget,
}: {
  bounds: SceneBounds | null;
  controlRef?: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    focusOn: (obj: THREE.Object3D) => void;
  } | null>;
  focusTarget?: THREE.Object3D | null;
}) {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const resetView = useCallback(() => {
    if (!bounds || !(camera instanceof THREE.PerspectiveCamera) || !controlsRef.current) return;
    const direction = new THREE.Vector3(0.72, 0.95, 0.72).normalize();
    camera.position.copy(bounds.center).add(direction.multiplyScalar(Math.max(bounds.radius * 1.35, 20)));
    controlsRef.current.target.copy(bounds.center);
    camera.lookAt(bounds.center);
    controlsRef.current.update();
    invalidate();
  }, [bounds, camera, invalidate]);

  const focusOn = useCallback(
    (targetObj: THREE.Object3D) => {
      if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;
      targetObj.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(targetObj);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 3);
      
      // Zoom distance close to the building (matches Image 2 perfectly)
      const zoomDistance = Math.min(Math.max(radius * 2.3, 15), 45);
      
      // Angled perspective from top-front-right looking down at the building
      const direction = new THREE.Vector3(0.65, 0.9, 0.65).normalize();

      camera.position.copy(center).add(direction.multiplyScalar(zoomDistance));
      controlsRef.current.target.copy(center);
      camera.lookAt(center);
      controlsRef.current.update();
      invalidate();
    },
    [camera, invalidate],
  );

  useEffect(() => {
    if (focusTarget) {
      focusOn(focusTarget);
    } else if (bounds) {
      resetView();
    }
  }, [bounds, focusTarget, focusOn, resetView]);

  const zoomBy = useCallback(
    (factor: number) => {
      if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;
      const target = controlsRef.current.target;
      const offset = camera.position.clone().sub(target);
      const minD = controlsRef.current.minDistance ?? 0.05;
      const maxD = controlsRef.current.maxDistance ?? 10000;
      const nextDistance = THREE.MathUtils.clamp(offset.length() * factor, minD, maxD);
      camera.position.copy(target).add(offset.normalize().multiplyScalar(nextDistance));
      controlsRef.current.update();
      invalidate();
    },
    [camera, invalidate],
  );

  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        zoomIn: () => zoomBy(0.65),
        zoomOut: () => zoomBy(1.45),
        reset: resetView,
        focusOn,
      };
    }
  }, [controlRef, zoomBy, resetView, focusOn]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      minDistance={0.05}
      maxDistance={10000}
      dampingFactor={0.12}
    />
  );
}

const OCCUPANCY_OPTIONS: Array<{ value: MapObjectOccupancy; label: string; help: string }> = [
  {
    value: "OCCUPIED",
    label: "Ditempati (Tenant Beroperasi)",
    help: "Kavling aktif beroperasi. Bangunan dan pintu tetap ada di 3D, lengkap dengan jam layanan dan profil tenant.",
  },
  {
    value: "VACANT",
    label: "Tidak Ditempati (Kavling Kosong)",
    help: "Kavling kosong / belum disewa. Bangunan dan pintu TETAP ADA di peta 3D, tanpa perlu input jam buka dan kontak.",
  },
  {
    value: "WALKABLE",
    label: "Dibuat Jalan (Bangunan / Kavling Hilang)",
    help: "Dibuat jalan: Bangunan dan kavling HILANG dari peta 3D agar menjadi koridor jalan yang dapat dilalui pejalan kaki.",
  },
  {
    value: "OBSTACLE",
    label: "Tembok / Pilar",
    help: "Bukan ruang komersial, melainkan struktur fisik dinding/pilar gedung yang menghalangi rute.",
  },
];

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="admin-object-field"><span>{label}</span>{children}</label>;
}

export function AdminMapPanel({ initialObjectName = null, focusNonce = 0 }: { initialObjectName?: string | null; focusNonce?: number }) {
  const cameraControlRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void; focusOn: (obj: THREE.Object3D) => void } | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const [objects, setObjects] = useState<SceneObjectRecord[]>([]);
  const [floorView, setFloorView] = useState<FloorId>("L1");
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [focusTarget, setFocusTarget] = useState<THREE.Object3D | null>(null);
  const [configs, setConfigs] = useState<MapObjectConfigByName>({});
  const [draft, setDraft] = useState<MapObjectConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Muat dari DB saat panel dibuka; fallback ke localStorage jika DB tidak tersedia
  useEffect(() => {
    fetchMapObjectConfigsFromDb()
      .then(setConfigs)
      .catch(() => setConfigs(readMapObjectConfigs()));
  }, []);
  const handleReady = useCallback((nextBounds: SceneBounds, nextObjects: SceneObjectRecord[]) => { setBounds(nextBounds); setObjects(nextObjects); }, []);
  const editableObjects = useMemo(
    () => objects.filter((record) => record.floor === floorView && (record.metadata.key === "visitor" || (record.selectable && /^(T1|TI)-GF-|^T1-FF-|^BAGGAGE|^DOOR__|^tembok[-_]pillar|^tembok_pilar_/i.test(record.name)))),
    [floorView, objects],
  );
  const selectRecord = useCallback((record: SceneObjectRecord) => {
    setSelected({ ...record.metadata, uuid: record.uuid, name: record.name, position: [0, 0, 0] });
    setDraft(configs[record.name] ?? defaultMapObjectConfig(record.name));
    setSaved(false);
    setFocusTarget(record.object);
  }, [configs]);
  const selectObject = useCallback((selection: SelectedObject) => {
    const record = objects.find((item) => item.uuid === selection.uuid);
    if (record?.selectable) {
      selectRecord(record);
      setFocusTarget(record.object);
      cameraControlRef.current?.focusOn(record.object);
    }
  }, [objects, selectRecord]);

  // Otomatis pilih dan zoom in ke objek saat navigasi dari direktori (misal: "Edit di peta")
  useEffect(() => {
    if (!initialObjectName || !objects.length) return;
    const q = initialObjectName.trim().toLowerCase();
    const match =
      objects.find((r) => r.name.toLowerCase() === q) ||
      objects.find((r) => configs[r.name]?.displayName?.trim().toLowerCase() === q) ||
      objects.find((r) => r.selectableLabel?.trim().toLowerCase() === q) ||
      objects.find((r) => r.name.toLowerCase().replace(/[-_]/g, "") === q.replace(/[-_]/g, "")) ||
      objects.find((r) => r.uuid === initialObjectName);

    if (!match) return;
    setFloorView(match.floor);
    selectRecord(match);
    setFocusTarget(match.object);
    cameraControlRef.current?.focusOn(match.object);
  }, [initialObjectName, focusNonce, objects, configs, selectRecord]);

  // Scroll otomatis pada list objek saat ada objek terpilih
  useEffect(() => {
    if (selected && selectedButtonRef.current) {
      selectedButtonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected?.uuid]);
  const updateDraft = <K extends keyof MapObjectConfig>(key: K, value: MapObjectConfig[K]) =>
    setDraft((current) => {
      if (!current) return current;
      if (key === "occupancy" && value === "VACANT") {
        return {
          ...current,
          occupancy: "VACANT",
          displayName: current.displayName && current.displayName !== "Area Jalan" ? current.displayName : "Kosong",
          category: "Kavling Kosong (Belum Disewa)",
          openTime: "",
          closeTime: "",
        };
      }
      if (key === "occupancy" && value === "WALKABLE") {
        return {
          ...current,
          occupancy: "WALKABLE",
          displayName: current.displayName && current.displayName !== "Kosong" ? current.displayName : "Area Jalan",
          category: "",
          openTime: "",
          closeTime: "",
        };
      }
      if (key === "occupancy" && value === "OCCUPIED") {
        return {
          ...current,
          occupancy: "OCCUPIED",
          displayName: current.displayName === "Kosong" || current.displayName === "Area Jalan" ? "" : current.displayName,
          category: current.category === "Kavling Kosong (Belum Disewa)" ? "" : current.category,
        };
      }
      return { ...current, [key]: value };
    });
  const updateDoor = (index: number, key: "side" | "open" | "position", value: string | boolean) => setDraft((current) => {
    if (!current) return current;
    const entryDoors = current.entryDoors.map((door, doorIndex) => {
      if (doorIndex !== index) return door;
      if (key === "side") return { ...door, side: value as MapObjectDoorSide };
      if (key === "open") return { ...door, open: Boolean(value) };
      return { ...door, position: Number(value) };
    });
    return { ...current, entryDoors };
  });
  const saveDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const resolvedCategory = draft.category?.trim() || inferCommercialCategory(draft.displayName, draft.objectName);
      const cleanDesc = (draft.description || "").replace(/^\[Kategori:[^\]]+\]\s*/i, "").trim();
      const updatedConfig: MapObjectConfig = {
        ...draft,
        category: resolvedCategory,
        description: resolvedCategory ? `[Kategori: ${resolvedCategory}] ${cleanDesc}`.trim() : cleanDesc,
      };
      await saveMapObjectConfigToDb(updatedConfig);
      const next = { ...configs, [draft.objectName]: { ...updatedConfig, updatedAt: new Date().toISOString() } };
      setConfigs(next);
      setDraft(next[draft.objectName]);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Gagal menyimpan ke database");
      // Fallback: simpan ke localStorage saja
      const resolvedCategory = draft.category?.trim() || inferCommercialCategory(draft.displayName, draft.objectName);
      const cleanDesc = (draft.description || "").replace(/^\[Kategori:[^\]]+\]\s*/i, "").trim();
      const updatedConfig: MapObjectConfig = {
        ...draft,
        category: resolvedCategory,
        description: resolvedCategory ? `[Kategori: ${resolvedCategory}] ${cleanDesc}`.trim() : cleanDesc,
      };
      const next = { ...configs, [draft.objectName]: { ...updatedConfig, updatedAt: new Date().toISOString() } };
      writeMapObjectConfigs(next);
      setConfigs(next);
      setDraft(next[draft.objectName]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-box admin-map-box admin-object-editor">
      <div className="box-header admin-map-header">
        <div className="box-title">
          <h2>Editor lokasi 3D Terminal 1</h2>
          <p>Pilih tenant, fasilitas, gate, area keberangkatan, atau struktur yang dapat dikonfigurasi pada kedua lantai.</p>
        </div>
        <div className="admin-map-summary">
          <span><Layers3 size={15} /> T1 &bull; {FLOOR_LABELS[floorView]}</span>
          <strong>{editableObjects.length} objek dapat diatur</strong>
        </div>
      </div>
      <div className="admin-map-selectors admin-3d-floor-selector" aria-label="Pilih lantai editor 3D">
        {(["L1", "L2"] as FloorId[]).map((floor) => (
          <button
            key={floor}
            type="button"
            aria-pressed={floorView === floor}
            onClick={() => { setFloorView(floor); setSelected(null); setDraft(null); setSaved(false); }}
          >
            {FLOOR_LABELS[floor]}
          </button>
        ))}
      </div>
      <div className="admin-map-canvas admin-3d-editor-canvas">
        <Canvas dpr={[1, 1.5]} camera={{ fov: 55, near: 0.01, far: 100000, position: [20, 20, 20] }}>
          <color attach="background" args={["#102d3d"]} />
          <ambientLight intensity={0.9} />
          <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#65747d" />
          <directionalLight position={[12, 24, 10]} intensity={1.7} />
          <Suspense fallback={null}>
            <SceneModel
              modelUrl={TERMINAL_MODEL_URL}
              floorView={floorView}
              showObjectLabels
              selectedUuid={selected?.uuid ?? null}
              onSelect={selectObject}
              onSelectFloor={(_, objectName) => {
                const record = objectName ? objects.find((item) => item.floor === floorView && item.name === objectName) : undefined;
                if (record) selectRecord(record);
              }}
              onReady={handleReady}
              objectConfigs={configs}
            />
          </Suspense>
          <AdminCamera bounds={bounds} controlRef={cameraControlRef} focusTarget={focusTarget} />
        </Canvas>
        <div className="admin-map-controls" aria-label="Kontrol zoom peta terminal">
          <button
            type="button"
            onClick={() => cameraControlRef.current?.zoomIn()}
            title="Zoom In (Perbesar hingga maksimal)"
            aria-label="Zoom in"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => cameraControlRef.current?.zoomOut()}
            title="Zoom Out (Perkecil hingga maksimal)"
            aria-label="Zoom out"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={() => cameraControlRef.current?.reset()}
            title="Reset Sudut & Posisi Kamera"
            aria-label="Reset kamera"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        {!bounds && <div className="admin-3d-loading">Memuat model gabungan Terminal 1...</div>}
      </div>

      <div className="admin-object-editor-layout">
        <aside className="admin-object-list">
          <div className="admin-object-list-header">
            <strong>Objek editable · {FLOOR_LABELS[floorView]}</strong>
            <span>{editableObjects.length}</span>
          </div>
          <div className="admin-object-list-scroll">
            {editableObjects.map((record) => (
              <button
                type="button"
                key={record.uuid}
                ref={record.uuid === selected?.uuid ? selectedButtonRef : undefined}
                className={record.uuid === selected?.uuid ? "is-selected" : ""}
                onClick={() => {
                  selectRecord(record);
                  setFocusTarget(record.object);
                  cameraControlRef.current?.focusOn(record.object);
                }}
              >
                <strong>{configs[record.name]?.displayName || record.selectableLabel || record.name}</strong>
                <small>
                  {record.name} &bull; {configs[record.name]?.occupancy === "WALKABLE" ? "Jalan" : configs[record.name]?.occupancy === "VACANT" ? "Kosong" : configs[record.name]?.occupancy === "OBSTACLE" ? "Obstacle" : record.metadata.category}
                </small>
              </button>
            ))}
            {!editableObjects.length && (
              <div className="admin-object-empty">
                <strong>Belum ada objek editable</strong>
                <span>Objek yang dapat dikonfigurasi akan muncul setelah model selesai dimuat.</span>
              </div>
            )}
          </div>
        </aside>

        <section className="admin-object-form">
          {!draft ? (
            <div className="admin-object-empty">
              <ImageIcon size={22} />
              <strong>Pilih objek dari model</strong>
              <span>Data tenant/fasilitas, jam aktif, foto, dan status rute akan muncul di sini.</span>
            </div>
          ) : (
            <>
              <div className="admin-object-form-heading">
                <div>
                  <small>OBJEK TERPILIH</small>
                  <h3>{draft.displayName.trim() || selected?.name}</h3>
                  {draft.displayName.trim() && (
                    <small style={{ color: "#7c93a0", display: "block", marginTop: "2px" }}>
                      Kode Blok: {selected?.name}
                    </small>
                  )}
                </div>
                <span className="admin-object-pill">
                  {draft.entityType === "TENANT" ? "Tenant" : "Fasilitas"}
                </span>
              </div>

              <div className="admin-object-form-grid">
                <EditorField label="Nama tampilan">
                  <input
                    value={draft.displayName}
                    onChange={(event) => updateDraft("displayName", event.target.value)}
                    placeholder="Contoh: Kopi Juanda"
                  />
                </EditorField>

                <EditorField label="Jenis data">
                  <select
                    value={draft.entityType}
                    onChange={(event) => updateDraft("entityType", event.target.value as MapObjectConfig["entityType"])}
                  >
                    <option value="TENANT">Tenant komersial</option>
                    <option value="FACILITY">Fasilitas / layanan</option>
                  </select>
                </EditorField>

                <EditorField label="Warna objek">
                  <span className="admin-object-color-field">
                    <input
                      type="color"
                      value={draft.color || "#D8C7A7"}
                      onChange={(event) => updateDraft("color", event.target.value)}
                    />
                    <input
                      value={draft.color}
                      onChange={(event) => updateDraft("color", event.target.value)}
                      placeholder="#D8C7A7"
                      pattern="^#[0-9a-fA-F]{6}$"
                    />
                  </span>
                </EditorField>

                {draft.entityType === "TENANT" && draft.occupancy === "OCCUPIED" && (
                  <EditorField label="Kategori gerai">
                    <select
                      value={draft.category || inferCommercialCategory(draft.displayName, selected?.name)}
                      onChange={(event) => updateDraft("category", event.target.value)}
                    >
                      {COMMERCIAL_CATEGORIES.map((cat) => (
                        <option value={cat} key={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                )}

                <EditorField label="Status bentuk lokasi">
                  <select
                    value={draft.occupancy}
                    onChange={(event) => updateDraft("occupancy", event.target.value as MapObjectOccupancy)}
                  >
                    {OCCUPANCY_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </EditorField>
                <div className="admin-object-occupancy-help">
                  {OCCUPANCY_OPTIONS.find((option) => option.value === draft.occupancy)?.help}
                </div>

                {/* Banner Informasi bila Kavling Tidak Ditempati (Kosong) */}
                {draft.occupancy === "VACANT" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "14px 16px",
                      background: "rgba(2, 132, 199, 0.08)",
                      border: "1px solid rgba(2, 132, 199, 0.22)",
                      borderRadius: "12px",
                      color: "#0c4a6e",
                      marginTop: "6px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🏬</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                        Kavling Tidak Ditempati (Unit Kosong)
                      </strong>
                      <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.5", color: "#334155" }}>
                        Kavling ini ditandai sebagai unit kosong / belum disewa. <strong>Bangunan dan pintu tetap terlihat pada peta 3D</strong>. Anda <strong>tidak perlu</strong> menginput jam operasional, foto, kontak, maupun media sosial. Unit ini otomatis terhitung sebagai <strong>kavling kosong</strong> pada analitik okupansi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Banner Informasi bila Dibuat Area Jalan (Bangunan Hilang) */}
                {draft.occupancy === "WALKABLE" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "14px 16px",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "12px",
                      color: "#065f46",
                      marginTop: "6px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🚶</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
                        Dibuat Area Jalan (Bangunan / Kavling Hilang)
                      </strong>
                      <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.5", color: "#334155" }}>
                        Blok kavling ini dihilangkan dari peta 3D agar menjadi area koridor jalan terbuka yang dapat dilewati oleh pejalan kaki dan rute navigasi bandara.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Operasional (hanya tersedia saat Ditempati) */}
                {draft.occupancy === "OCCUPIED" && (
                  <div className="admin-operational-panel">
                    <div className="admin-operational-heading">
                      <small>STATUS OPERASIONAL</small>
                      <strong>Jadwal & Ketersediaan Layanan</strong>
                    </div>

                    {/* Tombol Buka, Buka 24 Jam, Tutup */}
                    <div className="admin-status-toggle-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        className={`admin-status-btn open ${draft.openTime !== "CLOSED" && !((draft.openTime === "00:00" && (draft.closeTime === "23:59" || draft.closeTime === "24:00" || draft.closeTime === "00:00")) || draft.openTime === "24 Jam") ? "is-active" : ""}`}
                        onClick={() => {
                          updateDraft("openTime", draft.openTime && draft.openTime !== "CLOSED" && draft.openTime !== "00:00" ? draft.openTime : "08:00");
                          updateDraft("closeTime", draft.closeTime && draft.closeTime !== "CLOSED" && draft.closeTime !== "23:59" ? draft.closeTime : "22:00");
                        }}
                        style={{ minHeight: "38px", padding: "0 10px", fontSize: "12px" }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Buka</span>
                      </button>

                      <button
                        type="button"
                        className={`admin-status-btn open ${((draft.openTime === "00:00" && (draft.closeTime === "23:59" || draft.closeTime === "24:00" || draft.closeTime === "00:00")) || draft.openTime === "24 Jam") ? "is-active" : ""}`}
                        onClick={() => {
                          updateDraft("openTime", "00:00");
                          updateDraft("closeTime", "23:59");
                        }}
                        style={{ minHeight: "38px", padding: "0 10px", fontSize: "12px" }}
                      >
                        <Clock size={16} />
                        <span>Buka 24 Jam</span>
                      </button>

                      <button
                        type="button"
                        className={`admin-status-btn closed ${draft.openTime === "CLOSED" ? "is-active" : ""}`}
                        onClick={() => {
                          updateDraft("openTime", "CLOSED");
                          updateDraft("closeTime", "CLOSED");
                        }}
                        style={{ minHeight: "38px", padding: "0 10px", fontSize: "12px" }}
                      >
                        <XCircle size={16} />
                        <span>Tutup</span>
                      </button>
                    </div>

                    {/* Konfigurasi saat status BUKA jam tertentu */}
                    {draft.openTime !== "CLOSED" && !((draft.openTime === "00:00" && (draft.closeTime === "23:59" || draft.closeTime === "24:00" || draft.closeTime === "00:00")) || draft.openTime === "24 Jam") && (
                      <div className="admin-time-inputs-row">
                        <EditorField label="Jam buka">
                          <input
                            type="time"
                            value={draft.openTime === "CLOSED" ? "" : (draft.openTime || "08:00")}
                            onChange={(event) => updateDraft("openTime", event.target.value)}
                          />
                        </EditorField>
                        <EditorField label="Jam tutup">
                          <input
                            type="time"
                            value={draft.closeTime === "CLOSED" ? "" : (draft.closeTime || "22:00")}
                            onChange={(event) => updateDraft("closeTime", event.target.value)}
                          />
                        </EditorField>
                      </div>
                    )}

                    {/* Info saat status BUKA 24 JAM */}
                    {((draft.openTime === "00:00" && (draft.closeTime === "23:59" || draft.closeTime === "24:00" || draft.closeTime === "00:00")) || draft.openTime === "24 Jam") && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#008ca2", background: "#e0f7fa", padding: "6px 12px", borderRadius: "8px" }}>
                        <Clock size={14} />
                        <span>Buka nonstop 24 jam sehari.</span>
                      </div>
                    )}

                    {/* Peringatan jika status TUTUP */}
                    {draft.openTime === "CLOSED" && (
                      <div className="admin-closed-alert">
                        <AlertCircle size={16} />
                        <span>
                          Gerai ditandai <strong>Tutup Sementara</strong> (sedang renovasi atau di luar jam operasional).
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Pintu Masuk - tampil untuk yang Ditempati & Tidak Ditempati (hanya hilang jika dibuat Area Jalan) */}
                {draft.occupancy !== "WALKABLE" && (
                  <div className="admin-object-doors">
                    <div className="admin-object-doors-heading">
                      <strong>Pintu masuk (maksimal 4)</strong>
                      <span>
                        Rute hanya boleh masuk dari pintu yang terbuka. Posisi 0% dan 100% adalah kedua ujung sisi; 50% adalah titik tengah sisi.
                      </span>
                    </div>
                    {draft.entryDoors.map((door, index) => (
                      <div className="admin-object-door-row" key={`${draft.objectName}-door-${index}`}>
                        <strong>Pintu {index + 1}</strong>
                        <select
                          value={door.side}
                          onChange={(event) => updateDoor(index, "side", event.target.value as MapObjectDoorSide)}
                        >
                          <option value="NORTH">Utara</option>
                          <option value="EAST">Timur</option>
                          <option value="SOUTH">Selatan</option>
                          <option value="WEST">Barat</option>
                        </select>
                        <label>
                          <input
                            type="checkbox"
                            checked={door.open}
                            onChange={(event) => updateDoor(index, "open", event.target.checked)}
                          />{" "}
                          Buka
                        </label>
                        <label className="admin-object-door-position">
                          Posisi{" "}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={door.position}
                            aria-label={`Posisi pintu ${index + 1}`}
                            onChange={(event) => updateDoor(index, "position", event.target.value)}
                          />
                          <span>{door.position}%</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <EditorField label="Deskripsi / detail">
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(event) => updateDraft("description", event.target.value)}
                    placeholder="Layanan, akses, dan informasi penting."
                  />
                </EditorField>

                {draft.occupancy === "OCCUPIED" && (
                  <>
                    <EditorField label="Foto tampak depan (URL)">
                      <input
                        type="url"
                        value={draft.photoUrl}
                        onChange={(event) => updateDraft("photoUrl", event.target.value)}
                        placeholder="URL gambar langsung atau link Google Drive"
                      />
                      <small className="admin-object-field-help">
                        Untuk Google Drive, ubah akses file menjadi &quot;Anyone with the link / Siapa saja yang memiliki link dapat melihat&quot;.
                      </small>
                    </EditorField>

                    <EditorField label="Website / sosial media">
                      <input
                        type="url"
                        value={draft.websiteUrl}
                        onChange={(event) => updateDraft("websiteUrl", event.target.value)}
                        placeholder="https://..."
                      />
                    </EditorField>

                    <EditorField label="Instagram / link lain">
                      <input
                        type="url"
                        value={draft.instagramUrl}
                        onChange={(event) => updateDraft("instagramUrl", event.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </EditorField>

                    <EditorField label="Kontak">
                      <input
                        value={draft.contact}
                        onChange={(event) => updateDraft("contact", event.target.value)}
                        placeholder="Telepon / email"
                      />
                    </EditorField>

                    <EditorField label="Masa aktif mulai">
                      <input
                        type="date"
                        value={draft.activeFrom}
                        onChange={(event) => updateDraft("activeFrom", event.target.value)}
                      />
                    </EditorField>

                    <EditorField label="Masa aktif sampai">
                      <input
                        type="date"
                        value={draft.activeUntil}
                        onChange={(event) => updateDraft("activeUntil", event.target.value)}
                      />
                    </EditorField>
                  </>
                )}
              </div>

              {/* Review Foto Tampak Depan di atas tombol Simpan Konfigurasi (hanya saat Ditempati) */}
              {draft.occupancy === "OCCUPIED" && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1.5px solid #cbd5e1",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "750",
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <ImageIcon size={16} style={{ color: "#00a8bd" }} />
                    Review Foto Tampak Depan
                  </span>
                  {draft.photoUrl?.trim() && (
                    <a
                      href={draft.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "11.5px",
                        fontWeight: "700",
                        color: "#0284c7",
                        textDecoration: "underline",
                      }}
                    >
                      Buka Link Foto ↗
                    </a>
                  )}
                </div>

                {draft.photoUrl?.trim() ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: "180px",
                      maxHeight: "260px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <img
                      src={getMapObjectPhotoUrl(draft.photoUrl)}
                      alt={`Foto tampak depan ${draft.displayName || draft.objectName}`}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: "260px",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = "true";
                          const match = draft.photoUrl.match(/\/(?:file\/)?d\/([^/]+)/i);
                          const id = match?.[1] || (draft.photoUrl.includes("id=") ? new URL(draft.photoUrl).searchParams.get("id") : null);
                          if (id) {
                            target.src = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
                            return;
                          }
                        }
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div style="color: #94a3b8; font-size: 12px; text-align: center; padding: 20px; line-height: 1.5;">Preview foto gagal dimuat.<br /><span style="font-size: 11px; color: #cbd5e1;">Jika menggunakan Google Drive, pastikan izin file disetel ke <b>\"Siapa saja yang memiliki link dapat melihat\"</b> (Akses Publik).</span></div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "20px 14px",
                      borderRadius: "10px",
                      border: "1px dashed #cbd5e1",
                      background: "#ffffff",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                      lineHeight: "1.5",
                    }}
                  >
                    Belum ada URL foto tampak depan.<br />
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Masukkan link foto di kolom <b>Foto tampak depan (URL)</b> di atas untuk melihat preview.
                    </span>
                  </div>
                )}
              </div>
              )}

              {/* Tombol Simpan Konfigurasi - Full Besar & Hijau */}
              <div className="admin-object-form-actions" style={{ width: "100%", marginTop: "24px" }}>
                <button
                  type="button"
                  className="admin-save-button-full"
                  onClick={saveDraft}
                  disabled={saving}
                  style={{
                    width: "100%",
                    minHeight: "52px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "14px 24px",
                    borderRadius: "14px",
                    border: "none",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: saving ? "wait" : "pointer",
                    boxShadow: "0 6px 20px rgba(22, 163, 74, 0.4)",
                    transition: "all 0.18s ease",
                  }}
                >
                  <Save size={20} />
                  <span>{saving ? "Menyimpan konfigurasi..." : "Simpan konfigurasi"}</span>
                </button>
                {saved && !saveError && (
                  <span
                    className="admin-object-saved"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "#16a34a",
                      fontSize: "14px",
                      fontWeight: "750",
                      marginTop: "10px",
                    }}
                  >
                    <Check size={18} /> Tersimpan ke database
                  </span>
                )}
                {saveError && (
                  <span
                    className="admin-object-saved"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "#dc2626",
                      fontSize: "14px",
                      fontWeight: "750",
                      marginTop: "10px",
                    }}
                  >
                    {saveError} (tersimpan lokal)
                  </span>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
