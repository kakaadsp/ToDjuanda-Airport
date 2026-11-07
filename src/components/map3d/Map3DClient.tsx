"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMapStore } from "@/store/mapStore";
import { MapModeSwitcher, type MapMode } from "./MapModeSwitcher";

const AirportWayfinding = dynamic(
  () => import("./AirportWayfinding").then((module) => module.AirportWayfinding),
  {
    ssr: false,
    loading: () => (
      <main className="map3d-loading" role="status">
        Memuat peta 3D Terminal 1...
      </main>
    ),
  },
);

const FullMapShell = dynamic(
  () => import("@/components/wayfinding/FullMapShell").then((module) => module.FullMapShell),
  {
    ssr: false,
    loading: () => (
      <main className="map3d-loading" role="status">
        Memuat peta 2D Terminal 1...
      </main>
    ),
  },
);

export function Map3DClient() {
  const lang = useMapStore((state) => state.lang);
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<MapMode>("3d");

  useEffect(() => {
    const viewParam = searchParams.get("view") || searchParams.get("mode");
    if (viewParam === "2d") {
      setMode("2d");
      return;
    }
    try {
      const saved = localStorage.getItem("todjuanda_map_mode") as MapMode | null;
      if (saved === "2d" || saved === "3d") {
        setMode(saved);
      }
    } catch {}
  }, [searchParams]);

  const handleModeChange = (nextMode: MapMode) => {
    setMode(nextMode);
    try {
      localStorage.setItem("todjuanda_map_mode", nextMode);
      const url = new URL(window.location.href);
      if (nextMode === "2d") {
        url.searchParams.set("mode", "2d");
      } else {
        url.searchParams.delete("mode");
        url.searchParams.delete("view");
      }
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  return (
    <div className="map3d-root" data-map-mode={mode}>
      <MapModeSwitcher mode={mode} onChange={handleModeChange} />
      {mode === "3d" ? (
        <AirportWayfinding onSwitchTo2D={() => handleModeChange("2d")} />
      ) : (
        <FullMapShell hideHeader onSwitchTo3D={() => handleModeChange("3d")} />
      )}
      <span className="sr-only" aria-live="polite">
        {lang === "EN" ? `Map mode: ${mode}` : `Mode peta: ${mode}`}
      </span>
    </div>
  );
}
