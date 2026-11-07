"use client";

import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ArrowLeft,
  ArrowUpDown,
  Bath,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Crosshair,
  Globe,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Layers,
  LoaderCircle,
  LocateFixed,
  LocateOff,
  MapPin,
  Menu,
  Minus,
  Moon,
  MousePointer2,
  Navigation,
  Pause,
  Plane,
  PlaneTakeoff,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trees,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import * as THREE from "three";
import { PassengerRoadmap } from "./PassengerRoadmap";
import { FloorSwitcher } from "./FloorSwitcher";
import { ExteriorScene } from "./ExteriorScene";
import { ApronAircraft } from "./ApronAircraft";
import { findAircraftStands } from "@/lib/map3d/aircraft";
import { FLOOR_LABELS, FLOOR_ORDER, floorViewLabel, type FloorId, type FloorView } from "@/lib/map3d/floors";
import { TERMINAL_MODEL_URL } from "@/lib/map3d/assets";
import {
  SceneModel,
  getSelectableLabel,
  type SceneBounds,
  type SceneObjectRecord,
} from "@/components/map3d/SceneModel";
import { GridRouteLayer } from "@/components/map3d/GridRouteLayer";
import { RoutePlaybackController } from "@/components/map3d/RoutePlaybackController";
import {
  createPlaybackSnapshot,
  createRouteMetrics,
  type RouteWorldPoint,
  type RoutePlaybackSnapshot,
  projectPointOntoRouteSegments,
} from "@/lib/map3d/route-guidance";
import { createRouteSteps } from "@/lib/map3d/route-steps";
import {
  createSelectedObject,
  type SelectedObject,
} from "@/lib/map3d/object-metadata";
import { getMapOrbitLimits } from "@/lib/map3d/map-camera";
import { isMapModelLoading } from "@/lib/map3d/loading-state";
import {
  createFloorNavigation,
  findFloorRoute,
  floorAtHeight,
  placeElevation,
  snapPlace,
  type FloorNavigation,
  type FloorRoute,
  type FloorTransition,
  type RoutePlace,
} from "@/lib/map3d/multi-floor-route";
import { defaultMapObjectConfig, fetchMapObjectConfigsFromDb, getMapObjectPhotoUrl, readMapObjectConfigs, type MapObjectConfig } from "@/lib/map3d/admin-object-config";
import { geographicToT1Model, isUsableT1Position, T1_GEO_CALIBRATION } from "@/lib/map3d/passenger-geolocation";
import { usePassengerGeolocation } from "@/hooks/usePassengerGeolocation";
import { useMapStore } from "@/store/mapStore";

type ViewerApi = {
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusObject: (object: THREE.Object3D) => void;
  focusPoint: (point: THREE.Vector3) => void;
  focusRoute: (points: THREE.Vector3[]) => void;
  visitorPov: (point: THREE.Vector3, direction: THREE.Vector3) => void;
};

type CameraMode = "map" | "pov";

const mapCopy = {
  ID: {
    loading: "MEMUAT MODEL LANTAI", directions: "Petunjuk arah", from: "Dari", to: "Ke", chooseStart: "Pilih titik awal", chooseDestination: "Pilih tujuan", searchStart: "Cari titik awal", searchDestination: "Cari tujuan", clearSearch: "Hapus pencarian", noResults: "Tidak ditemukan. Coba nama tenant, kode building, atau nomor gate.", routeHint: "Rute terdekat menghindari tembok dan pilar, melalui bukaan pintu yang ada pada model.", chooseStartHint: "Titik awal berada di area jalan terdekat. Pilih tujuan.", selectStartHint: "Pilih posisi awal terlebih dahulu.", noSafeRoute: "Tidak ditemukan jalur aman pada lantai ini. Coba titik awal atau tujuan lain.", noFloorRoute: "Tidak ditemukan jalur lewat eskalator atau tangga menuju lantai tujuan.", stepTitle: "Langkah perjalanan", previous: "Sebelumnya", next: "Berikutnya", mapView: "Lihat peta", simulation: "Mulai simulasi 3D", continueSimulation: "Lanjutkan simulasi 3D", pause: "Jeda", resume: "Lanjutkan", center: "Pusatkan", estimate: "Perkiraan", minutes: "menit", arrive: "Tiba di tujuan", straight: "Jalan lurus", left: "Belok kiri", right: "Belok kanan", floorDirection: "Ikuti papan petunjuk ke lantai tujuan", operationalHours: "Jam operasional", open24: "Buka 24 jam", activePeriod: "Masa aktif", now: "Sekarang", unspecified: "Tidak ditentukan", facility: "FASILITAS BANDARA", tenant: "TENANT KOMERSIAL", frontPhoto: "Tampak depan", resetRoute: "Hapus rute", showMap: "Tampilkan seluruh peta", zoomIn: "Perbesar peta", zoomOut: "Perkecil peta", hideExterior: "Sembunyikan area luar gedung", showExterior: "Tampilkan area luar gedung", compass: "Arah mata angin pada model peta", locating: "Mengalibrasi GPS Akurasi 1.0...", locationActive: "Lokasi Anda Aktif (Akurasi 1.0)", locationDenied: "Izin lokasi diblokir", locationUnavailable: "Lokasi hanya tersedia melalui HTTPS atau localhost", locationTimeout: "GPS belum merespons", locationOutside: "Anda belum terdeteksi di sekitar Terminal 1", locationInaccurate: "Akurasi GPS belum cukup", retryLocation: "Coba lagi", yourLocation: "Lokasi Anda (GPS)", locationFloorNote: "GPS tidak dapat mendeteksi lantai. Koreksi bila perlu." },
  EN: {
    loading: "LOADING FLOOR MODEL", directions: "Directions", from: "From", to: "To", chooseStart: "Choose starting point", chooseDestination: "Choose destination", searchStart: "Search starting point", searchDestination: "Search destination", clearSearch: "Clear search", noResults: "No results. Try a tenant name, building code, or gate number.", routeHint: "The shortest route avoids walls and pillars through the model's available doorways.", chooseStartHint: "Your start is on the nearest walkway. Choose a destination.", selectStartHint: "Choose a starting point first.", noSafeRoute: "No safe route was found on this floor. Try another start or destination.", noFloorRoute: "No route via an escalator or staircase was found to the destination floor.", stepTitle: "Walking steps", previous: "Previous", next: "Next", mapView: "View map", simulation: "Start 3D simulation", continueSimulation: "Continue 3D simulation", pause: "Pause", resume: "Resume", center: "Recenter", estimate: "Estimated", minutes: "min", arrive: "Arrive at destination", straight: "Walk straight", left: "Turn left", right: "Turn right", floorDirection: "Follow signs to the destination floor", operationalHours: "Operating hours", open24: "Open 24 hours", activePeriod: "Active period", now: "Now", unspecified: "Not specified", facility: "AIRPORT FACILITY", tenant: "COMMERCIAL TENANT", frontPhoto: "Front view", resetRoute: "Clear route", showMap: "Show full map", zoomIn: "Zoom in", zoomOut: "Zoom out", hideExterior: "Hide exterior area", showExterior: "Show exterior area", compass: "Map compass", locating: "Calibrating GPS Accuracy 1.0...", locationActive: "Live location active (Accuracy 1.0)", locationDenied: "Location permission is blocked", locationUnavailable: "Location requires HTTPS or localhost", locationTimeout: "GPS has not responded", locationOutside: "You are not detected near Terminal 1", locationInaccurate: "GPS accuracy is not sufficient yet", retryLocation: "Try again", yourLocation: "Your location (GPS)", locationFloorNote: "GPS cannot detect floors. Correct it if needed." },
} as const;
const CameraController = forwardRef<
  ViewerApi,
  { bounds: SceneBounds | null; viewMode: CameraMode; onHeadingChange: (heading: number) => void }
>(function CameraController({ bounds, viewMode, onHeadingChange }, ref) {
    const { camera, invalidate, size: viewportSize } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const lastHeadingRef = useRef(Number.NaN);

    const updateHeading = useCallback(() => {
      const direction = camera.getWorldDirection(new THREE.Vector3());
      direction.y = 0;
      if (direction.lengthSq() < 0.0001) return;
      direction.normalize();
      // Three.js looks down -Z. Convert the camera heading to the CSS angle
      // needed to keep the world north marker pointing to true north.
      const heading = THREE.MathUtils.radToDeg(Math.atan2(direction.x, -direction.z));
      if (!Number.isFinite(lastHeadingRef.current) || Math.abs(heading - lastHeadingRef.current) > 0.35) {
        lastHeadingRef.current = heading;
        onHeadingChange(-heading);
      }
    }, [camera, onHeadingChange]);

    // Event ini dipanggil langsung oleh OrbitControls saat gesture/mouse
    // mengubah kamera, sehingga kompas tidak menunggu siklus useFrame.
    useFrame(updateHeading);

    const getFitDistance = useCallback(
      (box: THREE.Box3, viewDirection: THREE.Vector3, margin: number) => {
        if (!(camera instanceof THREE.PerspectiveCamera)) return 1;
        const center = box.getCenter(new THREE.Vector3());
        const direction = viewDirection.clone().normalize();
        const forward = direction.clone().multiplyScalar(-1);
        const right = forward.clone().cross(camera.up).normalize();
        const viewUp = right.clone().cross(forward).normalize();
        const tanVertical = Math.tan(
          THREE.MathUtils.degToRad(camera.fov * 0.5),
        );
        const aspect = viewportSize.width / Math.max(viewportSize.height, 1);
        const tanHorizontal = tanVertical * aspect;
        let requiredDistance = 0;

        for (const x of [box.min.x, box.max.x]) {
          for (const y of [box.min.y, box.max.y]) {
            for (const z of [box.min.z, box.max.z]) {
              const relative = new THREE.Vector3(x, y, z).sub(center);
              const outwardDepth = relative.dot(direction);
              const horizontal = Math.abs(relative.dot(right));
              const vertical = Math.abs(relative.dot(viewUp));
              requiredDistance = Math.max(
                requiredDistance,
                outwardDepth + horizontal / tanHorizontal,
                outwardDepth + vertical / tanVertical,
              );
            }
          }
        }
        return Math.max(requiredDistance * margin, 0.01);
      },
      [camera, viewportSize.height, viewportSize.width],
    );

    const fitView = useCallback(() => {
      if (
        !bounds ||
        !(camera instanceof THREE.PerspectiveCamera) ||
        !controlsRef.current
      ) {
        return;
      }
      const direction = new THREE.Vector3(0, 1, 0.55).normalize();
      const distance = getFitDistance(bounds.box, direction, 1.1);
      camera.position.copy(bounds.center).add(direction.multiplyScalar(distance));
      controlsRef.current.target.copy(bounds.center);
      controlsRef.current.minDistance = Math.max(bounds.radius * 0.015, 0.01);
      controlsRef.current.maxDistance = Math.max(bounds.radius * 12, 100);
      controlsRef.current.update();
      invalidate();
    }, [bounds, camera, getFitDistance, invalidate]);

    const zoomBy = useCallback(
      (factor: number) => {
        if (!controlsRef.current) return;
        const target = controlsRef.current.target;
        const offset = camera.position.clone().sub(target);
        const nextDistance = THREE.MathUtils.clamp(
          offset.length() * factor,
          controlsRef.current.minDistance,
          controlsRef.current.maxDistance,
        );
        camera.position
          .copy(target)
          .add(offset.normalize().multiplyScalar(nextDistance));
        controlsRef.current.update();
        invalidate();
      },
      [camera, invalidate],
    );

    const focusObject = useCallback(
      (object: THREE.Object3D) => {
        if (
          !controlsRef.current ||
          !(camera instanceof THREE.PerspectiveCamera)
        ) {
          return;
        }
        object.updateWorldMatrix(true, false);
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const direction = camera.position
          .clone()
          .sub(controlsRef.current.target)
          .normalize();
        const minFocusDistance = bounds ? bounds.radius * 0.025 : 1;
        const distance = Math.max(
          getFitDistance(box, direction, 1.5),
          minFocusDistance,
        );
        controlsRef.current.target.copy(center);
        camera.position.copy(center).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, getFitDistance, invalidate],
    );

    const focusPoint = useCallback(
      (point: THREE.Vector3) => {
        if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) {
          return;
        }
        const direction = new THREE.Vector3(0, 1, 0.62).normalize();
        const distance = Math.max(bounds ? bounds.radius * 0.1 : 12, 8);
        controlsRef.current.target.copy(point);
        camera.position.copy(point).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, invalidate],
    );

    const focusRoute = useCallback(
      (points: THREE.Vector3[]) => {
        if (
          !points.length ||
          !controlsRef.current ||
          !(camera instanceof THREE.PerspectiveCamera)
        ) {
          return;
        }
        const box = new THREE.Box3().setFromPoints(points);
        box.expandByVector(new THREE.Vector3(2, 2.5, 2));
        const center = box.getCenter(new THREE.Vector3());
        const direction = new THREE.Vector3(0, 1, 0.68).normalize();
        const minimumDistance = bounds ? bounds.radius * 0.04 : 8;
        const distance = Math.max(
          getFitDistance(box, direction, 1.28),
          minimumDistance,
        );
        controlsRef.current.target.copy(center);
        camera.position.copy(center).add(direction.multiplyScalar(distance));
        controlsRef.current.update();
        invalidate();
      },
      [bounds, camera, getFitDistance, invalidate],
    );

    const visitorPov = useCallback(
      (point: THREE.Vector3, direction: THREE.Vector3) => {
        if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) {
          return;
        }
        const forward = direction.clone();
        forward.y = 0;
        if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
        forward.normalize();
        const eye = point.clone();
        eye.y = Math.max(point.y + 1.53, 1.65);
        const target = eye.clone().add(forward.multiplyScalar(8));
        camera.position.copy(eye);
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
        camera.lookAt(target);
        invalidate();
      },
      [camera, invalidate],
    );

    useEffect(() => {
      fitView();
    }, [fitView]);

    useImperativeHandle(
      ref,
      () => ({
        resetView: fitView,
        zoomIn: () => zoomBy(0.78),
        zoomOut: () => zoomBy(1.28),
        focusObject,
        focusPoint,
        focusRoute,
        visitorPov,
      }),
      [fitView, focusObject, focusPoint, focusRoute, visitorPov, zoomBy],
    );

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        {...getMapOrbitLimits()}
        enabled={viewMode === "map"}
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableRotate
        enableZoom
        panSpeed={1.15}
        rotateSpeed={0.5}
        zoomSpeed={0.9}
        onChange={updateHeading}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          // Dua jari: putar peta sekaligus tetap mendukung pinch-to-zoom.
          // Klik kanan mouse tetap menjadi kontrol rotasi desktop.
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
      />
    );
  },
);

function LoadingOverlay({ modelReady, lang }: { modelReady: boolean; lang: "ID" | "EN" }) {
  const { progress } = useProgress();
  if (!isMapModelLoading(modelReady)) return null;
  return (
    <div className="loading-overlay" aria-live="polite">
      <div className="loader-mark">
        <Box size={22} strokeWidth={1.6} />
      </div>
      <div className="loader-copy">
        <span>{mapCopy[lang].loading}</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="loader-track">
        <div style={{ width: progress + "%" }} />
      </div>
    </div>
  );
}

/** Objek yang menjadi tujuan rute: kotak pembatasnya pada bidang XZ. */
function recordRect(record: SceneObjectRecord) {
  record.object.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(record.object);
  return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
}

function recordCenter(record: SceneObjectRecord): RoutePlace {
  const rect = recordRect(record);
  return { floor: record.floor, point: [(rect.minX + rect.maxX) / 2, (rect.minZ + rect.maxZ) / 2] };
}

const DEPARTURE_ENTRANCE = /^DOOR__Keberangkatan_/i;

/**
 * A departure area has one designated passenger access door. Keep this
 * mapping explicit so route planning cannot silently pick a different door
 * just because it happens to be closer in the 3D model.
 */
const DEPARTURE_ENTRANCE_BY_AREA: Record<number, RegExp> = {
  1: /^DOOR__Keberangkatan_1A(?:_\d+)?$/i,
  2: /^DOOR__Keberangkatan_1A(?:_\d+)?$/i,
  3: /^DOOR__Keberangkatan_1B(?:_\d+)?$/i,
  4: /^DOOR__Keberangkatan_1C(?:_\d+)?$/i,
};

const GATE_OBJECT = /^T1-FF-GATE-(\d+)$/i;

/** Nama pintu masuk untuk ditampilkan: `DOOR__Keberangkatan_1A_4` → `Pintu Keberangkatan 1A`. */
function entranceLabel(name: string) {
  return `Pintu ${name.replace(DEPARTURE_ENTRANCE, "Keberangkatan ").replace(/_\d+$/, "")}`;
}

function closestEntrance(
  objects: SceneObjectRecord[],
  record: SceneObjectRecord,
  allowedDoor: RegExp = DEPARTURE_ENTRANCE,
) {
  const target = recordCenter(record).point;
  let best: { record: SceneObjectRecord; distance: number } | null = null;
  for (const entrance of objects) {
    if (!allowedDoor.test(entrance.name)) continue;
    const [x, z] = recordCenter(entrance).point;
    const distance = Math.hypot(x - target[0], z - target[1]);
    if (!best || distance < best.distance) best = { record: entrance, distance };
  }
  return best?.record ?? null;
}

function joinRoutes(first: FloorRoute, second: FloorRoute): FloorRoute {
  const pointOffset = Math.max(0, first.points.length - 1);
  return {
    points: [...first.points, ...second.points.slice(1)],
    pointFloors: [...first.pointFloors, ...second.pointFloors.slice(1)],
    transitions: [
      ...first.transitions,
      ...second.transitions.map((transition) => ({ ...transition, index: transition.index + pointOffset })),
    ],
    length: first.length + second.length,
  };
}

function requiredDepartureForRecord(record: SceneObjectRecord) {
  const label = record.selectableLabel ?? "";
  const departureMatch = /^Departure\s+(\d+)$/i.exec(label);
  if (departureMatch) return Number(departureMatch[1]);
  // Pilar pembatas di sisi Departure 1 termasuk akses zona Departure 1.
  if (/tembok[-_ ]?pillar[-_ ]?6/i.test(`${record.name} ${label}`)) return 1;
  return null;
}

function nearestRouteDistance(metrics: { points: THREE.Vector3[]; cumulativeDistances: number[] }, position: RouteWorldPoint) {
  const point = new THREE.Vector3(...position);
  let bestDistance = 0;
  let bestSquared = Number.POSITIVE_INFINITY;
  for (let index = 0; index < metrics.points.length - 1; index += 1) {
    const start = metrics.points[index];
    const end = metrics.points[index + 1];
    const segment = end.clone().sub(start);
    const lengthSquared = segment.lengthSq();
    const ratio = lengthSquared > 0
      ? THREE.MathUtils.clamp(point.clone().sub(start).dot(segment) / lengthSquared, 0, 1)
      : 0;
    const projected = start.clone().addScaledVector(segment, ratio);
    const squared = projected.distanceToSquared(point);
    if (squared < bestSquared) {
      bestSquared = squared;
      bestDistance = metrics.cumulativeDistances[index] + Math.sqrt(lengthSquared) * ratio;
    }
  }
  return bestDistance;
}

export function AirportWayfinding() {
  const viewerApi = useRef<ViewerApi>(null);
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const [objects, setObjects] = useState<SceneObjectRecord[]>([]);
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [mapObjectConfigs, setMapObjectConfigs] = useState<Record<string, MapObjectConfig>>({});
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("q")?.trim() ?? "",
  );
  const [searchFocused, setSearchFocused] = useState(() =>
    typeof window !== "undefined" && Boolean(new URLSearchParams(window.location.search).get("q")?.trim()),
  );
  const [navigation, setNavigation] = useState<FloorNavigation | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<RoutePlace | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<RoutePlace | null>(null);
  const [startName, setStartName] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [routeWorldPoints, setRouteWorldPoints] = useState<RouteWorldPoint[]>([]);
  const [routeTransitions, setRouteTransitions] = useState<FloorTransition[]>([]);
  const [routePointFloors, setRoutePointFloors] = useState<FloorId[]>([]);
  const [routeMessage, setRouteMessage] = useState<string>(mapCopy.ID.selectStartHint);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectingStart, setSelectingStart] = useState(false);
  const [viewMode, setViewMode] = useState<CameraMode>("map");
  const [routePaused, setRoutePaused] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [livePosition, setLivePosition] = useState<RouteWorldPoint | null>(null);
  const liveReadingTimestamp = useRef<number | null>(null);
  const [routeProgress, setRouteProgress] =
    useState<RoutePlaybackSnapshot | null>(null);
  const [routeRestartToken, setRouteRestartToken] = useState(0);
  const [routeRecenterToken, setRouteRecenterToken] = useState(0);
  const [floorView, setFloorView] = useState<FloorView>("ALL");
  const [showExterior, setShowExterior] = useState(true);
  const [exteriorAttribution, setExteriorAttribution] = useState<string | null>(null);
  const [compassRotation, setCompassRotation] = useState(0);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const [passengerFloor, setPassengerFloor] = useState<FloorId>("L1");
  const [automaticLocation, setAutomaticLocation] = useState(true);
  const [locationMapped, setLocationMapped] = useState(false);
  const locationFocusDone = useRef(false);
  const passengerLocation = usePassengerGeolocation(automaticLocation);
  const refreshPassengerLocation = useCallback(() => {
    locationFocusDone.current = false;
    setAutomaticLocation(true);
    setLocationMapped(false);
    passengerLocation.refresh();
  }, [passengerLocation.refresh]);
  const togglePassengerLocation = useCallback(() => {
    if (automaticLocation || locationMapped) {
      locationFocusDone.current = false;
      setAutomaticLocation(false);
      setLocationMapped(false);
      setLiveTracking(false);
      setLivePosition(null);
      return;
    }
    refreshPassengerLocation();
  }, [automaticLocation, locationMapped, refreshPassengerLocation]);
  const touchStartY = useRef<number | null>(null);

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -28) {
      setMobileSheetExpanded(true);
    } else if (deltaY > 28) {
      setMobileSheetExpanded(false);
    }
  }, []);

  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const lang = useMapStore((state) => state.lang);
  const setLang = useMapStore((state) => state.setLang);
  const copy = mapCopy[lang];
  useEffect(() => {
    // Muat dari DB terlebih dahulu, kemudian listen event localStorage
    // dari tab admin untuk sinkronisasi real-time
    fetchMapObjectConfigsFromDb()
      .then(setMapObjectConfigs)
      .catch(() => setMapObjectConfigs(readMapObjectConfigs()));

    const sync = () => setMapObjectConfigs(readMapObjectConfigs());
    window.addEventListener("storage", sync);
    window.addEventListener("todjuanda-map-config-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("todjuanda-map-config-change", sync);
    };
  }, []);
  const selectedLocationConfig = useMemo(
    () => selected ? mapObjectConfigs[selected.name] ?? defaultMapObjectConfig(selected.name) : null,
    [mapObjectConfigs, selected],
  );
  const handleReady = useCallback(
    (nextBounds: SceneBounds, nextObjects: SceneObjectRecord[]) => {
      setBounds(nextBounds);
      setObjects(nextObjects);
      try {
        setNavigation(createFloorNavigation(nextObjects));
        setGridError(null);
      } catch (error) {
        setNavigation(null);
        setGridError(error instanceof Error ? error.message : "Area jalan dari model GLB tidak dapat diproses.");
      }
    },
    [],
  );

  const modelFloors = useMemo(
    () => FLOOR_ORDER.filter((floor) => objects.some((record) => record.floor === floor)),
    [objects],
  );
  const multiFloor = modelFloors.length > 1;

  const selectableBuildings = useMemo(
    () => objects.filter((record) => record.selectable),
    [objects],
  );

  const gateRecords = useMemo(() => {
    const gates = new Map<number, SceneObjectRecord>();
    for (const record of objects) {
      const match = GATE_OBJECT.exec(record.name);
      if (match) gates.set(Number(match[1]), record);
    }
    return gates;
  }, [objects]);
  const gateNumbers = useMemo(() => [...gateRecords.keys()].sort((left, right) => left - right), [gateRecords]);

  const routeMetrics = useMemo(
    () => createRouteMetrics(routeWorldPoints),
    [routeWorldPoints],
  );
  const routeSessionActive = Boolean(routeMetrics);
  useEffect(() => {
    if (!startPoint && !routeSessionActive) setRouteMessage(copy.selectStartHint);
  }, [copy.selectStartHint, routeSessionActive, startPoint]);
  const routeSteps = useMemo(
    () => routeMetrics
      ? createRouteSteps(routeMetrics, routeTransitions.map((transition) => ({
        index: transition.index,
        direction: FLOOR_ORDER.indexOf(transition.to) > FLOOR_ORDER.indexOf(transition.from) ? "up" : "down",
        label: transition.label,
      })))
      : [],
    [routeMetrics, routeTransitions],
  );
  const activeStep = routeSteps[activeStepIndex] ?? null;
  useEffect(() => {
    if (!routeProgress || !routeMetrics || routeSteps.length === 0) return;
    if (routeProgress.progress >= 1) {
      setActiveStepIndex(routeSteps.length - 1);
      return;
    }
    const nextStepIndex = routeSteps.findIndex((step) => {
      if (step.kind === "arrive") return false;
      return routeProgress.distance < routeMetrics.cumulativeDistances[step.endIndex];
    });
    if (nextStepIndex >= 0) setActiveStepIndex(nextStepIndex);
  }, [routeMetrics, routeProgress, routeSteps]);
  const visibleRouteProgress = useMemo(
    () =>
      routeProgress ??
      (routeMetrics ? createPlaybackSnapshot(routeMetrics, 0) : null),
    [routeMetrics, routeProgress],
  );

  const usableLocationReading = useMemo(
    () => passengerLocation.reading && isUsableT1Position(
      passengerLocation.reading,
      passengerLocation.reading.accuracy,
    ) ? passengerLocation.reading : null,
    [passengerLocation.reading],
  );

  // Browser GPS memberi posisi horizontal. Titik itu diproyeksikan ke model
  // yang sama dengan area luar, lalu di-snap ke koridor terdekat agar langsung
  // bisa dipakai sebagai origin rute.
  useEffect(() => {
    if (!automaticLocation || !navigation || !usableLocationReading) return;
    // Kunci titik awal setelah satu pembacaan yang lolos kalibrasi. GPS indoor
    // dapat bergeser beberapa puluh meter; pembacaan baru hanya dipakai setelah
    // penumpang menekan tombol pusatkan/perbarui lokasi secara eksplisit.
    if (locationFocusDone.current) return;
    const [x, z] = geographicToT1Model(usableLocationReading);
    const snapped = snapPlace(navigation, { floor: passengerFloor, point: [x, z] });
    if (!snapped) return;

    const frame = window.requestAnimationFrame(() => {
      setStartPoint(snapped);
      setStartName(copy.yourLocation);
      setLocationMapped(true);
      setSelectingStart(false);
      if (!routeSessionActive) setRouteMessage(copy.chooseStartHint);
      if (!locationFocusDone.current) {
        locationFocusDone.current = true;
        setFloorView(multiFloor ? passengerFloor : "L1");
        viewerApi.current?.focusPoint(new THREE.Vector3(
          snapped.point[0],
          placeElevation(navigation, snapped),
          snapped.point[1],
        ));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [automaticLocation, copy.chooseStartHint, copy.yourLocation, multiFloor, navigation, passengerFloor, routeSessionActive, usableLocationReading]);

  // Mode navigasi aktif: ikuti GPS yang sudah dirata-ratakan dan tempelkan
  // marker ke koridor terdekat. Perubahan kurang dari 3 m diabaikan agar
  // marker tidak bergetar karena noise GPS.
  useEffect(() => {
    if (!liveTracking || !navigation || !usableLocationReading) return;
    if (liveReadingTimestamp.current === usableLocationReading.timestamp) return;
    liveReadingTimestamp.current = usableLocationReading.timestamp;
    const [x, z] = geographicToT1Model(usableLocationReading);
    // Akurasi 1.0: Jika rute aktif, proyeksikan GPS tepat ke garis rute (Route Snapping)
    if (routeWorldPoints.length >= 2) {
      const snappedToRoute = projectPointOntoRouteSegments(
        routeWorldPoints,
        [x, 0, z],
        livePosition ? livePosition[1] : undefined,
      );
      if (snappedToRoute) {
        const targetPoint = snappedToRoute.projected;
        if (livePosition) {
          const distance = Math.hypot(targetPoint[0] - livePosition[0], targetPoint[2] - livePosition[2]);
          if (distance < 0.25) return;
          const smoothing = Math.min(0.85, Math.max(0.4, distance / 12));
          const nextX = livePosition[0] + (targetPoint[0] - livePosition[0]) * smoothing;
          const nextZ = livePosition[2] + (targetPoint[2] - livePosition[2]) * smoothing;
          const reprojected = projectPointOntoRouteSegments(routeWorldPoints, [nextX, targetPoint[1], nextZ], targetPoint[1]);
          const finalPoint = reprojected ? reprojected.projected : targetPoint;
          setLivePosition(finalPoint);
          if (routeMetrics) {
            const currentDist = reprojected ? reprojected.distanceFromStart : snappedToRoute.distanceFromStart;
            setRouteProgress(createPlaybackSnapshot(routeMetrics, currentDist));
          }
        } else {
          setLivePosition(targetPoint);
          if (routeMetrics) {
            setRouteProgress(createPlaybackSnapshot(routeMetrics, snappedToRoute.distanceFromStart));
          }
        }
        return;
      }
    }

    const snapped = snapPlace(navigation, { floor: passengerFloor, point: [x, z] });
    if (!snapped) return;
    const next: RouteWorldPoint = [snapped.point[0], placeElevation(navigation, snapped), snapped.point[1]];
    if (livePosition) {
      const distance = Math.hypot(next[0] - livePosition[0], next[2] - livePosition[2]);
      if (distance < 1.5) return;
      // Interpolasi sebagian membuat perpindahan marker terasa kontinu,
      // sementara filter GPS tetap menolak perubahan mikro.
      const smoothing = Math.min(0.72, Math.max(0.38, distance / 18));
      setLivePosition([
        livePosition[0] + (next[0] - livePosition[0]) * smoothing,
        next[1],
        livePosition[2] + (next[2] - livePosition[2]) * smoothing,
      ]);
    } else {
      setLivePosition(next);
    }
    setStartPoint(snapped);
    setStartName(copy.yourLocation);
  }, [copy.yourLocation, livePosition, liveTracking, navigation, passengerFloor, routeMetrics, routeWorldPoints, usableLocationReading]);

  // Saat simulasi berjalan dengan satu lantai terpilih, peta mengikuti lantai
  // tempat pengunjung berada tanpa mengubah pilihan pengguna.
  const playbackFloor = viewMode === "pov" && routeProgress && navigation ? floorAtHeight(navigation, routeProgress.position[1]) : null;
  const shownFloorView: FloorView = playbackFloor && floorView !== "ALL" ? playbackFloor : floorView;
  const highlightedPoints = useMemo(
    () => activeStep
      ? routeWorldPoints.slice(activeStep.startIndex, activeStep.kind === "arrive" ? activeStep.startIndex + 1 : activeStep.endIndex + 1)
      : [],
    [activeStep, routeWorldPoints],
  );

  const clearRoute = useCallback(() => {
    setRouteWorldPoints([]);
    setRouteTransitions([]);
    setRoutePointFloors([]);
    setDestinationPoint(null);
    setDestinationName(null);
    setActiveStepIndex(0);
    setRouteProgress(null);
    setRoutePaused(false);
  }, []);

  const commitStartPoint = useCallback(
    (place: RoutePlace, name: string) => {
      if (!navigation) return;
      const snapped = snapPlace(navigation, place);
      if (!snapped) {
        setRouteMessage(copy.selectStartHint);
        return;
      }
      setStartPoint(snapped);
      setStartName(name);
      setAutomaticLocation(false);
      setLocationMapped(false);
      clearRoute();
      setRouteMessage(copy.chooseStartHint);
      setSelectingStart(false);
      setViewMode("map");
      // Setelah titik awal dipilih, tujuan boleh diklik di lantai mana pun.
      // Jangan menyembunyikan L2 ketika titik awal berada di L1 karena itu
      // membuat mesh tujuan L2 tidak menerima raycast sama sekali.
      setFloorView((view) => multiFloor ? "ALL" : (view === "ALL" || view === snapped.floor ? view : snapped.floor));
      viewerApi.current?.focusPoint(new THREE.Vector3(snapped.point[0], placeElevation(navigation, snapped), snapped.point[1]));
    },
    [clearRoute, lang, multiFloor, navigation],
  );

  const chooseEntryPoint = useCallback(
    (point: THREE.Vector3, objectName: string, side: "NORTH" | "EAST" | "SOUTH" | "WEST") => {
      if (!navigation) return;
      const displayName = mapObjectConfigs[objectName]?.displayName?.trim();
      commitStartPoint({ floor: floorAtHeight(navigation, point.y), point: [point.x, point.z] }, `${displayName || objectName} · Pintu ${side}`);
    },
    [commitStartPoint, navigation],
  );

  const setBuildingAsStart = useCallback(
    (record: SceneObjectRecord) => {
      setSelected(createSelectedObject(record.object));
      const displayName = mapObjectConfigs[record.name]?.displayName?.trim();
      commitStartPoint(recordCenter(record), displayName || record.selectableLabel || record.name);
    },
    [commitStartPoint],
  );

  const handleManualStartPoint = useCallback(
    (point: THREE.Vector3, objectName?: string) => {
      if (!navigation) return;
      // Klik pada tenant/fasilitas harus memakai pusat objek dan metadata
      // lantainya. Raycast pada dinding atau atap dapat menghasilkan Y yang
      // bukan ketinggian lantai, sehingga floorAtHeight(point.y) sebelumnya
      // bisa memilih lantai yang salah dan membuat titik tampak melenceng.
      const record = objectName
        ? objects.find((item) => item.name === objectName && item.selectable)
        : undefined;
      if (record) {
        setBuildingAsStart(record);
        return;
      }
      commitStartPoint(
        { floor: floorAtHeight(navigation, point.y), point: [point.x, point.z] },
        "Posisi pada peta",
      );
    },
    [commitStartPoint, navigation, objects, passengerFloor, setBuildingAsStart],
  );

  /**
   * Hitung rute dari `start` ke sebuah objek, di lantai yang sama atau lewat
   * eskalator/tangga. Dipakai oleh pencarian, klik peta, dan panduan penumpang.
   */
  const planRoute = useCallback(
    (start: RoutePlace, record: SceneObjectRecord) => {
      if (!navigation) return false;
      const objectConfig = mapObjectConfigs[record.name] ?? defaultMapObjectConfig(record.name);
      const target = {
        floor: record.floor,
        rect: recordRect(record),
        entryDoors: objectConfig.entryDoors,
      };
      const departure = requiredDepartureForRecord(record);
      const requiredEntrance = departure && DEPARTURE_ENTRANCE_BY_AREA[departure]
        ? closestEntrance(objects, record, DEPARTURE_ENTRANCE_BY_AREA[departure])
        : null;

      // Departure 1/2/3/4 masing-masing memiliki pintu akses wajib. Jika
      // pengguna sudah memilih titik awal sendiri, rute tetap harus melewati
      // pintu yang ditentukan, bukan langsung menuju sisi terdekat bangunan.
      let route = findFloorRoute(navigation, start, target);
      if (requiredEntrance) {
        const entrancePlace = recordCenter(requiredEntrance);
        const toEntrance = findFloorRoute(navigation, start, {
          floor: requiredEntrance.floor,
          rect: recordRect(requiredEntrance),
        });
        const entrancePoint = toEntrance?.points.at(-1);
        const entranceStart = entrancePoint
          ? snapPlace(navigation, { floor: requiredEntrance.floor, point: [entrancePoint[0], entrancePoint[2]] })
          : snapPlace(navigation, entrancePlace);
        const fromEntrance = entranceStart ? findFloorRoute(navigation, entranceStart, target) : null;
        route = toEntrance && fromEntrance ? joinRoutes(toEntrance, fromEntrance) : null;
      }
      const label = objectConfig.displayName?.trim() || record.selectableLabel || record.name;
      setRouteProgress(null);
      setRoutePaused(false);
      setActiveStepIndex(0);
      setMobileSheetExpanded(false);
      setViewMode("map");
      if (!route) {
        setRouteWorldPoints([]);
        setRouteTransitions([]);
        setRoutePointFloors([]);
        setDestinationPoint(null);
        setDestinationName(label);
        setRouteMessage(start.floor === record.floor ? copy.noSafeRoute : copy.noFloorRoute);
        return false;
      }

      const end = route.points.at(-1);
      setRouteWorldPoints(route.points);
      setRouteTransitions(route.transitions);
      setRoutePointFloors(route.pointFloors);
      setDestinationPoint(end ? { floor: record.floor, point: [end[0], end[2]] } : null);
      setDestinationName(label);
      setRouteMessage(route.transitions.length
        ? `${lang === "ID" ? "Rute melewati" : "Route via"} ${route.transitions.map((transition) => transition.label.toLocaleLowerCase(lang === "ID" ? "id-ID" : "en-US")).join(", ")}.`
        : copy.routeHint);
      setSelected(createSelectedObject(record.object));
      setDirectionsOpen(true);
      // Mulai dari lantai titik awal. Lantai lain disembunyikan agar rute tidak
      // tertutup pelat lantai di atasnya.
      if (multiFloor) setFloorView(start.floor);
      return true;
    },
    [copy.noFloorRoute, copy.noSafeRoute, copy.routeHint, lang, mapObjectConfigs, multiFloor, navigation, objects],
  );

  const calculateRoute = useCallback(
    (record: SceneObjectRecord) => {
      if (!startPoint || !navigation) {
        setRouteMessage(copy.selectStartHint);
        return;
      }
      planRoute(startPoint, record);
    },
    [copy.selectStartHint, navigation, planRoute, startPoint],
  );

  /** Pintu masuk keberangkatan terdekat ke sebuah objek, sebagai titik awal penumpang. */
  const nearestEntrance = useCallback(
    (record: SceneObjectRecord) => {
      const target = recordCenter(record).point;
      let best: { record: SceneObjectRecord; distance: number } | null = null;
      for (const entrance of objects) {
        if (!DEPARTURE_ENTRANCE.test(entrance.name)) continue;
        const [x, z] = recordCenter(entrance).point;
        const distance = Math.hypot(x - target[0], z - target[1]);
        if (!best || distance < best.distance) best = { record: entrance, distance };
      }
      return best?.record ?? null;
    },
    [objects],
  );

  const entranceForDeparture = useCallback(
    (record: SceneObjectRecord, departure: number) => {
      const allowedDoor = DEPARTURE_ENTRANCE_BY_AREA[departure];
      if (!allowedDoor) return null;

      const target = recordCenter(record).point;
      let best: { record: SceneObjectRecord; distance: number } | null = null;
      for (const entrance of objects) {
        if (!allowedDoor.test(entrance.name)) continue;
        const [x, z] = recordCenter(entrance).point;
        const distance = Math.hypot(x - target[0], z - target[1]);
        if (!best || distance < best.distance) best = { record: entrance, distance };
      }
      return best?.record ?? null;
    },
    [objects],
  );

  const startPassengerRoute = useCallback(
    (from: SceneObjectRecord, fromName: string, to: SceneObjectRecord) => {
      if (!navigation) return;
      const start = snapPlace(navigation, recordCenter(from));
      if (!start) {
        setRouteMessage(`${lang === "ID" ? "Tidak ada area jalan di dekat" : "No walkway near"} ${fromName}.`);
        return;
      }
      setSelectingStart(false);
      setQuery("");
      setStartPoint(start);
      setStartName(fromName);
      planRoute(start, to);
    },
    [lang, navigation, planRoute],
  );

  const routeToDeparture = useCallback(
    (departure: number) => {
      const target = objects.find((record) => record.selectableLabel === `Departure ${departure}`);
      if (!target) {
        setRouteMessage(`${lang === "ID" ? "Area Departure" : "Departure area"} ${departure} ${lang === "ID" ? "belum ditandai pada peta." : "is not marked on the map."}`);
        return;
      }
      const entrance = entranceForDeparture(target, departure);
      if (!entrance) {
        const door = departure <= 2 ? "1A" : departure === 3 ? "1B" : "1C";
        setRouteMessage(lang === "ID" ? `Pintu Keberangkatan ${door} belum ditandai pada peta.` : `Departure door ${door} is not marked on the map yet.`);
        return;
      }
      startPassengerRoute(entrance, entranceLabel(entrance.name), target);
    },
    [entranceForDeparture, lang, objects, startPassengerRoute],
  );

  const routeToGate = useCallback(
    (gate: number, departure: number | null) => {
      const target = gateRecords.get(gate);
      if (!target) {
        setRouteMessage(lang === "ID" ? `Gate ${gate} tidak ada pada peta Lantai 2.` : `Gate ${gate} is not available on the second-floor map.`);
        return;
      }
      const checkIn = departure === null ? null : objects.find((record) => record.selectableLabel === `Departure ${departure}`);
      if (checkIn) {
        startPassengerRoute(checkIn, `Departure ${departure}`, target);
        return;
      }
      if (startPoint) {
        planRoute(startPoint, target);
        return;
      }
      const entrance = nearestEntrance(target);
      if (entrance) startPassengerRoute(entrance, entranceLabel(entrance.name), target);
    },
    [gateRecords, nearestEntrance, objects, planRoute, startPassengerRoute, startPoint],
  );

  const handleSelect = useCallback(
    (selection: SelectedObject) => {
      const record = objects.find((item) => item.uuid === selection.uuid);
      if (selectingStart && record) {
        setSelected(selection);
        const config = mapObjectConfigs[record.name] ?? defaultMapObjectConfig(record.name);
        const openDoors = config.entryDoors.filter((door) => door.open);
        if (openDoors.length > 0) {
          setRouteMessage(lang === "ID" ? "Pilih pintu masuk bangunan berdasarkan arah mata angin." : "Choose an open building entrance by compass direction.");
        } else {
          setBuildingAsStart(record);
        }
        return;
      }
      if (!record) return;
      if (startPoint) calculateRoute(record);
      else setBuildingAsStart(record);
    },
    [calculateRoute, lang, mapObjectConfigs, objects, selectingStart, setBuildingAsStart, startPoint],
  );

  const CATEGORIES = useMemo(
    () => [
      { id: "toilet", label: "Toilet", icon: Bath, query: "toilet" },
      { id: "komersial", label: lang === "EN" ? "Commercial" : "Komersial", icon: ShoppingBag, query: "komersial" },
      { id: "gate", label: "Gate", icon: Plane, query: "gate" },
      { id: "departure", label: "Departure", icon: PlaneTakeoff, query: "departure" },
      { id: "musholla", label: "Musholla", icon: Moon, query: "musholla" },
      { id: "atm", label: "ATM", icon: Landmark, query: "atm" },
    ],
    [lang],
  );

  const handleCategoryClick = useCallback(
    (catId: string, catQuery: string) => {
      if (activeCategory === catId) {
        setActiveCategory(null);
        setQuery("");
        setSearchFocused(false);
      } else {
        setActiveCategory(catId);
        setQuery(catQuery);
        setSearchFocused(true);
      }
    },
    [activeCategory],
  );

  const searchResults = useMemo(() => {
    const rawQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!rawQuery) return [];

    let matchKeywords = [rawQuery];
    if (rawQuery === "komersial") matchKeywords = ["komersial", "toko", "resto", "restoran", "kafe", "cafe", "store", "shop", "tenant", "building", "kios"];
    if (rawQuery === "musholla" || rawQuery === "musala") matchKeywords = ["musholla", "musala", "mushola", "sholat", "prayer", "ibadah"];
    if (rawQuery === "departure") matchKeywords = ["departure", "keberangkatan", "pintu", "check-in"];
    if (rawQuery === "toilet") matchKeywords = ["toilet", "wc", "restroom", "lavatory"];
    if (rawQuery === "atm") matchKeywords = ["atm", "bank", "mandiri", "bca", "bri", "bni"];
    if (rawQuery === "gate") matchKeywords = ["gate", "boarding"];

    return selectableBuildings
      .filter((item) => {
        const displayName = (mapObjectConfigs[item.name]?.displayName ?? "").toLocaleLowerCase("id-ID");
        const cat = (item.metadata?.category ?? "").toLocaleLowerCase("id-ID");
        const name = item.name.toLocaleLowerCase("id-ID");
        const label = (item.selectableLabel ?? getSelectableLabel(item.name) ?? "").toLocaleLowerCase("id-ID");
        const haystack = `${name} ${label} ${displayName} ${cat}`;

        return matchKeywords.some((kw) => haystack.includes(kw));
      })
      .slice(0, 10);
  }, [mapObjectConfigs, query, selectableBuildings]);

  const chooseSearchResult = (record: SceneObjectRecord) => {
    if (selectingStart) {
      setQuery("");
      setSearchFocused(false);
      setBuildingAsStart(record);
      setDirectionsOpen(true);
      return;
    }
    if (startPoint) {
      calculateRoute(record);
      setDirectionsOpen(true);
    } else {
      setSelected(createSelectedObject(record.object));
      if (multiFloor) setFloorView(record.floor);
      viewerApi.current?.focusObject(record.object);
    }
    setQuery("");
    setSearchFocused(false);
  };

  const swapOriginDestination = useCallback(() => {
    if (!destinationName) return;
    const destRecord = objects.find(
      (r) =>
        r.name === destinationName ||
        r.selectableLabel === destinationName ||
        mapObjectConfigs[r.name]?.displayName === destinationName,
    );
    const startRecord = startName
      ? objects.find(
          (r) =>
            r.name === startName ||
            r.selectableLabel === startName ||
            mapObjectConfigs[r.name]?.displayName === startName,
        )
      : null;
    if (destRecord) {
      setBuildingAsStart(destRecord);
      if (startRecord) {
        calculateRoute(startRecord);
      } else {
        setDestinationPoint(null);
        setDestinationName(null);
        clearRoute();
      }
    }
  }, [calculateRoute, clearRoute, destinationName, mapObjectConfigs, objects, setBuildingAsStart, startName]);

  const beginStartSelection = useCallback(() => {
    setQuery("");
    setSelectingStart(true);
    // Klik manual harus menjadi sumber lokasi tunggal agar pembacaan GPS
    // yang datang bersamaan tidak mengganti titik yang dipilih pengguna.
    setAutomaticLocation(false);
    setLocationMapped(false);
    setViewMode("map");
    clearRoute();
    setRouteMessage(multiFloor
      ? (lang === "EN" ? "Click a floor area or building to choose your starting point. Use the floor buttons to switch floors." : "Klik area lantai atau building pada peta untuk memilih titik awal. Pilih lantai lewat tombol lantai.")
      : (lang === "EN" ? "Click a floor area or building to choose your starting point." : "Klik area lantai atau building pada peta untuk memilih titik awal."));
  }, [clearRoute, lang, multiFloor]);

  const showMapView = useCallback(() => {
    setViewMode("map");
    window.requestAnimationFrame(() => {
      if (routeMetrics) {
        viewerApi.current?.focusRoute(routeMetrics.points);
      } else {
        viewerApi.current?.resetView();
      }
    });
  }, [routeMetrics]);

  const selectRouteStep = useCallback((index: number) => {
    if (!routeMetrics || index < 0 || index >= routeSteps.length) return;
    setActiveStepIndex(index);
    setViewMode("map");
    const step = routeSteps[index];
    // Langkah naik/turun memperlihatkan kedua lantai; langkah lain hanya lantainya.
    const stepFloor = routePointFloors[step.startIndex];
    if (multiFloor) setFloorView(step.kind === "up" || step.kind === "down" ? "ALL" : stepFloor ?? "ALL");
    const focusIndex = Math.round((step.startIndex + step.endIndex) / 2);
    window.requestAnimationFrame(() => {
      viewerApi.current?.focusPoint(routeMetrics.points[focusIndex]);
    });
  }, [multiFloor, routeMetrics, routePointFloors, routeSteps]);

  useEffect(() => {
    if (!routeMetrics) return;
    const frame = window.requestAnimationFrame(() => viewerApi.current?.focusRoute(routeMetrics.points));
    return () => window.cancelAnimationFrame(frame);
  }, [routeMetrics]);

  const startWorldPoint: RouteWorldPoint | null = startPoint && navigation
    ? [startPoint.point[0], placeElevation(navigation, startPoint), startPoint.point[1]]
    : null;
  const destinationWorldPoint: RouteWorldPoint | null = destinationPoint && navigation
    ? [destinationPoint.point[0], placeElevation(navigation, destinationPoint), destinationPoint.point[1]]
    : null;

  const aircraftStands = useMemo(() => findAircraftStands(objects), [objects]);

  const toggleRoutePause = useCallback(() => {
    setRoutePaused((value) => !value);
  }, []);

  const toggleLiveTracking = useCallback(() => {
    setLiveTracking((active) => {
      if (active) {
        setLivePosition(null);
        liveReadingTimestamp.current = null;
        return false;
      }
      setAutomaticLocation(true);
      // Akurasi 1.0: Titik navigasi awal di-kunci persis di titik awal garis rute
      const initialPoint = routeWorldPoints.length > 0 ? routeWorldPoints[0] : startWorldPoint;
      setLivePosition(initialPoint);
      if (routeMetrics && routeWorldPoints.length > 0) {
        setRouteProgress(createPlaybackSnapshot(routeMetrics, 0));
      }
      return true;
    });
  }, [routeMetrics, routeWorldPoints, startWorldPoint]);

  const recenterActiveRoute = useCallback(() => {
    if (!routeSessionActive) return;
    setViewMode("pov");
    setRouteRecenterToken((value) => value + 1);
  }, [routeSessionActive]);

  const restartActiveRoute = useCallback(() => {
    if (!routeMetrics) return;
    setRoutePaused(false);
    setRouteProgress(createPlaybackSnapshot(routeMetrics, 0));
    setViewMode("pov");
    setRouteRestartToken((value) => value + 1);
  }, [routeMetrics]);

  const startOrResumeRoute = useCallback(() => {
    if (!routeMetrics) return;
    // Hanya rute yang sudah selesai yang boleh diulang dari awal. Selama
    // masih berjalan, kamera dan controller mempertahankan jarak tempuhnya.
    if (!routeProgress || routeProgress.progress >= 1) {
      restartActiveRoute();
      return;
    }
    setRoutePaused(false);
    setViewMode("pov");
    setRouteRecenterToken((value) => value + 1);
  }, [restartActiveRoute, routeMetrics, routeProgress]);

  const handlePlaybackComplete = useCallback(() => {
    setRoutePaused(true);
  }, []);


  const resetRoute = useCallback(() => {
    setLiveTracking(false);
    setLivePosition(null);
    if (!automaticLocation) {
      setStartPoint(null);
      setStartName(null);
    }
    clearRoute();
    setRouteMessage(copy.selectStartHint);
    setSelected(null);
    setQuery("");
    setSelectingStart(false);
    setDirectionsOpen(false);
    setViewMode("map");
  }, [automaticLocation, clearRoute, copy.selectStartHint]);

  // Kedua lantai ada dalam satu model, jadi berpindah lantai tidak memuat
  // ulang apa pun dan rute yang sedang aktif tetap ada.
  const changeFloor = useCallback((view: FloorView) => setFloorView(view), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (
        event.key.toLocaleLowerCase("id-ID") === "r" &&
        !(event.target instanceof HTMLInputElement)
      ) {
        showMapView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMapView]);

  useEffect(() => {
    if (!routeMetrics) return;
    const routeBounds = new THREE.Box3().setFromPoints(routeMetrics.points);
    const routeReport = {
      pointCount: routeMetrics.points.length,
      totalDistance: routeMetrics.totalDistance,
      first: routeMetrics.points[0]?.toArray(),
      last: routeMetrics.points.at(-1)?.toArray(),
      floors: [...new Set(routePointFloors)],
      bounds: {
        min: routeBounds.min.toArray(),
        max: routeBounds.max.toArray(),
      },
    };
    console.info("[Terminal 1 geometry route audit]", routeReport);
    (
      window as Window & { __TERMINAL_ACTIVE_ROUTE_AUDIT__?: unknown }
    ).__TERMINAL_ACTIVE_ROUTE_AUDIT__ = routeReport;
  }, [routeMetrics, routePointFloors]);

  const routeFloorsText = routeTransitions.length
    ? [routeTransitions[0].from, ...routeTransitions.map((transition) => transition.to)].map((floor) => FLOOR_LABELS[floor]).join(" → ")
    : routePointFloors[0] ? FLOOR_LABELS[routePointFloors[0]] : "";
  const traveledRouteDistance = useMemo(() => {
    if (!routeMetrics) return 0;
    const simulatedDistance = routeProgress?.distance ?? 0;
    const gpsDistance = liveTracking && livePosition
      ? nearestRouteDistance(routeMetrics, livePosition)
      : 0;
    return Math.min(routeMetrics.totalDistance, Math.max(simulatedDistance, gpsDistance));
  }, [livePosition, liveTracking, routeMetrics, routeProgress]);
  const remainingRouteDistance = routeMetrics
    ? Math.max(0, routeMetrics.totalDistance - traveledRouteDistance)
    : 0;
  const remainingRouteMinutes = remainingRouteDistance > 0
    ? Math.ceil(remainingRouteDistance / 1.35 / 60)
    : 0;
  const searchPlaceholderExample = multiFloor ? "T1-GF-01, Gate 5" : "T1-GF-...";

  return (
    <main
      className="viewer-shell"
      data-view-mode={viewMode}
      data-floor-view={shownFloorView}
      data-start-location={startName ?? ""}
      data-destination-location={destinationName ?? ""}
      data-route-active={routeSessionActive ? "true" : "false"}
      data-route-paused={routePaused ? "true" : "false"}
      data-has-selected={Boolean(selected)}
    >
      <PassengerRoadmap
        routeReady={Boolean(navigation)}
        gates={gateNumbers}
        onRouteToDeparture={routeToDeparture}
        onRouteToGate={routeToGate}
      />
      <div className="canvas-stage">
        <Canvas
          dpr={[1, 1.75]}
          frameloop="demand"
          camera={{ fov: 70, near: 0.01, far: 100000, position: [0, 10, 10] }}
          gl={{
            antialias: true,
            alpha: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1;
          }}
        >
          <ambientLight intensity={0.72} color="#FFFFFF" />
          <hemisphereLight
            intensity={1.05}
            color="#FFFFFF"
            groundColor="#8B949B"
          />
          <directionalLight
            position={[12, 20, 10]}
            intensity={1.85}
            color="#FFFDF7"
          />
          <directionalLight
            position={[-10, 8, -12]}
            intensity={0.52}
            color="#D9E8FF"
          />
          <Suspense fallback={null}>
            <SceneModel
              modelUrl={TERMINAL_MODEL_URL}
              floorView={shownFloorView}
              showObjectLabels
              selectedUuid={selected?.uuid ?? null}
              onSelect={handleSelect}
              onSelectPoint={selectingStart && navigation ? handleManualStartPoint : undefined}
              onSelectEntryPoint={chooseEntryPoint}
              onReady={handleReady}
            />
            {/* Lingkungan luar menempel di tanah, jadi tidak ditampilkan saat hanya Lantai 2 yang terlihat. */}
            {bounds && shownFloorView !== "L2" && (
              <ExteriorScene baseY={bounds.box.min.y} visible={showExterior} onAttribution={setExteriorAttribution} />
            )}
            {bounds && showExterior && <ApronAircraft stands={aircraftStands} groundY={bounds.box.min.y} />}
            <GridRouteLayer
              points={routeWorldPoints}
              highlightedPoints={highlightedPoints}
              start={startWorldPoint}
              destination={destinationWorldPoint}
              visitorPosition={liveTracking ? livePosition : (visibleRouteProgress?.position ?? null)}
              startLabel={automaticLocation && locationMapped
                ? (lang === "ID" ? "LOKASI ANDA" : "YOUR LOCATION")
                : (lang === "ID" ? "TITIK AWAL" : "START")}
            />
          </Suspense>
          <CameraController
            ref={viewerApi}
            bounds={bounds}
            viewMode={viewMode}
            onHeadingChange={setCompassRotation}
          />
          <RoutePlaybackController
            metrics={routeMetrics}
            active={routeSessionActive}
            paused={routePaused}
            viewMode={viewMode}
            restartToken={routeRestartToken}
            recenterToken={routeRecenterToken}
            onProgress={setRouteProgress}
            onComplete={handlePlaybackComplete}
          />
        </Canvas>
      </div>

      <LoadingOverlay modelReady={bounds !== null} lang={lang} />
      <FloorSwitcher view={shownFloorView} floors={modelFloors.length ? modelFloors : ["L1"]} onSelect={changeFloor} />

      {/* Google Maps Floating Search Bar & Category Chips */}
      <div className="gmaps-top-container">
        <div className="gmaps-searchbox-wrapper">
          <div className="gmaps-searchbox">
            <button
              type="button"
              className="gmaps-icon-btn gmaps-menu-btn"
              onClick={() => setMenuDrawerOpen(true)}
              aria-label={lang === "EN" ? "Open menu" : "Buka menu navigasi"}
              title={lang === "EN" ? "Menu" : "Menu"}
            >
              <Menu size={20} />
            </button>
            <div className="gmaps-brand-pill" title="ToDjuanda Smart Airport Navigation">
              <img
                src="/Logo-ToDjuanda/Logo.png"
                alt="Logo ToDjuanda"
                className="gmaps-brand-logo-img"
              />
              <span className="gmaps-brand-title">ToDjuanda</span>
            </div>
            <input
              type="text"
              className="gmaps-search-input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              placeholder={lang === "EN" ? "Search Terminal 1 (Toilet, gate, shop...)" : "Cari di Terminal 1 (Toilet, gate, komersial...)"}
              aria-label={lang === "EN" ? "Search map" : "Cari peta"}
            />
            {query && (
              <button
                type="button"
                className="gmaps-icon-btn gmaps-clear-btn"
                onClick={() => {
                  setQuery("");
                  setActiveCategory(null);
                }}
                aria-label={lang === "EN" ? "Clear" : "Hapus"}
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              className="gmaps-icon-btn gmaps-search-btn"
              onClick={() => setSearchFocused(true)}
              aria-label={lang === "EN" ? "Search" : "Cari"}
            >
              <Search size={19} />
            </button>
            <div className="gmaps-search-divider" />
            <button
              type="button"
              className={`gmaps-directions-trigger ${directionsOpen ? "is-active" : ""}`}
              onClick={() => {
                setDirectionsOpen((prev) => !prev);
                if (!startPoint) beginStartSelection();
              }}
              title={lang === "EN" ? "Directions" : "Petunjuk arah"}
              aria-label={lang === "EN" ? "Directions" : "Petunjuk arah"}
            >
              <Navigation size={17} />
            </button>
          </div>

          {/* Banner Rute Aktif Saat Panel Directions Ditutup (Bisa Dibuka Lagi Kapan Saja) */}
          {routeSessionActive && !directionsOpen && (
            <button
              type="button"
              className="gmaps-active-route-pill"
              onClick={() => setDirectionsOpen(true)}
              title={lang === "EN" ? "Open directions panel" : "Buka kembali petunjuk arah"}
            >
              <span className="gmaps-pulse-dot" />
              <span className="gmaps-active-route-text">
                Rute ke <strong>{destinationName}</strong> · {remainingRouteMinutes} mnt ({Math.round(remainingRouteDistance)} m)
              </span>
              <span className="gmaps-active-route-badge">{lang === "EN" ? "Directions →" : "Petunjuk →"}</span>
            </button>
          )}

          {/* Search Results Dropdown */}
          {searchFocused && query && (
            <div className="gmaps-search-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((record) => {
                  const displayName = mapObjectConfigs[record.name]?.displayName?.trim();
                  const floorNote = multiFloor ? ` · ${FLOOR_LABELS[record.floor]}` : "";
                  return (
                    <button
                      key={record.uuid}
                      type="button"
                      className="gmaps-search-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => chooseSearchResult(record)}
                    >
                      <div className="gmaps-item-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="gmaps-item-info">
                        <strong>{displayName || record.selectableLabel || record.name}</strong>
                        <small>
                          {record.metadata.category}
                          {displayName || record.selectableLabel ? ` · ${record.name}` : ""}
                          {floorNote}
                        </small>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="gmaps-search-empty">
                  <p>{copy.noResults}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Filter Chips ala Google Maps */}
        <div className="gmaps-category-chips" role="tablist">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`gmaps-chip ${active ? "is-active" : ""}`}
                onClick={() => handleCategoryClick(cat.id, cat.query)}
              >
                <Icon size={14} className="gmaps-chip-icon" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Directions Panel */}
      {directionsOpen && (
        <aside
          className="gmaps-directions-panel"
          data-expanded={mobileSheetExpanded ? "true" : "false"}
          data-view-mode={viewMode}
          aria-label={copy.directions}
        >
          <div
            className="gmaps-sheet-handle"
            onClick={() => setMobileSheetExpanded((prev) => !prev)}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
            aria-hidden="true"
          />

          <div className="gmaps-directions-header">
            <button
              type="button"
              className="gmaps-icon-btn gmaps-back-btn"
              onClick={() => {
                setDirectionsOpen(false);
                setSelectingStart(false);
                setSearchFocused(false);
              }}
              aria-label={lang === "EN" ? "Close directions" : "Tutup petunjuk arah"}
              title={lang === "EN" ? "Back to map" : "Kembali ke peta"}
            >
              <ArrowLeft size={20} />
            </button>
            <h2>{copy.directions}</h2>
            <button
              type="button"
              className="gmaps-icon-btn gmaps-swap-btn"
              onClick={swapOriginDestination}
              disabled={!startPoint || !destinationPoint}
              aria-label={lang === "EN" ? "Reverse starting point and destination" : "Tukar titik awal dan tujuan"}
              title={lang === "EN" ? "Swap" : "Tukar"}
            >
              <ArrowUpDown size={18} />
            </button>
          </div>

          <div className="gmaps-directions-body">
            {/* Origin & Destination Inputs */}
            <div className="gmaps-inputs-container">
              <div className="gmaps-input-row">
                <span className="gmaps-dot gmaps-dot-origin" />
                <button
                  type="button"
                  className={`gmaps-input-btn ${selectingStart ? "is-focused" : ""}`}
                  onClick={() => {
                    beginStartSelection();
                    setMobileSheetExpanded(true);
                  }}
                >
                  <small>{copy.from}</small>
                  <span>{startName ?? (automaticLocation && locationMapped ? copy.yourLocation : copy.chooseStart)}</span>
                </button>
              </div>

              <div className="gmaps-input-connector" />

              <div className="gmaps-input-row">
                <span className="gmaps-dot gmaps-dot-dest" />
                <button
                  type="button"
                  className={`gmaps-input-btn ${!selectingStart ? "is-focused" : ""}`}
                  onClick={() => {
                    setSelectingStart(false);
                    setQuery("");
                    setSearchFocused(true);
                    setMobileSheetExpanded(true);
                  }}
                >
                  <small>{copy.to}</small>
                  <span>{routeSessionActive ? destinationName : copy.chooseDestination}</span>
                </button>
              </div>
            </div>

            {/* GPS Live Status Bar */}
            <div className="gmaps-live-bar" data-state={locationMapped ? "active" : passengerLocation.status}>
              <div className="gmaps-live-info">
                {locationMapped ? <Crosshair size={15} /> : <MapPin size={15} />}
                <span>
                  <strong>
                    {!automaticLocation
                      ? (lang === "ID" ? "Posisi manual di peta" : "Manual position")
                      : locationMapped
                        ? copy.locationActive
                        : passengerLocation.status === "checking"
                          ? copy.locating
                          : usableLocationReading
                            ? copy.locationActive
                            : copy.locationFloorNote}
                  </strong>
                  {usableLocationReading && <small>±{Math.round(usableLocationReading.accuracy)} m</small>}
                </span>
              </div>
              {modelFloors.length > 1 && (
                <div className="gmaps-floor-selector-inline">
                  {(["L1", "L2"] as FloorId[]).filter((f) => modelFloors.includes(f)).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={passengerFloor === f ? "is-selected" : ""}
                      onClick={() => {
                        setPassengerFloor(f);
                        setAutomaticLocation(true);
                        setLocationMapped(false);
                      }}
                    >
                      {FLOOR_LABELS[f]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Route Status / Hint */}
            <p className="gmaps-hint-msg" role="status">
              {gridError ?? routeMessage}
            </p>

            {/* Route Summary & Steps */}
            {routeMetrics && routeSteps.length > 0 && (
              <div className="gmaps-route-card">
                <div className="gmaps-route-time-row">
                  <div className="gmaps-time-estimate">
                    <strong>{remainingRouteMinutes} {copy.minutes}</strong>
                    <span>({Math.round(remainingRouteDistance)} m{routeFloorsText ? ` · ${routeFloorsText}` : ""})</span>
                  </div>
                  <button
                    type="button"
                    className="gmaps-clear-route-btn"
                    onClick={resetRoute}
                    title={copy.resetRoute}
                    aria-label={copy.resetRoute}
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="gmaps-cta-row">
                  {viewMode === "pov" ? (
                    <button
                      type="button"
                      className="gmaps-action-primary"
                      onClick={showMapView}
                    >
                      <RotateCcw size={15} />
                      <span>{copy.mapView}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="gmaps-action-primary"
                      onClick={startOrResumeRoute}
                    >
                      <Play size={15} fill="currentColor" />
                      <span>{routeProgress && routeProgress.progress < 1 ? copy.continueSimulation : copy.simulation}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`gmaps-action-secondary ${liveTracking ? "is-tracking" : ""}`}
                    onClick={toggleLiveTracking}
                  >
                    <MousePointer2 size={15} />
                    <span>{liveTracking ? "Stop GPS" : "GPS Nav"}</span>
                  </button>
                </div>

                <div className="gmaps-steps-container">
                  <div className="gmaps-steps-title">
                    <h4>{copy.stepTitle}</h4>
                    <span className="gmaps-steps-count">{activeStepIndex + 1}/{routeSteps.length}</span>
                  </div>
                  <ol className="gmaps-steps-list">
                    {routeSteps.map((step, idx) => (
                      <li key={`${step.kind}-${step.startIndex}`}>
                        <button
                          type="button"
                          className={idx === activeStepIndex ? "is-active" : ""}
                          onClick={() => selectRouteStep(idx)}
                        >
                          <span className="gmaps-step-idx">{idx + 1}</span>
                          <div className="gmaps-step-text">
                            <strong>{step.label}</strong>
                            <small>
                              {step.kind === "arrive"
                                ? destinationName
                                : step.kind === "up" || step.kind === "down"
                                  ? copy.floorDirection
                                  : `±${Math.round(step.distance)} m`}
                            </small>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Side Navigation Drawer */}
      {menuDrawerOpen && (
        <div className="gmaps-drawer-wrapper" role="dialog" aria-modal="true" aria-label="Menu navigasi bandara">
          <div
            className="gmaps-drawer-backdrop"
            onClick={() => setMenuDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="gmaps-drawer">
            <div className="gmaps-drawer-header">
              <div className="gmaps-drawer-brand">
                <span className="gmaps-drawer-logo">🛫</span>
                <div>
                  <h3>Juanda Airport</h3>
                  <span>Terminal 1 Navigation</span>
                </div>
              </div>
              <button
                type="button"
                className="gmaps-icon-btn"
                onClick={() => setMenuDrawerOpen(false)}
                aria-label={lang === "EN" ? "Close menu" : "Tutup menu"}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="gmaps-drawer-nav">
              <Link
                href="/"
                className="gmaps-nav-item"
                onClick={() => setMenuDrawerOpen(false)}
              >
                <Home size={18} />
                <span>{lang === "EN" ? "Home" : "Beranda"}</span>
              </Link>
              <Link
                href="/map"
                className="gmaps-nav-item is-active"
                onClick={() => setMenuDrawerOpen(false)}
              >
                <Navigation size={18} />
                <span>{lang === "EN" ? "Map & Navigation" : "Peta & Navigasi"}</span>
              </Link>
              <Link
                href="/about"
                className="gmaps-nav-item"
                onClick={() => setMenuDrawerOpen(false)}
              >
                <Info size={18} />
                <span>{lang === "EN" ? "About Airport" : "Tentang Juanda"}</span>
              </Link>
              <Link
                href="/help"
                className="gmaps-nav-item"
                onClick={() => setMenuDrawerOpen(false)}
              >
                <HelpCircle size={18} />
                <span>{lang === "EN" ? "Help & FAQ" : "Bantuan & FAQ"}</span>
              </Link>
            </nav>

            <div className="gmaps-drawer-divider" />

            <div className="gmaps-drawer-lang">
              <div className="gmaps-lang-label">
                <Globe size={16} />
                <span>{lang === "EN" ? "Language" : "Bahasa"}</span>
              </div>
              <div className="gmaps-lang-switch">
                <button
                  type="button"
                  className={lang === "ID" ? "is-active" : ""}
                  onClick={() => setLang("ID")}
                >
                  Indonesia
                </button>
                <button
                  type="button"
                  className={lang === "EN" ? "is-active" : ""}
                  onClick={() => setLang("EN")}
                >
                  English
                </button>
              </div>
            </div>

            <div className="gmaps-drawer-footer">
              <p>Bandara Internasional Juanda</p>
              <small>PT Angkasa Pura I · Terminal 1 Wayfinding</small>
            </div>
          </aside>
        </div>
      )}

      {/* Floating Controls di Kanan Bawah */}
      <div className="gmaps-bottom-controls" aria-label={lang === "ID" ? "Kontrol peta" : "Map controls"}>
        {/* Tombol Kompas Google Maps */}
        <button
          type="button"
          className="gmaps-control-btn gmaps-compass-btn"
          onClick={() => viewerApi.current?.resetView()}
          title={copy.compass}
          aria-label={copy.compass}
        >
          <div className="gmaps-compass-needle" style={{ transform: `rotate(${compassRotation}deg)` }}>
            <span className="needle-n" />
            <span className="needle-s" />
          </div>
        </button>

        <div className="gmaps-control-stack">
          {/* Tombol Lokasi Saya */}
          <button
            type="button"
            className={`gmaps-control-btn ${automaticLocation ? "is-active" : ""}`}
            onClick={togglePassengerLocation}
            disabled={!bounds}
            title={automaticLocation ? "GPS Aktif" : "Aktifkan GPS"}
            aria-label="Lokasi saya"
          >
            {automaticLocation ? <LocateFixed size={18} /> : <LocateOff size={18} />}
          </button>

          {/* Zoom In & Out */}
          <button
            type="button"
            className="gmaps-control-btn"
            onClick={() => viewerApi.current?.zoomIn()}
            disabled={!bounds}
            title={copy.zoomIn}
            aria-label={copy.zoomIn}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="gmaps-control-btn"
            onClick={() => viewerApi.current?.zoomOut()}
            disabled={!bounds}
            title={copy.zoomOut}
            aria-label={copy.zoomOut}
          >
            <Minus size={18} />
          </button>

          {/* Toggle Area Luar */}
          <button
            type="button"
            className={`gmaps-control-btn ${showExterior ? "is-active" : ""}`}
            onClick={() => setShowExterior((v) => !v)}
            disabled={!bounds || shownFloorView === "L2"}
            title={lang === "ID" ? "Area Luar Gedung / Apron" : "Exterior / Apron"}
            aria-label="Toggle area luar"
          >
            <Trees size={18} />
          </button>
        </div>
      </div>

      {exteriorAttribution && <p className="map-attribution">Area luar: {exteriorAttribution}</p>}

      {/* Google Maps Place Details Card */}
      {selected && selectedLocationConfig && (
        <aside className="gmaps-place-card" aria-label={`Informasi ${selectedLocationConfig.displayName || selected.name}`}>
          <div className="gmaps-place-card-top">
            {selectedLocationConfig.photoUrl?.trim() && (
              <div className="gmaps-place-photo">
                <img
                  src={getMapObjectPhotoUrl(selectedLocationConfig.photoUrl)}
                  alt={selectedLocationConfig.displayName || selected.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            <button
              type="button"
              className="gmaps-place-close"
              onClick={() => setSelected(null)}
              aria-label={lang === "ID" ? "Tutup" : "Close"}
            >
              <X size={18} />
            </button>
          </div>

          <div className="gmaps-place-content">
            <span className="gmaps-place-badge">
              {selectedLocationConfig.entityType === "FACILITY" ? copy.facility : copy.tenant}
            </span>
            <h3 className="gmaps-place-title">
              {selectedLocationConfig.displayName || selected.name}
            </h3>
            {selectedLocationConfig.displayName?.trim() && (
              <small className="gmaps-place-code">Blok: {selected.name}</small>
            )}
            <p className="gmaps-place-category">
              {selected.category}
              {multiFloor ? ` · ${selected.location.replace(/^Terminal 1 - /, "")}` : ""}
            </p>

            {selectedLocationConfig.description && (
              <p className="gmaps-place-desc">{selectedLocationConfig.description}</p>
            )}

            <div className="gmaps-place-status">
              <span className="gmaps-open-pill">
                {selectedLocationConfig.entityType === "FACILITY" || (!selectedLocationConfig.openTime && !selectedLocationConfig.closeTime)
                  ? "Buka 24 Jam"
                  : `${selectedLocationConfig.openTime} – ${selectedLocationConfig.closeTime}`}
              </span>
            </div>

            <div className="gmaps-place-actions">
              <button
                type="button"
                className="gmaps-btn-primary"
                onClick={() => {
                  const record = objects.find((item) => item.uuid === selected.uuid);
                  if (record) {
                    if (startPoint) {
                      calculateRoute(record);
                    } else {
                      const departure = requiredDepartureForRecord(record);
                      const entrance = departure !== null
                        ? entranceForDeparture(record, departure)
                        : nearestEntrance(record);
                      if (entrance) {
                        startPassengerRoute(entrance, entranceLabel(entrance.name), record);
                      } else {
                        setBuildingAsStart(record);
                      }
                    }
                    setDirectionsOpen(true);
                    setSelected(null);
                  }
                }}
              >
                <Navigation size={16} />
                <span>{copy.directions}</span>
              </button>
              <button
                type="button"
                className="gmaps-btn-secondary"
                onClick={() => {
                  const record = objects.find((item) => item.uuid === selected.uuid);
                  if (record) {
                    setBuildingAsStart(record);
                    setDirectionsOpen(true);
                    setSelected(null);
                  }
                }}
              >
                <MapPin size={16} />
                <span>{copy.chooseStart}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

    </main>
  );
}
