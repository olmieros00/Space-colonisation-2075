import * as THREE from "three";
import { UI, closePanel } from "./ui.js";
import { camState, focusEarth, focusOnObject as focusCameraOnObject, initCameraEvents, updateCamera } from "./camera.js";
import { C, configureTextureLoading } from "./materials.js";
import { travel } from "./transitions.js";
import { buildHub } from "../scenes/hub.js";
import { buildGateway } from "../scenes/gateway.js";
import { buildMoon } from "../scenes/moon.js";
import { buildOrbit } from "../scenes/orbit/index.js";
import { updateConstellation } from "../scenes/orbit/constellation.js";
import { earthMesh, moonMesh } from "../scenes/orbit/earth.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x05070b, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
configureTextureLoading(renderer);

const R = 16;
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2400);
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const interactive = [];
const satellites = [];
const animated = [];
let scene = new THREE.Scene();

const state = {
  scene,
  mode: "hub",
  hovered: null,
  hotelEntrance: new THREE.Vector3(0, 0, 0),
  hubRocket: null,
  launching: false,
  activeSun: null,
  renderer,
  animated
};

const assets = { earthMesh, moonMesh };

function resetScene() {
  interactive.length = 0;
  satellites.length = 0;
  animated.length = 0;
  state.hovered = null;
  state.hubRocket = null;
  state.activeSun = null;
  camState.focusTween = null;
  camState.focusTarget.set(0, 0, 0);
  camState.focusDistance = 2.6 * R;
  if (UI.earthViewBtn) UI.earthViewBtn.style.display = "none";
  scene = new THREE.Scene();
  state.scene = scene;
  scene.fog = new THREE.FogExp2(0x05070b, 0.016);
  renderer.setClearColor(0x05070b, 1);
}

function go(dest) {
  travel(dest, scenes, UI, state);
}

function focusOnObject(obj, closeDistance) {
  focusCameraOnObject(obj, UI, R, closeDistance);
}

const scenes = {
  hub: () => {
    resetScene();
    buildHub(scene, camera, camState, interactive, animated, UI, go, state);
  },
  orbit: () => {
    resetScene();
    buildOrbit(scene, R, camera, camState, interactive, animated, satellites, UI, go, state, focusOnObject);
  },
  gateway: () => {
    resetScene();
    buildGateway(scene, camera, camState, interactive, animated, UI, go, state, assets);
  },
  moon: () => {
    resetScene();
    buildMoon(scene, camera, camState, interactive, animated, UI, go, state, assets);
  }
};

function pick() {
  raycaster.setFromCamera(camState.mouse, camera);
  const hits = raycaster.intersectObjects(interactive, true);
  let hit = null;
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.interactive) o = o.parent;
    if (o) { hit = o; break; }
  }
  if (hit !== state.hovered) {
    if (state.hovered && state.hovered.material && state.hovered.material.emissive) state.hovered.material.emissive.setHex(state.hovered.material.userData.baseEmissive || 0x000000);
    state.hovered = hit;
    if (state.hovered && state.hovered.material && state.hovered.material.emissive) state.hovered.material.emissive.setHex(C.amber);
  }
  if (state.hovered) {
    const d = state.hovered.userData.interactive;
    UI.tooltip.innerHTML = `<strong>${d.name}</strong><br>${d.detail || "Interactive destination"}`;
    UI.tooltip.style.opacity = 1;
  } else {
    UI.tooltip.style.opacity = 0;
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  const t = clock.elapsedTime;
  requestAnimationFrame(animate);
  if (state.mode === "orbit") updateConstellation(satellites, t);
  for (const a of animated) if (a.userData.tick) a.userData.tick(t, dt);
  updateCamera(camera, camState, dt);
  if (state.mode === "moon") UI.welcome.classList.toggle("show", camState.orbitDistance < 15);
  pick();
  renderer.render(scene, camera);
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

initCameraEvents(
  renderer,
  camera,
  camState,
  () => {
    pick();
    if (!camState.dragMoved && state.hovered && state.hovered.userData.interactive.action) {
      state.hovered.userData.interactive.action();
    }
  },
  e => {
    UI.tooltip.style.left = `${e.clientX}px`;
    UI.tooltip.style.top = `${e.clientY}px`;
  }
);

UI.returnBtn.addEventListener("click", () => go("hub"));
UI.earthViewBtn.addEventListener("click", () => focusEarth(UI, R));
document.getElementById("closePanel").addEventListener("click", closePanel);
document.querySelectorAll(".mission-card").forEach(btn => btn.addEventListener("click", () => go(btn.dataset.dest)));

scenes.hub();
UI.iris.animate([{ clipPath: "circle(150% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 800, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
animate();
