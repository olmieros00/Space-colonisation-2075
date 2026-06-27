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
  const geo = new THREE.SphereGeometry(radius, 160, 80);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8a8f91,
    roughness: 0.98,
    metalness: 0
  });
  const moon = new THREE.Mesh(geo, material);
  Promise.all([
    loadLocalTexture("assets/moon_2k_real.jpg", { colorSpace: THREE.SRGBColorSpace }),
    loadLocalTexture("assets/moon_2k_real.jpg")
  ]).then(([moonMap, reliefMap]) => {
    moon.material.map = moonMap;
    moon.material.bumpMap = reliefMap;
    moon.material.bumpScale = radius * 0.010;
    moon.material.needsUpdate = true;
  }).catch(() => {
    // Keep the neutral Moon material if the local texture is unavailable.
  });
  return moon;
}

function loadLocalTexture(path, { colorSpace = null } = {}) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      path,
      tex => {
        if (colorSpace) tex.colorSpace = colorSpace;
        tex.anisotropy = getMaxAnisotropy();
        resolve(tex);
      },
      undefined,
      err => reject(err)
    );
  });
}

export function buildEarth(scene, R, animated, state) {
  const earth = earthMesh(R, animated, state);
  scene.add(earth);
  return { earthGroup: earth };
}
