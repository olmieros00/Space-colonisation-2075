import * as THREE from "three";
import { addInteractive, addLights, makeStars } from "../../core/materials.js";
import { applyHDRIEnvironment } from "../../core/assets.js";
import { makeEnv } from "../../core/pbr.js";
import { setOrbit } from "../../core/camera.js";
import { buildConstellation } from "./constellation.js?v=guardian-sats-hidden-2";
import { buildEarth, moonMesh } from "./earth.js?v=moon-surface-detail-1";
import { buildSolarSystem } from "./solarsystem.js";
import { buildStarcloud } from "./starcloud.js";
import { buildStation } from "./station.js";
import { buildSatelliteSwarm } from "./swarm.js";

const SHOW_ORBIT_STRUCTURES = false;
const EARTH_DIAMETER_KM = 12742;
const MOON_DIAMETER_KM = 3476;
const EARTH_MOON_DISTANCE_KM = 384400;
const MOON_RADIUS_RATIO = MOON_DIAMETER_KM / EARTH_DIAMETER_KM;
const MOON_DISTANCE_RATIO = EARTH_MOON_DISTANCE_KM / (EARTH_DIAMETER_KM * 0.5);
const MOON_DIRECTION = new THREE.Vector3(-2.95, 0.55, -2.42).normalize();

export function buildOrbit(scene, R, camera, camState, interactive, animated, satellites, UI, travel, state, focusOnObject) {
  state.renderer.setClearColor(0x000000, 1);
  scene.background = new THREE.Color(0x000000);
  makeStars(scene);
  state.mode = "orbit";
  UI.location.textContent = "EARTH ORBIT // GUARDIAN NET";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Earth-Moon real scale mode. Wheel out to the Moon at about 60 Earth radii.";
  addLights(scene, state);
  applyHDRIEnvironment(scene, "space", () => makeEnv(scene, state.renderer, "space"));
  buildSolarSystem(scene, state);
  scene.fog = null;
  buildEarth(scene, R, animated, state);

  const moon = moonMesh(MOON_RADIUS_RATIO * R);
  moon.position.copy(MOON_DIRECTION).multiplyScalar(MOON_DISTANCE_RATIO * R);
  moon.name = "Orbital Moon";
  addInteractive(interactive, moon, "The Moon", () => focusOnObject(moon, 0.88 * R, {
    orbitMin: 0.34 * R,
    orbitMax: 4.2 * R,
    exitDistance: 18 * R
  }), "Mean diameter 3,476 km; average distance from Earth 384,400 km");
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

  setOrbit(new THREE.Vector3(0, 0, 0), 2.6 * R, 1.02 * R, 72 * R, 0.18, 0.3);
}
