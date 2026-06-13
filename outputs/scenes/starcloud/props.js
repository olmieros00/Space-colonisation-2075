import * as THREE from "three";
import { C, mat } from "../../core/materials.js";
import { box, cyl } from "../../core/primitives.js";

const droidMat = new THREE.MeshStandardMaterial({ color: 0x64707d, metalness: 0.45, roughness: 0.55 });
const eyeMat = new THREE.MeshStandardMaterial({ color: C.amber, emissive: C.amber, emissiveIntensity: 1.4 });

function addPropCollider(colliders, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(x, y, z);
  colliders.add(mesh);
}

function crate(group, colliders, x, z, w = 2.2, d = 2.2) {
  group.add(box(w, 1.5, d, mat.dark, x, 0.75, z));
  group.add(box(w * 0.8, 0.15, d + 0.12, mat.beskar, x, 1.55, z));
  addPropCollider(colliders, w, 1.5, d, x, 0.75, z);
}

function antenna(group, colliders, x, z, h = 6) {
  const mast = cyl(0.08, 0.1, h, mat.beskar, 10, x, h / 2, z);
  const dish = cyl(0.9, 0.25, 0.28, mat.white, 32, x, h + 0.2, z);
  dish.rotation.x = Math.PI / 2.5;
  group.add(mast, dish);
  addPropCollider(colliders, 0.9, h, 0.9, x, h / 2, z);
}

function droid(group, x, z, scale = 1) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.add(box(0.9 * scale, 0.55 * scale, 1.1 * scale, droidMat, 0, 0.28 * scale, 0));
  root.add(box(0.55 * scale, 0.8 * scale, 0.5 * scale, droidMat, 0, 0.95 * scale, 0));
  root.add(cyl(0.08 * scale, 0.08 * scale, 0.7 * scale, mat.beskar, 8, 0, 1.55 * scale, 0));
  root.add(box(0.5 * scale, 0.28 * scale, 0.34 * scale, droidMat, 0, 1.92 * scale, 0));
  root.add(box(0.12 * scale, 0.08 * scale, 0.04 * scale, eyeMat, 0, 1.95 * scale, -0.18 * scale));
  root.add(box(0.08 * scale, 1.1 * scale, 0.08 * scale, mat.beskar, -0.42 * scale, 1.05 * scale, 0));
  group.add(root);
}

export function buildDeckProps(scene, colliders) {
  const group = new THREE.Group();
  [
    [-15, -118], [-8, -112, 3, 2.4], [14, -62], [22, 72, 2.6, 1.8],
    [-18, 86], [5, 118, 3.2, 2.2], [50, 12, 2, 2], [-52, -18, 2, 2]
  ].forEach(p => crate(group, colliders, ...p));
  [[-48, -108, 8], [47, -45, 5], [-50, 76, 7], [49, 118, 6]].forEach(p => antenna(group, colliders, ...p));
  [[-4, -100, 1.1], [12, -15, 0.9], [-10, 54, 1], [18, 108, 0.8]].forEach(p => droid(group, ...p));
  scene.add(group);
  return group;
}
