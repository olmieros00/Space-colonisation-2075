import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { box, cyl } from "../../core/primitives.js";

const deckMat = new THREE.MeshStandardMaterial({ color: 0x34424c, metalness: 0.42, roughness: 0.58 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0xdadbd2, metalness: 0.2, roughness: 0.44 });
const glowMat = new THREE.MeshStandardMaterial({ color: 0x9fd3ff, emissive: 0x245477, emissiveIntensity: 0.22, transparent: true, opacity: 0.2 });

function habCollider(colliders, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(x, y, z);
  colliders.add(mesh);
}

function addDeck(group, colliders) {
  group.add(box(76, 1.1, 430, deckMat, -58, -0.55, 0));
  group.add(box(4, 5, 430, mat.beskar, -96, 2.5, 0));
  group.add(box(4, 5, 430, mat.beskar, -20, 2.5, 0));
  group.add(box(76, 5, 4, mat.beskar, -58, 2.5, -215));
  group.add(box(76, 5, 4, mat.beskar, -58, 2.5, 215));
  habCollider(colliders, 5, 8, 438, -98, 4, 0);
  habCollider(colliders, 5, 8, 438, -18, 4, 0);
  habCollider(colliders, 82, 8, 5, -58, 4, -218);
  habCollider(colliders, 82, 8, 5, -58, 4, 218);
  for (let z = -190; z <= 190; z += 38) group.add(box(70, 0.08, 0.55, mat.beskar, -58, 0.05, z));
}

function addBoulevard(group) {
  for (let z = -190; z <= 190; z += 20) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(18, 0.28, 8, 32, Math.PI), mat.beskar);
    rib.position.set(-58, 15.5, z);
    rib.rotation.z = Math.PI;
    group.add(rib);
  }
  const roof = box(34, 0.35, 410, glowMat, -58, 18.5, 0);
  roof.rotation.z = 0.02;
  group.add(roof);
  group.add(box(4, 12, 410, glowMat, -75, 8, 0));
  group.add(box(4, 12, 410, glowMat, -41, 8, 0));
}

function addDomeHouse(group, colliders, x, z, r) {
  const base = cyl(r, r, 4, wallMat, 36, x, 2, z);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), wallMat);
  dome.position.set(x, 4, z);
  dome.scale.y = 0.58;
  const window = box(r * 1.25, 3.8, 0.18, glowMat, x, 4.2, z - r - 0.08);
  group.add(base, dome, window);
  habCollider(colliders, r * 2, 9, r * 2, x, 4.5, z);
}

function addPodHouse(group, colliders, x, z, len) {
  const pod = cyl(6, 6, len, wallMat, 32, x, 5, z);
  pod.rotation.z = Math.PI / 2;
  group.add(pod);
  group.add(box(7, 3.4, 0.16, glowMat, x - len / 2 - 0.1, 5, z));
  habCollider(colliders, len, 12, 13, x, 6, z);
}

function addVilla(group, colliders, x, z, w, d, h) {
  group.add(box(w, h, d, wallMat, x, h / 2, z));
  group.add(box(w * 0.72, h * 0.62, 0.2, glowMat, x, h * 0.52, z - d / 2 - 0.1));
  group.add(box(w + 3, 0.4, d + 3, mat.dark, x, 0.22, z));
  habCollider(colliders, w, h, d, x, h / 2, z);
}

function addConnectors(group) {
  for (let z = -160; z <= 160; z += 80) {
    const tube = cyl(2.2, 2.2, 24, glowMat, 24, -31, 4, z);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);
  }
}

export function buildHabitationLayer(scene, colliders) {
  const group = new THREE.Group();
  group.name = "Starcloud livable boulevard";
  addDeck(group, colliders);
  addBoulevard(group);
  addDomeHouse(group, colliders, -82, -160, 8);
  addVilla(group, colliders, -36, -120, 18, 22, 20);
  addPodHouse(group, colliders, -82, -72, 22);
  addDomeHouse(group, colliders, -34, -28, 10);
  addVilla(group, colliders, -84, 36, 16, 24, 28);
  addPodHouse(group, colliders, -34, 92, 26);
  addDomeHouse(group, colliders, -82, 156, 9);
  addConnectors(group);
  scene.add(group);
  return { root: group, bounds: { minX: -96, maxX: -20, minZ: -214, maxZ: 214 }, spawn: new THREE.Vector3(-58, 1.7, 120) };
}
