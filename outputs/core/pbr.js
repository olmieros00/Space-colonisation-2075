import * as THREE from "three";

let anisotropy = 1;
const trackedTextures = new Set();

export function setPBRAnisotropy(value) {
  anisotropy = Math.max(1, value || 1);
  for (const tex of trackedTextures) tex.anisotropy = anisotropy;
}

function seeded(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeTexture(canvas, repeat = 2, colorSpace = null) {
  const tex = new THREE.CanvasTexture(canvas);
  if (colorSpace) tex.colorSpace = colorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  trackedTextures.add(tex);
  return tex;
}

function colorCanvas(color, size) {
  const c = new THREE.Color(color);
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = `#${c.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0,0,0,.20)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const x = seeded(i) * size;
    const y = seeded(i + 80) * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + seeded(i + 9) * 80 - 40, y + seeded(i + 18) * 16 - 8);
    ctx.stroke();
  }
  return cnv;
}

function heightData(size) {
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0.48 + (seeded(x * 17 + y * 31) - 0.5) * 0.06;
      if (x % 128 < 4 || y % 128 < 4) h -= 0.26;
      if ((x + 44) % 128 < 3 || (y + 71) % 128 < 3) h += 0.08;
      if (x % 96 < 3 && y % 96 < 3) h += 0.34;
      data[y * size + x] = THREE.MathUtils.clamp(h, 0, 1);
    }
  }
  return data;
}

function normalCanvas(size) {
  const h = heightData(size);
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size;
  const img = cnv.getContext("2d").createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x + size - 1) % size;
      const xp = (x + 1) % size;
      const ym = (y + size - 1) % size;
      const yp = (y + 1) % size;
      const dx = h[y * size + xp] - h[y * size + xm];
      const dy = h[yp * size + x] - h[ym * size + x];
      const n = new THREE.Vector3(-dx * 4.5, -dy * 4.5, 1).normalize();
      const p = (y * size + x) * 4;
      img.data[p] = (n.x * 0.5 + 0.5) * 255;
      img.data[p + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[p + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[p + 3] = 255;
    }
  }
  cnv.getContext("2d").putImageData(img, 0, 0);
  return cnv;
}

function roughnessCanvas(base, size) {
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size;
  const ctx = cnv.getContext("2d");
  const b = Math.round(base * 255);
  ctx.fillStyle = `rgb(${b},${b},${b})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000; i++) {
    const v = THREE.MathUtils.clamp(b + (seeded(i) - 0.5) * 54, 0, 255);
    ctx.fillStyle = `rgba(${v},${v},${v},.18)`;
    ctx.fillRect(seeded(i + 5) * size, seeded(i + 11) * size, 1 + seeded(i + 17) * 4, 1);
  }
  return cnv;
}

export function makePBR({ color, metalness, roughness, normalScale = 0.7, repeat = 2 }) {
  const size = 512;
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness,
    roughness,
    map: makeTexture(colorCanvas(color, size), repeat, THREE.SRGBColorSpace),
    normalMap: makeTexture(normalCanvas(size), repeat),
    normalScale: new THREE.Vector2(normalScale, normalScale),
    roughnessMap: makeTexture(roughnessCanvas(roughness, size), repeat),
    envMapIntensity: 1
  });
}

function envCanvas(type) {
  const cnv = document.createElement("canvas");
  cnv.width = 512;
  cnv.height = 256;
  const ctx = cnv.getContext("2d");
  const sets = {
    space: ["#02040a", "#0b1424", "#02040a"],
    day: ["#2f8fd8", "#d9edf8", "#d8bd86"],
    interior: ["#f4f3ec", "#ffffff", "#d8d8d2"]
  }[type] || ["#05070b", "#1a1d24", "#05070b"];
  const grad = ctx.createLinearGradient(0, 0, 0, cnv.height);
  grad.addColorStop(0, sets[0]);
  grad.addColorStop(0.52, sets[1]);
  grad.addColorStop(1, sets[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  if (type === "space") {
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < 180; i++) ctx.fillRect(seeded(i) * cnv.width, seeded(i + 91) * cnv.height, 1, 1);
  }
  return cnv;
}

export function makeEnv(scene, renderer, type = "space") {
  if (!renderer) return;
  const texture = new THREE.CanvasTexture(envCanvas(type));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  scene.environment = target.texture;
  scene.userData.envTarget = target;
  texture.dispose();
  pmrem.dispose();
}
