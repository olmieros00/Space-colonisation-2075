import * as THREE from "three";
import { addInteractive, mat } from "../../core/materials.js";
import { greeble } from "../../core/greeble.js";
import { label } from "../../core/labels.js";
import { box, cyl, shadowAll } from "../../core/primitives.js";
import { openPanel } from "../../core/ui.js";
import { makeConcreteTexture, makeLogoTexture, makeSolarTexture } from "./textures.js";
import { buildRocket } from "./rocket.js";

export function buildPad(scene, interactive, travel) {
  const concrete = mat.concrete;
  const scorch = mat.scorched;
  const steel = mat.hullSteel;
  const pad = cyl(9.3, 10.4, 0.72, concrete, 8, -24, 0.36, -2);
  addInteractive(interactive, pad, "First Light Launchway", () => travel("orbit"), "Begin the climb from home soil to the Guardian Net");
  scene.add(pad);

  const trench = box(5.4, 0.58, 8.9, scorch, -24, 0.72, 2.75);
  trench.rotation.y = 0.02;
  scene.add(trench);
  scene.add(box(0.22, 0.22, 13.8, steel, -27.25, 1.08, 2.8));
  scene.add(box(0.22, 0.22, 13.8, steel, -20.75, 1.08, 2.8));
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

export function addLatticeTower(group, height, width, material, tiers = 12) {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = box(0.18, height, 0.18, material, sx * width * 0.5, height * 0.5, sz * width * 0.5);
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

export function buildTowers(scene) {
  const steel = mat.hullSteel;
  const mech = new THREE.Group();
  addLatticeTower(mech, 23, 2.6, steel, 11);
  const deck = box(4.4, 0.45, 3.3, steel, 0, 18.4, 0);
  const chopA = box(8.5, 0.28, 0.34, steel, -4.8, 17.8, -0.72);
  const chopB = box(8.5, 0.28, 0.34, steel, -4.8, 16.85, 0.72);
  const qd = box(5.6, 0.22, 0.28, steel, -3.2, 12.4, 0.1);
  qd.rotation.z = -0.08;
  mech.add(deck, chopA, chopB, qd);
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
  label(scene, "COLOSSUS CATCH TOWER", new THREE.Vector3(-17.3, 25.2, -6.2), 0.48, "subsystem");
}

export function buildFacility(scene, interactive) {
  const wall = mat.facilityWhite;
  const glass = mat.glassPanel;
  const dark = mat.darkMetal;
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
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.0), new THREE.MeshBasicMaterial({ map: makeLogoTexture("FIRST LIGHT"), transparent: true }));
  sign.position.set(12.2, 4.75, 5.37);
  building.add(sign);
  const solarMat = mat.solar.clone();
  solarMat.map = makeSolarTexture();
  for (let i = -4; i <= 4; i++) {
    const panel = box(3.0, 0.08, 2.2, solarMat, i * 3.3, 6.45, -1.3);
    panel.rotation.x = -0.08;
    building.add(panel);
  }
  for (let i = -2; i <= 2; i++) {
    building.add(box(2.2, 0.65, 1.7, dark, i * 5.8, 6.7, -3.5));
  }
  greeble(building, {
    center: new THREE.Vector3(0, 3.25, 5.43),
    normal: new THREE.Vector3(0, 0, 1),
    width: 38,
    height: 5.1,
    minSize: 0.08,
    maxSize: 0.34,
    depth: 0.018
  }, 220);
  building.position.set(9, 0, -35);
  scene.add(addInteractive(interactive, shadowAll(building), "Frontier Starbase Campus", () => openPanel(), "Open the route map from Texas to the Moon"));
  label(scene, "FIRST LIGHT CAMPUS", new THREE.Vector3(9, 9.0, -40), 0.46, "subsystem");

  const control = new THREE.Group();
  const base = box(10, 3.2, 7.5, wall, 0, 1.6, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.7, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  dome.position.y = 3.25;
  control.add(base, dome);
  control.position.set(28, 0, -26);
  scene.add(addInteractive(interactive, shadowAll(control), "Frontier Mission Control", () => openPanel(), "Choose the next human step"));
  label(scene, "FRONTIER MISSION CONTROL", new THREE.Vector3(28, 8.4, -29), 0.5, "subsystem");
}

export function buildDisplayBooster(scene) {
  const booster = buildRocket();
  booster.scale.setScalar(0.62);
  booster.position.set(29, 0.18, -37);
  booster.rotation.y = -0.2;
  scene.add(booster);
  const plinth = box(5.2, 0.35, 5.2, mat.concrete, 29, 0.18, -37);
  scene.add(plinth);
  label(scene, "HERITAGE BOOSTER", new THREE.Vector3(29, 9.8, -40.5), 0.42, "subsystem");
}

export function buildProps(scene) {
  const white = mat.whitePanel;
  const steel = mat.hullSteel;
  const dark = mat.darkMetal;
  for (let i = 0; i < 7; i++) {
    const tank = i % 2
      ? cyl(1.25, 1.25, 5.5, white, 32, 38 + i * 2.8, 2.75, -11)
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
        const wheel = cyl(0.18, 0.18, 0.16, dark, 12, x, 0.2, z);
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
    const trunk = cyl(0.07, 0.11, 0.8 + Math.random() * 0.8, dark, 6);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.55 + Math.random() * 0.5, 1.0 + Math.random() * 1.1, 7), mat.foliage);
    leaves.position.y = trunk.geometry.parameters.height + 0.45;
    shrub.add(trunk, leaves);
    shrub.position.set(THREE.MathUtils.randFloat(-68, 62), 0, THREE.MathUtils.randFloat(-58, -45));
    scene.add(shrub);
  }
  const dish = new THREE.Group();
  dish.add(cyl(0.08, 0.1, 2.2, steel, 10, 0, 1.1, 0));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
  bowl.rotation.x = 0.75;
  bowl.position.y = 2.2;
  dish.add(bowl);
  dish.position.set(42, 0, -28);
  scene.add(shadowAll(dish));
}

export function buildGround(scene) {
  const concrete = mat.concrete.clone();
  concrete.map = makeConcreteTexture();
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(150, 112), concrete);
  apron.rotation.x = -Math.PI / 2;
  apron.receiveShadow = true;
  scene.add(apron);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(230, 190), mat.sand);
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.04;
  sand.receiveShadow = true;
  scene.add(sand);
  sand.renderOrder = -1;

  const water = new THREE.Mesh(new THREE.PlaneGeometry(230, 42), mat.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.025, 65);
  scene.add(water);

  const fenceMat = mat.hullSteel;
  for (let i = -72; i <= 72; i += 4) {
    scene.add(box(0.08, 1.45, 0.08, fenceMat, i, 0.72, -42));
  }
  scene.add(box(146, 0.04, 0.06, fenceMat, 0, 1.32, -42));
  scene.add(box(146, 0.04, 0.06, fenceMat, 0, 0.75, -42));
}
