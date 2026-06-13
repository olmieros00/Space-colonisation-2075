import * as THREE from "three";
import { addInteractive, label, makeGridTexture, mat } from "../../core/materials.js";

export function buildStarcloud(scene, R, interactive, animated, focusOnObject) {
  const group = new THREE.Group();
  const root = new THREE.Group();
  const focusStarcloud = () => focusOnObject(group, 1.5 * R);
  const silver = new THREE.MeshStandardMaterial({ color: 0x9aa5ad, metalness: 0.75, roughness: 0.34 });
  const darkFace = new THREE.MeshStandardMaterial({ color: 0x11151b, metalness: 0.4, roughness: 0.55 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc49a35, metalness: 0.8, roughness: 0.36 });
  const gridTex = makeGridTexture();
  const arrayMat = new THREE.MeshStandardMaterial({ map: gridTex, color: 0xa9c5d8, emissive: 0x203a52, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.42 });
  const radiatorMat = new THREE.MeshStandardMaterial({ color: 0xe6e7e1, metalness: 0.1, roughness: 0.62 });

  const primary = new THREE.Group();
  const solar = new THREE.Mesh(new THREE.BoxGeometry(0.43 * R, 0.01 * R, 0.43 * R), arrayMat);
  solar.rotation.z = 0.18;
  solar.rotation.y = -0.4;
  solar.position.set(0, 0.08 * R, 0);
  addInteractive(interactive, solar, "STARCLOUD // ORBITAL DATA CENTER", focusStarcloud, "First H100 in orbit (2025) · Sun-synchronous · Radiative cooling");
  const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.012 * R, 0.32 * R, 0.32 * R), radiatorMat);
  radiator.position.set(0.28 * R, 0, 0);
  addInteractive(interactive, radiator, "STARCLOUD // ORBITAL DATA CENTER", focusStarcloud, "First H100 in orbit (2025) · Sun-synchronous · Radiative cooling");
  primary.add(solar, radiator);
  for (let i = 0; i < 7; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.055 * R, 0.035 * R, 0.045 * R), silver);
    box.position.set((i - 3) * 0.064 * R, -0.06 * R, 0);
    const inset = new THREE.Mesh(new THREE.BoxGeometry(0.036 * R, 0.003 * R, 0.024 * R), darkFace);
    inset.position.set(box.position.x, box.position.y + 0.019 * R, box.position.z + 0.006 * R);
    addInteractive(interactive, box, "STARCLOUD // ORBITAL DATA CENTER", focusStarcloud, "First H100 in orbit (2025) · Sun-synchronous · Radiative cooling");
    primary.add(box, inset);
  }
  for (let i = -2; i <= 2; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.004 * R, 0.34 * R, 0.006 * R), darkFace);
    rib.position.set(0.287 * R, i * 0.06 * R, 0.17 * R);
    primary.add(rib);
  }
  root.add(primary);

  function smallComputeSat(i) {
    const sat = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.038 * R, 0.026 * R, 0.03 * R), i % 2 ? silver : gold);
    const finA = new THREE.Mesh(new THREE.BoxGeometry(0.042 * R, 0.006 * R, 0.018 * R), arrayMat);
    const finB = finA.clone();
    finA.position.x = 0.043 * R;
    finB.position.x = -0.043 * R;
    sat.add(body, finA, finB);
    const a = i * Math.PI * 2 / 6;
    sat.position.set(Math.cos(a) * 0.42 * R, (i - 2.5) * 0.035 * R, Math.sin(a) * 0.32 * R);
    sat.rotation.y = a;
    root.add(sat);
  }
  for (let i = 0; i < 6; i++) smallComputeSat(i);

  const capsule = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.03 * R, 0.055 * R, 32), mat.white);
  cone.rotation.x = Math.PI;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * R, 0.026 * R, 0.045 * R, 32), mat.beskar);
  trunk.position.y = -0.045 * R;
  capsule.add(cone, trunk);
  capsule.position.set(-0.42 * R, 0.12 * R, 0.28 * R);
  capsule.rotation.z = -0.6;
  root.add(capsule);

  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5 * R, 32, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  group.add(root);
  group.add(hit);
  group.position.set(-1.4 * R, -0.15 * R, 1.3 * R);
  group.userData = { radius: group.position.length(), phase: Math.atan2(group.position.z, group.position.x), speed: 0.032, inclination: 1.69, ascendingNode: -0.3 };
  group.userData.tick = (t) => {
    const d = group.userData;
    const a = d.phase + t * d.speed;
    const p = new THREE.Vector3(Math.cos(a) * d.radius, 0, Math.sin(a) * d.radius);
    p.applyAxisAngle(new THREE.Vector3(1, 0, 0), d.inclination);
    p.applyAxisAngle(new THREE.Vector3(0, 1, 0), d.ascendingNode);
    group.position.copy(p);
    root.rotation.y = t * 0.18;
    root.rotation.z = Math.sin(t * 0.35) * 0.08;
  };
  animated.push(group);
  addInteractive(interactive, hit, "STARCLOUD // ORBITAL DATA CENTER", focusStarcloud, "First H100 in orbit (2025) · Sun-synchronous · Radiative cooling");
  hit.userData.focusable = true;
  const title = label(scene, "STARCLOUD // ORBITAL DATA CENTER", new THREE.Vector3(), 0.62);
  title.position.set(0, 0.62 * R, 0);
  const sub = label(scene, "40MW CLUSTER · NVIDIA GB200 · SCALING TO 5GW", new THREE.Vector3(), 0.45, "#ff9a3c");
  sub.position.set(0, 0.48 * R, 0);
  group.add(title, sub);
  return group;
}
