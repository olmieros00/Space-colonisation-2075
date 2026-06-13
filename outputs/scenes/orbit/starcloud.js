import * as THREE from "three";
import { addInteractive, label, mat } from "../../core/materials.js";

const TWO_PI = Math.PI * 2;

function makeSolarCellTexture(size = 1024, cols = 64, rows = 32) {
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size / 2;
  const ctx = cnv.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, cnv.width, cnv.height);
  grad.addColorStop(0, "#050811");
  grad.addColorStop(0.45, "#0a0e16");
  grad.addColorStop(1, "#11172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.strokeStyle = "rgba(16, 24, 38, 0.92)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x++) {
    const px = (x / cols) * cnv.width;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, cnv.height);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    const py = (y / rows) * cnv.height;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(cnv.width, py);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(80, 104, 180, 0.28)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= cols; x += 8) {
    const px = (x / cols) * cnv.width;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, cnv.height);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeStarcloudLogoTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = 256;
  cnv.height = 96;
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.fillStyle = "#11151b";
  ctx.beginPath();
  ctx.moveTo(22, 48);
  ctx.lineTo(52, 24);
  ctx.lineTo(45, 42);
  ctx.lineTo(76, 42);
  ctx.lineTo(40, 72);
  ctx.lineTo(48, 52);
  ctx.closePath();
  ctx.fill();
  ctx.font = "bold 28px Courier New";
  ctx.fillText("Starcloud", 88, 58);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addSolarWing(root, R, x, side, arrayMat, trussMat) {
  const wing = new THREE.Group();
  const sectionCount = 3;
  const sectionLength = 0.14 * R;
  const sectionWidth = 0.095 * R;
  const gap = 0.018 * R;
  const zBase = side * 0.105 * R;
  for (let i = 0; i < sectionCount; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(sectionLength, 0.004 * R, sectionWidth), arrayMat);
    panel.position.set(x + (i - 1) * (sectionLength + gap), 0.045 * R, zBase + side * sectionWidth * 0.48);
    panel.rotation.y = -0.08 * side;
    wing.add(panel);

    const frameA = new THREE.Mesh(new THREE.BoxGeometry(sectionLength + 0.006 * R, 0.007 * R, 0.004 * R), trussMat);
    frameA.position.copy(panel.position);
    frameA.position.z += side * sectionWidth * 0.53;
    const frameB = frameA.clone();
    frameB.position.z -= side * sectionWidth * 1.06;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.006 * R, 0.008 * R, sectionWidth + 0.01 * R), trussMat);
    cross.position.copy(panel.position);
    wing.add(frameA, frameB, cross);
  }
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.5 * R, 0.009 * R, 0.006 * R), trussMat);
  boom.position.set(x, 0.035 * R, side * 0.075 * R);
  wing.add(boom);
  root.add(wing);
}

function addTrussSpine(root, R, trussMat, amberMat, goldMat) {
  const spine = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.52 * R, 0.018 * R, 0.018 * R), trussMat);
  spine.add(beam);
  for (let i = -8; i <= 8; i++) {
    const x = i * 0.032 * R;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.006 * R, 0.07 * R, 0.006 * R), trussMat);
    rib.position.set(x, 0, 0);
    rib.rotation.z = i % 2 ? 0.55 : -0.55;
    spine.add(rib);
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.48 * R, 0.006 * R, 0.008 * R), amberMat);
  strip.position.set(0, 0.033 * R, 0);
  spine.add(strip);
  for (let i = -5; i <= 5; i += 2) {
    const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.035 * R, 0.026 * R, 6, 3), goldMat);
    foil.position.set(i * 0.04 * R, -0.02 * R, -0.018 * R);
    foil.rotation.x = Math.PI * 0.52;
    const pos = foil.geometry.attributes.position;
    for (let p = 0; p < pos.count; p++) pos.setZ(p, Math.sin(p * 2.1 + i) * 0.002 * R);
    foil.geometry.computeVertexNormals();
    spine.add(foil);
  }
  root.add(spine);
  return spine;
}

function buildComputeModule(R, bodyMat, darkMat, decalMat, trussMat, detail = false) {
  const module = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.034 * R, 0.026 * R, 0.024 * R), bodyMat);
  module.add(body);

  const chamfer = new THREE.Mesh(new THREE.BoxGeometry(0.006 * R, 0.0265 * R, 0.0245 * R), bodyMat);
  chamfer.position.x = 0.019 * R;
  chamfer.rotation.z = -0.32;
  module.add(chamfer);

  const port = new THREE.Mesh(new THREE.CylinderGeometry(0.006 * R, 0.006 * R, 0.003 * R, 18), darkMat);
  port.rotation.z = Math.PI / 2;
  port.position.set(0.0225 * R, 0.002 * R, 0);
  module.add(port);

  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.025 * R, 0.010 * R), decalMat);
  logo.position.set(-0.001 * R, 0.0132 * R, 0.002 * R);
  logo.rotation.x = -Math.PI / 2;
  module.add(logo);

  if (detail) {
    for (let i = -2; i <= 2; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.002 * R, 0.0012 * R, 0.016 * R), darkMat);
      vent.position.set(i * 0.005 * R, -0.0136 * R, -0.001 * R);
      module.add(vent);
    }
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.0014 * R, 0.0014 * R, 0.031 * R, 8), trussMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(-0.008 * R, -0.004 * R, 0.013 * R);
    module.add(pipe);
  }
  return module;
}

function addComputeSpine(root, detailRoot, R, interactive, focusStarcloud) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, metalness: 0.5, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x101218, metalness: 0.45, roughness: 0.5 });
  const trussMat = mat.beskar;
  const logoTex = makeStarcloudLogoTexture();
  const decalMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
  const rows = [-0.032 * R, 0.032 * R];
  let idx = 0;
  for (let x = -0.235 * R; x <= 0.235 * R; x += 0.026 * R) {
    for (const z of rows) {
      const module = buildComputeModule(R, bodyMat, darkMat, decalMat, trussMat, false);
      module.position.set(x, -0.012 * R, z);
      module.rotation.y = z > 0 ? -0.08 : 0.08;
      addInteractive(interactive, module, "STARCLOUD ATLAS-CLASS", focusStarcloud, "Atlas-class orbital data center module bay");
      root.add(module);
      if (idx % 2 === 0) {
        const greeble = new THREE.Group();
        for (let v = -2; v <= 2; v++) {
          const vent = new THREE.Mesh(new THREE.BoxGeometry(0.002 * R, 0.0012 * R, 0.016 * R), darkMat);
          vent.position.set(v * 0.005 * R, -0.014 * R, -0.001 * R);
          greeble.add(vent);
        }
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.0014 * R, 0.0014 * R, 0.031 * R, 8), trussMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(-0.008 * R, -0.004 * R, 0.013 * R);
        greeble.add(pipe);
        greeble.position.copy(module.position);
        greeble.rotation.copy(module.rotation);
        detailRoot.add(greeble);
      }
      idx++;
    }
  }
}

function addLaserTerminals(root, animatedBeams, R) {
  const turretMat = new THREE.MeshStandardMaterial({ color: 0xb8c2cc, metalness: 0.68, roughness: 0.36 });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const mounts = [
    [-0.2 * R, 0.045 * R, -0.07 * R, -1.2, 0.35],
    [-0.05 * R, 0.052 * R, 0.08 * R, -0.35, -0.2],
    [0.13 * R, 0.05 * R, -0.08 * R, 0.7, 0.45],
    [0.23 * R, 0.042 * R, 0.05 * R, 1.35, -0.1]
  ];
  for (const [x, y, z, yaw, pitch] of mounts) {
    const turret = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.009 * R, 0.012 * R, 0.012 * R, 18), turretMat);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.012 * R, 0.028 * R, 20), turretMat);
    dish.rotation.x = Math.PI / 2;
    dish.position.z = -0.018 * R;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.0012 * R, 0.0012 * R, 1.3 * R, 8), beamMat.clone());
    beam.rotation.x = Math.PI / 2;
    beam.position.z = -0.68 * R;
    turret.position.set(x, y, z);
    turret.rotation.set(pitch, yaw, 0.08);
    turret.add(base, dish, beam);
    beam.userData.tick = (t) => {
      beam.material.opacity = 0.32 + 0.23 * Math.sin(t * 1.7 + x) ** 2;
    };
    animatedBeams.push(beam);
    root.add(turret);
  }
}

function addDragonCapsule(root, R) {
  const capsule = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f1ec, metalness: 0.18, roughness: 0.38 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x11151b, metalness: 0.5, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.028 * R, 0.038 * R, 12, 32), bodyMat);
  body.scale.set(1.12, 0.82, 1.12);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03 * R, 0.04 * R, 32), bodyMat);
  nose.position.y = 0.044 * R;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * R, 0.03 * R, 0.045 * R, 32), darkMat);
  trunk.position.y = -0.055 * R;
  capsule.add(body, nose, trunk);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.4;
    const flare = new THREE.Mesh(new THREE.BoxGeometry(0.044 * R, 0.004 * R, 0.013 * R), bodyMat);
    flare.position.set(Math.cos(a) * 0.026 * R, -0.02 * R, Math.sin(a) * 0.026 * R);
    flare.rotation.y = -a;
    capsule.add(flare);
  }
  for (let i = 0; i < 12; i++) {
    const a = i * TWO_PI / 12;
    const nub = new THREE.Mesh(new THREE.SphereGeometry(0.0034 * R, 8, 6), darkMat);
    nub.position.set(Math.cos(a) * 0.03 * R, 0.016 * R, Math.sin(a) * 0.03 * R);
    capsule.add(nub);
  }
  capsule.position.set(-0.39 * R, 0.18 * R, 0.24 * R);
  capsule.rotation.set(-0.9, 0.55, -0.42);
  root.add(capsule);
}

export function buildServiceDroids(parent, R) {
  const droids = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x667381, metalness: 0.72, roughness: 0.52 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x7a4a32, metalness: 0.45, roughness: 0.68 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x161a20, metalness: 0.55, roughness: 0.52 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff9a3c, emissive: 0xff9a3c, emissiveIntensity: 1.7 });
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });

  for (let i = 0; i < 5; i++) {
    const droid = new THREE.Group();
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.012 * R, 0.006 * R, 0.018 * R), i % 2 ? metal : rust);
    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.009 * R, 0.018 * R, 5), metal);
    torso.position.y = 0.012 * R;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0018 * R, 0.0018 * R, 0.014 * R, 8), dark);
    neck.position.y = 0.028 * R;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.011 * R, 0.006 * R, 0.008 * R), dark);
    head.position.y = 0.038 * R;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0022 * R, 8, 6), eyeMat);
    eye.position.set(0, 0.038 * R, -0.0045 * R);
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.0015 * R, 0.0015 * R, 0.02 * R, 8), metal);
    upper.rotation.z = 0.8;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.0012 * R, 0.0012 * R, 0.016 * R, 8), metal);
    lower.position.set(0.013 * R, -0.006 * R, 0);
    lower.rotation.z = -0.9;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0022 * R, 8, 6), sparkMat);
    tip.position.set(0.021 * R, -0.011 * R, 0);
    arm.position.set(0.004 * R, 0.018 * R, -0.006 * R);
    arm.add(upper, lower, tip);
    droid.add(chassis, torso, neck, head, eye, arm);
    droid.position.set((-0.2 + i * 0.1) * R, 0.03 * R, (i % 2 ? 0.055 : -0.055) * R);
    droid.userData.tick = (t) => {
      const crawl = ((t * 0.018 + i * 0.19) % 0.48) - 0.24;
      droid.position.x = crawl * R;
      head.rotation.y = Math.sin(t * 0.9 + i) * 0.9;
      arm.rotation.z = -0.35 + Math.sin(t * 2.8 + i) * 0.42;
      tip.scale.setScalar(0.65 + Math.sin(t * 17 + i * 4) * 0.35);
      tip.material.opacity = 0.42 + Math.sin(t * 19 + i) ** 2 * 0.5;
    };
    droids.add(droid);
  }
  parent.add(droids);
  return droids;
}

export function buildStarcloud(scene, R, interactive, animated, focusOnObject, camState) {
  const group = new THREE.Group();
  const root = new THREE.Group();
  const detailRoot = new THREE.Group();
  detailRoot.visible = false;
  const focusAnchor = new THREE.Mesh(
    new THREE.SphereGeometry(0.012 * R, 8, 6),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  focusAnchor.position.set(0, 0.09 * R, 0);
  root.add(focusAnchor);
  const focusStarcloud = () => focusOnObject(focusAnchor, 0.86 * R);
  const solarTex = makeSolarCellTexture();
  const arrayMat = new THREE.MeshPhysicalMaterial({
    map: solarTex,
    color: 0x0a0e16,
    metalness: 0.4,
    roughness: 0.35,
    emissive: 0x111a35,
    emissiveIntensity: 0.18,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22
  });
  const trussMat = mat.beskar;
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xff9a3c, emissive: 0xff9a3c, emissiveIntensity: 1.35, metalness: 0.25, roughness: 0.35 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.95, roughness: 0.28, side: THREE.DoubleSide });
  const animatedBeams = [];

  addTrussSpine(root, R, trussMat, amberMat, goldMat);
  for (const x of [-0.17 * R, 0, 0.17 * R]) {
    addSolarWing(root, R, x, 1, arrayMat, trussMat);
    addSolarWing(root, R, x, -1, arrayMat, trussMat);
  }
  addComputeSpine(root, detailRoot, R, interactive, focusStarcloud);
  addLaserTerminals(root, animatedBeams, R);
  addDragonCapsule(root, R);
  addInteractive(interactive, root, "STARCLOUD ATLAS-CLASS", focusStarcloud, "Atlas-class ~50GW orbital data center · service-droid maintained · laser mesh uplinks");

  const radiatorMat = new THREE.MeshStandardMaterial({ color: 0xd8d9d4, metalness: 0.12, roughness: 0.66 });
  for (const z of [-0.13 * R, 0.13 * R]) {
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.18 * R, 0.006 * R, 0.055 * R), radiatorMat);
    radiator.position.set(0.19 * R, -0.055 * R, z);
    root.add(radiator);
  }

  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5 * R, 32, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  group.add(root, detailRoot, hit);
  group.position.set(-1.4 * R, -0.15 * R, 1.3 * R);
  group.userData = {
    radius: group.position.length(),
    phase: Math.atan2(group.position.z, group.position.x),
    speed: TWO_PI / 360,
    spinSpeed: TWO_PI / 300,
    inclination: 1.69,
    ascendingNode: -0.3,
    droids: null
  };
  group.userData.tick = (t) => {
    const d = group.userData;
    const a = d.phase + t * d.speed;
    const p = new THREE.Vector3(Math.cos(a) * d.radius, 0, Math.sin(a) * d.radius);
    p.applyAxisAngle(new THREE.Vector3(1, 0, 0), d.inclination);
    p.applyAxisAngle(new THREE.Vector3(0, 1, 0), d.ascendingNode);
    group.position.copy(p);
    root.rotation.y = t * d.spinSpeed;
    root.rotation.z = Math.sin(t * 0.18) * 0.05;
    detailRoot.rotation.copy(root.rotation);
    for (const beam of animatedBeams) beam.userData.tick?.(t);

    const focusedClose = camState && camState.orbitDistance < 1.05 * R && camState.orbitTarget.distanceTo(group.position) < 1.4 * R;
    detailRoot.visible = focusedClose;
    if (focusedClose && !d.droids) d.droids = buildServiceDroids(detailRoot, R);
    if (!focusedClose && d.droids) {
      detailRoot.remove(d.droids);
      d.droids = null;
    }
    if (d.droids) {
      for (const droid of d.droids.children) droid.userData.tick?.(t);
    }
  };
  animated.push(group);
  addInteractive(interactive, hit, "STARCLOUD ATLAS-CLASS", focusStarcloud, "Atlas-class ~50GW orbital data center · service-droid maintained · laser mesh uplinks");
  hit.userData.focusable = true;
  const title = label(scene, "STARCLOUD ATLAS-CLASS · ~50GW · ORBITAL DATA CENTER", new THREE.Vector3(), 0.54);
  title.position.set(0, 0.54 * R, 0);
  const sub = label(scene, "DARK SOLAR WINGS · DRAGON SERVICE CAPSULE · LASER COMM ARRAY", new THREE.Vector3(), 0.4, "#ff9a3c");
  sub.position.set(0, 0.42 * R, 0);
  group.add(title, sub);
  return group;
}
