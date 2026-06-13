import * as THREE from "three";
import { addLights, makeStars } from "../../core/materials.js";
import { setOrbit } from "../../core/camera.js";
import { buildConstellation } from "./constellation.js";
import { buildEarth, moonMesh } from "./earth.js";
import { buildStarcloud } from "./starcloud.js";
import { buildStation } from "./station.js";

export function buildOrbit(scene, R, camera, camState, interactive, animated, satellites, UI, travel, state, focusOnObject) {
  makeStars(scene);
  state.mode = "orbit";
  UI.location.textContent = "EARTH ORBIT // AI1 CONSTELLATION";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Drag to orbit the camera. Wheel zooms. Hover AI1 Prime or Starcloud. Click focusable orbit assets for fly-to inspection.";
  addLights(scene, state);
  scene.fog = null;
  buildEarth(scene, R, animated, state);

  const moon = moonMesh(0.27 * R);
  moon.position.set(-4.5 * R, 0.4 * R, -4 * R);
  scene.add(moon);
  const moonLight = new THREE.PointLight(0xd0d8e8, 0.4, 120);
  moonLight.position.copy(moon.position);
  scene.add(moonLight);

  buildConstellation(scene, R, interactive, animated, satellites, focusOnObject);
  buildStation(scene, R, interactive, animated, travel);
  const starcloud = buildStarcloud(scene, R, interactive, animated, focusOnObject);
  scene.add(starcloud);

  setOrbit(new THREE.Vector3(0, 0, 0), 2.6 * R, 1.02 * R, 6 * R, 0.18, 0.3);
}
