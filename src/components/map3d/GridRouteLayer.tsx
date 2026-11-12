"use client";

import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type * as THREE from "three";
import type { RouteWorldPoint, RoutePlaybackSnapshot } from "@/lib/map3d/route-guidance";

type GridRouteLayerProps = {
  points: RouteWorldPoint[];
  highlightedPoints: RouteWorldPoint[];
  start: RouteWorldPoint | null;
  destination: RouteWorldPoint | null;
  visitorPosition: RouteWorldPoint | null;
  startLabel?: string;
  heroVisible?: boolean;
  playbackRef?: RefObject<RoutePlaybackSnapshot | null>;
};

export function GridRouteLayer({ points, highlightedPoints, start, destination, visitorPosition, startLabel = "TITIK AWAL", heroVisible = false, playbackRef }: GridRouteLayerProps) {
  const marker = useRef<THREE.Group>(null);
  useFrame(() => {
    if (marker.current && playbackRef?.current) marker.current.position.set(...playbackRef.current.position);
  });
  return (
    <group name="GEOMETRY_ROUTE_OVERLAY">
      {points.length >= 2 && (
        <>
          {/* Jejak samar tetap terlihat di balik dinding agar arah rute dapat
              diikuti, tanpa membuat garis utama menembus bangunan. */}
          <Line points={points} color="#06a9e5" lineWidth={3} transparent opacity={0.22} depthTest={false} depthWrite={false} renderOrder={26} raycast={() => undefined} />
          <Line points={points} color="#f7fbff" lineWidth={8} depthWrite={false} renderOrder={28} raycast={() => undefined} />
          <Line points={points} color="#06a9e5" lineWidth={5} depthWrite={false} renderOrder={29} raycast={() => undefined} />
        </>
      )}
      {highlightedPoints.length >= 2 && (
        <Line points={highlightedPoints} color="#f47b36" lineWidth={7} depthWrite={false} renderOrder={30} raycast={() => undefined} />
      )}
      {start && (
        <group ref={marker} position={visitorPosition ?? start}>
          {!heroVisible && <mesh renderOrder={31} raycast={() => undefined}>
            <sphereGeometry args={[0.38, 12, 12]} />
            <meshBasicMaterial color="#16a36a" depthWrite={false} toneMapped={false} />
          </mesh>}
          <Html position={[0, heroVisible ? 1.5 : 0.75, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
            <span className="navigation-marker-label start-marker-label">{startLabel}</span>
          </Html>
        </group>
      )}
      {destination && (
        <group position={destination}>
          <mesh renderOrder={31} raycast={() => undefined}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshBasicMaterial color="#ff5a36" depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 0.75, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
            <span className="navigation-marker-label destination-marker-label">TUJUAN</span>
          </Html>
        </group>
      )}
    </group>
  );
}
