import * as THREE from "three";
import { swarmFragmentShader, swarmVertexShader } from "../../shaders/swarm.glsl.js";

// Thousands of GPU dots stand in for the much larger 2027+ traffic vision,
// but every dot is assigned to a real orbital lane instead of a random shell.
const SWARM_COUNT = 36000;
const LANE_COUNT = 90;
const LANE_SEGMENTS = 144;
const TWO_PI = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MEAN_ORBIT_PERIOD = 240;

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

export function buildSatelliteSwarm(scene, R, animated, camState) {
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
  return group;
}
