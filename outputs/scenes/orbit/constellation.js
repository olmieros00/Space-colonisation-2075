import * as THREE from "three";
import { C, addInteractive, mat } from "../../core/materials.js";

const PLANE_COUNT = 10;
const SATELLITES_PER_PLANE = 15;
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
  const g = new THREE.Group();
  const span = (prime ? 0.08 : 0.045) * R;
  const bodySize = prime ? 0.010 * R : 0.007 * R;
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 });
  const solar = new THREE.MeshStandardMaterial({ color: 0x16294a, emissive: 0x2f5694, emissiveIntensity: 0.4, metalness: 0.28, roughness: 0.42 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x66778a, metalness: 0.75, roughness: 0.32 });
  const bodyMat = prime ? mat.amber : gold;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodySize, bodySize * 0.82, bodySize), bodyMat);
  const wings = new THREE.Group();

  function panelWing(axis = "x", dir = 1) {
    const wing = new THREE.Group();
    const panelLen = span * 0.18;
    const gap = span * 0.012;
    const panelDepth = span * 0.075;
    const boomLength = span * 0.48;
    const boomGeo = axis === "x"
      ? new THREE.BoxGeometry(boomLength, span * 0.012, span * 0.012)
      : new THREE.BoxGeometry(span * 0.012, span * 0.012, boomLength);
    const boom = new THREE.Mesh(boomGeo, frame);
    if (axis === "x") boom.position.x = dir * boomLength * 0.34;
    else boom.position.z = dir * boomLength * 0.34;
    wing.add(boom);
    for (let i = 0; i < 3; i++) {
      const offset = bodySize * 1.15 + dir * (i + 0.5) * (panelLen + gap);
      const panel = new THREE.Mesh(
        axis === "x"
          ? new THREE.BoxGeometry(panelLen, span * 0.014, panelDepth)
          : new THREE.BoxGeometry(panelDepth, span * 0.014, panelLen),
        solar
      );
      if (axis === "x") panel.position.x = offset;
      else panel.position.z = offset;
      wing.add(panel);
      const borderA = new THREE.Mesh(
        axis === "x"
          ? new THREE.BoxGeometry(panelLen, span * 0.017, span * 0.006)
          : new THREE.BoxGeometry(span * 0.006, span * 0.017, panelLen),
        frame
      );
      borderA.position.copy(panel.position);
      if (axis === "x") borderA.position.z += panelDepth * 0.52;
      else borderA.position.x += panelDepth * 0.52;
      wing.add(borderA);
    }
    return wing;
  }

  wings.add(panelWing("x", 1), panelWing("x", -1));
  if (prime) wings.add(panelWing("z", 1), panelWing("z", -1));
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(span * 0.006, span * 0.006, span * 0.16, 12), frame);
  arm.rotation.x = Math.PI / 2;
  arm.position.z = -bodySize * 1.25;
  const dish = new THREE.Mesh(new THREE.SphereGeometry(prime ? span * 0.12 : span * 0.09, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat.white);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = -bodySize * 2.15;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(span * 0.005, span * 0.005, prime ? span * 0.42 : span * 0.28, 10), frame);
  mast.position.y = prime ? span * 0.26 : span * 0.18;
  g.add(body, wings, arm, dish, mast);
  if (prime) g.scale.setScalar(1.7);
  g.userData = {
    radius,
    speed,
    phase,
    prime,
    plane,
    index,
    inclination: WALKER_INCLINATION,
    ascendingNode: plane * (Math.PI * 2 / PLANE_COUNT),
    orbitalNormal: planeNormal.clone()
  };
  if (prime) {
    g.userData.focusable = true;
    addInteractive(interactive, body, name, () => focusOnObject(g), "AI Data Center Node — 150kW peak");
  }
  satellites.push(g);
  scene.add(g);
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
      satellite(scene, R, interactive, satellites, focusOnObject, isPrime ? "AI1 Prime" : "AI1 Satellite", radius, speed, phase, isPrime, k, j, planeNormal);
    }
  }
  for (const guide of planeGuides) addPlaneGuideRing(scene, guide.radius, guide.planeNormal);

  const lineGeo = new THREE.BufferGeometry();
  const linePos = [];
  const linkCount = 36;
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
  const wingAxis = new THREE.Vector3();
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
    wingAxis.crossVectors(radial, tangent).normalize();
    rotation.makeBasis(wingAxis, radial, tangent);
    s.quaternion.setFromRotationMatrix(rotation);
  }
}
