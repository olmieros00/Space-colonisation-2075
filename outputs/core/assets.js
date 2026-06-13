import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const glbCache = new Map();
const glbMissing = new Set();
const glbPending = new Map();
const hdriCache = new Map();
const hdriMissing = new Set();
const hdriPending = new Map();
let rendererRef = null;

const HDRI_BY_TYPE = {
  space: "assets/env_space.hdr",
  day: "assets/env_day.hdr",
  interior: "assets/env_interior.hdr"
};

export function configureAssetLoading(renderer) {
  rendererRef = renderer;
}

function prepareAsset(root) {
  root.traverse(obj => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.material) {
      obj.material.envMapIntensity = obj.material.envMapIntensity ?? 1;
      obj.material.needsUpdate = true;
    }
  });
  return root;
}

function fitAssetToHeight(root, height) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (!size.y) return root;
  root.scale.multiplyScalar(height / size.y);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= fitted.min.y;
  root.position.z -= center.z;
  return root;
}

function cloneGLB(root) {
  return prepareAsset(root.clone(true));
}

export function loadGLB(path, onLoad, onFallback = () => {}) {
  if (glbMissing.has(path)) {
    queueMicrotask(() => onFallback());
    return;
  }
  if (glbCache.has(path)) {
    queueMicrotask(() => onLoad(cloneGLB(glbCache.get(path))));
    return;
  }
  if (glbPending.has(path)) {
    glbPending.get(path).push({ onLoad, onFallback });
    return;
  }
  glbPending.set(path, [{ onLoad, onFallback }]);
  gltfLoader.load(
    path,
    gltf => {
      glbCache.set(path, gltf.scene);
      const pending = glbPending.get(path) || [];
      glbPending.delete(path);
      for (const job of pending) job.onLoad(cloneGLB(gltf.scene));
    },
    undefined,
    err => {
      glbMissing.add(path);
      const pending = glbPending.get(path) || [];
      glbPending.delete(path);
      for (const job of pending) job.onFallback(err);
    }
  );
}

export function swapWithGLB(container, path, { height = 1, y = 0, rotation = null } = {}) {
  loadGLB(path, asset => {
    fitAssetToHeight(asset, height);
    if (rotation) asset.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    asset.position.y += y;
    container.clear();
    container.add(asset);
  });
}

export function loadHDRI(path, onReady, onFallback = () => {}) {
  if (!rendererRef || hdriMissing.has(path)) {
    queueMicrotask(() => onFallback());
    return;
  }
  if (hdriCache.has(path)) {
    queueMicrotask(() => onReady(hdriCache.get(path)));
    return;
  }
  if (hdriPending.has(path)) {
    hdriPending.get(path).push({ onReady, onFallback });
    return;
  }
  hdriPending.set(path, [{ onReady, onFallback }]);
  rgbeLoader.load(
    path,
    texture => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(rendererRef);
      const target = pmrem.fromEquirectangular(texture);
      hdriCache.set(path, target.texture);
      texture.dispose();
      pmrem.dispose();
      const pending = hdriPending.get(path) || [];
      hdriPending.delete(path);
      for (const job of pending) job.onReady(target.texture);
    },
    undefined,
    err => {
      hdriMissing.add(path);
      const pending = hdriPending.get(path) || [];
      hdriPending.delete(path);
      for (const job of pending) job.onFallback(err);
    }
  );
}

export function applyHDRIEnvironment(scene, type, onFallback = () => {}) {
  loadHDRI(HDRI_BY_TYPE[type] || HDRI_BY_TYPE.space, envMap => {
    scene.environment = envMap;
  }, onFallback);
}
