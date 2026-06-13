import * as THREE from "three";
import { addInteractive } from "../../core/materials.js";
import { label } from "../../core/labels.js";
import { setOrbit } from "../../core/camera.js";
import { addHorizonGround, configureDaylight } from "./environment.js";
import {
  buildDisplayBooster,
  buildFacility,
  buildGround,
  buildPad,
  buildProps,
  buildRocket,
  buildTowers
} from "./structures.js";

export function buildHub(scene, camera, camState, interactive, animated, UI, travel, state) {
  state.mode = "hub";
  UI.location.textContent = "FRONTIER 2075 // STARBASE TEXAS";
  UI.returnBtn.style.display = "none";
  UI.hint.textContent = "Orbit the First Light apron. Hover the pad or Mission Control. Click the rocket when you are ready to leave Earth.";
  state.renderer.setClearColor(0xdcecf6, 1);
  state.renderer.toneMappingExposure = 1.05;
  scene.fog = new THREE.FogExp2(0xd4e7f2, 0.00078);
  configureDaylight(scene, state);
  addHorizonGround(scene);
  buildGround(scene);

  buildFacility(scene, interactive);
  buildProps(scene);
  buildDisplayBooster(scene);
  buildPad(scene, interactive, travel);

  const rocket = buildRocket();
  rocket.position.set(-24, 0.55, -2);
  state.hubRocket = rocket;
  scene.add(addInteractive(interactive, rocket, "Colossus Heavy", () => travel("orbit"), "Click to light the engines and climb toward the blue world above"));

  buildTowers(scene);
  label(scene, "FIRST LIGHT // COLOSSUS", new THREE.Vector3(-24, 17.4, -7.5), 0.62, "hero");
  setOrbit(new THREE.Vector3(-24, 6.1, -3), 44, 18, 82, 0.15, 0.95);
}
