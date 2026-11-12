"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { advanceSimulation } from "@/lib/map3d/distance-calibration";
import { RouteFollowCamera } from "@/lib/map3d/map-camera";
import { createPlaybackSnapshot, sampleRouteAtDistance, type RouteMetrics, type RoutePlaybackSnapshot } from "@/lib/map3d/route-guidance";

type RoutePlaybackControllerProps = {
  metrics: RouteMetrics | null;
  active: boolean;
  paused: boolean;
  speed?: number;
  playbackRef?: RefObject<RoutePlaybackSnapshot | null>;
  viewMode: "map" | "pov";
  restartToken: number;
  recenterToken: number;
  onProgress: (snapshot: RoutePlaybackSnapshot) => void;
  onComplete: () => void;
};

export function RoutePlaybackController({ metrics, active, paused, speed = 1, playbackRef, viewMode, restartToken, recenterToken, onProgress, onComplete }: RoutePlaybackControllerProps) {
  const { camera, invalidate } = useThree();
  const traveledDistance = useRef(0);
  const lastPublishedAt = useRef(0);
  const completed = useRef(false);
  const cameraPose = useRef(new RouteFollowCamera());

  const placeCamera = useCallback((distance: number, delta?: number) => {
    if (!metrics || !(camera instanceof THREE.PerspectiveCamera)) return;
    const current = sampleRouteAtDistance(metrics, distance);
    const ahead = sampleRouteAtDistance(metrics, Math.min(distance + 1.8, metrics.totalDistance));
    const forward = ahead.point.clone().sub(current.point);
    forward.y = 0;
    if (forward.lengthSq() < .000001) forward.copy(current.direction);
    forward.normalize();
    const eye = current.point.clone().addScaledVector(forward, -3);
    eye.y = Math.max(current.point.y + 1.53, 1.65) + 1.2;
    const target = current.point.clone().addScaledVector(forward, .8);
    target.y = current.point.y + .65;
    cameraPose.current.update(camera, eye, target, delta);
  }, [camera, metrics]);

  const publish = useCallback((force = false) => {
    if (!metrics) return;
    const snapshot = createPlaybackSnapshot(metrics, traveledDistance.current);
    if (playbackRef) playbackRef.current = snapshot;
    const now = performance.now();
    if (!force && now - lastPublishedAt.current < 100) return;
    lastPublishedAt.current = now;
    onProgress(snapshot);
  }, [playbackRef, metrics, onProgress]);

  useEffect(() => {
    if (!metrics || !active) return;
    traveledDistance.current = 0;
    completed.current = false;
    cameraPose.current.reset();
    publish(true);
    invalidate();
  }, [active, invalidate, metrics, publish, restartToken]);

  useEffect(() => {
    if (!metrics || !active || viewMode !== "pov") return;
    placeCamera(traveledDistance.current);
    publish(true);
    invalidate();
  }, [active, invalidate, metrics, placeCamera, publish, recenterToken, viewMode]);

  // Run after OrbitControls (-1) and before the hero/labels (0).
  useFrame((_state, delta) => {
    if (!metrics || !active || viewMode !== "pov") return;
    if (!paused) traveledDistance.current = advanceSimulation(traveledDistance.current, delta, speed, metrics.totalDistance);
    placeCamera(traveledDistance.current, delta);
    publish();
    if (!paused && traveledDistance.current >= metrics.totalDistance && !completed.current) {
      completed.current = true;
      publish(true);
      onComplete();
      return;
    }
    if (!paused) invalidate();
  }, -.5);
  return null;
}