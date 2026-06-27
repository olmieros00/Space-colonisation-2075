import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { UI, closePanel, openPanel, togglePanel } from "./ui.js";
import { configureAssetLoading } from "./assets.js";
import { camState, enterInspection, exitInspection, focusEarth, focusOnObject as focusCameraOnObject, initCameraEvents, updateCamera } from "./camera.js";
import { C, configureTextureLoading } from "./materials.js";
import { readyCinemaFonts, showCinematicTitle } from "./cinema.js";
import { R } from "./constants.js";
import { travel } from "./transitions.js";
import { createWalkCamera } from "./walkCamera.js";
import { buildHub } from "../scenes/hub/index.js";
import { buildGateway } from "../scenes/gateway.js";
import { buildMoon } from "../scenes/moon.js";
import { buildOrbit } from "../scenes/orbit/index.js";
import { updateConstellation } from "../scenes/orbit/constellation.js?v=guardian-sats-hidden-2";
import { buildStarcloudScene } from "../scenes/starcloud/index.js";
import { earthMesh, moonMesh } from "../scenes/orbit/earth.js";

const canvas = document.getElementById("scene");
if (!UI.inspectBtn) UI.inspectBtn = document.getElementById("inspectBtn");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
configureTextureLoading(renderer);
configureAssetLoading(renderer);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2400);
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const walkController = createWalkCamera(renderer.domElement, camera);
const interactive = [];
const satellites = [];
const animated = [];
let scene = new THREE.Scene();
const renderPass = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
const state = {
  scene,
  mode: "hub",
  hovered: null,
  hotelEntrance: new THREE.Vector3(0, 0, 0),
  hubRocket: null,
  launching: false,
  activeSun: null,
  renderer,
  animated,
  composer,
  renderPass,
  ssaoPass: null
};
try {
  const ssaoPass = new SSAOPass(scene, camera, innerWidth, innerHeight);
  ssaoPass.kernelRadius = 8;
  ssaoPass.minDistance = 0.002;
  ssaoPass.maxDistance = 0.18;
  composer.addPass(ssaoPass);
  state.ssaoPass = ssaoPass;
} catch {
  state.ssaoPass = null;
}
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.6, 0.85);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const assets = { earthMesh, moonMesh };

function resetScene() {
  interactive.length = 0;
  satellites.length = 0;
  animated.length = 0;
  state.hovered = null;
  walkController.deactivate();
  state.hubRocket = null;
  state.activeSun = null;
  if (camState.focusPauseRoot) camState.focusPauseRoot.userData.paused = false;
  camState.focusTween = null;
  camState.focusTarget.set(0, 0, 0);
  camState.focusDistance = 2.6 * R;
  camState.focusedObject = null;
  camState.focusPauseRoot = null;
  camState.inputMode = "orbit";
  camState.structureDestination = null;
  camState.bounds = null;
  camState.isFocused = false;
  camState.canInspect = false;
  camState.inspectionActive = false;
  camState.inspectionRoot = null;
  camState.inspectionTween = null;
  if (camState.inspectionRestore) {
    camera.near = camState.inspectionRestore.near;
    camera.far = camState.inspectionRestore.far;
    camera.updateProjectionMatrix();
    camState.inspectionRestore = null;
  } else if (camera.near !== 0.1 || camera.far !== 2400) {
    camera.near = 0.1;
    camera.far = 2400;
    camera.updateProjectionMatrix();
  }
  camState.focusExitDistance = 0;
  if (UI.earthViewBtn) UI.earthViewBtn.style.display = "none";
  if (UI.inspectBtn) UI.inspectBtn.style.display = "none";
  scene = new THREE.Scene();
  state.scene = scene;
  renderPass.scene = scene;
  if (state.ssaoPass) state.ssaoPass.scene = scene;
  scene.fog = new THREE.FogExp2(0x000000, 0.016);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMappingExposure = 1.25;
}

function go(dest) {
  travel(dest, scenes, UI, state);
}

function focusOrbitObject(obj, closeDistance, options) {
  focusCameraOnObject(obj, UI, R, closeDistance, options);
  camState.structureDestination = options?.canInspect && options?.pauseRoot?.userData?.droidTier !== undefined ? "starcloud" : null;
}

const scenes = {
  hub: () => {
    resetScene();
    buildHub(scene, camera, camState, interactive, animated, UI, go, state);
  },
  orbit: () => {
    resetScene();
    buildOrbit(scene, R, camera, camState, interactive, animated, satellites, UI, go, state, focusOrbitObject);
  },
  gateway: () => {
    resetScene();
    buildGateway(scene, camera, camState, interactive, animated, UI, go, state, assets);
  },
  moon: () => {
    resetScene();
    buildMoon(scene, camera, camState, interactive, animated, UI, go, state, assets);
  },
  starcloud: () => {
    resetScene();
    buildStarcloudScene(scene, camera, camState, interactive, animated, UI, go, state, walkController);
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
  if (state.mode === "starcloud") walkController.update(dt);
  else updateCamera(camera, camState, dt);
  if (state.mode === "moon") UI.welcome.classList.toggle("show", camState.orbitDistance < 15);
  if (state.mode === "starcloud") UI.tooltip.style.opacity = 0;
  else pick();
  composer.render();
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloomPass.setSize(innerWidth, innerHeight);
  if (state.ssaoPass) state.ssaoPass.setSize(innerWidth, innerHeight);
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

UI.returnBtn.addEventListener("click", () => go(state.mode === "starcloud" ? "orbit" : "hub"));
UI.menuBtn.addEventListener("click", () => openPanel());
UI.earthViewBtn.addEventListener("click", () => focusEarth(UI, R));
if (UI.inspectBtn) {
  UI.inspectBtn.addEventListener("click", () => {
    if (camState.structureDestination && !camState.inspectionActive && !camState.inspectionTween) go(camState.structureDestination);
    else if (camState.inspectionActive || camState.inspectionTween) exitInspection(camera, UI);
    else enterInspection(camera, UI);
  });
}
camState.focusExitCallback = () => focusEarth(UI, R);
document.getElementById("closePanel").addEventListener("click", closePanel);
document.addEventListener("keydown", e => {
  if (e.code !== "KeyM" || e.repeat) return;
  if (document.pointerLockElement) document.exitPointerLock?.();
  togglePanel();
});
document.querySelectorAll(".mission-card").forEach(btn => btn.addEventListener("click", () => {
  closePanel();
  go(btn.dataset.dest);
}));

async function readyLabelFonts() {
  if (!document.fonts) return;
  const loads = [
    document.fonts.load("64px Bungee Inline"),
    document.fonts.load("50px Russo One"),
    document.fonts.load("700 48px Teko"),
    document.fonts.load("900 48px Orbitron"),
    document.fonts.load("700 48px Orbitron"),
    document.fonts.load("48px Audiowide"),
    document.fonts.load("800 42px Oxanium"),
    document.fonts.load("600 42px Oxanium"),
    document.fonts.load("600 34px Saira Condensed"),
    document.fonts.load("28px Share Tech Mono")
  ];
  await Promise.race([
    Promise.allSettled(loads).then(() => document.fonts.ready),
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);
}

await readyLabelFonts();
await readyCinemaFonts();
scenes.hub();
animate();
UI.iris.style.clipPath = "circle(150% at 50% 50%)";
showCinematicTitle(UI, "boot", { duration: 3600 }).then(() => {
  UI.iris.animate([{ clipPath: "circle(150% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 900, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
});
