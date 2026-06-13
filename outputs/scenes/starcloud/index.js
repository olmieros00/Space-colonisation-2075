import * as THREE from "three";
import { addLights, makeStars, mat } from "../../core/materials.js";
import { buildHabitationMassing } from "./buildings.js";
import { buildDeckProps } from "./props.js";
import { buildMegastructure } from "./structure.js";

function earthBackdrop(scene) {
  const earth = new THREE.Group();
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 96, 64),
    new THREE.MeshBasicMaterial({ color: 0x1f6ea8 })
  );
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(3035, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  );
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(3090, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x6db4ff, transparent: true, opacity: 0.16, side: THREE.BackSide })
  );
  earth.position.set(-4200, 1450, -11800);
  earth.rotation.z = -0.32;
  earth.add(ocean, clouds, rim);
  scene.add(earth);
  return earth;
}

export function buildStarcloudScene(scene, camera, camState, interactive, animated, UI, go, state, walkController) {
  state.mode = "starcloud";
  camState.inputMode = "walk";
  scene.fog = new THREE.FogExp2(0x02040a, 0.00018);
  state.renderer.setClearColor(0x02040a, 1);
  camera.near = 0.5;
  camera.far = 20000;
  camera.updateProjectionMatrix();

  UI.location.textContent = "STARCLOUD ATLAS // OUTER DECK";
  UI.hint.textContent = "Click the viewport for pointer lock. WASD to walk, Shift to move faster, Esc to release.";
  UI.returnBtn.textContent = "RETURN TO ORBIT";
  UI.returnBtn.style.display = "block";
  if (UI.earthViewBtn) UI.earthViewBtn.style.display = "none";
  if (UI.inspectBtn) UI.inspectBtn.style.display = "none";

  makeStars(scene);
  addLights(scene, state, false);
  scene.add(new THREE.HemisphereLight(0x9cb8d8, 0x05070b, 0.55));
  const colliders = new THREE.Group();
  colliders.name = "Starcloud collision";
  scene.add(colliders);

  const { bounds } = buildMegastructure(scene, colliders);
  buildHabitationMassing(scene, colliders);
  buildDeckProps(scene, colliders);
  const earth = earthBackdrop(scene);
  animated.push({ userData: { tick: t => { earth.rotation.y = t * 0.004; } } });

  const beacon = new THREE.PointLight(0xff9a3c, 1.1, 80);
  beacon.position.set(0, 6, 118);
  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), mat.amber);
  beaconMesh.position.copy(beacon.position);
  scene.add(beacon, beaconMesh);

  walkController.activate({
    colliders,
    bounds,
    spawn: new THREE.Vector3(0, 1.7, 118),
    yaw: Math.PI,
    pitch: -0.04
  });
}
