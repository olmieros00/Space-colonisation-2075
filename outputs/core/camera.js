import * as THREE from "three";
import { R } from "./constants.js";

export const camState = {
  orbitTarget: new THREE.Vector3(),
  orbitYaw: 0.3,
  orbitPitch: 0.18,
  orbitDistance: 2.6 * R,
  orbitMin: 1.02 * R,
  orbitMax: 6 * R,
  dragging: false,
  dragMoved: false,
  down: { x: 0, y: 0 },
  mouse: new THREE.Vector2(9, 9),
  inputMode: "orbit",
  focusTarget: new THREE.Vector3(),
  focusDistance: 2.6 * R,
  focusTween: null,
  focusedObject: null,
  focusPauseRoot: null,
  isFocused: false,
  focusExitDistance: 0,
  focusExitCallback: null,
  structureDestination: null,
  canInspect: false,
  inspectionActive: false,
  inspectionRoot: null,
  inspectionLocalTarget: new THREE.Vector3(),
  inspectionTween: null,
  inspectionRestore: null,
  inspectionFocusDistance: 0.78 * R
};

const tmpFocusWorld = new THREE.Vector3();
const tmpInspectionWorld = new THREE.Vector3();
const tmpInspectionTarget = new THREE.Vector3();

function focusWorldPosition(obj) {
  return obj.getWorldPosition(tmpFocusWorld);
}

function localToWorld(root, local, target = tmpInspectionWorld) {
  return target.copy(local).applyMatrix4(root.matrixWorld);
}

function releaseFocusPause() {
  if (camState.focusPauseRoot) {
    camState.focusPauseRoot.userData.paused = false;
    camState.focusPauseRoot = null;
  }
}

export function setOrbit(target, distance, min, max, pitch, yaw = 0.55) {
  camState.orbitTarget.copy(target);
  camState.orbitDistance = distance;
  camState.orbitMin = min;
  camState.orbitMax = max;
  camState.orbitPitch = pitch;
  camState.orbitYaw = yaw;
}

export function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function focusOnObject(obj, UI, R, closeDistance, options = {}) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length() || R * 0.1;
  const center = box.isEmpty() ? focusWorldPosition(obj).clone() : box.getCenter(new THREE.Vector3());
  releaseFocusPause();
  camState.focusedObject = obj;
  camState.focusPauseRoot = options.pauseRoot || obj.userData.pauseRoot || null;
  camState.isFocused = true;
  camState.canInspect = Boolean(options.canInspect && options.inspectionRoot);
  camState.inspectionRoot = options.inspectionRoot || null;
  camState.inspectionLocalTarget.copy(options.inspectionLocalTarget || new THREE.Vector3(0, 0, 0));
  camState.inspectionFocusDistance = closeDistance || 0.78 * R;
  camState.focusExitDistance = options.exitDistance || 2.15 * R;
  camState.orbitMin = options.orbitMin || 0.035 * R;
  camState.orbitMax = options.orbitMax || 2.35 * R;
  if (camState.focusPauseRoot) camState.focusPauseRoot.userData.paused = true;
  camState.focusTarget.copy(center);
  camState.focusDistance = closeDistance || THREE.MathUtils.clamp(size * 3, 0.16 * R, 1.8 * R);
  camState.focusTween = {
    start: performance.now(),
    fromTarget: camState.orbitTarget.clone(),
    toTarget: center,
    fromDistance: camState.orbitDistance,
    toDistance: camState.focusDistance
  };
  UI.earthViewBtn.style.display = "block";
  if (UI.inspectBtn) {
    UI.inspectBtn.textContent = "ENTER STRUCTURE";
    UI.inspectBtn.style.display = camState.canInspect ? "block" : "none";
  }
}

export function focusEarth(UI, R) {
  camState.inspectionActive = false;
  camState.inspectionTween = null;
  if (camState.inspectionRestore) {
    camState.inspectionRestore.camera.near = camState.inspectionRestore.near;
    camState.inspectionRestore.camera.far = camState.inspectionRestore.far;
    camState.inspectionRestore.camera.updateProjectionMatrix();
    camState.inspectionRestore = null;
  }
  releaseFocusPause();
  camState.focusedObject = null;
  camState.isFocused = false;
  camState.canInspect = false;
  camState.structureDestination = null;
  camState.inspectionRoot = null;
  camState.focusExitDistance = 0;
  camState.orbitMin = 1.02 * R;
  camState.orbitMax = 6 * R;
  camState.focusTarget.set(0, 0, 0);
  camState.focusDistance = 2.6 * R;
  camState.focusTween = {
    start: performance.now(),
    fromTarget: camState.orbitTarget.clone(),
    toTarget: camState.focusTarget.clone(),
    fromDistance: camState.orbitDistance,
    toDistance: camState.focusDistance,
    hideButton: true
  };
  if (UI.inspectBtn) UI.inspectBtn.style.display = "none";
}

export function enterInspection(camera, UI) {
  if (!camState.canInspect || !camState.inspectionRoot || camState.inspectionActive) return;
  camState.inspectionRoot.updateWorldMatrix(true, true);
  const localEye = new THREE.Vector3(-0.22, 0.24, -0.42);
  const target = localToWorld(camState.inspectionRoot, camState.inspectionLocalTarget, new THREE.Vector3());
  const eye = localToWorld(camState.inspectionRoot, localEye, new THREE.Vector3());
  if (camState.focusPauseRoot) camState.focusPauseRoot.userData.paused = false;
  camState.inspectionActive = true;
  camState.orbitMin = 0.05;
  camState.orbitMax = 3;
  camState.orbitYaw = -Math.PI / 2;
  camState.orbitPitch = -0.1;
  camState.inspectionRestore = { camera, near: camera.near, far: camera.far };
  camera.near = 0.01;
  camera.far = 200;
  camera.updateProjectionMatrix();
  camState.inspectionTween = {
    start: performance.now(),
    localEye,
    fromPosition: camera.position.clone(),
    toPosition: eye,
    fromTarget: camState.orbitTarget.clone(),
    toTarget: target,
    fromDistance: camState.orbitDistance,
    toDistance: 0.55
  };
  if (UI.inspectBtn) {
    UI.inspectBtn.textContent = "↺ EXIT STRUCTURE";
    UI.inspectBtn.style.display = "block";
  }
}

export function exitInspection(camera, UI) {
  if (!camState.inspectionActive && !camState.inspectionTween) return;
  camState.inspectionActive = false;
  camState.inspectionTween = null;
  if (camState.inspectionRestore) {
    camState.inspectionRestore.camera.near = camState.inspectionRestore.near;
    camState.inspectionRestore.camera.far = camState.inspectionRestore.far;
    camState.inspectionRestore.camera.updateProjectionMatrix();
    camState.inspectionRestore = null;
  } else {
    camera.near = 0.1;
    camera.far = 2400;
    camera.updateProjectionMatrix();
  }
  if (camState.focusPauseRoot) camState.focusPauseRoot.userData.paused = true;
  camState.orbitMin = 0.018 * R;
  camState.orbitMax = 1.95 * R;
  camState.orbitDistance = camState.inspectionFocusDistance;
  if (camState.focusedObject) camState.orbitTarget.copy(focusWorldPosition(camState.focusedObject));
  if (UI.inspectBtn) {
    UI.inspectBtn.textContent = "ENTER STRUCTURE";
    UI.inspectBtn.style.display = camState.canInspect ? "block" : "none";
  }
}

export function updateCamera(camera) {
  if (camState.inspectionTween) {
    camState.inspectionRoot?.updateWorldMatrix(true, true);
    if (camState.inspectionRoot) {
      camState.inspectionTween.toTarget.copy(localToWorld(camState.inspectionRoot, camState.inspectionLocalTarget, tmpInspectionTarget));
      camState.inspectionTween.toPosition.copy(localToWorld(camState.inspectionRoot, camState.inspectionTween.localEye, tmpInspectionWorld));
    }
    const p = Math.min((performance.now() - camState.inspectionTween.start) / 1000, 1);
    const e = easeInOut(p);
    camera.position.lerpVectors(camState.inspectionTween.fromPosition, camState.inspectionTween.toPosition, e);
    camState.orbitTarget.lerpVectors(camState.inspectionTween.fromTarget, camState.inspectionTween.toTarget, e);
    camState.orbitDistance = THREE.MathUtils.lerp(camState.inspectionTween.fromDistance, camState.inspectionTween.toDistance, e);
    camera.lookAt(camState.orbitTarget);
    if (p >= 1) camState.inspectionTween = null;
    return;
  }

  if (camState.inspectionActive && camState.inspectionRoot) {
    camState.inspectionRoot.updateWorldMatrix(true, true);
    camState.orbitTarget.copy(localToWorld(camState.inspectionRoot, camState.inspectionLocalTarget, tmpInspectionTarget));
  }

  if (camState.focusTween) {
    if (camState.isFocused && camState.focusedObject) {
      camState.focusTween.toTarget.copy(focusWorldPosition(camState.focusedObject));
      camState.focusTarget.copy(camState.focusTween.toTarget);
    }
    const p = Math.min((performance.now() - camState.focusTween.start) / 1000, 1);
    const e = easeInOut(p);
    camState.orbitTarget.lerpVectors(camState.focusTween.fromTarget, camState.focusTween.toTarget, e);
    camState.orbitDistance = THREE.MathUtils.lerp(camState.focusTween.fromDistance, camState.focusTween.toDistance, e);
    if (p >= 1) {
      if (camState.focusTween.hideButton) document.getElementById("earthViewBtn").style.display = "none";
      camState.focusTween = null;
    }
  } else if (camState.isFocused && camState.focusedObject) {
    camState.orbitTarget.copy(focusWorldPosition(camState.focusedObject));
    camState.focusTarget.copy(camState.orbitTarget);
  }

  const x = Math.sin(camState.orbitYaw) * Math.cos(camState.orbitPitch) * camState.orbitDistance;
  const y = Math.sin(camState.orbitPitch) * camState.orbitDistance;
  const z = Math.cos(camState.orbitYaw) * Math.cos(camState.orbitPitch) * camState.orbitDistance;
  camera.position.set(camState.orbitTarget.x + x, camState.orbitTarget.y + y, camState.orbitTarget.z + z);
  camera.lookAt(camState.orbitTarget);
}

export function normalizedMouse(renderer, event) {
  const rect = renderer.domElement.getBoundingClientRect();
  camState.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  camState.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function initCameraEvents(renderer, camera, state, onClickCallback, onMoveCallback) {
  renderer.domElement.addEventListener("pointerdown", e => {
    if (state.inputMode === "walk") return;
    state.dragging = true;
    state.dragMoved = false;
    state.down.x = e.clientX;
    state.down.y = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", e => {
    if (state.inputMode === "walk") return;
    normalizedMouse(renderer, e);
    onMoveCallback?.(e);
    if (state.dragging) {
      state.orbitYaw += e.movementX * -0.005;
      state.orbitPitch += e.movementY * 0.005;
      state.orbitPitch = THREE.MathUtils.clamp(state.orbitPitch, -1.4, 1.4);
      if (Math.hypot(e.clientX - state.down.x, e.clientY - state.down.y) > 5) state.dragMoved = true;
    }
  });
  renderer.domElement.addEventListener("pointerup", e => {
    if (state.inputMode === "walk") return;
    state.dragging = false;
    normalizedMouse(renderer, e);
    onClickCallback?.(e);
  });
  renderer.domElement.addEventListener("wheel", e => {
    if (state.inputMode === "walk") return;
    state.orbitDistance = THREE.MathUtils.clamp(state.orbitDistance + e.deltaY * 0.025, state.orbitMin, state.orbitMax);
    if (state.isFocused && state.focusExitDistance && state.orbitDistance >= state.focusExitDistance) {
      state.focusExitCallback?.();
    }
  }, { passive: true });
}
