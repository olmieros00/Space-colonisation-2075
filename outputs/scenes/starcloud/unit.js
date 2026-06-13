import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { box, cyl, shadowAll } from "../../core/primitives.js";

const arrayMat = new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.42, roughness: 0.5 });
const radiatorMat = new THREE.MeshStandardMaterial({ color: 0xdfe1dc, metalness: 0.18, roughness: 0.64 });
const spineMat = new THREE.MeshStandardMaterial({ color: 0x5d6a76, metalness: 0.56, roughness: 0.42 });
const containerMat = new THREE.MeshStandardMaterial({ color: 0xd8dbd5, metalness: 0.35, roughness: 0.48 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x92cfff, emissive: 0x14324d, emissiveIntensity: 0.18, transparent: true, opacity: 0.34 });

function unitCollider(colliders, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(x, y, z);
  colliders.add(mesh);
}

function solarGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = "rgba(80,108,150,0.38)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 36);
  return tex;
}

function addArrayWing(group, side) {
  const material = arrayMat.clone();
  material.map = solarGridTexture();
  const wing = box(2000, 1.2, 4000, material, side * 1030, -2, 0);
  wing.rotation.z = side * 0.018;
  group.add(wing);
  for (let z = -1800; z <= 1800; z += 400) {
    group.add(box(2000, 2.2, 5, mat.beskar, side * 1030, -0.4, z));
  }
  for (let x = 120; x <= 1900; x += 220) {
    group.add(box(4, 2.4, 4000, mat.beskar, side * x, -0.3, 0));
  }
  const radiator = box(18, 640, 4000, radiatorMat, side * 2048, 310, 0);
  radiator.rotation.z = side * 0.02;
  group.add(radiator);
  for (let z = -1800; z <= 1800; z += 300) group.add(box(22, 642, 4, mat.beskar, side * 2048, 310, z));
}

function addContainers(group, colliders) {
  for (let z = -1980; z <= 1980; z += 40) {
    const side = Math.floor((z + 1980) / 40) % 2 ? 1 : -1;
    const rack = box(12, 6, 6, containerMat, side * 27, 7, z);
    group.add(rack);
    if (Math.abs(z) < 230) unitCollider(colliders, 13, 7, 7, side * 27, 7, z);
    if (Math.abs(z % 160) < 1) {
      const pipe = cyl(0.4, 0.4, 52, mat.beskar, 12, 0, 19, z);
      pipe.rotation.z = Math.PI / 2;
      group.add(pipe);
    }
  }
}

function addTerminals(group) {
  for (const [x, z, yaw] of [[-44, -620, -0.8], [46, 880, 0.7]]) {
    const base = cyl(2.2, 2.8, 3, mat.beskar, 24, x, 17, z);
    const dish = cyl(8, 1.8, 1.2, mat.white, 48, x, 21, z);
    dish.rotation.x = Math.PI / 2.8;
    dish.rotation.z = yaw;
    group.add(base, dish);
  }
  const dock = new THREE.Group();
  dock.position.set(0, 16, 205);
  dock.add(cyl(10, 10, 10, mat.beskar, 32));
  dock.add(cyl(7, 7, 2, mat.black, 32, 0, 6, 0));
  group.add(dock);
  const capsule = new THREE.Group();
  capsule.position.set(-58, 22, 228);
  capsule.add(cyl(4.8, 6.4, 8, mat.white, 36));
  capsule.add(new THREE.Mesh(new THREE.ConeGeometry(4.8, 5.6, 36), mat.white));
  capsule.children[1].position.y = 6.8;
  group.add(capsule);
}

function addDataSpine(group, colliders) {
  group.add(box(30, 30, 4000, spineMat, 0, 12, 0));
  group.add(box(36, 4, 4000, mat.dark, 0, 29, 0));
  group.add(box(7, 7, 4000, mat.beskar, -21, 12, 0));
  group.add(box(7, 7, 4000, mat.beskar, 21, 12, 0));
  unitCollider(colliders, 38, 34, 450, 0, 16, 0);
  addContainers(group, colliders);
}

export function buildStarcloudUnit(scene, colliders) {
  const group = new THREE.Group();
  group.name = "Starcloud 5GW unit";
  addDataSpine(group, colliders);
  addArrayWing(group, -1);
  addArrayWing(group, 1);
  addTerminals(group);
  group.add(box(62, 8, 420, glassMat, -52, 5, 0));
  scene.add(shadowAll(group));
  return group;
}

export function buildSimpleUnit(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(box(22, 16, 3600, spineMat, 0, 8, 0));
  group.add(box(1550, 0.8, 3600, arrayMat, -830, -3, 0));
  group.add(box(1550, 0.8, 3600, arrayMat, 830, -3, 0));
  group.add(box(10, 420, 3400, radiatorMat, -1600, 210, 0));
  group.add(box(10, 420, 3400, radiatorMat, 1600, 210, 0));
  return group;
}
