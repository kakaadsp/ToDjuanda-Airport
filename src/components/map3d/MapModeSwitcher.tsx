"use client";

import { Box, Layers } from "lucide-react";
import { useMapStore } from "@/store/mapStore";

export type MapMode = "3d" | "2d";

interface MapModeSwitcherProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

export function MapModeSwitcher({ mode, onChange }: MapModeSwitcherProps) {
  const lang = useMapStore((state) => state.lang);
  const isEn = lang === "EN";

  return (
    <div
      className="map-mode-switcher-container"
      role="group"
      aria-label={isEn ? "Map View Mode" : "Mode Tampilan Peta"}
    >
      <div className="map-mode-switcher-pill">
        <button
          type="button"
          className={`map-mode-btn ${mode === "3d" ? "is-active" : ""}`}
          onClick={() => onChange("3d")}
          aria-pressed={mode === "3d"}
          title={isEn ? "Switch to 3D Map view" : "Beralih ke tampilan Peta 3D"}
        >
          <Box size={14} className="map-mode-icon" aria-hidden="true" />
          <span>{isEn ? "3D Map" : "3D Peta"}</span>
        </button>

        <button
          type="button"
          className={`map-mode-btn ${mode === "2d" ? "is-active" : ""}`}
          onClick={() => onChange("2d")}
          aria-pressed={mode === "2d"}
          title={
            isEn
              ? "Switch to lightweight 2D Blueprint Map (Faster & saves battery)"
              : "Beralih ke Peta 2D Ringan (Lebih cepat & hemat baterai)"
          }
        >
          <Layers size={14} className="map-mode-icon" aria-hidden="true" />
          <span>{isEn ? "2D Light" : "2D Ringan"}</span>
        </button>
      </div>
    </div>
  );
}

