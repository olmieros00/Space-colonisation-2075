import * as THREE from "three";
import { addLights, glowRing, makeParticles, makeStars, mat } from "../core/materials.js";
import { applyHDRIEnvironment } from "../core/assets.js";
import { label } from "../core/labels.js";
import { makeEnv } from "../core/pbr.js";
import { setOrbit } from "../core/camera.js";

export function buildMoon(scene, camera, camState, interactive, animated, UI, travel, state, assets) {
  makeStars(scene);
  state.mode = "moon";
  UI.location.textContent = "MARE IMBRIUM // HAVEN OUTPOST";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Circle the Mare Imbrium shelter. Wheel closer until Earth hangs over the roofline.";
  addLights(scene, state);
  applyHDRIEnvironment(scene, "space", () => makeEnv(scene, state.renderer, "space"));
  state.renderer.setClearColor(0x010207, 1);
  scene.fog = new THREE.FogExp2(0x010207, 0.012);
  UI.welcome.classList.remove("show");

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180, 72, 72), mat.regolith);
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.22) * 0.16 + Math.cos(pos.getY(i) * 0.18) * 0.18 + Math.random() * 0.08);
  ground.geometry.computeVertexNormals();
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const earth = assets.earthMesh(5.5, animated, state);
  earth.position.set(-12, 22, -45);
  scene.add(earth);
  const flare = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 12), new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.65 }));
  flare.position.set(-6.2, 25.2, -41.4);
  flare.scale.set(4, 0.22, 0.22);
  scene.add(flare);

  const pit = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 1.1, 64), mat.moonPit);
  pit.position.set(10, -0.55, -12);
  scene.add(pit);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5.8, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat.cream);
  dome.scale.set(1.35, 0.62, 1);
  dome.position.set(10, 0.12, -12);
  scene.add(dome);
  const module = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 4.3, 28), mat.whitePanel);
  module.rotation.z = Math.PI / 2;
  module.position.set(18.5, 1.15, -10.7);
  scene.add(module);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 5.2, 24), mat.hullSteel);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(15, 0.92, -11.3);
  scene.add(tube);
  state.hotelEntrance.set(5.2, 0, -7.4);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.2, 0.18), mat.dark);
  sign.position.set(3.3, 1.3, -5.7);
  scene.add(sign);
  label(scene, "IMBRIUM HAVEN · FIRST OPEN LUNAR ADDRESS", new THREE.Vector3(3.3, 2.55, -5.55), 0.43, "subsystem");
  label(scene, "CREW SLEEP · WATER SHIELD · EARTH WINDOW", new THREE.Vector3(0.6, 1.3, -4.5), 0.32, "telemetry");
  label(scene, "HABITAT CORE", new THREE.Vector3(5.7, 1.3, -4.5), 0.32, "subsystem");
  label(scene, "IMBRIUM // HAVEN", new THREE.Vector3(10, 5.7, -12), 0.74, "hero");

  const entryGlow = glowRing(1.25, 0.04);
  entryGlow.position.copy(state.hotelEntrance).add(new THREE.Vector3(0, 1.2, 0));
  entryGlow.rotation.x = Math.PI / 2;
  scene.add(entryGlow);
  makeParticles(scene, animated, 280, 95, 0xc7c3b4);
  setOrbit(new THREE.Vector3(10, 1, -12), 30, 10, 60, 0.25, -0.45);
}
