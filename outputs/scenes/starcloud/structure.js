import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { box } from "../../core/primitives.js";

const DECK_BOUNDS = { minX: -58, maxX: 58, minZ: -145, maxZ: 145 };

const hullMat = new THREE.MeshStandardMaterial({ color: 0x252c36, metalness: 0.42, roughness: 0.58 });
const panelMat = new THREE.MeshStandardMaterial({ color: 0x0b1018, metalness: 0.5, roughness: 0.46 });
const lineMat = new THREE.LineBasicMaterial({ color: 0x425064, transparent: true, opacity: 0.42 });

function addStructureCollider(colliders, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.set(x, y, z);
  colliders.add(m);
  return m;
}

function addGrid(group) {
  const pts = [];
  for (let z = -140; z <= 140; z += 10) pts.push(-56, 0.04, z, 56, 0.04, z);
  for (let x = -55; x <= 55; x += 10) pts.push(x, 0.045, -142, x, 0.045, 142);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.LineSegments(geo, lineMat));
}

function addLocalDeck(group, colliders) {
  const deck = box(120, 1, 300, hullMat, 0, -0.5, 0);
  group.add(deck);
  addGrid(group);
  const rails = [
    [-60, 0.75, 0, 1.5, 2.4, 300],
    [60, 0.75, 0, 1.5, 2.4, 300],
    [0, 0.75, -150, 120, 2.4, 1.5],
    [0, 0.75, 150, 120, 2.4, 1.5]
  ];
  rails.forEach(([x, y, z, w, h, d]) => {
    group.add(box(w, h, d, mat.beskar, x, y, z));
    addStructureCollider(colliders, w, 5, d, x, 2.5, z);
  });
  addStructureCollider(colliders, 125, 8, 2, 0, 3, -151);
  addStructureCollider(colliders, 125, 8, 2, 0, 3, 151);
  addStructureCollider(colliders, 2, 8, 305, -61, 3, 0);
  addStructureCollider(colliders, 2, 8, 305, 61, 3, 0);
}

function addTruss(group, z) {
  for (let side of [-1, 1]) {
    for (let x = 120; x <= 1500; x += 180) {
      const beam = box(130, 0.8, 3.5, mat.beskar, side * x, 8, z);
      beam.rotation.z = side * 0.08;
      group.add(beam);
    }
    const panel = box(1420, 1.4, 130, panelMat, side * 830, 3, z);
    group.add(panel);
  }
}

function addVista(group) {
  for (let dir of [-1, 1]) {
    for (let i = 0; i < 18; i++) {
      const z = dir * (280 + i * 330);
      group.add(box(70, 18, 160, hullMat, 0, 2, z));
      group.add(box(16, 30, 190, mat.dark, -28, 10, z));
      group.add(box(16, 30, 190, mat.dark, 28, 10, z));
      if (i % 2 === 0) addTruss(group, z);
    }
  }
  group.add(box(18, 18, 12000, mat.beskar, 0, 9, 0));
  group.add(box(7, 4, 11800, mat.dark, -20, 3, 0));
  group.add(box(7, 4, 11800, mat.dark, 20, 3, 0));
}

export function buildMegastructure(scene, colliders) {
  const group = new THREE.Group();
  group.name = "Starcloud walkable megastructure";
  addLocalDeck(group, colliders);
  addVista(group);
  scene.add(group);
  return { root: group, bounds: DECK_BOUNDS };
}
