import * as THREE from "three";
import { closePanel } from "./ui.js";
import { showCinematicTitle } from "./cinema.js";
import { camState } from "./camera.js";

export async function irisWipe(UI, next, titleKey = "hub", options = {}) {
  UI.iris.animate([{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)" }], { duration: 520, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" });
  await new Promise(r => setTimeout(r, 540));
  next();
  await showCinematicTitle(UI, titleKey, options);
  UI.iris.animate([{ clipPath: "circle(150% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 620, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
}

function addLaunchPlume(rocket, animated) {
  const positions = [];
  const colors = [];
  const seeds = [];
  const count = 260;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random();
    const h = Math.random();
    seeds.push(a, r, h);
    positions.push(0, -0.6 - h * 5, 0);
    const whiteHot = Math.random() > 0.45;
    colors.push(whiteHot ? 1 : 1, whiteHot ? 0.92 : 0.38, whiteHot ? 0.72 : 0.05);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const plume = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.62,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  }));
  plume.userData.tick = (t) => {
    const p = plume.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const a = seeds[i * 3] + t * 1.8;
      const r = seeds[i * 3 + 1];
      const h = seeds[i * 3 + 2];
      const spread = 0.42 + h * 4.2 + Math.sin(t * 8 + i) * 0.24;
      p.setXYZ(i, Math.cos(a) * r * spread, -1.0 - h * 10.5, Math.sin(a) * r * spread);
    }
    p.needsUpdate = true;
  };
  plume.position.y = 0.05;
  const anchor = rocket.userData.plumeAnchor || rocket;
  anchor.add(plume);
  animated.push(plume);
  return plume;
}

function addGroundSmoke(scene, animated, origin) {
  const group = new THREE.Group();
  group.position.copy(origin);
  const mat = new THREE.MeshBasicMaterial({ color: 0xd8d0c2, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 38; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat.clone());
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.random() * 6.8;
    puff.position.set(Math.cos(a) * r, 0.45 + Math.random() * 1.2, Math.sin(a) * r);
    puff.scale.setScalar(0.7 + Math.random() * 1.4);
    puff.userData.speed = 0.22 + Math.random() * 0.54;
    group.add(puff);
  }
  group.userData.age = 0;
  group.userData.tick = (_, dt) => {
    group.userData.age += dt;
    for (const puff of group.children) {
      puff.scale.multiplyScalar(1 + dt * puff.userData.speed);
      puff.position.y += dt * 0.24;
      puff.material.opacity = Math.max(0, 0.42 - group.userData.age * 0.08);
    }
  };
  scene.add(group);
  animated.push(group);
}

function addIgnitionFlash(scene, animated, origin) {
  const flash = new THREE.PointLight(0xffb15c, 8, 34);
  flash.position.copy(origin).add(new THREE.Vector3(0, 1.5, 0));
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
  );
  core.position.copy(flash.position);
  const group = new THREE.Group();
  group.add(flash, core);
  group.userData.age = 0;
  group.userData.tick = (_, dt) => {
    group.userData.age += dt;
    const k = Math.max(0, 1 - group.userData.age / 1.2);
    flash.intensity = 8 * k;
    core.scale.setScalar(1 + (1 - k) * 1.8);
    core.material.opacity = 0.75 * k;
  };
  scene.add(group);
  animated.push(group);
}

async function launchToOrbit(scenes, UI, state) {
  if (state.launching) return;
  state.launching = true;
  closePanel();
  const rocket = state.hubRocket;
  if (!rocket) {
    state.launching = false;
    irisWipe(UI, scenes.orbit, "orbit", { variant: "hyperspace" });
    return;
  }
  const start = performance.now();
  const startY = rocket.position.y;
  const startTarget = camState.orbitTarget.clone();
  const startDistance = camState.orbitDistance;
  const startPitch = camState.orbitPitch;
  const startYaw = camState.orbitYaw;
  const pad = rocket.position.clone();
  addLaunchPlume(rocket, state.animated);
  addGroundSmoke(state.scene, state.animated, new THREE.Vector3(pad.x, 0.75, pad.z + 2.6));
  addIgnitionFlash(state.scene, state.animated, new THREE.Vector3(pad.x, 0.75, pad.z));
  UI.hint.textContent = "First Light ignition. Hold the coast in memory while Colossus climbs for orbit.";
  await new Promise(resolve => {
    function step(now) {
      const p = Math.min((now - start) / 4200, 1);
      const released = THREE.MathUtils.smoothstep(p, 0.14, 1);
      const rise = released * released * (0.28 + 0.72 * released);
      rocket.position.y = startY + rise * 96;
      rocket.rotation.y = rise * 0.72;
      rocket.rotation.z = Math.sin(released * Math.PI) * 0.018;
      const track = new THREE.Vector3(pad.x, startY + rise * 62 + 8, pad.z - 2);
      camState.orbitTarget.lerpVectors(startTarget, track, THREE.MathUtils.smoothstep(p, 0.08, 0.82));
      camState.orbitDistance = THREE.MathUtils.lerp(startDistance, 58, THREE.MathUtils.smoothstep(p, 0.18, 1));
      camState.orbitPitch = THREE.MathUtils.lerp(startPitch, 0.36, THREE.MathUtils.smoothstep(p, 0.2, 1));
      camState.orbitYaw = THREE.MathUtils.lerp(startYaw, 0.72, THREE.MathUtils.smoothstep(p, 0.18, 1));
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
  state.launching = false;
  irisWipe(UI, scenes.orbit, "orbit", { variant: "hyperspace" });
}

export function travel(dest, scenes, UI, state) {
  closePanel();
  if (dest === "orbit") {
    if (state.mode === "hub") launchToOrbit(scenes, UI, state);
    else irisWipe(UI, scenes.orbit, "orbit", { variant: "hyperspace" });
  }
  if (dest === "gateway") irisWipe(UI, scenes.gateway, "gateway", { variant: "iris" });
  if (dest === "moon") irisWipe(UI, scenes.moon, "moon", { variant: "crawl" });
  if (dest === "starcloud") irisWipe(UI, scenes.starcloud, "starcloud", { variant: "iris" });
  if (dest === "hub") irisWipe(UI, scenes.hub, "hub", { variant: "iris" });
}
