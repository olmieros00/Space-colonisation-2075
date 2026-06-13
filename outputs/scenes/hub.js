import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { addInteractive, label, mat } from "../core/materials.js";
import { openPanel } from "../core/ui.js";
import { setOrbit } from "../core/camera.js";

const DEG = Math.PI / 180;

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeConcreteTexture() {
  const tex = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#777b74";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 36000; i++) {
      const v = 96 + Math.random() * 48;
      ctx.fillStyle = `rgba(${v},${v + 2},${v - 6},${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    ctx.strokeStyle = "rgba(65,70,68,0.45)";
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 42; i++) {
      const x = w * (0.35 + Math.random() * 0.28);
      const y = h * (0.4 + Math.random() * 0.22);
      const r = 18 + Math.random() * 86;
      const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
      g.addColorStop(0, "rgba(20,18,16,0.18)");
      g.addColorStop(1, "rgba(20,18,16,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  return tex;
}

function makeSolarTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#081326");
    grad.addColorStop(0.55, "#12264a");
    grad.addColorStop(1, "#050b16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(90,130,190,0.45)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
}

function makeLogoTexture(text = "SPACEX", vertical = false) {
  return canvasTexture(vertical ? 256 : 768, vertical ? 768 : 180, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(235,238,238,0.96)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#252a30";
    ctx.font = `900 ${vertical ? 58 : 96}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (vertical) {
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, w * 0.5, h * 0.54);
      ctx.strokeStyle = "rgba(60,68,76,0.38)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.72);
      ctx.quadraticCurveTo(w * 0.58, h * 0.18, w * 0.89, h * 0.32);
      ctx.stroke();
    }
  });
}

function shadowAll(obj, cast = true, receive = false) {
  obj.traverse(o => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

function box(w, h, d, material, x = 0, y = h / 2, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(r1, r2, h, seg, material, x = 0, y = h / 2, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function configureDaylight(scene, state) {
  const sky = new Sky();
  sky.scale.setScalar(450000);
  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 25);
  const theta = THREE.MathUtils.degToRad(32);
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.turbidity.value = 2.4;
  sky.material.uniforms.rayleigh.value = 2.8;
  sky.material.uniforms.mieCoefficient.value = 0.0015;
  sky.material.uniforms.mieDirectionalG.value = 0.62;
  sky.material.uniforms.sunPosition.value.copy(sun);
  scene.add(sky);

  const pmrem = new THREE.PMREMGenerator(state.renderer);
  scene.environment = pmrem.fromScene(sky).texture;
  pmrem.dispose();

  const sunLight = new THREE.DirectionalLight(0xfff1d4, 1.65);
  sunLight.position.copy(sun).multiplyScalar(120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -82;
  sunLight.shadow.camera.right = 82;
  sunLight.shadow.camera.top = 70;
  sunLight.shadow.camera.bottom = -70;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 250;
  sunLight.shadow.bias = -0.00015;
  scene.add(sunLight);
  scene.add(new THREE.HemisphereLight(0x8fc7ff, 0xc6ad7e, 0.52));
  state.activeSun = sunLight;
}

function buildRocket() {
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xe2e3dd, metalness: 0.18, roughness: 0.36, clearcoat: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111217, metalness: 0.4, roughness: 0.42 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x59616b, metalness: 0.72, roughness: 0.34 });
  const radius = 0.52;
  const body = cyl(radius, radius, 12.6, 64, white, 0, 6.85, 0);
  const upper = cyl(radius * 1.02, radius * 1.02, 1.2, 64, white, 0, 13.75, 0);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), white);
  cap.position.y = 14.35;
  const interstage = cyl(radius * 1.03, radius * 1.03, 0.38, 64, black, 0, 12.95, 0);
  g.add(body, upper, cap, interstage);

  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 4.9), new THREE.MeshBasicMaterial({ map: makeLogoTexture("SPACEX", true), transparent: true }));
  logo.position.set(0, 7.1, radius + 0.012);
  g.add(logo);

  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const fin = box(0.055, 0.68, 0.42, black);
    fin.position.set(Math.cos(a) * 0.57, 11.9, Math.sin(a) * 0.57);
    fin.rotation.y = -a;
    g.add(fin);
  }
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = box(0.07, 2.4, 0.12, black);
    leg.position.set(Math.cos(a) * 0.62, 1.25, Math.sin(a) * 0.62);
    leg.rotation.z = Math.cos(a) * 0.18;
    leg.rotation.x = Math.sin(a) * -0.18;
    g.add(leg);
  }
  const octaweb = new THREE.Group();
  octaweb.add(cyl(radius * 1.08, radius * 1.08, 0.22, 64, black, 0, 0.2, 0));
  for (let i = 0; i < 9; i++) {
    const a = i === 0 ? 0 : (i - 1) * Math.PI / 4;
    const r = i === 0 ? 0 : 0.33;
    const nozzle = cyl(0.075, 0.12, 0.34, 18, metal, Math.cos(a) * r, -0.04, Math.sin(a) * r);
    octaweb.add(nozzle);
  }
  g.add(octaweb);
  g.userData.plumeAnchor = octaweb;
  shadowAll(g);
  return g;
}

function buildPad(scene, interactive, travel) {
  const concrete = new THREE.MeshStandardMaterial({ color: 0x777a74, roughness: 0.82, metalness: 0.03 });
  const scorch = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.95 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x606a73, metalness: 0.72, roughness: 0.36 });
  const pad = cyl(9.3, 10.4, 0.72, 8, concrete, -24, 0.36, -2);
  addInteractive(interactive, pad, "Launch Complex Colossus", () => travel("orbit"), "Ignite the Falcon-heritage Colossus ascent to orbit");
  scene.add(pad);

  const trench = box(5.4, 0.58, 8.9, scorch, -24, 0.72, 2.75);
  trench.rotation.y = 0.02;
  scene.add(trench);
  const blackHalo = new THREE.Mesh(new THREE.RingGeometry(4.2, 13.5, 80), new THREE.MeshBasicMaterial({ color: 0x0c0b0a, transparent: true, opacity: 0.24, side: THREE.DoubleSide }));
  blackHalo.rotation.x = -Math.PI / 2;
  blackHalo.position.set(-24, 0.735, 0.2);
  scene.add(blackHalo);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const clamp = box(0.55, 0.22, 1.15, steel, -24 + Math.cos(a) * 1.4, 0.98, -2 + Math.sin(a) * 1.4);
    clamp.rotation.y = -a;
    scene.add(clamp);
  }
  return pad;
}

function addLatticeTower(group, height, width, material, tiers = 12) {
  const legGeo = new THREE.BoxGeometry(0.18, height, 0.18);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, material);
      leg.position.set(sx * width * 0.5, height * 0.5, sz * width * 0.5);
      group.add(leg);
    }
  }
  for (let i = 0; i < tiers; i++) {
    const y = (i + 0.5) * (height / tiers);
    for (const z of [-1, 1]) {
      const braceA = box(width * 1.34, 0.1, 0.1, material, 0, y, z * width * 0.52);
      const braceB = braceA.clone();
      braceA.rotation.z = 0.66;
      braceB.rotation.z = -0.66;
      group.add(braceA, braceB);
    }
    for (const x of [-1, 1]) {
      const braceA = box(0.1, 0.1, width * 1.34, material, x * width * 0.52, y, 0);
      const braceB = braceA.clone();
      braceA.rotation.x = 0.66;
      braceB.rotation.x = -0.66;
      group.add(braceA, braceB);
    }
  }
}

function buildTowers(scene) {
  const steel = new THREE.MeshStandardMaterial({ color: 0x6d7882, metalness: 0.74, roughness: 0.34 });
  const mech = new THREE.Group();
  addLatticeTower(mech, 23, 2.6, steel, 11);
  const deck = box(4.4, 0.45, 3.3, steel, 0, 18.4, 0);
  const chopA = box(8.5, 0.28, 0.34, steel, -4.8, 17.8, -0.72);
  const chopB = box(8.5, 0.28, 0.34, steel, -4.8, 16.85, 0.72);
  mech.add(deck, chopA, chopB);
  mech.position.set(-17.3, 0, -3.2);
  scene.add(shadowAll(mech));

  const strongback = new THREE.Group();
  addLatticeTower(strongback, 16, 1.1, steel, 8);
  strongback.rotation.z = -0.16;
  strongback.position.set(-21.2, 0.2, -5.8);
  scene.add(shadowAll(strongback));

  const mastTops = [];
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const mast = new THREE.Group();
    addLatticeTower(mast, 24, 0.75, steel, 9);
    mast.position.set(-24 + Math.cos(a) * 14.2, 0, -2 + Math.sin(a) * 14.2);
    const tip = new THREE.Vector3(mast.position.x, 24, mast.position.z);
    mastTops.push(tip);
    scene.add(shadowAll(mast));
  }
  for (let i = 0; i < mastTops.length; i++) {
    const a = mastTops[i];
    const b = mastTops[(i + 1) % mastTops.length];
    const points = [];
    for (let j = 0; j <= 32; j++) {
      const p = j / 32;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(a.x, b.x, p),
        THREE.MathUtils.lerp(a.y, b.y, p) - Math.sin(p * Math.PI) * 2.2,
        THREE.MathUtils.lerp(a.z, b.z, p)
      ));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x4b545c, transparent: true, opacity: 0.75 })));
  }
  label(scene, "MECHAZILLA CATCH TOWER", new THREE.Vector3(-17.3, 25.2, -6.2), 0.48, "subsystem");
}

function buildFacility(scene, interactive) {
  const wall = new THREE.MeshPhysicalMaterial({ color: 0xdeddd4, metalness: 0.08, roughness: 0.44, clearcoat: 0.18 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x1e3548, metalness: 0.05, roughness: 0.08, transmission: 0.18, transparent: true, opacity: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202830, metalness: 0.35, roughness: 0.45 });
  const building = new THREE.Group();
  building.add(box(42, 6.2, 10, wall, 0, 3.1, 0));
  building.add(box(43.5, 0.18, 10.4, dark, 0, 2.35, 5.08));
  building.add(box(43.5, 0.18, 10.4, dark, 0, 4.45, 5.08));
  const glassFloor = box(39.5, 2.0, 0.18, glass, 0, 1.45, 5.16);
  building.add(glassFloor);
  for (let i = -18; i <= 18; i += 2.2) {
    building.add(box(0.07, 5.25, 0.22, dark, i, 3.0, 5.3));
  }
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.45), new THREE.MeshBasicMaterial({ map: makeLogoTexture(), transparent: true }));
  logo.position.set(-11.5, 4.6, 5.36);
  building.add(logo);
  const solarMat = new THREE.MeshStandardMaterial({ map: makeSolarTexture(), color: 0x233f6a, emissive: 0x081326, emissiveIntensity: 0.12, metalness: 0.35, roughness: 0.42 });
  for (let i = -4; i <= 4; i++) {
    const panel = box(3.0, 0.08, 2.2, solarMat, i * 3.3, 6.45, -1.3);
    panel.rotation.x = -0.08;
    building.add(panel);
  }
  for (let i = -2; i <= 2; i++) {
    building.add(box(2.2, 0.65, 1.7, dark, i * 5.8, 6.7, -3.5));
  }
  building.position.set(9, 0, -35);
  scene.add(addInteractive(interactive, shadowAll(building), "SpaceX Starbase Campus", () => openPanel(), "Open Mission Control routing panel"));

  const control = new THREE.Group();
  const base = box(10, 3.2, 7.5, wall, 0, 1.6, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.7, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  dome.position.y = 3.25;
  control.add(base, dome);
  control.position.set(28, 0, -26);
  scene.add(addInteractive(interactive, shadowAll(control), "Mission Control", () => openPanel(), "Open hub-and-spoke mission panel"));
  label(scene, "MISSION CONTROL", new THREE.Vector3(28, 8.4, -29), 0.5, "subsystem");
}

function buildDisplayBooster(scene) {
  const booster = buildRocket();
  booster.scale.setScalar(0.62);
  booster.position.set(29, 0.18, -37);
  booster.rotation.y = -0.2;
  scene.add(booster);
  const plinth = box(5.2, 0.35, 5.2, new THREE.MeshStandardMaterial({ color: 0x73766f, roughness: 0.8 }), 29, 0.18, -37);
  scene.add(plinth);
  label(scene, "DISPLAY BOOSTER", new THREE.Vector3(29, 9.8, -40.5), 0.42, "subsystem");
}

function buildProps(scene) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.22, roughness: 0.42 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x7a858d, metalness: 0.72, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.35, roughness: 0.5 });
  for (let i = 0; i < 7; i++) {
    const tank = i % 2
      ? cyl(1.25, 1.25, 5.5, 32, white, 38 + i * 2.8, 2.75, -11)
      : new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 16), white);
    if (i % 2 === 0) tank.position.set(38 + i * 2.8, 1.7, -11);
    scene.add(tank);
    scene.add(box(0.12, 0.12, 18, steel, 38 + i * 2.8, 0.65, -3));
  }
  for (let i = 0; i < 9; i++) {
    const truck = new THREE.Group();
    truck.add(box(2.2, 0.55, 1.0, i % 2 ? white : dark, 0, 0.55, 0));
    truck.add(box(0.75, 0.65, 0.95, white, 0.95, 0.85, 0));
    for (const x of [-0.72, 0.72]) {
      for (const z of [-0.46, 0.46]) {
        const wheel = cyl(0.18, 0.18, 0.16, 12, dark, x, 0.2, z);
        wheel.rotation.x = Math.PI / 2;
        truck.add(wheel);
      }
    }
    truck.position.set(-3 + i * 3.8, 0, -23 - (i % 3) * 2.4);
    truck.rotation.y = -0.15 + (i % 4) * 0.08;
    scene.add(shadowAll(truck));
  }
  for (let i = 0; i < 32; i++) {
    const shrub = new THREE.Group();
    const trunk = cyl(0.07, 0.11, 0.8 + Math.random() * 0.8, 6, dark);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.55 + Math.random() * 0.5, 1.0 + Math.random() * 1.1, 7), new THREE.MeshStandardMaterial({ color: 0x48643a, roughness: 0.9 }));
    leaves.position.y = trunk.geometry.parameters.height + 0.45;
    shrub.add(trunk, leaves);
    shrub.position.set(THREE.MathUtils.randFloat(-68, 62), 0, THREE.MathUtils.randFloat(-58, -45));
    scene.add(shrub);
  }
  const dish = new THREE.Group();
  dish.add(cyl(0.08, 0.1, 2.2, 10, steel, 0, 1.1, 0));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
  bowl.rotation.x = 0.75;
  bowl.position.y = 2.2;
  dish.add(bowl);
  dish.position.set(42, 0, -28);
  scene.add(shadowAll(dish));
}

function buildGround(scene) {
  const concrete = new THREE.MeshStandardMaterial({ map: makeConcreteTexture(), color: 0xd0cec3, roughness: 0.92, metalness: 0.02 });
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(150, 112), concrete);
  apron.rotation.x = -Math.PI / 2;
  apron.receiveShadow = true;
  scene.add(apron);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(230, 190), new THREE.MeshStandardMaterial({ color: 0xb9a476, roughness: 0.95 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.04;
  sand.receiveShadow = true;
  scene.add(sand);
  sand.renderOrder = -1;

  const water = new THREE.Mesh(new THREE.PlaneGeometry(230, 42), new THREE.MeshPhysicalMaterial({ color: 0x4d8eaa, roughness: 0.12, metalness: 0.02, transparent: true, opacity: 0.72 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.025, 65);
  scene.add(water);

  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x59616b, metalness: 0.6, roughness: 0.55 });
  for (let i = -72; i <= 72; i += 4) {
    scene.add(box(0.08, 1.45, 0.08, fenceMat, i, 0.72, -42));
  }
  scene.add(box(146, 0.04, 0.06, fenceMat, 0, 1.32, -42));
  scene.add(box(146, 0.04, 0.06, fenceMat, 0, 0.75, -42));
}

export function buildHub(scene, camera, camState, interactive, animated, UI, travel, state) {
  state.mode = "hub";
  UI.location.textContent = "STARBASE TEXAS // 2075";
  UI.returnBtn.style.display = "none";
  UI.hint.textContent = "Drag to orbit the Starbase apron. Wheel zooms. Hover the pad or Mission Control. Click the pad to launch.";
  state.renderer.setClearColor(0x9fc6e8, 1);
  state.renderer.toneMappingExposure = 0.48;
  scene.fog = new THREE.FogExp2(0xb7d5ee, 0.00035);
  configureDaylight(scene, state);
  buildGround(scene);

  buildFacility(scene, interactive);
  buildProps(scene);
  buildDisplayBooster(scene);
  buildPad(scene, interactive, travel);

  const rocket = buildRocket();
  rocket.position.set(-24, 0.55, -2);
  state.hubRocket = rocket;
  scene.add(addInteractive(interactive, rocket, "Colossus Launch Vehicle", () => travel("orbit"), "Click to ignite and ascend into Earth orbit"));

  buildTowers(scene);
  label(scene, "LAUNCH COMPLEX COLOSSUS", new THREE.Vector3(-24, 17.4, -7.5), 0.62, "hero");
  setOrbit(new THREE.Vector3(-24, 6.1, -3), 44, 18, 82, 0.15, 0.95);
}
