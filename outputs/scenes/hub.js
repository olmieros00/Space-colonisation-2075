import * as THREE from "three";
import { addInteractive, addLights, glowRing, label, makeParticles, makeStars, mat } from "../core/materials.js";
import { openPanel } from "../core/ui.js";
import { setOrbit } from "../core/camera.js";

function buildRocket() {
  const g = new THREE.Group();
  const radius = 0.46;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 11.7, 48), mat.white);
  body.position.y = 6.15;
  g.add(body);
  const fairing = new THREE.Group();
  const fairingCyl = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, 1.05, 48), mat.white);
  fairingCyl.position.y = 12.55;
  const fairingCap = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat.white);
  fairingCap.position.y = 13.08;
  fairing.add(fairingCyl, fairingCap);
  g.add(fairing);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.48, 0.35), mat.black);
    const a = i * Math.PI / 2;
    fin.position.set(Math.cos(a) * 0.5, 10.85, Math.sin(a) * 0.5);
    fin.rotation.y = -a;
    g.add(fin);
  }
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.15, 0.08), mat.black);
    const a = i * Math.PI / 2 + Math.PI / 4;
    leg.position.set(Math.cos(a) * 0.47, 1.25, Math.sin(a) * 0.47);
    leg.rotation.z = Math.cos(a) * 0.12;
    leg.rotation.x = Math.sin(a) * -0.12;
    g.add(leg);
  }
  const interstage = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.34, 48), mat.black);
  interstage.position.y = 11.8;
  g.add(interstage);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.035, 5.2, 0.035), mat.black);
  stripe.position.set(0, 6.2, radius + 0.012);
  g.add(stripe);
  const octaweb = new THREE.Group();
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, 0.18, 48), mat.black);
  baseRing.position.y = 0.2;
  octaweb.add(baseRing);
  for (let i = 0; i < 8; i++) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 12), mat.black);
    const a = i * Math.PI / 4;
    nozzle.position.set(Math.cos(a) * 0.29, 0.02, Math.sin(a) * 0.29);
    octaweb.add(nozzle);
  }
  g.add(octaweb);
  g.userData.plumeAnchor = octaweb;
  return g;
}

export function buildHub(scene, camera, camState, interactive, animated, UI, travel, state) {
  makeStars(scene);
  state.mode = "hub";
  UI.location.textContent = "STARBASE TEXAS // 2075";
  UI.returnBtn.style.display = "none";
  UI.hint.textContent = "Drag to orbit Starbase. Wheel zooms. Hover amber targets. Click Mission Control, the Colossus pad, or mission cards to travel.";
  addLights(scene, state, true);
  state.renderer.setClearColor(0x11151d, 1);
  scene.fog = new THREE.FogExp2(0x11151d, 0.012);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 110), new THREE.MeshStandardMaterial({ color: 0x343b46, roughness: 0.88 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = -70; i <= 70; i += 10) {
    const lineA = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 110), mat.beskar);
    lineA.position.set(i, 0.025, 0);
    const lineB = new THREE.Mesh(new THREE.BoxGeometry(150, 0.035, 0.035), mat.beskar);
    lineB.position.set(0, 0.026, i * 0.75);
    scene.add(lineA, lineB);
  }

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.5, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0x555b62, roughness: 0.82 }));
  pad.position.set(-24, 0.25, -2);
  scene.add(addInteractive(interactive, pad, "Launch Complex Colossus", () => travel("orbit"), "Falcon-9-heritage megalaunch pad"));
  const trench = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.72, 8.4), new THREE.MeshStandardMaterial({ color: 0x101217, roughness: 0.9 }));
  trench.position.set(-24, 0.52, 2.7);
  scene.add(trench);
  const rocket = buildRocket();
  rocket.position.set(-24, 0.55, -2);
  state.hubRocket = rocket;
  scene.add(rocket);

  const tower = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const y = 1.3 + i * 1.85;
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.65, 0.32), mat.beskar);
    mast.position.set(0, y, 0);
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), mat.beskar);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), mat.beskar);
    crossA.position.y = y + 0.62;
    crossB.position.y = y + 0.62;
    tower.add(mast, crossA, crossB);
  }
  tower.position.set(-18.2, 0, -2.2);
  scene.add(tower);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 18, 12), mat.white);
    mast.position.set(-24 + Math.cos(a) * 11.8, 9, -2 + Math.sin(a) * 11.8);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8), mat.white);
    cap.position.set(mast.position.x, 18.2, mast.position.z);
    scene.add(mast, cap);
  }
  label(scene, "LAUNCH COMPLEX COLOSSUS", new THREE.Vector3(-24, 16.8, -7), 0.75);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat.glass);
  dome.position.set(13, 0.22, -12);
  scene.add(addInteractive(interactive, dome, "Mission Control Dome", () => openPanel(), "Open hub-and-spoke mission panel"));
  const domeGlow = glowRing(5.55, 0.05);
  domeGlow.rotation.x = Math.PI / 2;
  domeGlow.position.copy(dome.position);
  scene.add(domeGlow);
  label(scene, "MISSION CONTROL DOME", new THREE.Vector3(13, 7.2, -16), 0.66);

  const mech = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.2), mat.beskar);
    b.position.y = 1.2 + i * 2.2;
    mech.add(b);
  }
  const chopA = new THREE.Mesh(new THREE.BoxGeometry(7, 0.28, 0.34), mat.beskar);
  const chopB = chopA.clone();
  chopA.position.set(-3.5, 18.2, -0.55);
  chopB.position.set(-3.5, 17.3, 0.55);
  mech.add(chopA, chopB);
  mech.position.set(29, 0, 13);
  scene.add(mech);
  label(scene, "MECHAZILLA TOWER", new THREE.Vector3(29, 22, 13), 0.58);

  const hangar = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 10), mat.white);
  hangar.position.set(-30, 2, 24);
  const hangarStrip = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 0.08), mat.black);
  hangarStrip.position.set(-30, 3.4, 18.95);
  scene.add(hangar, hangarStrip);
  for (let i = 0; i < 10; i++) {
    const tank = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 12), mat.white);
    tank.scale.y = 0.75;
    tank.position.set(-45 + i * 4, 1.4, -25);
    scene.add(tank);
  }
  label(scene, "CREW QUARTERS & FUEL FARMS", new THREE.Vector3(-28, 5, 25), 0.58);
  makeParticles(scene, animated, 260, 120, 0xb6bdc4);
  setOrbit(new THREE.Vector3(0, 4, 0), 64, 30, 110, 0.62, 0.55);
}
