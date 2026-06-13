import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { box } from "../../core/primitives.js";

const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9ddd7, metalness: 0.22, roughness: 0.36 });
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x9fd3ff,
  emissive: 0x163047,
  emissiveIntensity: 0.35,
  metalness: 0.08,
  roughness: 0.2
});

function addBuildingCollider(colliders, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(x, y, z);
  colliders.add(mesh);
}

function addWindowGrid(group, w, h, x, z, front = true) {
  const rows = Math.max(3, Math.floor(h / 5));
  const cols = Math.max(3, Math.floor(w / 4));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 5 === 0) continue;
      const pane = box(1.2, 0.7, 0.08, glassMat, x - w / 2 + 2 + c * (w - 4) / cols, 4 + r * (h - 7) / rows, z);
      group.add(pane);
    }
  }
}

function addBuilding(group, colliders, spec) {
  const { x, z, w, d, h, step = 0 } = spec;
  const body = box(w, h, d, wallMat, x, h / 2, z);
  group.add(body);
  if (step) group.add(box(w * 0.72, h * 0.35, d * 0.82, mat.white, x, h + h * 0.175, z - step));
  addWindowGrid(group, w, h, x, z - d / 2 - 0.06, true);
  const door = box(3, 4.5, 0.12, mat.black, x, 2.25, z - d / 2 - 0.12);
  group.add(door);
  const pad = box(w + 4, 0.08, d + 4, mat.dark, x, 0.06, z);
  group.add(pad);
  addBuildingCollider(colliders, w, h, d, x, h / 2, z);
}

export function buildHabitationMassing(scene, colliders) {
  const group = new THREE.Group();
  [
    { x: -38, z: -96, w: 18, d: 22, h: 34, step: 3 },
    { x: -30, z: -52, w: 22, d: 18, h: 24 },
    { x: -42, z: 3, w: 15, d: 24, h: 39, step: -2 },
    { x: -28, z: 58, w: 26, d: 22, h: 28 },
    { x: 34, z: -80, w: 20, d: 20, h: 18 },
    { x: 40, z: -28, w: 15, d: 28, h: 36, step: 2 },
    { x: 30, z: 26, w: 24, d: 18, h: 22 },
    { x: 42, z: 92, w: 18, d: 22, h: 32, step: -3 }
  ].forEach(spec => addBuilding(group, colliders, spec));
  scene.add(group);
  return group;
}
