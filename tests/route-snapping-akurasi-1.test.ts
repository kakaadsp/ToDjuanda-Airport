import assert from "node:assert/strict";
import test from "node:test";
import { METERS_PER_MODEL_UNIT } from "../src/lib/map3d/distance-calibration";
import { projectPointOntoRouteSegments, type RouteWorldPoint } from "../src/lib/map3d/route-guidance";

test("Akurasi 1.0: projects point onto route segments and stays strictly on line", () => {
  const route: RouteWorldPoint[] = [
    [0, 1, 0],
    [10, 1, 0],
    [10, 1, 20],
  ];

  // Point is at (5, 1, 3) which is 3 meters to the side of first segment (0,1,0)->(10,1,0)
  const result = projectPointOntoRouteSegments(route, [5, 1, 3]);
  assert.ok(result !== null);
  // Must be snapped exactly onto segment: x=5, y=1, z=0
  assert.equal(result.projected[0], 5);
  assert.equal(result.projected[1], 1);
  assert.equal(result.projected[2], 0);
  assert.equal(result.segmentIndex, 0);
  assert.equal(result.distanceFromStart, 5 * METERS_PER_MODEL_UNIT.x);
  assert.equal(result.deviationDistance, 3);
});

test("Akurasi 1.0: handles corners and vertical elevation correctly", () => {
  const route: RouteWorldPoint[] = [
    [0, 0, 0],
    [0, 3, 10], // e.g. escalator
  ];

  // Point halfway along escalator at z=5, but raw GPS y is flat (0)
  const result = projectPointOntoRouteSegments(route, [0.5, 0, 5]);
  assert.ok(result !== null);
  assert.equal(result.projected[0], 0);
  assert.equal(result.projected[1], 1.5); // interpolated elevation
  assert.equal(result.projected[2], 5);
  assert.ok(Math.abs(result.deviationDistance - 0.5) < 0.001);
});
