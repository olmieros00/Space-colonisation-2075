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
  const sun = new THREE.DirectionalLight(0xffffff, atmospheric ? 2.5 : 1.8);
  sun.position.set(22, 34, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  state.activeSun = sun;
  const amber = new THREE.PointLight(C.amber, atmospheric ? 1.5 : 0.8, 80);
  amber.position.set(-12, 8, 10);
  scene.add(amber);
}

export function label(scene, text, pos, size = 0.9, color = "#e8e8e0") {
  const cnv = document.createElement("canvas");
  cnv.width = 768;
  cnv.height = 128;
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.font = "36px Courier New";
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.fillRect(0, 16, cnv.width, 74);
  ctx.strokeStyle = "rgba(255,154,60,.75)";
  ctx.strokeRect(4, 20, cnv.width - 8, 66);
  ctx.fillStyle = color;
  ctx.fillText(text, 26, 66);
  const texture = new THREE.CanvasTexture(cnv);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.copy(pos);
  sprite.scale.set(size * 6, size, 1);
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
