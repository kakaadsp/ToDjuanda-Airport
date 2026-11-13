"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import type { RouteWorldPoint, RoutePlaybackSnapshot } from "@/lib/map3d/route-guidance";
import { METERS_PER_MODEL_UNIT } from "@/lib/map3d/distance-calibration";

/** One shared GLB; no shadows, textures, idle render loop, or React frame updates. */
export function NavigationHero({ position, direction, moving, speed = 1, playbackRef }: {
  position: RouteWorldPoint; direction?: RouteWorldPoint; moving: boolean; speed?: number;
  playbackRef?: RefObject<RoutePlaybackSnapshot | null>;
}) {
  const { scene, animations } = useGLTF("/models/navigation-hero.glb");
  const model = useMemo(() => clone(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const action = useRef<THREE.AnimationAction | null>(null);
  const group = useRef<THREE.Group>(null);
  const headingInitialized = useRef(false);
  useEffect(() => {
    const clip = animations.find((clip) => clip.name === (moving ? "Walk" : "Idle"));
    if (!clip) return;
    action.current = mixer.clipAction(clip);
    action.current.reset().play();
    mixer.update(0);
    return () => { mixer.stopAllAction(); };
  }, [animations, mixer, moving]);
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(model); }, [mixer, model]);
  // The route controller supplies render frames during simulation. This avatar
  // never invalidates the canvas just to animate a stationary character.
  useFrame((_, delta) => {
    const snapshot = playbackRef?.current;
    if (group.current) {
      const point = snapshot?.position ?? position;
      const heading = snapshot?.direction ?? direction;
      // Follow the exact sampled polyline every frame: no interpolation across
      // corners, no walking bob applied to the group's route position.
      group.current.position.set(...point);
      if (heading) {
        const target = Math.atan2(heading[0], heading[2]);
        if (!headingInitialized.current) {
          group.current.rotation.y = target;
          headingInitialized.current = true;
        }
        const difference = Math.atan2(Math.sin(target - group.current.rotation.y), Math.cos(target - group.current.rotation.y));
        group.current.rotation.y += difference * (1 - Math.exp(-12 * delta));
      }
    }
    if (moving) mixer.update(Math.min(delta, .1) * speed);
  });
  return <group ref={group} position={position}
    scale={[.45 / METERS_PER_MODEL_UNIT.x, .45, .45 / METERS_PER_MODEL_UNIT.z]}>
    <primitive object={model} dispose={null} raycast={() => undefined} />
  </group>;
}
