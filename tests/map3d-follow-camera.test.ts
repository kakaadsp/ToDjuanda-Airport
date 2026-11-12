import assert from "node:assert/strict";
import test from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { RouteFollowCamera } from "../src/lib/map3d/map-camera";

test("follow camera faces travel direction and frames the hero in all four directions", () => {
  for (const forward of [new Vector3(1,0,0), new Vector3(-1,0,0), new Vector3(0,0,1), new Vector3(0,0,-1)]) {
    const camera = new PerspectiveCamera(70,16/9,.01,1000);
    const follow = new RouteFollowCamera();
    const eye = forward.clone().multiplyScalar(-3); eye.y = 2.85;
    const target = forward.clone().multiplyScalar(.8); target.y = .65;
    follow.update(camera,eye,target);
    assert.ok(camera.getWorldDirection(new Vector3()).dot(forward) > .5);
    const hero = new Vector3(0,.6,0).project(camera);
    assert.ok(Math.abs(hero.x)<1 && Math.abs(hero.y)<1 && hero.z>-1 && hero.z<1);
  }
});

test("delayed map/orbit changes cannot reverse the simulation camera", () => {
  const camera = new PerspectiveCamera();
  const follow = new RouteFollowCamera();
  const eye = new Vector3(0,2.85,-3), target = new Vector3(0,.65,.8);
  follow.update(camera,eye,target);
  const expected = camera.quaternion.clone();
  const controls = new OrbitControls(camera);
  controls.target.set(200,0,-300); camera.position.set(200,50,-400); controls.update();
  follow.update(camera,eye,target,1/60);
  assert.ok(camera.position.distanceTo(eye)<1e-8);
  assert.ok(camera.quaternion.angleTo(expected)<1e-7);
  controls.dispose();
});