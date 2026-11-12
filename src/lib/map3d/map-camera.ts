import { PerspectiveCamera, Vector3 } from "three";

/** Own the smoothed pose independently of OrbitControls and delayed map focus.
 * Never smooth from a camera transform that another controller can overwrite.
 */
export class RouteFollowCamera {
  private position = new Vector3();
  private target = new Vector3();
  private initialized = false;

  reset() { this.initialized = false; }

  update(camera: PerspectiveCamera, position: Vector3, target: Vector3, delta?: number) {
    const blend = !this.initialized || delta === undefined ? 1 : 1 - Math.exp(-12 * delta);
    this.position.lerp(position, blend);
    this.target.lerp(target, blend);
    this.initialized = true;
    camera.position.copy(this.position);
    // Apply lookAt to the actual camera: its local forward axis is -Z.
    camera.lookAt(this.target);
    camera.updateMatrixWorld();
  }
}

export function getMapOrbitLimits() {
  return {
    minPolarAngle: 0,
    maxPolarAngle: (75 * Math.PI) / 180,
    screenSpacePanning: false,
  };
}
