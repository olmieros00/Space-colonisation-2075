import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mat } from "../../core/materials.js";

function satCanvasTexture(draw) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  draw(canvas.getContext("2d"), canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

const mliMap = satCanvasTexture((ctx, w, h) => {
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 320; i++) {
    const x = (Math.sin(i * 41.7) * 0.5 + 0.5) * w;
    const y = (Math.sin(i * 17.3 + 2.1) * 0.5 + 0.5) * h;
    ctx.strokeStyle = i % 2 ? "rgba(255,238,150,.22)" : "rgba(65,44,8,.24)";
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(i * 5.1) * 42, y + Math.cos(i * 3.9) * 18);
    ctx.stroke();
  }
});

const solarMap = satCanvasTexture((ctx, w, h) => {
  ctx.fillStyle = "#102243";
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x <= w; x += w / 12) {
    ctx.strokeStyle = "rgba(180,210,255,.22)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += h / 8) {
    ctx.strokeStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
});

const goldMli = mat.goldMli.clone();
goldMli.map = mliMap;
const carbon = mat.carbonPanel;
const frame = mat.hullSteel;
const darkGlass = mat.sensorGlass.clone();
darkGlass.emissive = new THREE.Color(0x10284a);
darkGlass.emissiveIntensity = 0.3;
const solar = mat.solar.clone();
solar.map = solarMap;
solar.emissiveIntensity = 0.48;
const white = mat.whitePanel;
const amberPrime = mat.amber;

function satRounded(w, h, d, material, x = 0, y = 0, z = 0, radius = 0.018) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * radius), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function satCylinder(radiusTop, radiusBottom, height, material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addPanelLines(parent, sx, sy, z, scale) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x11151c, transparent: true, opacity: 0.7 });
  for (let i = -1; i <= 1; i++) parent.add(satRounded(sx * 0.03, sy * 0.92, scale * 0.012, lineMat, i * sx * 0.24, 0, z, 0.01));
  for (let i = -1; i <= 1; i++) parent.add(satRounded(sx * 0.92, sy * 0.025, scale * 0.012, lineMat, 0, i * sy * 0.25, z, 0.01));
}

function satAddSolarWing(parent, side, span, bodyY, prime = false) {
  const root = new THREE.Group();
  const panelCount = prime ? 4 : 3;
  const panelW = span * (prime ? 0.105 : 0.12);
  const panelH = span * 0.27;
  const gap = span * 0.018;
  const boom = satRounded(span * 0.018, bodyY * 0.8 + panelCount * (panelW + gap), span * 0.018, frame);
  boom.position.y = side * (bodyY * 0.52 + (panelCount * (panelW + gap)) * 0.5);
  const hinge = satCylinder(span * 0.035, span * 0.035, span * 0.075, frame, 18);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.y = side * bodyY * 0.58;
  const trussA = satRounded(span * 0.012, span * 0.26, span * 0.012, frame, span * 0.08, side * bodyY * 1.25, 0, 0.01);
  trussA.rotation.z = side * 0.55;
  const trussB = satRounded(span * 0.012, span * 0.26, span * 0.012, frame, -span * 0.08, side * bodyY * 1.25, 0, 0.01);
  trussB.rotation.z = -side * 0.55;
  root.add(boom, hinge, trussA, trussB);
  for (let i = 0; i < panelCount; i++) {
    const y = side * (bodyY * 0.72 + (i + 0.5) * (panelW + gap));
    const panel = satRounded(panelH, panelW, span * 0.012, solar, 0, y, 0, 0.01);
    root.add(panel);
    addPanelLines(root, panelH, panelW, span * 0.01, span);
    root.children.slice(-6).forEach(line => line.position.y += y);
    root.add(satRounded(panelH * 1.08, span * 0.015, span * 0.018, frame, 0, y + side * panelW * 0.52, 0, 0.01));
    root.add(satRounded(panelH * 1.08, span * 0.015, span * 0.018, frame, 0, y - side * panelW * 0.52, 0, 0.01));
    root.add(satRounded(span * 0.014, panelW * 1.05, span * 0.018, frame, panelH * 0.52, y, 0, 0.01));
    root.add(satRounded(span * 0.014, panelW * 1.05, span * 0.018, frame, -panelH * 0.52, y, 0, 0.01));
  }
  parent.add(root);
}

function addPayloadStack(parent, span, bodyZ, prime) {
  const aperture = satCylinder(span * 0.09, span * 0.125, span * 0.12, white, 32);
  aperture.rotation.x = Math.PI / 2;
  aperture.position.z = bodyZ * 0.7;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(span * 0.065, 32), darkGlass);
  lens.position.z = bodyZ * 0.765;
  const dishArm = satCylinder(span * 0.01, span * 0.01, span * 0.22, frame, 12);
  dishArm.rotation.x = Math.PI / 2;
  dishArm.position.set(-span * 0.18, 0, bodyZ * 0.55);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(span * (prime ? 0.11 : 0.085), 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
  dish.rotation.x = Math.PI / 2;
  dish.position.set(-span * 0.18, 0, bodyZ * 0.74);
  parent.add(aperture, lens, dishArm, dish);
}

function addPropulsion(parent, span, bodyX, bodyY, bodyZ) {
  const thrusterMat = mat.darkMetal;
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      const nozzle = satCylinder(span * 0.025, span * 0.012, span * 0.06, thrusterMat, 16);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(x * bodyX * 0.48, y * bodyY * 0.42, -bodyZ * 0.58);
      parent.add(nozzle);
      const vertexJet = satCylinder(span * 0.009, span * 0.006, span * 0.075, thrusterMat, 12);
      vertexJet.rotation.z = Math.PI / 2;
      vertexJet.position.set(x * bodyX * 0.68, y * bodyY * 0.55, zSign(y) * bodyZ * 0.35);
      parent.add(vertexJet);
    }
  }
  for (const x of [-0.26, 0.26]) {
    const tank = satCylinder(span * 0.055, span * 0.055, span * 0.22, mat.white, 24);
    tank.position.set(x * span, -bodyY * 0.62, -bodyZ * 0.05);
    parent.add(tank);
  }
}

function zSign(v) {
  return v > 0 ? 1 : -1;
}

function addBusDetail(parent, span, bodyX, bodyY, bodyZ, prime) {
  parent.add(satRounded(bodyX * 1.34, bodyY * 1.22, span * 0.055, carbon, 0, 0, -bodyZ * 0.66, 0.03));
  parent.add(satRounded(bodyX * 1.18, bodyY * 0.18, span * 0.038, frame, 0, bodyY * 0.58, -bodyZ * 0.12, 0.02));
  parent.add(satRounded(bodyX * 1.18, bodyY * 0.18, span * 0.038, frame, 0, -bodyY * 0.58, -bodyZ * 0.12, 0.02));
  parent.add(satRounded(bodyX * 1.06, bodyY * 1.04, span * 0.018, carbon, 0, 0, -bodyZ * 0.54));
  parent.add(satRounded(bodyX * 0.9, bodyY * 0.18, span * 0.018, darkGlass, 0, bodyY * 0.38, bodyZ * 0.54));
  parent.add(satRounded(bodyX * 0.72, bodyY * 0.12, span * 0.018, darkGlass, 0, -bodyY * 0.36, bodyZ * 0.54));
  for (const x of [-0.34, 0, 0.34]) {
    const radiator = satRounded(bodyX * 0.17, bodyY * 0.72, span * 0.012, white, x * bodyX, -bodyY * 0.02, bodyZ * 0.565, 0.01);
    parent.add(radiator);
  }
  for (const x of [-0.42, 0.42]) {
    for (const y of [-0.34, 0.34]) {
      const wheelVent = satCylinder(span * 0.028, span * 0.028, span * 0.012, carbon, 24);
      wheelVent.rotation.x = Math.PI / 2;
      wheelVent.position.set(x * bodyX, y * bodyY, -bodyZ * 0.575);
      parent.add(wheelVent);
    }
  }
  const mast = satCylinder(span * 0.008, span * 0.008, span * (prime ? 0.42 : 0.28), frame, 12);
  mast.position.set(bodyX * 0.36, bodyY * 0.18, -bodyZ * 0.74);
  const tracker = satRounded(span * 0.055, span * 0.04, span * 0.04, darkGlass, bodyX * 0.36, bodyY * 0.18, -bodyZ * 0.94, 0.02);
  parent.add(mast, tracker);
}

function addHexAvionicsTower(parent, span, bodyZ) {
  const tower = satCylinder(span * 0.11, span * 0.13, span * 0.26, goldMli, 6);
  tower.rotation.x = Math.PI / 2;
  tower.position.set(0, 0, -bodyZ * 0.92);
  const cap = satCylinder(span * 0.13, span * 0.13, span * 0.018, carbon, 32);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0, -bodyZ * 1.06);
  parent.add(tower, cap);
  for (const x of [-0.11, 0.11]) {
    const bottle = satCylinder(span * 0.035, span * 0.035, span * 0.18, white, 18);
    bottle.position.set(x * span, span * 0.08, -bodyZ * 0.98);
    parent.add(bottle);
  }
}

function addPrimeCrossArrays(parent, span, bodyX) {
  for (const side of [-1, 1]) {
    const panel = satRounded(span * 0.12, span * 0.42, span * 0.012, solar, side * bodyX * 1.1, 0, -span * 0.02, 0.01);
    panel.rotation.z = Math.PI / 2;
    parent.add(panel);
  }
}

export function buildSatelliteModel(R, prime = false) {
  const g = new THREE.Group();
  const span = (prime ? 0.08 : 0.045) * R;
  const bodyX = span * (prime ? 0.18 : 0.16);
  const bodyY = span * 0.22;
  const bodyZ = span * (prime ? 0.32 : 0.28);
  const busMat = prime ? amberPrime : goldMli;
  const bus = satRounded(bodyX, bodyY, bodyZ, busMat, 0, 0, 0, 0.08);
  g.add(bus);
  satAddSolarWing(g, 1, span, bodyY, prime);
  satAddSolarWing(g, -1, span, bodyY, prime);
  if (prime) addPrimeCrossArrays(g, span, bodyX);
  addBusDetail(g, span, bodyX, bodyY, bodyZ, prime);
  addPayloadStack(g, span, bodyZ, prime);
  addPropulsion(g, span, bodyX, bodyY, bodyZ);
  addHexAvionicsTower(g, span, bodyZ);
  g.userData.primaryBody = bus;
  g.userData.boundingRadius = span * (prime ? 0.48 : 0.36);
  return g;
}
