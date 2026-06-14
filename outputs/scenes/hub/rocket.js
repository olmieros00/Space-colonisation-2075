import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { box, cyl, shadowAll } from "../../core/primitives.js";
import { canvasTexture, makeLogoTexture } from "./textures.js";

function makeRocketSkin() {
  const tex = canvasTexture(512, 2048, (ctx, w, h) => {
    ctx.fillStyle = "#f0f1ea";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(42,46,50,0.28)";
    ctx.lineWidth = 4;
    for (let y of [190, 480, 760, 1120, 1430, 1690]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = "#111217";
    ctx.fillRect(0, 1510, w, 72);
    ctx.fillRect(0, 250, w, 38);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = "rgba(80,88,92,0.16)";
      ctx.fillRect(x, y, 2 + Math.random() * 6, 1);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function addBand(group, y, r, h, material) {
  group.add(cyl(r, r, h, material, 96, 0, y, 0));
}

function addGridFins(group, y, radius, material) {
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const fin = new THREE.Group();
    fin.add(box(0.08, 0.78, 0.82, material, 0, 0, 0));
    for (let j = -1; j <= 1; j++) fin.add(box(0.1, 0.82, 0.035, material, 0, 0, j * 0.25));
    fin.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    fin.rotation.y = -a;
    group.add(fin);
  }
}

function addEngineSection(group, radius, black, metal) {
  const skirt = cyl(radius * 1.04, radius * 1.0, 0.82, black, 96, 0, 0.45, 0);
  group.add(skirt);
  for (let i = 0; i < 13; i++) {
    const a = i === 0 ? 0 : (i - 1) * Math.PI / 6;
    const r = i === 0 ? 0 : radius * 0.55;
    const nozzle = cyl(0.075, 0.17, 0.58, metal, 24, Math.cos(a) * r, -0.12, Math.sin(a) * r);
    group.add(nozzle);
  }
}

function addLandingFins(group, radius, black) {
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const fin = box(0.1, 1.8, 0.76, black, Math.cos(a) * (radius + 0.05), 1.25, Math.sin(a) * (radius + 0.05));
    fin.rotation.y = -a;
    fin.rotation.z = Math.cos(a) * -0.18;
    fin.rotation.x = Math.sin(a) * 0.18;
    group.add(fin);
  }
}

function addDecals(group, radius) {
  const vertical = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 7.6),
    new THREE.MeshBasicMaterial({ map: makeLogoTexture("FRONTIER", true), transparent: true })
  );
  vertical.position.set(0, 9.1, radius + 0.018);
  group.add(vertical);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.74),
    new THREE.MeshBasicMaterial({ map: makeLogoTexture("FIRST LIGHT"), transparent: true })
  );
  badge.position.set(0, 18.1, radius + 0.02);
  group.add(badge);
}

export function buildRocket() {
  const group = new THREE.Group();
  const skin = makeRocketSkin();
  const white = mat.rocketWhite.clone();
  white.map = skin;
  const black = mat.darkMetal;
  const metal = mat.hullSteel;
  const radius = 0.92;
  group.add(cyl(radius, radius, 15.4, white, 128, 0, 8.0, 0));
  group.add(cyl(radius * 0.96, radius * 0.96, 6.2, white, 128, 0, 18.8, 0));
  group.add(new THREE.Mesh(new THREE.ConeGeometry(radius * 0.97, 2.9, 128), white));
  group.children[group.children.length - 1].position.y = 23.35;
  addBand(group, 15.9, radius * 1.03, 0.45, black);
  addBand(group, 21.9, radius * 0.97, 0.2, black);
  addEngineSection(group, radius, black, metal);
  addLandingFins(group, radius, black);
  addGridFins(group, 13.9, radius + 0.22, black);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const pipe = cyl(0.018, 0.018, 10.5, metal, 10, Math.cos(a) * (radius + 0.035), 7.1, Math.sin(a) * (radius + 0.035));
    group.add(pipe);
  }
  addDecals(group, radius);
  group.userData.plumeAnchor = group;
  group.userData.engineWorldOffset = new THREE.Vector3(0, 0.25, 0);
  return shadowAll(group);
}
