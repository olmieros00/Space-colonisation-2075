import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function box(w, h, d, material, x = 0, y = h / 2, z = 0) {
  const radius = Math.max(0.001, Math.min(w, h, d) * 0.04);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cyl(rTop, rBottom, h, material, segments = 32, x = 0, y = h / 2, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function shadowAll(obj, cast = true, receive = false) {
  obj.traverse(o => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}
