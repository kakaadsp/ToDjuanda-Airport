import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { calibratedDistance, T1_DISTANCE_REFERENCES, advanceSimulation, SIMULATION_SPEEDS } from "../src/lib/map3d/distance-calibration";
import { createRouteMetrics, sampleRouteAtDistance, projectPointOntoRouteSegments } from "../src/lib/map3d/route-guidance";
import { createRouteSteps } from "../src/lib/map3d/route-steps";
import { geographicToT1Model, T1_GEO_CALIBRATION } from "../src/lib/map3d/passenger-geolocation";
import { loadGlb, nodeMeshObjects } from "./helpers/load-glb";

const near = (a: number, b: number, tolerance = 1e-7) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);

test("both Google Earth reference spans reproduce supplied metres without resizing model coordinates", () => {
  for (const ref of Object.values(T1_DISTANCE_REFERENCES)) {
    near(calibratedDistance(ref.start, ref.end), ref.meters);
    const metrics = createRouteMetrics([[...ref.start], [...ref.end]])!;
    near(metrics.totalDistance, ref.meters);
    const midpoint = sampleRouteAtDistance(metrics, ref.meters / 2).point.toArray();
    ref.start.forEach((v, i) => near(midpoint[i], (v + ref.end[i]) / 2));
  }
});

test("reference coordinates remain anchored to the actual repo GLB landmarks", async () => {
  const records = nodeMeshObjects(await loadGlb("public/models/t1-gabungan.glb"));
  const box = (name: string) => new THREE.Box3().setFromObject(records.find(r => r.name === name)!.object);
  near(box("tembok_pilar_196").min.x, T1_DISTANCE_REFERENCES.longitudinal.start[0], .001);
  near(box("tembok_pilar_123").max.x, T1_DISTANCE_REFERENCES.longitudinal.end[0], .001);
  near(box("area_visitor").min.z, T1_DISTANCE_REFERENCES.transverse.start[2], .001);
  near(box("area_merah").max.z, T1_DISTANCE_REFERENCES.transverse.end[2], .001);
});

test("step distances, 3D slopes, projection progress and ETA share metres", () => {
  const points: [number, number, number][] = [[0,0,0], [20,0,0], [20,3,10], [20,3,30]];
  const metrics = createRouteMetrics(points)!;
  near(createRouteSteps(metrics).reduce((sum, step) => sum+step.distance, 0), metrics.totalDistance);
  const projection = projectPointOntoRouteSegments(points, [20,1.5,5])!;
  const sample = sampleRouteAtDistance(metrics, projection.distanceFromStart);
  near(sample.point.x, 20); near(sample.point.y, 1.5); near(sample.point.z, 5);
  near(calibratedDistance([0,0,0], [0,3,0]), 3);
});

test("simulation multipliers change travel time without changing route distance", () => {
  for (const speed of SIMULATION_SPEEDS) {
    let distance = 0;
    for (let i=0; i<100; i++) distance = advanceSimulation(distance, .1, speed, 1000);
    near(distance, 13.5*speed);
  }
  assert.equal(advanceSimulation(99.9, .1, 2, 100), 100);
});

test("continuous playback stays on the path without jumps across bends or floor transitions", () => {
  const points: [number, number, number][] = [[0,0,0], [5,0,0], [5,0,4], [8,3,4], [8,3,10]];
  const metrics = createRouteMetrics(points)!;
  for (const fps of [30, 60, 120]) {
    const delta = 1/fps;
    let distance = 0;
    let previous = sampleRouteAtDistance(metrics, 0).point.toArray();
    while (distance < metrics.totalDistance) {
      distance = advanceSimulation(distance, delta, 2, metrics.totalDistance);
      const current = sampleRouteAtDistance(metrics, distance).point.toArray();
      assert.ok(calibratedDistance(previous, current) <= 2.7 * delta + 1e-8);
      previous = current;
    }
    previous.forEach((value, axis) => near(value, points.at(-1)![axis]));
  }
});

test("GPS east and north displacements retain physical metres and geographic origin", () => {
  const origin = T1_GEO_CALIBRATION.origin;
  const base = geographicToT1Model(origin);
  for (const target of [
    {latitude: origin.latitude, longitude: origin.longitude+100/(111320*Math.cos(origin.latitude*Math.PI/180))},
    {latitude: origin.latitude+100/111320, longitude: origin.longitude},
  ]) {
    const next = geographicToT1Model(target);
    near(calibratedDistance([base[0],0,base[1]], [next[0],0,next[1]]), 100, .01);
  }
});

test("hero GLB contains a lightweight skin and Idle/Walk clips", async () => {
  const gltf = await loadGlb("public/models/navigation-hero.glb");
  assert.deepEqual(gltf.animations.map(clip => clip.name).sort(), ["Idle", "Walk"]);
  let triangles = 0, skins = 0;
  gltf.scene.traverse(obj => {
    if (obj instanceof THREE.SkinnedMesh) skins++;
    if (obj instanceof THREE.Mesh) triangles += (obj.geometry.index?.count ?? obj.geometry.attributes.position.count)/3;
  });
  assert.equal(skins, 1); assert.ok(triangles < 5000);
});
