import * as THREE from "three";
import { getMaxAnisotropy, loadPlanetTexture } from "../../core/materials.js";
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
  earthFragmentShader,
  earthVertexShader,
  proceduralCloudFragmentShader,
  proceduralCloudVertexShader,
  proceduralEarthFragmentShader,
  proceduralEarthVertexShader
} from "../../shaders/earth.glsl.js";

function proceduralEarthMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: proceduralEarthVertexShader,
    fragmentShader: proceduralEarthFragmentShader
  });
}

export function earthMesh(radius = 8, animated, state) {
  const earthAngularSpeed = Math.PI * 2 / 240;
  const cloudAngularSpeed = Math.PI * 2 / 200;
  const geo = new THREE.SphereGeometry(radius, 128, 128);
  const material = proceduralEarthMaterial();
  const earth = new THREE.Group();
  earth.rotation.z = THREE.MathUtils.degToRad(-23.44);
  earth.scale.y = 0.99665;
  const surface = new THREE.Mesh(geo, material);
  const cloudMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: proceduralCloudVertexShader,
    fragmentShader: proceduralCloudFragmentShader
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 96, 96), cloudMaterial);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.025, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader
    })
  );
  earth.add(surface, clouds, atmosphere);
  const sunDir = new THREE.Vector3(0.45, 0.7, 0.55).normalize();
  Promise.all([
    loadPlanetTexture("earth_atmos_2048.jpg", { colorSpace: THREE.SRGBColorSpace }),
    loadPlanetTexture("earth_specular_2048.jpg"),
    loadPlanetTexture("earth_normal_2048.jpg"),
    loadPlanetTexture("earth_lights_2048.png", { colorSpace: THREE.SRGBColorSpace })
  ]).then(([dayMap, specMap, normalMap, nightMap]) => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        specMap: { value: specMap },
        normalMap: { value: normalMap },
        nightMap: { value: nightMap },
        uSunDir: { value: sunDir.clone() }
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader
    });
    surface.material.dispose();
    surface.material = earthMaterial;
  }).catch(() => {
    // Keep the procedural Earth surface if any required remote texture is unavailable.
  });
  loadPlanetTexture("earth_clouds_2048.png", { colorSpace: THREE.SRGBColorSpace, repeatClouds: true }).then(cloudsMap => {
    clouds.geometry.dispose();
    clouds.geometry = new THREE.SphereGeometry(radius * 1.012, 96, 96);
    clouds.material.dispose();
    clouds.material = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      alphaMap: cloudsMap,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      roughness: 1,
      metalness: 0
    });
  }).catch(() => {
    // Keep the procedural cloud shader if the optional cloud texture is unavailable.
  });
  earth.userData.tick = (t) => {
    surface.rotation.y = -1.35 + t * earthAngularSpeed;
    clouds.rotation.y = -1.28 + t * cloudAngularSpeed;
    if (state.activeSun) sunDir.copy(state.activeSun.getWorldPosition(new THREE.Vector3())).normalize();
    if (surface.material.uniforms?.time) surface.material.uniforms.time.value = t;
    if (surface.material.uniforms?.uSunDir) surface.material.uniforms.uSunDir.value.copy(sunDir);
    if (clouds.material.uniforms?.time) clouds.material.uniforms.time.value = t;
  };
  animated.push(earth);
  return earth;
}

export function moonMesh(radius = 4) {
  const geo = new THREE.SphereGeometry(radius, 224, 112);
  const { albedo, relief } = moonSurfaceTextures();
  const material = new THREE.MeshStandardMaterial({
    map: albedo,
    bumpMap: relief,
    bumpScale: radius * 0.038,
    displacementMap: relief,
    displacementScale: radius * 0.018,
    roughness: 0.94,
    metalness: 0
  });
  const moon = new THREE.Mesh(geo, material);
  return moon;
}

let cachedMoonSurface = null;

function moonRand(seed) {
  return THREE.MathUtils.euclideanModulo(Math.sin(seed * 91.345 + 17.23) * 43758.5453, 1);
}

function makeMoonCanvas(size = 2048) {
  const albedo = document.createElement("canvas");
  const relief = document.createElement("canvas");
  albedo.width = albedo.height = relief.width = relief.height = size;
  const a = albedo.getContext("2d");
  const r = relief.getContext("2d");
  const base = a.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#9ca3a5");
  base.addColorStop(0.48, "#6f777b");
  base.addColorStop(1, "#3f484e");
  a.fillStyle = base;
  a.fillRect(0, 0, size, size);
  r.fillStyle = "#747474";
  r.fillRect(0, 0, size, size);

  for (let i = 0; i < 8500; i++) {
    const x = moonRand(i * 3 + 1) * size;
    const y = moonRand(i * 5 + 2) * size;
    const large = i < 180;
    const radius = large
      ? THREE.MathUtils.lerp(size * 0.012, size * 0.07, moonRand(i + 11) ** 2)
      : THREE.MathUtils.lerp(size * 0.0012, size * 0.010, moonRand(i + 17) ** 2.4);
    const tone = Math.floor(THREE.MathUtils.lerp(62, 160, moonRand(i + 29)));
    const basin = a.createRadialGradient(x, y, radius * 0.08, x, y, radius);
    basin.addColorStop(0, `rgba(${Math.max(20, tone - 54)},${Math.max(22, tone - 50)},${Math.max(24, tone - 46)},0.42)`);
    basin.addColorStop(0.54, `rgba(${tone},${tone + 3},${tone + 6},0.18)`);
    basin.addColorStop(0.72, "rgba(215,220,222,0.22)");
    basin.addColorStop(1, "rgba(10,12,14,0)");
    a.fillStyle = basin;
    a.beginPath();
    a.arc(x, y, radius, 0, Math.PI * 2);
    a.fill();

    const height = r.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    height.addColorStop(0, "rgba(20,20,20,0.46)");
    height.addColorStop(0.56, "rgba(86,86,86,0.16)");
    height.addColorStop(0.74, "rgba(230,230,230,0.34)");
    height.addColorStop(1, "rgba(128,128,128,0)");
    r.fillStyle = height;
    r.beginPath();
    r.arc(x, y, radius, 0, Math.PI * 2);
    r.fill();
  }

  const aData = a.getImageData(0, 0, size, size);
  const rData = r.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const grain = moonRand(x * 12.9898 + y * 78.233);
      const streak = Math.sin(x * 0.018 + y * 0.004) * 0.5 + 0.5;
      const delta = (grain - 0.5) * 22 + (streak - 0.5) * 8;
      aData.data[idx] = THREE.MathUtils.clamp(aData.data[idx] + delta, 18, 232);
      aData.data[idx + 1] = THREE.MathUtils.clamp(aData.data[idx + 1] + delta, 18, 232);
      aData.data[idx + 2] = THREE.MathUtils.clamp(aData.data[idx + 2] + delta, 18, 232);
      rData.data[idx] = rData.data[idx + 1] = rData.data[idx + 2] = THREE.MathUtils.clamp(rData.data[idx] + (grain - 0.5) * 36, 0, 255);
    }
  }
  a.putImageData(aData, 0, 0);
  r.putImageData(rData, 0, 0);
  return { albedo, relief };
}

function moonSurfaceTextures() {
  if (cachedMoonSurface) return cachedMoonSurface;
  const canvases = makeMoonCanvas();
  const albedo = new THREE.CanvasTexture(canvases.albedo);
  const relief = new THREE.CanvasTexture(canvases.relief);
  albedo.colorSpace = THREE.SRGBColorSpace;
  for (const tex of [albedo, relief]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = getMaxAnisotropy();
  }
  cachedMoonSurface = { albedo, relief };
  return cachedMoonSurface;
}

export function buildEarth(scene, R, animated, state) {
  const earth = earthMesh(R, animated, state);
  scene.add(earth);
  return { earthGroup: earth };
}
