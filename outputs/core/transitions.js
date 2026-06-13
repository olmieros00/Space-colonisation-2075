import * as THREE from "three";
import { closePanel } from "./ui.js";

export async function irisWipe(UI, next) {
  UI.iris.animate([{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)" }], { duration: 520, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" });
  await new Promise(r => setTimeout(r, 540));
  next();
  UI.iris.animate([{ clipPath: "circle(150% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { duration: 620, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
}

function addLaunchPlume(rocket, animated) {
  const positions = [];
  const colors = [];
  const seeds = [];
  for (let i = 0; i < 120; i++) {
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
    size: 0.42,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  }));
  plume.userData.tick = (t) => {
    const p = plume.geometry.attributes.position;
    for (let i = 0; i < 120; i++) {
      const a = seeds[i * 3] + t * 1.8;
      const r = seeds[i * 3 + 1];
      const h = seeds[i * 3 + 2];
      const spread = 0.5 + h * 3.6 + Math.sin(t * 8 + i) * 0.18;
      p.setXYZ(i, Math.cos(a) * r * spread, -0.8 - h * 8.5, Math.sin(a) * r * spread);
    }
    p.needsUpdate = true;
  };
  plume.position.y = -0.05;
  const anchor = rocket.userData.plumeAnchor || rocket;
  anchor.add(plume);
  animated.push(plume);
  return plume;
}

async function launchToOrbit(scenes, UI, state) {
  if (state.launching) return;
  state.launching = true;
  closePanel();
  const rocket = state.hubRocket;
  if (!rocket) {
    state.launching = false;
    irisWipe(UI, scenes.orbit);
    return;
  }
  const start = performance.now();
  const startY = rocket.position.y;
  addLaunchPlume(rocket, state.animated);
  UI.hint.textContent = "Launch Complex Colossus ignition. Tracking ascent to Earth orbit.";
  await new Promise(resolve => {
    function step(now) {
      const p = Math.min((now - start) / 3500, 1);
      const ease = p * p * (0.35 + 0.65 * p);
      rocket.position.y = THREE.MathUtils.lerp(startY, 80, ease);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
  state.launching = false;
  irisWipe(UI, scenes.orbit);
}

export function travel(dest, scenes, UI, state) {
  closePanel();
  if (dest === "orbit") {
    if (state.mode === "hub") launchToOrbit(scenes, UI, state);
    else irisWipe(UI, scenes.orbit);
  }
  if (dest === "gateway") irisWipe(UI, scenes.gateway);
  if (dest === "moon") irisWipe(UI, scenes.moon);
  if (dest === "hub") irisWipe(UI, scenes.hub);
}
