import * as THREE from "three";

export const camState = {
  orbitTarget: new THREE.Vector3(),
  orbitYaw: 0.3,
  orbitPitch: 0.18,
  orbitDistance: 41.6,
  orbitMin: 16.32,
  orbitMax: 96,
  dragging: false,
  dragMoved: false,
  down: { x: 0, y: 0 },
  mouse: new THREE.Vector2(9, 9),
  focusTarget: new THREE.Vector3(),
  focusDistance: 41.6,
  focusTween: null
};

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

export function focusOnObject(obj, UI, R, closeDistance) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length() || R * 0.1;
  const center = box.getCenter(new THREE.Vector3());
  camState.focusTarget.copy(center);
  camState.focusDistance = closeDistance || THREE.MathUtils.clamp(size * 3, 0.18 * R, 1.8 * R);
  camState.focusTween = {
    start: performance.now(),
    fromTarget: camState.orbitTarget.clone(),
    toTarget: center,
    fromDistance: camState.orbitDistance,
    toDistance: camState.focusDistance
  };
  UI.earthViewBtn.style.display = "block";
}

export function focusEarth(UI, R) {
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
}

export function updateCamera(camera) {
  if (camState.focusTween) {
    const p = Math.min((performance.now() - camState.focusTween.start) / 1000, 1);
    const e = easeInOut(p);
    camState.orbitTarget.lerpVectors(camState.focusTween.fromTarget, camState.focusTween.toTarget, e);
    camState.orbitDistance = THREE.MathUtils.lerp(camState.focusTween.fromDistance, camState.focusTween.toDistance, e);
    if (p >= 1) {
      if (camState.focusTween.hideButton) document.getElementById("earthViewBtn").style.display = "none";
      camState.focusTween = null;
    }
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
    state.dragging = true;
    state.dragMoved = false;
    state.down.x = e.clientX;
    state.down.y = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", e => {
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
    state.dragging = false;
    normalizedMouse(renderer, e);
    onClickCallback?.(e);
  });
  renderer.domElement.addEventListener("wheel", e => {
    state.orbitDistance = THREE.MathUtils.clamp(state.orbitDistance + e.deltaY * 0.025, state.orbitMin, state.orbitMax);
  }, { passive: true });
}
