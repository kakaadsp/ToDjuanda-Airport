/** Google Earth references supplied by the owner, matched to T1 ground-floor
 * landmarks (not the full model bounds, which include the western wing).
 * X: west main-hall wall tembok_pilar_196 -> east wall tembok_pilar_123.
 * Z: landside edge area_visitor -> apron-side edge area_merah at the centre.
 * Screenshot matching is approximate; reference distances are authoritative.
 * Y remains metres: screenshot references only constrain the horizontal plane.
 */
export const T1_DISTANCE_REFERENCES = {
  longitudinal: { start: [-226.65504853909079, 0, -15] as const, end: [301.94530931498593, 0, -15] as const, meters: 648.57 },
  transverse: { start: [-42, 0, -39.035394100895246] as const, end: [-42, 0, 39.03525785908914] as const, meters: 100.79 },
};
export const METERS_PER_MODEL_UNIT = {
  x: T1_DISTANCE_REFERENCES.longitudinal.meters / (T1_DISTANCE_REFERENCES.longitudinal.end[0] - T1_DISTANCE_REFERENCES.longitudinal.start[0]),
  y: 1,
  z: T1_DISTANCE_REFERENCES.transverse.meters / (T1_DISTANCE_REFERENCES.transverse.end[2] - T1_DISTANCE_REFERENCES.transverse.start[2]),
} as const;

export function calibratedDistance(a: readonly number[], b: readonly number[]) {
  return Math.hypot((b[0] - a[0]) * METERS_PER_MODEL_UNIT.x,
    (b[1] - a[1]) * METERS_PER_MODEL_UNIT.y,
    (b[2] - a[2]) * METERS_PER_MODEL_UNIT.z);
}

export const SIMULATION_SPEEDS = [1, 2, 3] as const;
export const VISITOR_SPEED_METERS_PER_SECOND = 1.35;
export function advanceSimulation(distance: number, delta: number, speed: number, total: number) {
  return Math.min(total, distance + Math.min(Math.max(delta, 0), .1) * VISITOR_SPEED_METERS_PER_SECOND * speed);
}
