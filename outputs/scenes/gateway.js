import * as THREE from "three";
import { addInteractive, addLights, glowRing, label, makeStars, mat } from "../core/materials.js";
import { setOrbit } from "../core/camera.js";

export function buildGateway(scene, camera, camState, interactive, animated, UI, travel, state, assets) {
  makeStars(scene);
  state.mode = "gateway";
  UI.location.textContent = "GATEWAY STATION // DOCKING BAY";
  UI.returnBtn.style.display = "block";
  UI.hint.textContent = "Drag to orbit the docking bay. Wheel zooms. Hover the Moon display. Click the Mare Imbrium Transit shuttle.";
  addLights(scene, state, false);
  scene.add(new THREE.AmbientLight(0x0a1420, 0.5));
  for (const z of [-6, -14]) {
    const bayLight = new THREE.PointLight(0x4aa8ff, 1.8, 18);
    bayLight.position.set(0, 4.8, z);
    scene.add(bayLight);
  }
  const shuttleLight = new THREE.PointLight(0xff9a3c, 1.2, 14);
  shuttleLight.position.set(0, 2, -13);
  scene.add(shuttleLight);
  state.renderer.setClearColor(0x070a0f, 1);
  scene.fog = new THREE.FogExp2(0x070a0f, 0.026);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.32, 42), mat.dark);
  floor.position.y = -0.2;
  scene.add(floor);
  for (const x of [-7.7, 7.7]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 42), mat.dark);
    wall.position.set(x, 2.8, 0);
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 42), mat.dark);
  ceiling.position.y = 6;
  scene.add(ceiling);
  for (let z = -18; z <= 18; z += 4) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.16, 0.25), mat.white);
    rib.position.set(0, 5.2, z);
    scene.add(rib);
  }

  const viewport = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshBasicMaterial({ color: 0x102444, transparent: true, opacity: 0.72 }));
  viewport.position.set(0, 3.3, -20.8);
  scene.add(viewport);
  const smallEarth = assets.earthMesh(2.1, animated, state);
  smallEarth.position.set(0, 2.6, -23.7);
  scene.add(smallEarth);

  const moonHolo = assets.moonMesh(1.25);
  moonHolo.material.transparent = true;
  moonHolo.material.opacity = 0.72;
  moonHolo.position.set(0, 2.4, -4);
  scene.add(addInteractive(interactive, moonHolo, "Mare Imbrium Lunar Display", null, "Amber marker marks GRU Hotel approach vector"));
  const marker = glowRing(0.34, 0.018);
  marker.position.set(0.85, 2.75, -3.36);
  marker.rotation.y = Math.PI / 2.6;
  marker.userData.tick = (t) => marker.scale.setScalar(1 + Math.sin(t * 3) * 0.18);
  animated.push(marker);
  scene.add(marker);

  const shuttle = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.86, 5.5, 28), mat.white);
  fuselage.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.25, 28), mat.white);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -3.35;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 1.2), mat.beskar);
  wing.position.set(0, -0.28, -0.2);
  shuttle.add(fuselage, nose, wing);
  shuttle.position.set(0, 1.25, -14.6);
  scene.add(shuttle);
  addInteractive(interactive, fuselage, "Mare Imbrium Transit", () => travel("moon"), "Docked Lunar Shuttle");
  label(scene, "MARE IMBRIUM TRANSIT", new THREE.Vector3(0, 3.4, -14.4), 0.62);

  setOrbit(new THREE.Vector3(0, 2.6, -6), 16, 6, 30, 0.1, 0.03);
}
