import * as THREE from "three";
import { C } from "../../core/materials.js";

const PLANE_COUNT = 6;
const SATELLITES_PER_PLANE = 8;
const WALKER_INCLINATION = 0.925;
const ORBIT_NORMAL_BASE = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;

function orbitalPlaneNormal(inclination, ascendingNode) {
  return ORBIT_NORMAL_BASE.clone()
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), ascendingNode)
    .normalize();
}

function addPlaneGuideRing(scene, radius, planeNormal) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = i * Math.PI * 2 / 128;
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const ring = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.07 })
  );
  ring.quaternion.setFromUnitVectors(ORBIT_NORMAL_BASE, planeNormal);
  scene.add(ring);
}

function satellite(scene, R, interactive, satellites, focusOnObject, name, radius, speed, phase, prime = false, plane = 0, index = 0, planeNormal = ORBIT_NORMAL_BASE) {
  const g = new THREE.Object3D();
  Object.assign(g.userData, {
    radius,
    speed,
    phase,
    prime,
    plane,
    index,
    inclination: WALKER_INCLINATION,
    ascendingNode: plane * (Math.PI * 2 / PLANE_COUNT),
    orbitalNormal: planeNormal.clone()
  });
  satellites.push(g);
  return g;
}

export function buildConstellation(scene, R, interactive, animated, satellites, focusOnObject) {
  const shells = [1.06 * R, 1.10 * R, 1.14 * R];
  const middleR = 1.10 * R;
  const meanSpeed = TWO_PI / 240;
  const planeGuides = [];
  for (let k = 0; k < PLANE_COUNT; k++) {
    const radius = shells[k % shells.length];
    const speed = meanSpeed * Math.pow(middleR / radius, 1.5 * 3.0);
    const ascendingNode = k * (Math.PI * 2 / PLANE_COUNT);
    const planeNormal = orbitalPlaneNormal(WALKER_INCLINATION, ascendingNode);
    planeGuides.push({ radius, planeNormal });
    for (let j = 0; j < SATELLITES_PER_PLANE; j++) {
      const phase = j * (Math.PI * 2 / SATELLITES_PER_PLANE) + k * 0.07;
      const isPrime = k === 0 && j === 0;
      satellite(scene, R, interactive, satellites, focusOnObject, isPrime ? "Guardian Prime" : "Guardian Relay", radius, speed, phase, isPrime, k, j, planeNormal);
    }
  }
  for (const guide of planeGuides) addPlaneGuideRing(scene, guide.radius, guide.planeNormal);

  const lineGeo = new THREE.BufferGeometry();
  const linePos = [];
  const linkCount = 16;
  for (let i = 0; i < linkCount; i++) linePos.push(0, 0, 0, 0, 0, 0);
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  const links = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: C.amber, transparent: true, opacity: 0.12 }));
  links.userData.tick = (t) => {
    const p = links.geometry.attributes.position;
    for (let i = 0; i < linkCount; i++) {
      const a = satellites[(i * 3) % satellites.length].position;
      const b = satellites[(i * 3 + 11) % satellites.length].position;
      p.setXYZ(i * 2, a.x, a.y, a.z);
      p.setXYZ(i * 2 + 1, b.x, b.y, b.z);
    }
    p.needsUpdate = true;
    links.material.opacity = 0.09 + 0.03 * Math.sin(t * 2.2) ** 2;
  };
  animated.push(links);
  scene.add(links);
}

export function updateConstellation(satellites, t) {
  const pos = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const solarAxis = new THREE.Vector3();
  const nadir = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  for (const s of satellites) {
    const d = s.userData;
    const a = t * d.speed + d.phase;
    pos.set(Math.cos(a) * d.radius, 0, Math.sin(a) * d.radius);
    pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), d.inclination);
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), d.ascendingNode);
    s.position.copy(pos);
    radial.copy(pos).normalize();
    tangent.crossVectors(d.orbitalNormal, radial).normalize();
    nadir.copy(radial).multiplyScalar(-1);
    solarAxis.crossVectors(nadir, tangent).normalize();
    rotation.makeBasis(tangent, solarAxis, nadir);
    s.quaternion.setFromRotationMatrix(rotation);
  }
}
