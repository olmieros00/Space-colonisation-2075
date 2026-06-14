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

function assetMeta(path, meta = {}) {
  const file = path.replace(/^assets\//, "");
  return {
    file,
    object: meta.object || file,
    scene: meta.scene || "shared scene"
  };
}

function assetLog(status, path, meta, extra = "") {
  const m = assetMeta(path, meta);
  if (status === "OK") console.log(`[assets] OK: ${m.file} → ${m.object} (${m.scene})${extra}`);
  else console.warn(`[assets] MISSING: ${m.file} → procedural fallback (place it at outputs/assets/${m.file})`);
}

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

export function loadGLB(path, onLoad, onFallback = () => {}, meta = {}) {
  if (glbMissing.has(path)) {
    queueMicrotask(() => {
      assetLog("MISSING", path, meta);
      onFallback();
    });
    return;
  }
  if (glbCache.has(path)) {
    queueMicrotask(() => {
      assetLog("OK", path, meta, " [cached]");
      onLoad(cloneGLB(glbCache.get(path)));
    });
    return;
  }
  if (glbPending.has(path)) {
    glbPending.get(path).push({ onLoad, onFallback, meta });
    return;
  }
  glbPending.set(path, [{ onLoad, onFallback, meta }]);
  gltfLoader.load(
    path,
    gltf => {
      glbCache.set(path, gltf.scene);
      const pending = glbPending.get(path) || [];
      glbPending.delete(path);
      for (const job of pending) {
        assetLog("OK", path, job.meta);
        job.onLoad(cloneGLB(gltf.scene));
      }
    },
    undefined,
    err => {
      glbMissing.add(path);
      const pending = glbPending.get(path) || [];
      glbPending.delete(path);
      for (const job of pending) {
        assetLog("MISSING", path, job.meta);
        job.onFallback(err);
      }
    }
  );
}

export function swapWithGLB(container, path, { height = 1, y = 0, rotation = null, object = null, scene = null } = {}) {
  loadGLB(path, asset => {
    fitAssetToHeight(asset, height);
    if (rotation) asset.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    asset.position.y += y;
    container.clear();
    container.add(asset);
  }, undefined, { object, scene });
}

export function loadHDRI(path, onReady, onFallback = () => {}, meta = {}) {
  if (!rendererRef || hdriMissing.has(path)) {
    queueMicrotask(() => {
      assetLog("MISSING", path, meta);
      onFallback();
    });
    return;
  }
  if (hdriCache.has(path)) {
    queueMicrotask(() => {
      assetLog("OK", path, meta, " [cached]");
      onReady(hdriCache.get(path));
    });
    return;
  }
  if (hdriPending.has(path)) {
    hdriPending.get(path).push({ onReady, onFallback, meta });
    return;
  }
  hdriPending.set(path, [{ onReady, onFallback, meta }]);
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
      for (const job of pending) {
        assetLog("OK", path, job.meta);
        job.onReady(target.texture);
      }
    },
    undefined,
    err => {
      hdriMissing.add(path);
      const pending = hdriPending.get(path) || [];
      hdriPending.delete(path);
      for (const job of pending) {
        assetLog("MISSING", path, job.meta);
        job.onFallback(err);
      }
    }
  );
}

export function applyHDRIEnvironment(scene, type, onFallback = () => {}) {
  const path = HDRI_BY_TYPE[type] || HDRI_BY_TYPE.space;
  loadHDRI(path, envMap => {
    scene.environment = envMap;
  }, onFallback, { object: `${type} HDRI environment`, scene: `${type} environment` });
}
