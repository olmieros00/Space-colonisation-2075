import * as THREE from "three";
import { makePBR, setPBRAnisotropy } from "./pbr.js";

export const C = {
  beskar: 0x7a8a9c,
  charcoal: 0x1a1d24,
  amber: 0xff9a3c,
  text: 0xe8e8e0,
  blue: 0x4aa8ff,
  lunar: 0xa8a8a2
};

export const mat = {
  beskar: makePBR({ color: C.beskar, metalness: 0.62, roughness: 0.36, normalScale: 0.66, repeat: 2.5 }),
  dark: makePBR({ color: C.charcoal, metalness: 0.34, roughness: 0.62, normalScale: 0.52, repeat: 2.2 }),
  white: makePBR({ color: 0xe8e8e0, metalness: 0.18, roughness: 0.42, normalScale: 0.48, repeat: 2 }),
  black: makePBR({ color: 0x050609, metalness: 0.5, roughness: 0.36, normalScale: 0.42, repeat: 2.4 }),
  hullSteel: makePBR({ color: C.beskar, metalness: 0.72, roughness: 0.34, normalScale: 1.0, repeat: 3 }),
  whitePanel: makePBR({ color: 0xe8e8e0, metalness: 0.52, roughness: 0.34, normalScale: 1.0, repeat: 2.6 }),
  darkMetal: makePBR({ color: 0x11151b, metalness: 0.7, roughness: 0.42, normalScale: 0.95, repeat: 3 }),
  solar: makePBR({ color: 0x16294a, metalness: 0.55, roughness: 0.32, normalScale: 0.85, repeat: 4 }),
  copperFrame: makePBR({ color: 0x7a4a32, metalness: 0.78, roughness: 0.44, normalScale: 1.0, repeat: 3.2 }),
  concrete: makePBR({ color: 0x777a74, metalness: 0.04, roughness: 0.82, normalScale: 0.88, repeat: 4 }),
  scorched: makePBR({ color: 0x151210, metalness: 0.02, roughness: 0.95, normalScale: 0.9, repeat: 3 }),
  facilityWhite: makePBR({ color: 0xdeddd4, metalness: 0.1, roughness: 0.42, normalScale: 0.82, repeat: 2.4 }),
  sand: makePBR({ color: 0xb9a476, metalness: 0.0, roughness: 0.95, normalScale: 0.75, repeat: 5 }),
  foliage: makePBR({ color: 0x48643a, metalness: 0.0, roughness: 0.9, normalScale: 0.55, repeat: 2 }),
  rocketWhite: makePBR({ color: 0xf0f1ea, metalness: 0.16, roughness: 0.32, normalScale: 0.75, repeat: 2.2 }),
  regolithPbr: makePBR({ color: 0x7f817d, metalness: 0.0, roughness: 0.94, normalScale: 0.95, repeat: 6 }),
  moonPit: makePBR({ color: 0x4d4e4c, metalness: 0.0, roughness: 1.0, normalScale: 1.0, repeat: 4 }),
  starcloudArray: makePBR({ color: 0x080c14, metalness: 0.5, roughness: 0.44, normalScale: 0.95, repeat: 5 }),
  starcloudRadiator: makePBR({ color: 0xdfe1dc, metalness: 0.2, roughness: 0.62, normalScale: 0.85, repeat: 3 }),
  computeContainer: makePBR({ color: 0xd8dbd5, metalness: 0.42, roughness: 0.44, normalScale: 0.95, repeat: 2.8 }),
  goldMli: makePBR({ color: 0xc9a227, metalness: 0.92, roughness: 0.34, normalScale: 0.82, repeat: 2.6 }),
  carbonPanel: makePBR({ color: 0x111723, metalness: 0.36, roughness: 0.5, normalScale: 0.82, repeat: 2.8 }),
  sensorGlass: makePBR({ color: 0x08111e, metalness: 0.35, roughness: 0.24, normalScale: 0.55, repeat: 2 }),
  droidMetal: makePBR({ color: 0x657481, metalness: 0.72, roughness: 0.56, normalScale: 0.75, repeat: 2.4 }),
  wornMetal: makePBR({ color: 0x46586a, metalness: 0.55, roughness: 0.72, normalScale: 0.9, repeat: 2.6 }),
  interiorWhite: makePBR({ color: 0xf1f1eb, metalness: 0.06, roughness: 0.24, normalScale: 0.55, repeat: 2 }),
  interiorBlack: makePBR({ color: 0x050609, metalness: 0.3, roughness: 0.42, normalScale: 0.65, repeat: 2.4 }),
  chairRed: makePBR({ color: 0xb8232f, metalness: 0.06, roughness: 0.3, normalScale: 0.52, repeat: 1.8 }),
  amber: new THREE.MeshStandardMaterial({ color: C.amber, emissive: C.amber, emissiveIntensity: 0.95, transparent: true, opacity: 0.82 }),
  emissiveAmber: new THREE.MeshStandardMaterial({ color: C.amber, emissive: C.amber, emissiveIntensity: 1.35 }),
  warningRed: new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff1830, emissiveIntensity: 1.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x7cc7ff, metalness: 0, roughness: 0.05, transmission: 0.45, transparent: true, opacity: 0.35 }),
  glassPanel: new THREE.MeshPhysicalMaterial({ color: 0x8ed4ff, metalness: 0.05, roughness: 0.08, transmission: 0.28, transparent: true, opacity: 0.42, envMapIntensity: 1.0 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x71a7bf, roughness: 0.24, metalness: 0, transparent: true, opacity: 0.68, envMapIntensity: 1.0 }),
  regolith: null,
  cream: null
};
mat.regolith = mat.regolithPbr;
mat.cream = mat.interiorWhite;
mat.amber.userData.baseEmissive = C.amber;
mat.solar.emissive = new THREE.Color(0x2f5694);
mat.solar.emissiveIntensity = 0.22;

const PLANET_TEXTURE_BASE = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/";
const planetLoader = new THREE.TextureLoader();
let maxAnisotropy = 1;

export function configureTextureLoading(renderer) {
  maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  setPBRAnisotropy(maxAnisotropy);
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
