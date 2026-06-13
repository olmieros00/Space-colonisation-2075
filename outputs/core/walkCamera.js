import * as THREE from "three";

const EYE_HEIGHT = 1.7;
const WALK_SPEED = 6;
const RUN_SPEED = 12;
const PLAYER_RADIUS = 0.45;

export function createWalkCamera(canvas, camera) {
  const state = {
    active: false,
    colliders: null,
    bounds: { minX: -55, maxX: 55, minZ: -145, maxZ: 145 },
    yaw: 0,
    pitch: 0,
    keys: new Set()
  };
  const raycaster = new THREE.Raycaster();
  const tmpDir = new THREE.Vector3();
  const tmpMove = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();

  function inBounds(pos) {
    return pos.x > state.bounds.minX + PLAYER_RADIUS &&
      pos.x < state.bounds.maxX - PLAYER_RADIUS &&
      pos.z > state.bounds.minZ + PLAYER_RADIUS &&
      pos.z < state.bounds.maxZ - PLAYER_RADIUS;
  }

  function blocked(from, to) {
    if (!state.colliders) return false;
    tmpDir.subVectors(to, from);
    const distance = tmpDir.length();
    if (distance <= 0.0001) return false;
    tmpDir.normalize();
    raycaster.set(new THREE.Vector3(from.x, EYE_HEIGHT * 0.55, from.z), tmpDir);
    raycaster.far = distance + PLAYER_RADIUS;
    const hits = raycaster.intersectObjects(state.colliders.children, true);
    return hits.length > 0;
  }

  function tryMove(delta) {
    const from = tmpPos.set(camera.position.x, 0, camera.position.z);
    const to = from.clone().add(delta);
    if (!inBounds(to) || blocked(from, to)) return;
    camera.position.x = to.x;
    camera.position.z = to.z;
  }

  canvas.addEventListener("click", () => {
    if (state.active && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  });

  document.addEventListener("mousemove", event => {
    if (!state.active || document.pointerLockElement !== canvas) return;
    state.yaw -= event.movementX * 0.0024;
    state.pitch = THREE.MathUtils.clamp(state.pitch - event.movementY * 0.0024, -1.4, 1.4);
  });

  document.addEventListener("keydown", event => {
    if (state.active) state.keys.add(event.code);
  });

  document.addEventListener("keyup", event => {
    state.keys.delete(event.code);
  });

  return {
    activate({ colliders, bounds, spawn = new THREE.Vector3(0, EYE_HEIGHT, 120), yaw = Math.PI, pitch = 0 }) {
      state.active = true;
      state.colliders = colliders;
      state.bounds = bounds || state.bounds;
      state.yaw = yaw;
      state.pitch = pitch;
      state.keys.clear();
      camera.position.copy(spawn);
      camera.rotation.order = "YXZ";
      camera.rotation.set(state.pitch, state.yaw, 0);
    },
    deactivate() {
      state.active = false;
      state.colliders = null;
      state.keys.clear();
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    },
    update(dt) {
      if (!state.active) return;
      camera.position.y = EYE_HEIGHT;
      camera.rotation.order = "YXZ";
      camera.rotation.set(state.pitch, state.yaw, 0);

      tmpMove.set(0, 0, 0);
      if (state.keys.has("KeyW")) tmpMove.z -= 1;
      if (state.keys.has("KeyS")) tmpMove.z += 1;
      if (state.keys.has("KeyA")) tmpMove.x -= 1;
      if (state.keys.has("KeyD")) tmpMove.x += 1;
      if (tmpMove.lengthSq() === 0) return;
      tmpMove.normalize().multiplyScalar((state.keys.has("ShiftLeft") || state.keys.has("ShiftRight") ? RUN_SPEED : WALK_SPEED) * dt);
      tmpMove.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
      tryMove(new THREE.Vector3(tmpMove.x, 0, 0));
      tryMove(new THREE.Vector3(0, 0, tmpMove.z));
    },
    get active() {
      return state.active;
    }
  };
}
