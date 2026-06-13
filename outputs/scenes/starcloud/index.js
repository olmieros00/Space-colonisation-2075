import * as THREE from "three";
import { makeStars, mat } from "../../core/materials.js";
import { buildConstellationField } from "./constellation.js";
import { buildHabitationLayer } from "./habitation.js";
import { buildDeckProps } from "./props.js";
import { buildStarcloudUnit } from "./unit.js";

function addLargeStarfield(scene) {
  const pos = [];
  for (let i = 0; i < 3500; i++) {
    const r = THREE.MathUtils.randFloat(9000, 34000);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdce7ff, size: 1.1, sizeAttenuation: false })));
}

function earthBackdrop(scene) {
  const earth = new THREE.Group();
  const shader = new THREE.ShaderMaterial({
    uniforms: {
      day: { value: new THREE.Color(0x2f75aa) },
      night: { value: new THREE.Color(0x03101d) },
      sunDir: { value: new THREE.Vector3(-0.35, 0.18, 0.92).normalize() }
    },
    vertexShader: "varying vec3 vN; void main(){vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "varying vec3 vN; uniform vec3 day; uniform vec3 night; uniform vec3 sunDir; void main(){float d=dot(normalize(vN),sunDir); float k=smoothstep(-0.04,0.16,d); vec3 c=mix(night,day,k); c+=vec3(0.25,0.45,0.85)*pow(1.0-abs(d),3.0)*0.45; gl_FragColor=vec4(c,1.0);}"
  });
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(4200, 96, 64), shader);
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(4250, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  );
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(4320, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x6db4ff, transparent: true, opacity: 0.16, side: THREE.BackSide })
  );
  earth.position.set(-9000, 3200, -26000);
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
  camera.near = 1;
  camera.far = 40000;
  camera.updateProjectionMatrix();

  UI.location.textContent = "STARCLOUD ATLAS // OUTER DECK";
  UI.hint.textContent = "Click the viewport for pointer lock. WASD to walk, Shift to move faster, Esc to release.";
  UI.returnBtn.textContent = "RETURN TO ORBIT";
  UI.returnBtn.style.display = "block";
  if (UI.earthViewBtn) UI.earthViewBtn.style.display = "none";
  if (UI.inspectBtn) UI.inspectBtn.style.display = "none";

  makeStars(scene);
  addLargeStarfield(scene);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.55);
  sun.position.set(-7000, 1250, -3000);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -260;
  sun.shadow.camera.right = 260;
  sun.shadow.camera.top = 260;
  sun.shadow.camera.bottom = -260;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x9cb8d8, 0x02040a, 0.34));
  state.activeSun = sun;
  const colliders = new THREE.Group();
  colliders.name = "Starcloud collision";
  scene.add(colliders);

  buildStarcloudUnit(scene, colliders);
  buildConstellationField(scene);
  const { bounds, spawn } = buildHabitationLayer(scene, colliders);
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
    spawn,
    yaw: 0,
    pitch: -0.02
  });
}
