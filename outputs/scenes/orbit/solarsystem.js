import * as THREE from "three";

const SUN_SOURCE = new THREE.Vector3(12, 18, 60);

function solarCoronaTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = 256;
  cnv.height = 256;
  const ctx = cnv.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  g.addColorStop(0, "rgba(255,250,220,1)");
  g.addColorStop(0.18, "rgba(255,218,142,.68)");
  g.addColorStop(0.42, "rgba(255,154,60,.22)");
  g.addColorStop(1, "rgba(255,154,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function bandTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = 256;
  cnv.height = 128;
  const ctx = cnv.getContext("2d");
  const bands = ["#d9b47a", "#8f6844", "#ead2a0", "#b98750", "#f1d69a", "#6d4b35"];
  for (let y = 0; y < cnv.height; y++) {
    ctx.fillStyle = bands[Math.floor(y / 18) % bands.length];
    ctx.fillRect(0, y, cnv.width, 1);
  }
  ctx.fillStyle = "rgba(255,255,255,.12)";
  for (let i = 0; i < 80; i++) ctx.fillRect(Math.random() * 256, Math.random() * 128, Math.random() * 42, 1);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function planet(scene, name, position, radius, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), material);
  mesh.name = name;
  mesh.position.copy(position);
  scene.add(mesh);
  return mesh;
}

function glowSprite(texture, position, scale, opacity, color = 0xffffff) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sprite.position.copy(position);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export function buildSolarSystem(scene, state) {
  const sunDir = SUN_SOURCE.clone().normalize();
  const sunPosition = sunDir.multiplyScalar(700);
  const sunGroup = new THREE.Group();
  sunGroup.name = "Visible Sol";
  sunGroup.position.copy(sunPosition);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(8, 96, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.68, 1.18), toneMapped: false })
  );
  sunGroup.add(sun);
  const coronaTexture = solarCoronaTexture();
  const corona = glowSprite(coronaTexture, new THREE.Vector3(), 56, 0.56, 0xffd69a);
  sunGroup.add(corona);
  scene.add(sunGroup);

  const sunLight = state.activeSun?.isDirectionalLight ? state.activeSun : new THREE.DirectionalLight(0xffffff, 1.35);
  sunLight.position.copy(sunPosition);
  sunLight.intensity = 1.35;
  if (!sunLight.parent) scene.add(sunLight);
  state.activeSun = sunGroup;

  const hot = new THREE.MeshBasicMaterial({ color: 0xfff0c8, toneMapped: false });
  const mars = new THREE.MeshBasicMaterial({ color: 0xc8714d });
  const ice = new THREE.MeshBasicMaterial({ color: 0xaec7ff });
  const jupiter = new THREE.MeshBasicMaterial({ map: bandTexture() });
  planet(scene, "Inner Forge", new THREE.Vector3(-118, 34, -360), 0.52, hot);
  planet(scene, "Ares Relay", new THREE.Vector3(138, -22, -520), 0.68, mars);
  planet(scene, "Jovian Beacon", new THREE.Vector3(-315, 62, -700), 1.25, jupiter);
  planet(scene, "Outer Ice", new THREE.Vector3(285, 86, -820), 0.86, ice);

  const tinyGlow = solarCoronaTexture();
  scene.add(glowSprite(tinyGlow, new THREE.Vector3(-118, 34, -360), 4.5, 0.2, 0xfff0c8));
  scene.add(glowSprite(tinyGlow, new THREE.Vector3(138, -22, -520), 4.8, 0.15, 0xff9a70));
  scene.add(glowSprite(tinyGlow, new THREE.Vector3(-315, 62, -700), 6.2, 0.12, 0xf5d190));
  scene.add(glowSprite(tinyGlow, new THREE.Vector3(285, 86, -820), 5.2, 0.13, 0xbcd6ff));
}
