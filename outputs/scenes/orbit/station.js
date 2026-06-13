import * as THREE from "three";
import { addInteractive, cylinderBetween, mat } from "../../core/materials.js";
import { greeble } from "../../core/greeble.js";
import { label } from "../../core/labels.js";
import { box, cyl } from "../../core/primitives.js";

const TWO_PI = Math.PI * 2;

function ringPoint(radius, angle, z = 0) {
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
}

function addSpokes(root, radius, z, count, spokeRadius, material, offset = 0) {
  for (let i = 0; i < count; i++) {
    const a = offset + i * TWO_PI / count;
    root.add(cylinderBetween(new THREE.Vector3(0, 0, z), ringPoint(radius, a, z), spokeRadius, material));
  }
}

function addWindowRows(root, radius, tube, z, windowMat, count = 48, arcStart = 0, arcEnd = TWO_PI) {
  for (let i = 0; i < count; i++) {
    const a = i * TWO_PI / count;
    const insideArc = arcStart <= arcEnd ? a >= arcStart && a <= arcEnd : a >= arcStart || a <= arcEnd;
    if (!insideArc || i % 2) continue;
    const light = box(0.020, 0.006, 0.006, windowMat, 0, 0, 0);
    light.position.copy(ringPoint(radius + tube * 1.16, a, z));
    light.rotation.z = a;
    root.add(light);
  }
}

function addFinishedSegments(root, R, radius, tube, z, material, start = 0, end = TWO_PI, count = 64) {
  for (let i = 0; i < count; i++) {
    const a = i * TWO_PI / count;
    const insideArc = start <= end ? a >= start && a <= end : a >= start || a <= end;
    if (!insideArc) continue;
    const segment = box(0.030 * R, 0.010 * R, 0.028 * R, i % 2 ? material : mat.white, 0, 0, 0);
    segment.position.copy(ringPoint(radius, a, z));
    segment.rotation.z = a;
    root.add(segment);
  }
}

function addLatticeArc(root, R, radius, tube, z, material, start = 0, end = TWO_PI, count = 52) {
  for (let i = 0; i < count; i++) {
    const a0 = start + (end - start) * (i / count);
    const a1 = start + (end - start) * ((i + 0.78) / count);
    const outer = ringPoint(radius + tube, a0, z);
    const inner = ringPoint(radius - tube, a1, z);
    root.add(cylinderBetween(outer, inner, 0.0036 * R, material));
    if (i % 2 === 0) {
      const chordA = ringPoint(radius, a0, z - 0.013 * R);
      const chordB = ringPoint(radius, a1, z + 0.013 * R);
      root.add(cylinderBetween(chordA, chordB, 0.0025 * R, material));
    }
  }
}

function addHabRing(station, animated, R, z, radius, finished = 1, spin = 0.08) {
  const ringGroup = new THREE.Group();
  const tube = 0.018 * R;
  const copper = new THREE.MeshStandardMaterial({ color: 0x7a4a32, metalness: 0.55, roughness: 0.5 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe8b0 });
  const finishedMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.18, roughness: 0.38 });
  const finishedArc = finished * TWO_PI;

  if (finished > 0) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 22, 128, finishedArc), finishedMat);
    ring.position.z = z;
    if (finished < 1) ring.rotation.z = -Math.PI * 0.35;
    ringGroup.add(ring);
    addFinishedSegments(ringGroup, R, radius, tube, z, finishedMat, 0, finishedArc, 72);
    addWindowRows(ringGroup, radius, tube, z, windowMat, 54, 0, finishedArc);
  }
  if (finished < 1) {
    const start = finishedArc - Math.PI * 0.35;
    addLatticeArc(ringGroup, R, radius, tube * 1.35, z, copper, start, start + TWO_PI * (1 - finished), 64);
  }

  addSpokes(ringGroup, radius, z, finished > 0.75 ? 6 : 4, 0.010 * R, finished > 0.55 ? mat.beskar : copper, z * 0.04);
  ringGroup.userData.tick = (t) => {
    ringGroup.rotation.z = t * spin;
  };
  animated.push(ringGroup);
  station.add(ringGroup);
}

function addUtilityRing(station, R, z, radius, variant = "docking") {
  const ringGroup = new THREE.Group();
  const copper = new THREE.MeshStandardMaterial({ color: 0x7a4a32, metalness: 0.55, roughness: 0.5 });
  const steel = mat.beskar;
  const tube = 0.008 * R;
  const ringMat = variant === "construction" ? copper : steel;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 96), ringMat);
  ring.position.z = z;
  ringGroup.add(ring);
  addSpokes(ringGroup, radius, z, variant === "solar" ? 8 : 5, 0.0048 * R, ringMat, 0.2);

  if (variant === "radiator") {
    for (let i = 0; i < 28; i++) {
      const a = i * TWO_PI / 28;
      const fin = box(0.012 * R, 0.072 * R, 0.003 * R, mat.white, 0, 0, 0);
      fin.position.copy(ringPoint(radius + 0.025 * R, a, z));
      fin.rotation.z = a;
      ringGroup.add(fin);
    }
  }

  if (variant === "solar") {
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x16294a, emissive: 0x2f5694, emissiveIntensity: 0.22, metalness: 0.25, roughness: 0.42 });
    for (const side of [-1, 1]) {
      const boom = box(0.010 * R, 0.010 * R, 0.18 * R, steel, 0, 0, 0);
      boom.position.set(side * (radius + 0.02 * R), 0, z);
      boom.rotation.y = Math.PI / 2;
      ringGroup.add(boom);
      for (let i = 0; i < 3; i++) {
        const panel = box(0.060 * R, 0.004 * R, 0.035 * R, solarMat, 0, 0, 0);
        panel.position.set(side * (radius + 0.06 * R + i * 0.066 * R), 0, z);
        ringGroup.add(panel);
      }
    }
  }

  if (variant === "construction") {
    addLatticeArc(ringGroup, R, radius, 0.020 * R, z, copper, -0.2, TWO_PI - 0.2, 54);
  }

  station.add(ringGroup);
}

function addSpine(station, R) {
  const core = new THREE.Group();
  const steel = mat.beskar;
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.16, roughness: 0.36 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.45, roughness: 0.5 });
  const length = 0.70 * R;
  for (let i = 0; i < 21; i++) {
    const t = i / 20;
    const rib = cyl((0.030 + (i % 3) * 0.005) * R, (0.034 + (i % 2) * 0.004) * R, 0.024 * R, i % 2 ? steel : white, 40, 0, 0, 0);
    rib.rotation.x = Math.PI / 2;
    rib.position.z = THREE.MathUtils.lerp(-length * 0.5, length * 0.5, t);
    core.add(rib);
  }
  const pipeYs = [0.045 * R, -0.045 * R];
  for (const y of pipeYs) {
    const pipe = cyl(0.004 * R, 0.004 * R, length * 0.86, dark, 12, 0, 0, 0);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.y = y;
    core.add(pipe);
  }
  for (const z of [-length * 0.54, length * 0.54]) {
    const node = cyl(0.052 * R, 0.046 * R, 0.09 * R, white, 40, 0, 0, 0);
    node.rotation.x = Math.PI / 2;
    node.position.z = z;
    core.add(node);
    const port = cyl(0.028 * R, 0.028 * R, 0.014 * R, dark, 28, 0, 0, 0);
    port.rotation.x = Math.PI / 2;
    port.position.z = z + Math.sign(z) * 0.055 * R;
    core.add(port);
  }
  for (let i = 0; i < 16; i++) {
    const panel = box(0.038 * R, 0.006 * R, 0.018 * R, i % 2 ? steel : white, 0, 0, 0);
    panel.position.set(Math.sin(i) * 0.05 * R, Math.cos(i) * 0.05 * R, -0.31 * R + i * 0.041 * R);
    panel.rotation.z = i * 0.8;
    core.add(panel);
  }
  station.add(core);
}

function addBuddingModules(station, R) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.16, roughness: 0.42 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x7a4a32, metalness: 0.55, roughness: 0.5 });
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -0.27 * R + i * 0.07 * R;
    const tube = cyl(0.010 * R, 0.010 * R, 0.12 * R, mat.beskar, 12, 0, 0, 0);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(side * 0.075 * R, 0.03 * R * Math.sin(i), z);
    station.add(tube);
    const pod = cyl(0.024 * R, 0.024 * R, 0.055 * R, i > 5 ? copper : white, 24, 0, 0, 0);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(side * 0.14 * R, 0.03 * R * Math.sin(i), z);
    station.add(pod);
  }
}

function addBerthedCapsule(station, R) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.18, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x11151b, metalness: 0.45, roughness: 0.48 });
  const capsule = new THREE.Group();
  const body = cyl(0.026 * R, 0.032 * R, 0.060 * R, white, 28, 0, 0, 0);
  body.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.027 * R, 24, 10, 0, TWO_PI, 0, Math.PI / 2), white);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -0.036 * R;
  const trunk = cyl(0.030 * R, 0.032 * R, 0.050 * R, dark, 24, 0, 0, 0);
  trunk.rotation.x = Math.PI / 2;
  trunk.position.z = 0.052 * R;
  capsule.add(body, nose, trunk);
  capsule.position.set(0.12 * R, -0.075 * R, -0.41 * R);
  capsule.rotation.set(0.15, -0.25, -0.1);
  station.add(capsule);
}

function buildGatewayStation(R, animated) {
  const station = new THREE.Group();
  addSpine(station, R);
  const rings = [
    { z: -0.34 * R, r: 0.09 * R, type: "docking" },
    { z: -0.24 * R, r: 0.18 * R, type: "hab", finished: 1.0, spin: TWO_PI / 95 },
    { z: -0.14 * R, r: 0.10 * R, type: "radiator" },
    { z: -0.04 * R, r: 0.19 * R, type: "hab", finished: 1.0, spin: -TWO_PI / 110 },
    { z: 0.07 * R, r: 0.10 * R, type: "construction" },
    { z: 0.18 * R, r: 0.18 * R, type: "hab", finished: 0.42, spin: TWO_PI / 120 },
    { z: 0.29 * R, r: 0.09 * R, type: "solar" },
    { z: 0.39 * R, r: 0.17 * R, type: "hab", finished: 0.18, spin: -TWO_PI / 135 }
  ];
  for (const ring of rings) {
    if (ring.type === "hab") addHabRing(station, animated, R, ring.z, ring.r, ring.finished, ring.spin);
    else addUtilityRing(station, R, ring.z, ring.r, ring.type);
  }
  addBuddingModules(station, R);
  addBerthedCapsule(station, R);
  greeble(station, {
    center: new THREE.Vector3(0, 0.060 * R, 0),
    normal: new THREE.Vector3(0, 1, 0),
    width: 0.68 * R,
    height: 0.18 * R,
    minSize: 0.005 * R,
    maxSize: 0.026 * R,
    depth: 0.0018 * R
  }, 260);
  return station;
}

export function buildStation(scene, R, interactive, animated, travel) {
  const gateway = buildGatewayStation(R, animated);
  gateway.position.set(1.85 * R, 0.42 * R, -0.95 * R);
  gateway.rotation.set(0.08, Math.PI / 2.35, 0.1);
  scene.add(gateway);
  const gatewayHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.86 * R, 32, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  gatewayHit.position.copy(gateway.position);
  gatewayHit.userData.focusable = true;
  scene.add(addInteractive(interactive, gatewayHit, "Gateway Station", () => travel("gateway"), "The Crossing between Earthlight and lunar night"));
  label(scene, "GATEWAY // THE CROSSING", gateway.position.clone().add(new THREE.Vector3(0, 0.58 * R, 0)), 0.68, "hero");
  return gateway;
}
