import * as THREE from "three";
import { addInteractive, glowRing, mat } from "../core/materials.js";
import { applyHDRIEnvironment } from "../core/assets.js";
import { label } from "../core/labels.js";
import { box, cyl } from "../core/primitives.js";
import { makeEnv } from "../core/pbr.js";
import { setOrbit } from "../core/camera.js";

const TWO_PI = Math.PI * 2;
const GATEWAY_BOUNDS = {
  min: new THREE.Vector3(-2.15, 1.55, -34.0),
  max: new THREE.Vector3(2.15, 4.25, 5.5)
};

function addSealedShell(scene) {
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(16, 7, 45),
    new THREE.MeshBasicMaterial({ color: 0x2b3038, side: THREE.BackSide })
  );
  hull.position.set(0, 2.9, -13.8);
  scene.add(hull);
  scene.add(box(15, 0.12, 45, mat.white, 0, -0.1, -13.8));
  scene.add(box(15, 0.12, 45, mat.white, 0, 5.82, -13.8));
  scene.add(box(0.16, 6.0, 45, mat.white, -7.35, 2.8, -13.8));
  scene.add(box(0.16, 6.0, 45, mat.white, 7.35, 2.8, -13.8));
}

function makeLineTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = 512;
  cnv.height = 512;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#050609";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#e8e8e0";
  ctx.lineWidth = 10;
  for (let i = -1; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 128, 512);
    ctx.lineTo(i * 128 + 280, 0);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 10);
  return tex;
}

function makePanelTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = 512;
  cnv.height = 512;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#f1e6c8";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(125,104,70,0.45)";
  ctx.lineWidth = 7;
  for (let x = 0; x <= 512; x += 128) {
    for (let y = 0; y <= 512; y += 128) {
      ctx.strokeRect(x + 8, y + 8, 112, 112);
      ctx.beginPath();
      ctx.arc(x + 64, y + 64, 10, 0, TWO_PI);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 5);
  return tex;
}

function addLightbox(scene, x, y, z, w, h, rotX = 0, rotY = 0) {
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lightMat);
  panel.position.set(x, y, z);
  panel.rotation.set(rotX, rotY, 0);
  scene.add(panel);
  const light = new THREE.PointLight(0xffffff, 0.28, Math.max(w, h) * 3);
  light.position.set(x, y - 0.12, z);
  scene.add(light);
}

function addReceptionLounge(scene) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f3ec, metalness: 0.04, roughness: 0.18, clearcoat: 0.5 });
  const mirror = new THREE.MeshPhysicalMaterial({ color: 0xf2f4f4, metalness: 0.25, roughness: 0.12, clearcoat: 0.7 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.22, roughness: 0.36 });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xb8232f, metalness: 0.04, roughness: 0.3, clearcoat: 0.35 });
  const floor = box(14, 0.14, 10, white, 0, -0.04, 4.8);
  scene.add(floor);
  for (let x = -6; x <= 6; x += 3) scene.add(box(0.035, 0.012, 10.1, black, x, 0.05, 4.8));
  for (let z = 0; z <= 9; z += 2.5) scene.add(box(14.1, 0.014, 0.035, black, 0, 0.052, z));
  scene.add(box(14.4, 5.2, 0.22, mirror, 0, 2.55, 9.9));
  scene.add(box(0.22, 5.2, 10.2, mirror, -7.1, 2.55, 4.8));
  scene.add(box(0.22, 5.2, 10.2, mirror, 7.1, 2.55, 4.8));
  scene.add(box(14.4, 0.20, 10.2, white, 0, 5.25, 4.8));
  for (let x = -4.5; x <= 4.5; x += 3) addLightbox(scene, x, 5.14, 4.8, 2.1, 1.0, -Math.PI / 2);

  const desk = new THREE.Group();
  desk.add(box(4.5, 1.0, 0.78, white, 0, 0.5, 0));
  desk.add(box(4.8, 0.08, 0.95, black, 0, 1.04, 0));
  desk.position.set(-2.8, 0, 7.5);
  scene.add(desk);

  for (let i = 0; i < 5; i++) {
    const chair = new THREE.Group();
    const seat = cyl(0.46, 0.52, 0.45, red, 28, 0, 0, 0);
    seat.scale.z = 0.7;
    const back = box(0.92, 0.74, 0.12, red, 0, 0.74, -0.36);
    back.rotation.x = -0.28;
    chair.add(seat, back);
    chair.position.set(-4 + (i % 3) * 4, 0.25, 2.2 + Math.floor(i / 3) * 2.8);
    chair.rotation.y = i * 0.65;
    scene.add(chair);
  }

  for (const [x, z] of [[-1.6, 2.9], [3.8, 3.3], [-4.6, 5.1]]) {
    const table = new THREE.Group();
    table.add(cyl(0.08, 0.08, 0.58, white, 20, 0, 0, 0));
    const top = cyl(0.62, 0.62, 0.08, white, 36, 0, 0, 0);
    top.position.y = 0.62;
    table.add(top);
    table.position.set(x, 0.02, z);
    scene.add(table);
  }

  label(scene, "GATEWAY STATION · THE CROSSING", new THREE.Vector3(0, 3.2, 9.72), 0.46, "subsystem");
}

function addCurvedCorridor(scene) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ea, metalness: 0.04, roughness: 0.23, clearcoat: 0.35 });
  const glass = new THREE.MeshBasicMaterial({ color: 0x57d8ff, transparent: true, opacity: 0.78 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.3, roughness: 0.45 });
  for (let i = 0; i < 18; i++) {
    const p = i / 17;
    const angle = p * Math.PI * 0.58;
    const z = -0.6 - p * 11.5;
    const y = Math.sin(angle) * 2.6;
    const floor = box(5.9, 0.14, 0.72, white, 0, y, z);
    floor.rotation.x = -Math.sin(angle) * 0.34;
    scene.add(floor);
    const ceiling = box(5.9, 0.12, 0.72, white, 0, y + 4.5, z);
    ceiling.rotation.x = floor.rotation.x;
    scene.add(ceiling);
    for (const side of [-1, 1]) {
      const wall = box(0.14, 4.4, 0.72, white, side * 3.0, y + 2.2, z);
      wall.rotation.x = floor.rotation.x;
      scene.add(wall);
    }
    if (i % 2 === 0) {
      addLightbox(scene, -1.55, y + 4.38, z, 1.2, 0.32, -Math.PI / 2 + floor.rotation.x);
      addLightbox(scene, 1.55, y + 4.38, z, 1.2, 0.32, -Math.PI / 2 + floor.rotation.x);
    }
    if (i % 3 === 0) {
      const console = box(0.08, 0.85, 1.05, dark, -2.86, y + 1.15, z);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.32), glass);
      screen.position.set(-2.92, y + 1.36, z);
      screen.rotation.y = Math.PI / 2;
      scene.add(console, screen);
    }
  }
  label(scene, "SPINWARD WALKWAY", new THREE.Vector3(0, 5.7, -6.2), 0.42, "subsystem");
}

function addOctagonalTunnel(scene) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f1eb, metalness: 0.04, roughness: 0.24, clearcoat: 0.38 });
  const blackFloor = new THREE.MeshStandardMaterial({ map: makeLineTexture(), color: 0xffffff, metalness: 0.2, roughness: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.28, roughness: 0.42 });
  const radius = 3.05;
  const length = 9.5;
  const centerZ = -17.2;
  for (let side = 0; side < 8; side++) {
    const a = side * TWO_PI / 8 + Math.PI / 8;
    const material = side % 2 ? white : black;
    const panel = box(2.45, 0.12, length, material, Math.cos(a) * radius, 2.6 + Math.sin(a) * radius, centerZ);
    panel.rotation.z = a + Math.PI / 2;
    scene.add(panel);
  }
  const floor = box(5.4, 0.10, length + 0.2, blackFloor, 0, 0.02, centerZ);
  scene.add(floor);
  for (let z = centerZ - length * 0.45; z <= centerZ + length * 0.45; z += 1.3) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.035, 8, 8), white);
    ring.position.set(0, 2.6, z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
  }
  for (let z = -21; z <= -13.8; z += 2) {
    addLightbox(scene, 0, 5.38, z, 2.4, 0.38, -Math.PI / 2);
  }
}

function addPaddedSection(scene) {
  const padMat = new THREE.MeshStandardMaterial({ map: makePanelTexture(), color: 0xffffff, roughness: 0.64, metalness: 0.02 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f1eb, metalness: 0.04, roughness: 0.26, clearcoat: 0.34 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.28, roughness: 0.42 });
  const centerZ = -25.2;
  scene.add(box(5.7, 0.12, 6.2, dark, 0, 0.03, centerZ));
  for (const side of [-1, 1]) {
    const wall = box(0.16, 3.8, 6.2, padMat, side * 2.92, 2.0, centerZ);
    scene.add(wall);
    const hatch = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.06, 16, 48), white);
    hatch.position.set(side * 2.81, 2.08, centerZ - 1.25);
    hatch.rotation.y = Math.PI / 2;
    scene.add(hatch);
  }
  scene.add(box(5.9, 0.16, 6.2, padMat, 0, 4.0, centerZ));
  label(scene, "SOFT DOCK AIRLOCK", new THREE.Vector3(0, 4.9, centerZ - 1.3), 0.38, "telemetry");
}

function addMoonHologram(scene, interactive, animated, assets) {
  const table = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f1eb, metalness: 0.04, roughness: 0.25, clearcoat: 0.4 });
  const glass = new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.18 });
  table.add(cyl(0.18, 0.18, 1.0, white, 24, 0, 0, 0));
  const top = cyl(1.55, 1.55, 0.10, white, 48, 0, 0, 0);
  top.position.y = 1.0;
  table.add(top);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.02, 48), glass);
  dish.position.y = 1.08;
  table.add(dish);
  table.position.set(4.2, 0, 5.4);
  scene.add(table);

  const moonHolo = assets.moonMesh(0.82);
  moonHolo.material.transparent = true;
  moonHolo.material.opacity = 0.62;
  moonHolo.position.set(4.2, 1.98, 5.4);
  scene.add(addInteractive(interactive, moonHolo, "Imbrium Approach Table", null, "A quiet map of the place where the Moon becomes home"));
  const marker = glowRing(0.22, 0.012);
  marker.position.set(4.76, 2.18, 5.82);
  marker.rotation.y = Math.PI / 2.6;
  marker.userData.tick = (t) => marker.scale.setScalar(1 + Math.sin(t * 3) * 0.18);
  animated.push(marker);
  scene.add(marker);
}

function addShuttleDock(scene, interactive, travel) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f1eb, metalness: 0.12, roughness: 0.32, clearcoat: 0.36 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.35, roughness: 0.42 });
  const bay = new THREE.Group();
  bay.add(box(9.8, 4.8, 0.22, white, 0, 2.4, -34.2));
  bay.add(box(0.22, 4.8, 8.5, white, -4.9, 2.4, -30.1));
  bay.add(box(0.22, 4.8, 8.5, white, 4.9, 2.4, -30.1));
  bay.add(box(9.8, 0.18, 8.5, white, 0, 4.8, -30.1));
  for (let x = -3.2; x <= 3.2; x += 3.2) addLightbox(scene, x, 4.68, -30.1, 1.6, 0.45, -Math.PI / 2);
  scene.add(bay);

  const shuttle = new THREE.Group();
  const fuselage = cyl(0.62, 0.78, 5.4, white, 36, 0, 0, 0);
  fuselage.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.70, 1.1, 36), white);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -3.22;
  const wing = box(4.5, 0.13, 1.15, black, 0, -0.28, -0.25);
  const tail = box(0.16, 1.0, 0.9, black, 0, 0.72, 1.6);
  shuttle.add(fuselage, nose, wing, tail);
  shuttle.position.set(0, 1.42, -30.3);
  scene.add(shuttle);
  addInteractive(interactive, fuselage, "Imbrium Transit", () => travel("moon"), "Docked lunar shuttle — click to cross the last dark");
  label(scene, "IMBRIUM // TRANSIT", new THREE.Vector3(0, 3.65, -30.3), 0.62, "hero");
}

export function buildGateway(scene, camera, camState, interactive, animated, UI, travel, state, assets) {
  state.mode = "gateway";
  UI.location.textContent = "GATEWAY // THE CROSSING";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Look through the bright transfer concourse. Hover displays. Click Imbrium Transit when the Moon starts calling.";
  state.renderer.setClearColor(0xf2f2ec, 1);
  state.renderer.toneMappingExposure = 0.46;
  scene.background = new THREE.Color(0xd8d8d2);
  scene.fog = new THREE.FogExp2(0xf2f2ec, 0.0025);
  applyHDRIEnvironment(scene, "interior", () => makeEnv(scene, state.renderer, "interior"));
  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe8b0, 0.58));

  addSealedShell(scene);
  addReceptionLounge(scene);
  addMoonHologram(scene, interactive, animated, assets);
  addCurvedCorridor(scene);
  addOctagonalTunnel(scene);
  addPaddedSection(scene);
  addShuttleDock(scene, interactive, travel);

  setOrbit(new THREE.Vector3(0, 2.55, -23.5), 4.0, 2.4, 4.8, 0.03, 0.02, GATEWAY_BOUNDS, { min: -0.24, max: 0.34 });
}
