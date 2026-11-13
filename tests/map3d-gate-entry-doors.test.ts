import assert from "node:assert/strict";
import { before, test } from "node:test";
import * as THREE from "three";
import { loadGlb, nodeMeshObjects } from "./helpers/load-glb";
import { createFloorNavigation, findFloorRoute, type FloorNavigation } from "../src/lib/map3d/multi-floor-route";
import { floorOfObject } from "../src/lib/map3d/floors";
import { fetchMapObjectConfigsFromDb, readMapObjectConfigs, resolveMapObjectEntryDoors } from "../src/lib/map3d/admin-object-config";
import { openTargetEntryDoors } from "../src/lib/map3d/walkable-grid";
let objects: Awaited<ReturnType<typeof nodeMeshObjects>>;
let nav: FloorNavigation;
before(async () => { objects = nodeMeshObjects(await loadGlb("public/models/t1-gabungan.glb")); nav = createFloorNavigation(objects); });
const rect = (name: string) => {
  const object = objects.find(o => o.name === name)!;
  assert.ok(object, name);
  const box = new THREE.Box3().setFromObject(object.object);
  return {floor: floorOfObject(object.object), rect:{ minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z }};
};
test("legacy empty door arrays do not make Gate 1-7 unreachable from ground floor", () => {
  const origin = rect("T1-GF-58");
  const start = {floor:origin.floor, point:[(origin.rect.minX+origin.rect.maxX)/2,(origin.rect.minZ+origin.rect.maxZ)/2] as [number,number]};
  for (let gate=1; gate<=7; gate++) {
    const name = "T1-FF-GATE-"+gate;
    const target = rect(name);
    assert.equal(findFloorRoute(nav,start,{...target,entryDoors:[]}),null,"reproduces empty-door failure");
    const doors=resolveMapObjectEntryDoors(name,[]);
    const route = findFloorRoute(nav,start,{...target,entryDoors:doors});
    assert.ok(route, name+" must be reachable with unconfigured doors");
    assert.equal(route.transitions.length,1);
    assert.equal(route.pointFloors.at(-1),"L2");
    assert.match(route.transitions[0].connector.name,/T1-GF-(EKS NAIK-0[12]|TANGGA-0[12])/);
    route.points.forEach(([x,,z],i)=>{
      if(route.transitions.some(t=>i===t.index||i===t.index+1))return;
      const floor=route.pointFloors[i];
      const grid=floor===target.floor ? openTargetEntryDoors(nav.grids[floor]!,target.rect,doors) : nav.grids[floor]!;
      const column=Math.floor((x-grid.minX)/grid.cellSize),row=Math.floor((z-grid.minZ)/grid.cellSize);
      assert.equal(grid.open[row*grid.width+column],1,name+" must stay on walkable cells");
    });
  }
});
test("explicitly closed gate doors remain closed after normalization", () => {
  const name="T1-FF-GATE-7";
  const doors=resolveMapObjectEntryDoors(name,[]).map(door=>({...door,open:false}));
  const resolved=resolveMapObjectEntryDoors(name,doors);
  assert.deepEqual(resolved,doors);
  const r=rect("T1-GF-58");
  assert.equal(findFloorRoute(nav,{floor:r.floor,point:[r.rect.minX,r.rect.minZ]},{...rect(name),entryDoors:resolved}),null);
});
test("missing, null and empty configuration use the same door defaults", () => {
  const name="T1-FF-GATE-1";
  assert.deepEqual(resolveMapObjectEntryDoors(name),resolveMapObjectEntryDoors(name,[]));
  assert.deepEqual(resolveMapObjectEntryDoors(name,null),resolveMapObjectEntryDoors(name,[]));
});

test("database-loaded gate metadata normalizes empty door arrays", async () => {
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>new Response(JSON.stringify({"T1-FF-GATE-7":{entryDoors:[]}}),{status:200});
    const configs=await fetchMapObjectConfigsFromDb();
    assert.equal(configs["T1-FF-GATE-7"].entryDoors.length,4);
    assert.ok(configs["T1-FF-GATE-7"].entryDoors.every(d=>d.open));
  } finally { globalThis.fetch=original; }
});
test("cached gate metadata normalizes legacy empty doors on reload", () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,"window");
  try {
    Object.defineProperty(globalThis,"window",{configurable:true,value:{localStorage:{getItem:()=>JSON.stringify({"T1-FF-GATE-1":{entryDoors:[]}})}}});
    const configs=readMapObjectConfigs();
    assert.equal(configs["T1-FF-GATE-1"].entryDoors.length,4);
  } finally {
    if(original) Object.defineProperty(globalThis,"window",original);
    else Reflect.deleteProperty(globalThis,"window");
  }
});
