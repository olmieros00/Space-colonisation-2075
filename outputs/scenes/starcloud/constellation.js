import * as THREE from "three";
import { box } from "../../core/primitives.js";
import { buildSimpleUnit } from "./unit.js";

const farMat = new THREE.MeshBasicMaterial({ color: 0x0d1420, transparent: true, opacity: 0.72 });
const lineMat = new THREE.LineBasicMaterial({ color: 0x324254, transparent: true, opacity: 0.28 });

function addHorizonLines(group) {
  const pts = [];
  for (let x = -18000; x <= 18000; x += 3000) pts.push(x, -6, -18000, x, -6, 18000);
  for (let z = -18000; z <= 18000; z += 3000) pts.push(-18000, -5.8, z, 18000, -5.8, z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.LineSegments(geo, lineMat));
}

function addFarUnit(group, x, z, scale = 1) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.scale.setScalar(scale);
  root.add(box(18, 12, 3200, farMat, 0, 5, 0));
  root.add(box(2400, 0.6, 3300, farMat, -1280, -4, 0));
  root.add(box(2400, 0.6, 3300, farMat, 1280, -4, 0));
  group.add(root);
}

export function buildConstellationField(scene) {
  const group = new THREE.Group();
  group.name = "Starcloud tiled constellation";
  addHorizonLines(group);
  for (let ix = -2; ix <= 2; ix++) {
    for (let iz = -2; iz <= 2; iz++) {
      if (ix === 0 && iz === 0) continue;
      const x = ix * 4300;
      const z = iz * 4700;
      const near = Math.abs(ix) <= 1 && Math.abs(iz) <= 1;
      group.add(near ? buildSimpleUnit(x, z) : new THREE.Group());
      if (!near) addFarUnit(group, x, z, 0.9 + Math.abs(iz) * 0.08);
    }
  }
  for (let z of [-17000, 17000]) {
    for (let x = -16000; x <= 16000; x += 4200) addFarUnit(group, x, z, 1.15);
  }
  scene.add(group);
  return group;
}
