"use client";

import { FLOOR_BUTTON_ORDER, FLOOR_LABELS, type FloorId, type FloorView } from "@/lib/map3d/floors";
import { useMapStore } from "@/store/mapStore";
import { Layers } from "lucide-react";

type FloorSwitcherProps = {
  view: FloorView;
  /** Lantai yang ada pada model yang dimuat. */
  floors: readonly FloorId[];
  onSelect: (view: FloorView) => void;
};

/**
 * Pemilih lantai vertikal Google Maps style.
 */
export function FloorSwitcher({ view, floors, onSelect }: FloorSwitcherProps) {
  const lang = useMapStore((state) => state.lang);
  const floorName = (floor: FloorId) =>
    lang === "EN" ? (floor === "L1" ? "1st Floor" : "2nd Floor") : FLOOR_LABELS[floor];

  return (
    <div className="gmaps-floor-switcher" role="group" aria-label={lang === "EN" ? "Select floor" : "Pilih lantai"}>
      <div className="gmaps-floor-buttons">
        {floors.includes("L2") && (
          <button
            type="button"
            className={`gmaps-floor-btn ${view === "L2" ? "is-active" : ""}`}
            aria-pressed={view === "L2"}
            title={lang === "EN" ? "2nd Floor - Departures & Gates" : "Lantai 2 - Keberangkatan & Gate"}
            onClick={() => onSelect(view === "L2" ? "ALL" : "L2")}
          >
            <span>2</span>
            <small className="gmaps-floor-tooltip">{floorName("L2")}</small>
          </button>
        )}
        {floors.includes("L1") && (
          <button
            type="button"
            className={`gmaps-floor-btn ${view === "L1" ? "is-active" : ""}`}
            aria-pressed={view === "L1"}
            title={lang === "EN" ? "1st Floor - Check-in & Arrivals" : "Lantai 1 - Check-in & Kedatangan"}
            onClick={() => onSelect(view === "L1" ? "ALL" : "L1")}
          >
            <span>1</span>
            <small className="gmaps-floor-tooltip">{floorName("L1")}</small>
          </button>
        )}
        {floors.length > 1 && (
          <button
            type="button"
            className={`gmaps-floor-btn gmaps-floor-all ${view === "ALL" ? "is-active" : ""}`}
            aria-pressed={view === "ALL"}
            title={lang === "EN" ? "View all floors" : "Tampilkan semua lantai"}
            onClick={() => onSelect("ALL")}
          >
            <Layers size={15} />
            <small className="gmaps-floor-tooltip">{lang === "EN" ? "All floors" : "Semua lantai"}</small>
          </button>
        )}
      </div>
    </div>
  );
}

