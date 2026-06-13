import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { addInteractive } from "../../core/materials.js";
import { label } from "../../core/labels.js";
import { setOrbit } from "../../core/camera.js";
import {
  buildDisplayBooster,
  buildFacility,
  buildGround,
  buildPad,
  buildProps,
  buildRocket,
  buildTowers
} from "./structures.js";

export function configureDaylight(scene, state) {
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

export function buildHub(scene, camera, camState, interactive, animated, UI, travel, state) {
  state.mode = "hub";
  UI.location.textContent = "FRONTIER 2075 // STARBASE TEXAS";
  UI.returnBtn.style.display = "none";
  UI.hint.textContent = "Orbit the First Light apron. Hover the pad or Mission Control. Click the rocket when you are ready to leave Earth.";
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
  scene.add(addInteractive(interactive, rocket, "Colossus Heavy", () => travel("orbit"), "Click to light the engines and climb toward the blue world above"));

  buildTowers(scene);
  label(scene, "FIRST LIGHT // COLOSSUS", new THREE.Vector3(-24, 17.4, -7.5), 0.62, "hero");
  setOrbit(new THREE.Vector3(-24, 6.1, -3), 44, 18, 82, 0.15, 0.95);
}
