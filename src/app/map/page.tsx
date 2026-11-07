import { Suspense } from "react";
import { Map3DClient } from "@/components/map3d/Map3DClient";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata = {
  title: "Peta & Navigasi Terminal 1 | Juanda Airport Wayfinding",
  description: "Peta 3D dan 2D interaktif serta panduan rute navigasi multi-lantai Terminal 1 Bandara Internasional Juanda.",
};

export default function MapPage() {
  return (
    <div className="map-page-shell">
      <SiteHeader />
      <Suspense fallback={<main className="map3d-loading" role="status">Memuat peta Terminal 1...</main>}>
        <Map3DClient />
      </Suspense>
    </div>
  );
}
