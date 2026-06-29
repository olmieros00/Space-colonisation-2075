import * as THREE from "three";
import { addInteractive } from "../../core/materials.js";
import { swarmFragmentShader, swarmVertexShader } from "../../shaders/swarm.glsl.js";

// Thousands of GPU dots stand in for the much larger 2027+ traffic vision,
// but every dot is assigned to a real orbital lane instead of a random shell.
const SWARM_COUNT = 36000;
const LANE_COUNT = 90;
const LANE_SEGMENTS = 144;
const TWO_PI = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MEAN_ORBIT_PERIOD = 5400;
const HIGHWAY_FOCUS_COUNT = 8;
const HIGHWAY_SEGMENT_COUNT = 96;
const HIGHWAY_SATELLITE_COUNT = 9;
const panelAxis = new THREE.Vector3();
const wingAxis = new THREE.Vector3();
const normalAxis = new THREE.Vector3();
const tempPoint = new THREE.Vector3();
const tempNext = new THREE.Vector3();
const baseTorusNormal = new THREE.Vector3(0, 0, 1);
const tmpRadial = new THREE.Vector3();
const tmpTangent = new THREE.Vector3();
const tmpCross = new THREE.Vector3();

function swarmRand(seed) {
  return THREE.MathUtils.euclideanModulo(Math.sin(seed * 127.1) * 43758.5453, 1);
}

function swarmSmoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function makeLane(i, R) {
  const dense = i < 64;
  const family = i % 10;
  const shellPick = [1.075, 1.10, 1.125, 1.16][i % 4];
  const radius = (dense ? shellPick : THREE.MathUtils.lerp(1.18, 1.31, swarmRand(i + 8))) * R;
  let inclination;
  if (family < 2) inclination = THREE.MathUtils.lerp(0.02, 0.22, swarmRand(i + 21));
  else if (family < 7) inclination = THREE.MathUtils.lerp(1.30, 1.72, swarmRand(i + 35));
  else inclination = THREE.MathUtils.lerp(0.45, 1.15, swarmRand(i + 49));
  return {
    radius,
    minorRadius: radius * THREE.MathUtils.lerp(0.965, 1.0, swarmRand(i + 63)),
    inclination,
    node: THREE.MathUtils.euclideanModulo(i * GOLDEN_ANGLE + swarmRand(i + 77) * 0.18, TWO_PI),
    phaseOffset: swarmRand(i + 91) * TWO_PI,
    density: dense ? THREE.MathUtils.lerp(0.85, 1.25, swarmRand(i + 102)) : 0.45
  };
}

function orbitPoint(lane, theta) {
  const p = new THREE.Vector3(Math.cos(theta) * lane.radius, 0, Math.sin(theta) * lane.minorRadius);
  p.applyAxisAngle(new THREE.Vector3(1, 0, 0), lane.inclination);
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), lane.node);
  return p;
}

function laneTangent(lane, theta) {
  const a = orbitPoint(lane, theta + 0.004);
  const b = orbitPoint(lane, theta - 0.004);
  return a.sub(b).normalize();
}

function laneNormal(lane) {
  return new THREE.Vector3(0, 1, 0)
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), lane.inclination)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), lane.node)
    .normalize();
}

function createLanes(R) {
  return Array.from({ length: LANE_COUNT }, (_, i) => makeLane(i, R));
}

function createTrafficGeometry(R, lanes) {
  const positions = new Float32Array(SWARM_COUNT * 3);
  const radii = new Float32Array(SWARM_COUNT);
  const minorRadii = new Float32Array(SWARM_COUNT);
  const inclinations = new Float32Array(SWARM_COUNT);
  const nodes = new Float32Array(SWARM_COUNT);
  const phases = new Float32Array(SWARM_COUNT);
  const speeds = new Float32Array(SWARM_COUNT);
  const tints = new Float32Array(SWARM_COUNT);
  const middleR = 1.10 * R;
  const meanSpeed = TWO_PI / MEAN_ORBIT_PERIOD;
  let cursor = 0;

  for (let i = 0; i < lanes.length && cursor < SWARM_COUNT; i++) {
    const lane = lanes[i];
    const laneCount = Math.min(SWARM_COUNT - cursor, Math.round((SWARM_COUNT / LANE_COUNT) * lane.density));
    for (let j = 0; j < laneCount; j++, cursor++) {
      const jitter = (swarmRand(i * 1009 + j * 17) - 0.5) * 0.015;
      positions[cursor * 3] = 0;
      radii[cursor] = lane.radius;
      minorRadii[cursor] = lane.minorRadius;
      inclinations[cursor] = lane.inclination;
      nodes[cursor] = lane.node;
      phases[cursor] = lane.phaseOffset + (j / laneCount + jitter) * TWO_PI;
      speeds[cursor] = meanSpeed * Math.pow(middleR / lane.radius, 1.5);
      tints[cursor] = swarmRand(i * 53 + j * 5);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  geo.setAttribute("aMinorRadius", new THREE.BufferAttribute(minorRadii, 1));
  geo.setAttribute("aInclination", new THREE.BufferAttribute(inclinations, 1));
  geo.setAttribute("aNode", new THREE.BufferAttribute(nodes, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geo.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
  geo.setDrawRange(0, cursor);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.34 * R);
  return geo;
}

function createLaneGuides(R, lanes) {
  const positions = [];
  for (const lane of lanes) {
    for (let i = 0; i < LANE_SEGMENTS; i++) {
      const a = (i / LANE_SEGMENTS) * TWO_PI;
      const b = ((i + 1) / LANE_SEGMENTS) * TWO_PI;
      positions.push(...orbitPoint(lane, a).toArray(), ...orbitPoint(lane, b).toArray());
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.34 * R);
  const mat = new THREE.LineBasicMaterial({
    color: 0x6d8daf,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true
  });
  const guides = new THREE.LineSegments(geo, mat);
  guides.frustumCulled = false;
  return guides;
}

function makeHighwayMaterial({ color = 0xaefaff, opacity = 1, depthWrite = false } = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite,
    depthTest: true,
    blending: THREE.AdditiveBlending
  });
}

function setHighwayOpacity(root, opacity) {
  root.traverse(o => {
    if (o.material && o.material.userData.highwayOpacity !== undefined) {
      o.material.opacity = o.material.userData.highwayOpacity * opacity;
    }
  });
}

function orientToLane(obj, lane, theta, roll = 0) {
  const radial = orbitPoint(lane, theta).normalize();
  const tangent = laneTangent(lane, theta);
  normalAxis.crossVectors(tangent, radial).normalize();
  wingAxis.crossVectors(normalAxis, tangent).normalize();
  panelAxis.copy(wingAxis).applyAxisAngle(tangent, roll);
  const m = new THREE.Matrix4().makeBasis(tangent, panelAxis, normalAxis);
  obj.quaternion.setFromRotationMatrix(m);
}

function addPanelGrid(panel, width, height, material) {
  const lines = [];
  const cols = 5;
  const rows = 3;
  for (let i = 1; i < cols; i++) {
    const x = THREE.MathUtils.lerp(-width / 2, width / 2, i / cols);
    lines.push(x, -height / 2, 0.004, x, height / 2, 0.004);
  }
  for (let i = 1; i < rows; i++) {
    const y = THREE.MathUtils.lerp(-height / 2, height / 2, i / rows);
    lines.push(-width / 2, y, 0.004, width / 2, y, 0.004);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  panel.add(new THREE.LineSegments(geo, material));
}

function makeAtmosphereHazeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "rgba(170,220,255,0.00)");
  g.addColorStop(0.22, "rgba(132,203,255,0.22)");
  g.addColorStop(0.48, "rgba(70,160,230,0.36)");
  g.addColorStop(0.7, "rgba(20,76,140,0.20)");
  g.addColorStop(1, "rgba(2,8,22,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const horizon = ctx.createLinearGradient(0, 0, canvas.width, 0);
  horizon.addColorStop(0, "rgba(180,235,255,0.00)");
  horizon.addColorStop(0.5, "rgba(230,250,255,0.62)");
  horizon.addColorStop(1, "rgba(180,235,255,0.00)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, canvas.height * 0.43, canvas.width, 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createOrbitAtmosphereLayer(R) {
  const root = new THREE.Group();
  root.name = "Low-orbit atmospheric highway haze";
  const hazeMat = new THREE.MeshBasicMaterial({
    map: makeAtmosphereHazeTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  hazeMat.userData.highwayOpacity = 0.55;
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(2.8 * R, 1.05 * R), hazeMat);
  haze.name = "Low-orbit blue atmospheric limb";
  root.add(haze);

  const washMat = new THREE.MeshBasicMaterial({
    color: 0x8fcaff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  });
  washMat.userData.highwayOpacity = 0.09;
  const wash = new THREE.Mesh(new THREE.PlaneGeometry(2.25 * R, 1.5 * R), washMat);
  wash.position.z = -0.02 * R;
  root.add(wash);
  return root;
}

function createHighwaySatellite(R) {
  const root = new THREE.Group();
  root.name = "Starcloud-style lane satellite";
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xdfe5de,
    metalness: 0.72,
    roughness: 0.34
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    metalness: 0.42,
    roughness: 0.52
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xbccbd2,
    metalness: 0.76,
    roughness: 0.28
  });
  const glowMat = makeHighwayMaterial({ color: 0xbefcff, opacity: 0.55 });
  glowMat.userData.highwayOpacity = 0.55;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.018 * R, 0.012 * R, 0.014 * R), bodyMat);
  root.add(body);

  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.026 * R, 0.006 * R, 0.008 * R), frameMat);
  bus.position.x = 0.002 * R;
  root.add(bus);

  const panelMat = darkMat.clone();
  panelMat.side = THREE.DoubleSide;
  const panelGridMat = makeHighwayMaterial({ color: 0x7befff, opacity: 0.3 });
  panelGridMat.userData.highwayOpacity = 0.3;
  const panelW = 0.075 * R;
  const panelH = 0.024 * R;
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH, 2, 1), panelMat);
    panel.position.y = side * 0.028 * R;
    panel.rotation.x = Math.PI / 2;
    panel.rotation.z = side * 0.035;
    addPanelGrid(panel, panelW, panelH, panelGridMat);
    root.add(panel);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.003 * R, 0.043 * R, 0.003 * R), frameMat);
    mast.position.y = side * 0.018 * R;
    root.add(mast);
  }

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * R, 0.003 * R, 0.003 * R, 20), glowMat);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = 0.011 * R;
  root.add(dish);

  return root;
}

function createHighwayCloseup(scene, R, lane, laneIndex, focusOnObject, interactive, animated, camState, UI) {
  const theta = lane.phaseOffset + laneIndex * 0.38;
  const group = new THREE.Group();
  group.name = `Satellite highway lane ${laneIndex + 1}`;
  group.visible = false;
  const atmosphere = createOrbitAtmosphereLayer(R);
  group.add(atmosphere);

  const anchor = new THREE.Object3D();
  anchor.name = `Highway lane ${laneIndex + 1} focus`;
  anchor.position.copy(orbitPoint(lane, theta));
  scene.add(anchor);

  const focusLane = () => {
    if (UI) UI.hint.textContent = "Satellite highway close-up. The camera is inside the lane; satellites stay small, with oversized ears visible only at close range.";
    focusOnObject(anchor, 0.24 * R, {
      orbitMin: 0.045 * R,
      orbitMax: 0.95 * R,
      exitDistance: 1.85 * R
    });
  };

  const laneHit = new THREE.Mesh(
    new THREE.TorusGeometry(lane.radius, 0.08 * R, 8, 180),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  laneHit.name = `Clickable satellite highway ${laneIndex + 1}`;
  laneHit.scale.y = lane.minorRadius / lane.radius;
  laneHit.quaternion.setFromUnitVectors(baseTorusNormal, laneNormal(lane));
  addInteractive(
    interactive,
    laneHit,
    `Satellite Highway ${laneIndex + 1}`,
    focusLane,
    "Click to enter the close-up traffic lane and inspect future broad-wing satellites"
  );
  scene.add(laneHit);

  const corridorMat = makeHighwayMaterial({ color: 0xaefaff, opacity: 0.0 });
  corridorMat.userData.highwayOpacity = 0.38;
  const glowMat = makeHighwayMaterial({ color: 0x5be7ff, opacity: 0.0 });
  glowMat.userData.highwayOpacity = 0.14;
  const tickMat = makeHighwayMaterial({ color: 0xffffff, opacity: 0.0 });
  tickMat.userData.highwayOpacity = 0.36;

  const corridor = [];
  const glow = [];
  const ticks = [];
  const segmentSpan = 0.42;
  for (let i = 0; i < HIGHWAY_SEGMENT_COUNT; i++) {
    const a = theta - segmentSpan / 2 + (i / HIGHWAY_SEGMENT_COUNT) * segmentSpan;
    const b = theta - segmentSpan / 2 + ((i + 1) / HIGHWAY_SEGMENT_COUNT) * segmentSpan;
    corridor.push(...orbitPoint(lane, a).toArray(), ...orbitPoint(lane, b).toArray());
    tempPoint.copy(orbitPoint(lane, a));
    tempNext.copy(orbitPoint(lane, a)).normalize().multiplyScalar(0.01 * R);
    glow.push(...tempPoint.clone().add(tempNext).toArray(), ...orbitPoint(lane, b).add(tempNext).toArray());
    if (i % 8 === 0) {
      const center = orbitPoint(lane, a);
      const radial = center.clone().normalize().multiplyScalar(0.028 * R);
      ticks.push(...center.clone().sub(radial).toArray(), ...center.clone().add(radial).toArray());
    }
  }
  const corridorGeo = new THREE.BufferGeometry();
  corridorGeo.setAttribute("position", new THREE.Float32BufferAttribute(corridor, 3));
  const corridorLines = new THREE.LineSegments(corridorGeo, corridorMat);
  corridorLines.frustumCulled = false;
  group.add(corridorLines);

  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute("position", new THREE.Float32BufferAttribute(glow, 3));
  const glowLines = new THREE.LineSegments(glowGeo, glowMat);
  glowLines.frustumCulled = false;
  group.add(glowLines);

  const tickGeo = new THREE.BufferGeometry();
  tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
  const tickLines = new THREE.LineSegments(tickGeo, tickMat);
  group.add(tickLines);

  const localSatellites = [];
  const meanSpeed = (TWO_PI / MEAN_ORBIT_PERIOD) * Math.pow((1.1 * R) / lane.radius, 1.5);
  for (let i = 0; i < HIGHWAY_SATELLITE_COUNT; i++) {
    const sat = createHighwaySatellite(R);
    sat.userData.theta = theta - segmentSpan / 2 + (i / HIGHWAY_SATELLITE_COUNT) * segmentSpan;
    sat.userData.speed = meanSpeed;
    sat.userData.roll = (swarmRand(laneIndex * 97 + i) - 0.5) * 0.22;
    localSatellites.push(sat);
    group.add(sat);
  }

  group.userData.tick = (t) => {
    const active = camState.isFocused && camState.focusedObject === anchor;
    const fade = active ? 1 : 0;
    group.visible = fade > 0;
    setHighwayOpacity(group, fade);
    const anchorTheta = theta + t * meanSpeed;
    anchor.position.copy(orbitPoint(lane, anchorTheta));
    tmpRadial.copy(anchor.position).normalize();
    tmpTangent.copy(laneTangent(lane, anchorTheta));
    tmpCross.crossVectors(tmpRadial, tmpTangent).normalize();
    atmosphere.position.copy(anchor.position).addScaledVector(tmpRadial, -0.055 * R);
    atmosphere.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tmpTangent, tmpCross, tmpRadial));
    for (let i = 0; i < localSatellites.length; i++) {
      const sat = localSatellites[i];
      const orbitTheta = sat.userData.theta + t * sat.userData.speed;
      sat.position.copy(orbitPoint(lane, orbitTheta));
      orientToLane(sat, lane, orbitTheta, sat.userData.roll);
    }
  };
  animated.push(group);
  scene.add(group);
}

export function buildSatelliteSwarm(scene, R, interactive, animated, camState, focusOnObject, UI) {
  const lanes = createLanes(R);
  const guides = createLaneGuides(R, lanes);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPointScale: { value: 1 } },
    vertexShader: swarmVertexShader,
    fragmentShader: swarmFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  });
  const points = new THREE.Points(createTrafficGeometry(R, lanes), material);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(guides, points);
  group.userData.tick = (t) => {
    const d = camState.orbitDistance;
    const k = 1 - swarmSmoothstep(1.42 * R, 2.55 * R, d);
    const laneK = 1 - swarmSmoothstep(1.55 * R, 2.75 * R, d);
    material.uniforms.uTime.value = t;
    material.uniforms.uOpacity.value = 0.92 * k;
    material.uniforms.uPointScale.value = THREE.MathUtils.lerp(0.9, 2.55, k);
    guides.material.opacity = 0.16 * laneK;
  };
  animated.push(group);
  scene.add(group);
  const focusStep = Math.max(1, Math.floor(lanes.length / HIGHWAY_FOCUS_COUNT));
  for (let i = 0; i < HIGHWAY_FOCUS_COUNT; i++) {
    createHighwayCloseup(scene, R, lanes[i * focusStep], i, focusOnObject, interactive, animated, camState, UI);
  }
  return group;
}
