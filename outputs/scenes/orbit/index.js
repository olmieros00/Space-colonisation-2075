import * as THREE from "three";
import { addLights, makeStars } from "../../core/materials.js";
import { applyHDRIEnvironment } from "../../core/assets.js";
import { makeEnv } from "../../core/pbr.js";
import { setOrbit } from "../../core/camera.js";
import { buildConstellation } from "./constellation.js?v=guardian-sats-hidden-2";
import { buildEarth, moonMesh } from "./earth.js";
import { buildSolarSystem } from "./solarsystem.js";
import { buildStarcloud } from "./starcloud.js";
import { buildStation } from "./station.js";
import { buildSatelliteSwarm } from "./swarm.js";

const SHOW_ORBIT_STRUCTURES = false;

export function buildOrbit(scene, R, camera, camState, interactive, animated, satellites, UI, travel, state, focusOnObject) {
  state.renderer.setClearColor(0x000000, 1);
  scene.background = new THREE.Color(0x000000);
  makeStars(scene);
  state.mode = "orbit";
  UI.location.textContent = "EARTH ORBIT // GUARDIAN NET";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Earth appearance edit mode. Orbit the blue homeworld without orbital structures in view.";
  addLights(scene, state);
  applyHDRIEnvironment(scene, "space", () => makeEnv(scene, state.renderer, "space"));
  buildSolarSystem(scene, state);
  scene.fog = null;
  buildEarth(scene, R, animated, state);

  const moon = moonMesh(0.27 * R);
  moon.position.set(-4.5 * R, 0.4 * R, -4 * R);
  scene.add(moon);
  const moonLight = new THREE.PointLight(0xd0d8e8, 0.4, 120);
  moonLight.position.copy(moon.position);
  scene.add(moonLight);

  buildConstellation(scene, R, interactive, animated, satellites, focusOnObject);
  buildSatelliteSwarm(scene, R, animated, camState);
  if (SHOW_ORBIT_STRUCTURES) {
    buildStation(scene, R, interactive, animated, travel);
    const starcloud = buildStarcloud(scene, R, interactive, animated, focusOnObject, camState);
    scene.add(starcloud);
  }

  setOrbit(new THREE.Vector3(0, 0, 0), 2.6 * R, 1.02 * R, 6 * R, 0.18, 0.3);
}
