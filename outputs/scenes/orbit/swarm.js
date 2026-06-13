import * as THREE from "three";
import { swarmFragmentShader, swarmVertexShader } from "../../shaders/swarm.glsl.js";

// 80k GPU points stand in for the ~400k-satellite 2027 vision without rendering 400k meshes.
const SWARM_COUNT = 80000;

const TWO_PI = Math.PI * 2;
const MEAN_ORBIT_PERIOD = 240;

function weightedShellRadius(R) {
  const shells = [1.06 * R, 1.10 * R, 1.14 * R];
  if (Math.random() < 0.72) return shells[Math.floor(Math.random() * shells.length)] + THREE.MathUtils.randFloatSpread(0.012 * R);
  return THREE.MathUtils.randFloat(1.03 * R, 1.31 * R);
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createSwarmGeometry(R) {
  const positions = new Float32Array(SWARM_COUNT * 3);
  const radii = new Float32Array(SWARM_COUNT);
  const inclinations = new Float32Array(SWARM_COUNT);
  const nodes = new Float32Array(SWARM_COUNT);
  const phases = new Float32Array(SWARM_COUNT);
  const speeds = new Float32Array(SWARM_COUNT);
  const middleR = 1.10 * R;
  const meanSpeed = TWO_PI / MEAN_ORBIT_PERIOD;

  for (let i = 0; i < SWARM_COUNT; i++) {
    const radius = weightedShellRadius(R);
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    radii[i] = radius;
    inclinations[i] = 0.9 + THREE.MathUtils.randFloatSpread(0.42);
    nodes[i] = Math.random() * TWO_PI;
    phases[i] = Math.random() * TWO_PI;
    speeds[i] = meanSpeed * Math.pow(middleR / radius, 1.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  geo.setAttribute("aInclination", new THREE.BufferAttribute(inclinations, 1));
  geo.setAttribute("aNode", new THREE.BufferAttribute(nodes, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.34 * R);
  return geo;
}

export function buildSatelliteSwarm(scene, R, animated, camState) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPointScale: { value: 1.0 }
    },
    vertexShader: swarmVertexShader,
    fragmentShader: swarmFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const swarm = new THREE.Points(createSwarmGeometry(R), material);
  swarm.frustumCulled = false;
  swarm.renderOrder = 3;
  swarm.userData.tick = (t) => {
    const d = camState.orbitDistance;
    const k = 1 - smoothstep(1.30 * R, 2.40 * R, d);
    material.uniforms.uTime.value = t;
    material.uniforms.uOpacity.value = 0.9 * k;
    material.uniforms.uPointScale.value = THREE.MathUtils.lerp(1.1, 3.4, k);
  };
  animated.push(swarm);
  scene.add(swarm);
  return swarm;
}
