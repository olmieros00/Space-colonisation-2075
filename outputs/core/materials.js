import * as THREE from "three";

export const C = {
  beskar: 0x7a8a9c,
  charcoal: 0x1a1d24,
  amber: 0xff9a3c,
  text: 0xe8e8e0,
  blue: 0x4aa8ff,
  lunar: 0xa8a8a2
};

export const mat = {
  beskar: new THREE.MeshStandardMaterial({ color: C.beskar, metalness: 0.62, roughness: 0.36 }),
  dark: new THREE.MeshStandardMaterial({ color: C.charcoal, metalness: 0.34, roughness: 0.62 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.18, roughness: 0.42 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050609, metalness: 0.5, roughness: 0.36 }),
  amber: new THREE.MeshStandardMaterial({ color: C.amber, emissive: C.amber, emissiveIntensity: 0.95, transparent: true, opacity: 0.82 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x7cc7ff, metalness: 0, roughness: 0.05, transmission: 0.45, transparent: true, opacity: 0.35 }),
  regolith: new THREE.MeshStandardMaterial({ color: 0x7f817d, roughness: 0.92 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xded8c5, roughness: 0.65, metalness: 0.04 })
};
mat.amber.userData.baseEmissive = C.amber;

const PLANET_TEXTURE_BASE = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/";
const planetLoader = new THREE.TextureLoader();
let maxAnisotropy = 1;

export function configureTextureLoading(renderer) {
  maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
}

export function loadPlanetTexture(file, { colorSpace = null, repeatClouds = false } = {}) {
  return new Promise((resolve, reject) => {
    planetLoader.load(
      `${PLANET_TEXTURE_BASE}${file}`,
      tex => {
        if (colorSpace) tex.colorSpace = colorSpace;
        tex.anisotropy = maxAnisotropy;
        if (repeatClouds) tex.wrapS = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      err => reject(err)
    );
  });
}

export function loadEarthTextures(onReady) {
  Promise.all([
    loadPlanetTexture("earth_atmos_2048.jpg", { colorSpace: THREE.SRGBColorSpace }),
    loadPlanetTexture("earth_specular_2048.jpg"),
    loadPlanetTexture("earth_normal_2048.jpg"),
    loadPlanetTexture("earth_lights_2048.png", { colorSpace: THREE.SRGBColorSpace }),
    loadPlanetTexture("earth_clouds_2048.png", { colorSpace: THREE.SRGBColorSpace, repeatClouds: true }).catch(() => null),
    loadPlanetTexture("moon_1024.jpg", { colorSpace: THREE.SRGBColorSpace })
  ]).then(([dayMap, specMap, normalMap, nightMap, cloudsMap, moonMap]) => {
    onReady({ dayMap, specMap, normalMap, nightMap, cloudsMap, moonMap });
  }).catch(() => onReady(null));
}

export function addLights(scene, state, atmospheric = false) {
  scene.add(new THREE.AmbientLight(0x8ea2b8, atmospheric ? 2.45 : 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, atmospheric ? 2.5 : 1.4);
  sun.position.set(12, 18, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  state.activeSun = sun;
  const amber = new THREE.PointLight(C.amber, atmospheric ? 1.5 : 0.8, 80);
  amber.position.set(-12, 8, 10);
  scene.add(amber);
}

const labelTiers = {
  hero: {
    font: "64px Bungee Inline, Orbitron, sans-serif",
    altFont: "900 62px Orbitron, Audiowide, sans-serif",
    fill: "#ffd23f",
    stroke: "#ffd23f",
    strokeWidth: 6,
    glow: "#ffae00",
    glowBlur: 18,
    spacing: 5,
    panelAlpha: 0.22,
    y: 170
  },
  subsystem: {
    font: "50px Russo One, Oxanium, sans-serif",
    fill: "#e8e8e0",
    stroke: "rgba(6,8,12,0.9)",
    strokeWidth: 3,
    glow: "#ff9a3c",
    glowBlur: 9,
    spacing: 4,
    panelAlpha: 0.42,
    y: 146
  },
  telemetry: {
    font: "28px Share Tech Mono, monospace",
    fill: "rgba(232,232,224,0.72)",
    stroke: "rgba(6,8,12,0.72)",
    strokeWidth: 2,
    glow: null,
    glowBlur: 0,
    spacing: 1.5,
    panelAlpha: 0.32,
    y: 142
  }
};

function labelOptions(tierOrColor, maybeOptions) {
  const knownTier = typeof tierOrColor === "string" && labelTiers[tierOrColor];
  if (knownTier) return { tier: tierOrColor, ...maybeOptions };
  if (typeof tierOrColor === "string") return { tier: "subsystem", color: tierOrColor, ...maybeOptions };
  return { tier: "subsystem", ...(tierOrColor || {}) };
}

function drawTrackedText(ctx, text, x, y, tracking, stroke = false) {
  const letters = Array.from(text.toUpperCase());
  let cursor = x;
  for (const letter of letters) {
    if (stroke) ctx.strokeText(letter, cursor, y);
    else ctx.fillText(letter, cursor, y);
    cursor += ctx.measureText(letter).width + tracking;
  }
}

function trackedWidth(ctx, text, tracking) {
  return Array.from(text.toUpperCase()).reduce((sum, letter) => sum + ctx.measureText(letter).width + tracking, -tracking);
}

function labelLines(text, tierName) {
  if (tierName !== "hero") return [text];
  if (text.includes(" // ")) return text.split(" // ").slice(0, 2);
  if (text.includes(" · ")) {
    const parts = text.split(" · ");
    return [parts[0], parts.slice(1).join(" · ")];
  }
  if (text.includes(" — ")) return text.split(" — ").slice(0, 2);
  if (text.length < 24) return [text];
  const words = text.split(" ");
  const lines = [""];
  for (const word of words) {
    const candidate = `${lines[lines.length - 1]} ${word}`.trim();
    if (candidate.length > 18 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  return lines;
}

function scaleFont(font, factor) {
  return font.replace(/(\d+(?:\.\d+)?)px/g, (_, px) => `${Math.max(18, Number(px) * factor)}px`);
}

export function label(scene, text, pos, size = 0.9, tierOrColor = "subsystem", maybeOptions = {}) {
  const opts = labelOptions(tierOrColor, maybeOptions);
  const tier = labelTiers[opts.tier] || labelTiers.subsystem;
  const heroAlt = opts.tier === "hero" && text.length % 2 === 0;
  const cnv = document.createElement("canvas");
  cnv.width = opts.tier === "hero" ? 1280 : 1024;
  cnv.height = opts.tier === "hero" ? 384 : 256;
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.font = heroAlt ? tier.altFont : tier.font;
  ctx.textBaseline = "middle";

  ctx.fillStyle = `rgba(4,6,10,${tier.panelAlpha})`;
  const panelY = opts.tier === "hero" ? 82 : 58;
  const panelH = opts.tier === "hero" ? 210 : 112;
  ctx.beginPath();
  ctx.moveTo(42, panelY);
  ctx.lineTo(cnv.width - 42, panelY);
  ctx.lineTo(cnv.width - 18, panelY + panelH * 0.28);
  ctx.lineTo(cnv.width - 66, panelY + panelH);
  ctx.lineTo(66, panelY + panelH);
  ctx.lineTo(18, panelY + panelH * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,154,60,.68)";
  ctx.lineWidth = opts.tier === "hero" ? 5 : 3;
  ctx.stroke();

  let tracking = tier.spacing;
  let lines = labelLines(text, opts.tier);
  let fitWidth = Math.max(...lines.map(line => trackedWidth(ctx, line, tracking)));
  let attempts = 0;
  const maxWidth = opts.tier === "hero" ? 1140 : 930;
  while (fitWidth > maxWidth && attempts < 10) {
    ctx.font = scaleFont(ctx.font, 0.92);
    tracking *= 0.9;
    fitWidth = Math.max(...lines.map(line => trackedWidth(ctx, line, tracking)));
    attempts++;
  }
  ctx.lineJoin = "round";
  const lineGap = opts.tier === "hero" ? 72 : 0;
  const y0 = opts.tier === "hero" && lines.length > 1 ? tier.y - 36 : tier.y;

  if (tier.glow) {
    ctx.shadowColor = tier.glow;
    ctx.shadowBlur = tier.glowBlur;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const x = Math.max(44, (cnv.width - trackedWidth(ctx, line, tracking)) * 0.5);
    const y = y0 + i * lineGap;
    if (opts.tier === "hero") {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(0,0,0,0.96)";
      ctx.lineWidth = (opts.strokeWidth || tier.strokeWidth) + 8;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.shadowColor = tier.glow;
      ctx.shadowBlur = tier.glowBlur;
      ctx.strokeStyle = opts.stroke || tier.stroke;
      ctx.lineWidth = opts.strokeWidth || tier.strokeWidth;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, y - 34, 0, y + 36);
      gradient.addColorStop(0, "#fff2a6");
      gradient.addColorStop(0.5, opts.color || tier.fill);
      gradient.addColorStop(1, "#ff9a3c");
      ctx.fillStyle = gradient;
    } else {
      ctx.strokeStyle = opts.stroke || tier.stroke;
      ctx.lineWidth = opts.strokeWidth || tier.strokeWidth;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.fillStyle = opts.color || tier.fill;
    }
    drawTrackedText(ctx, line, x, y, tracking, false);
  }
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(cnv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.copy(pos);
  sprite.scale.set(size * (opts.tier === "hero" ? 8.4 : 7.2), size * (opts.tier === "hero" ? 2.55 : 1.8), 1);
  scene.add(sprite);
  return sprite;
}

export function glowRing(radius, tube = 0.035) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 10, 96),
    new THREE.MeshBasicMaterial({ color: C.amber, transparent: true, opacity: 0.75 })
  );
}

export function addInteractive(interactive, obj, name, action, detail = "") {
  obj.userData.interactive = { name, action, detail };
  interactive.push(obj);
  return obj;
}

export function makeStars(scene) {
  const pos = [];
  for (let i = 0; i < 2000; i++) {
    const r = THREE.MathUtils.randFloat(360, 1150);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdce7ff, size: 1.2, sizeAttenuation: false })));
}

export function makeParticles(scene, animated, count, area, color = 0x8d98a6) {
  const pos = [];
  for (let i = 0; i < count; i++) pos.push(THREE.MathUtils.randFloatSpread(area), Math.random() * 7 + 0.2, THREE.MathUtils.randFloatSpread(area));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.055, transparent: true, opacity: 0.42 }));
  points.userData.tick = (t) => {
    const a = points.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      a.array[i * 3 + 1] -= 0.012 + Math.sin(t + i) * 0.002;
      if (a.array[i * 3 + 1] < 0) a.array[i * 3 + 1] = Math.random() * 7 + 0.4;
    }
    a.needsUpdate = true;
  };
  animated.push(points);
  scene.add(points);
}

export function cylinderBetween(a, b, radius, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 16), material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function makeGridTexture(size = 512, cells = 12, base = "#203142", line = "#77a8c9") {
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = line;
  ctx.globalAlpha = 0.58;
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * size;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
  return new THREE.CanvasTexture(cnv);
}
