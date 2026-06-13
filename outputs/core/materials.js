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

export function getMaxAnisotropy() {
  return maxAnisotropy;
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

export { label } from "./labels.js";
