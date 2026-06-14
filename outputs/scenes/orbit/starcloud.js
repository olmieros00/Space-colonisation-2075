import * as THREE from "three";
import { swapWithGLB } from "../../core/assets.js";
import { addInteractive, cylinderBetween, label, mat } from "../../core/materials.js";

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
  const bodyMat = mat.computeContainer;
  const darkMat = mat.darkMetal;
  const trussMat = mat.hullSteel;
  const logoTex = makeStarcloudLogoTexture();
  const decalMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true });
  const rows = [-0.032 * R, 0.032 * R];
  let idx = 0;
  for (let x = -0.235 * R; x <= 0.235 * R; x += 0.026 * R) {
    for (const z of rows) {
      const module = buildComputeModule(R, bodyMat, darkMat, decalMat, trussMat, false);
      module.position.set(x, -0.012 * R, z);
      module.rotation.y = z > 0 ? -0.08 : 0.08;
      addInteractive(interactive, module, "Starcloud Atlas", focusStarcloud, "A skyborne memory forge serving the outer settlements");
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
  const turretMat = mat.hullSteel;
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
  const bodyMat = mat.whitePanel;
  const darkMat = mat.darkMetal;
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
  swapWithGLB(capsule, "assets/dragon_capsule.glb", { height: 0.13 * R, object: "Starcloud Dragon servicing capsule", scene: "Orbit Starcloud" });
  root.add(capsule);
}

function addHumanScaleMarkers(root) {
  const suitMat = mat.whitePanel;
  const visorMat = mat.darkMetal;
  const placements = [
    [-3.15, 0.058, -0.58], [-2.35, 0.058, 0.55], [-1.65, 0.058, -0.62], [-0.9, 0.058, 0.58],
    [-0.25, 0.058, -0.54], [0.52, 0.058, 0.62], [1.22, 0.058, -0.58], [2.05, 0.058, 0.54],
    [2.85, 0.058, -0.48], [-3.7, 0.10, 0.18], [3.45, 0.10, -0.12], [0.18, 0.12, 1.54]
  ];
  for (let i = 0; i < placements.length; i++) {
    const [x, y, z] = placements[i];
    const figure = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.022, 4, 8), suitMat);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.005, 0.002), visorMat);
    visor.position.set(0, 0.019, -0.005);
    figure.add(body, visor);
    figure.position.set(x, y, z);
    figure.rotation.y = (i % 2 ? 0.2 : -0.25) + (z > 0 ? Math.PI : 0);
    swapWithGLB(figure, "assets/figure.glb", { height: 0.042, object: "Starcloud inspection figure", scene: "Orbit Starcloud inspection" });
    root.add(figure);
  }
}

function addHabitationMassing(root, R) {
  const shellMat = mat.hullSteel;
  const glassMat = mat.glassPanel;
  const solarMat = mat.starcloudArray;
  const connectorMat = mat.hullSteel;
  const podPositions = [
    [-2.65, 0.86, -1.22, "villa", 0.16],
    [-1.72, 0.92, 1.18, "dome", -0.2],
    [-0.9, 1.02, -1.44, "villa", -0.35],
    [0.05, 0.88, 1.38, "villa", 0.28],
    [0.86, 1.0, -1.2, "dome", 0.12],
    [1.72, 0.94, 1.5, "villa", -0.28],
    [2.62, 0.84, -1.34, "dome", 0.34],
    [3.18, 0.96, 0.96, "villa", -0.42]
  ];
  for (const [x, y, z, type, rot] of podPositions) {
    const pod = new THREE.Group();
    if (type === "villa") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.16, 0.22), shellMat);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.11), glassMat);
      glass.position.set(0.203, 0.012, 0);
      glass.rotation.y = Math.PI / 2;
      const solarBack = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.006, 0.18), solarMat);
      solarBack.position.y = 0.084;
      solarBack.rotation.x = 0.05;
      pod.add(body, glass, solarBack);
    } else {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 10, 0, TWO_PI, 0, Math.PI / 2), shellMat);
      dome.scale.y = 0.96;
      const aperture = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.055), glassMat);
      aperture.position.set(0.02, 0.052, -0.112);
      aperture.rotation.x = -0.2;
      pod.add(dome, aperture);
    }
    pod.position.set(x, y, z);
    pod.rotation.y = (z > 0 ? Math.PI : 0) + rot;
    root.add(pod);
    root.add(cylinderBetween(new THREE.Vector3(x * 0.92, 0.08, z * 0.36), new THREE.Vector3(x, y - 0.08, z * 0.86), 0.018, connectorMat));
  }
}

function addRakingInspectionLight(group) {
  const target = new THREE.Object3D();
  target.position.set(0.8, 0.2, 0);
  const sun = new THREE.DirectionalLight(0xffe4bc, 1.15);
  sun.position.set(-4.5, 1.05, -3.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -4;
  sun.shadow.camera.near = 0.05;
  sun.shadow.camera.far = 12;
  sun.target = target;
  group.add(sun, target);
}

function makeDroidMaterials() {
  return {
    metal: mat.droidMetal,
    worn: mat.wornMetal,
    rust: mat.copperFrame,
    dark: mat.darkMetal,
    eye: mat.emissiveAmber,
    red: mat.warningRed,
    spark: new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
  };
}

function installCrawler(droid, i, R, fast = false) {
  droid.userData.baseZ = (i % 2 ? 0.054 : -0.054) * R + ((i % 3) - 1) * 0.008 * R;
  droid.userData.phase = i * 0.083;
  droid.userData.tick = (t) => {
    const span = 0.48;
    const speed = fast ? 0.043 : 0.016;
    const crawl = ((t * speed + droid.userData.phase) % span) - span * 0.5;
    droid.position.x = crawl * R;
    droid.position.z = droid.userData.baseZ + Math.sin(t * (fast ? 2.2 : 0.65) + i) * 0.0025 * R;
    droid.rotation.y = fast ? Math.sin(t * 1.6 + i) * 0.22 : Math.sin(t * 0.4 + i) * 0.08;
    droid.userData.head?.rotation.set(0, Math.sin(t * 0.9 + i) * 0.9, 0);
    droid.userData.armA?.rotation.set(0, 0, -0.35 + Math.sin(t * 2.7 + i) * 0.45);
    droid.userData.armB?.rotation.set(0, 0, 0.45 + Math.sin(t * 2.1 + i) * 0.38);
    if (droid.userData.spark) {
      const pulse = Math.sin(t * 21 + i * 4) ** 2;
      droid.userData.spark.visible = pulse > 0.35;
      droid.userData.spark.material.opacity = 0.25 + pulse * 0.7;
      droid.userData.spark.scale.setScalar(0.55 + pulse * 0.65);
    }
    if (droid.userData.redLamp) {
      droid.userData.redLamp.material.emissiveIntensity = 0.7 + Math.sin(t * 8 + i) ** 2 * 1.7;
    }
  };
}

function addSegmentedArm(root, mats, u, angle, long = false) {
  const arm = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * u, 0.24 * u, (long ? 3.2 : 2.4) * u, 6), mats.metal);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * u, 0.18 * u, (long ? 2.5 : 1.8) * u, 6), mats.worn);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.34 * u, 8, 6), mats.dark);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.28 * u, 0.85 * u, 8), mats.dark);
  upper.rotation.z = angle;
  lower.position.set(Math.cos(angle) * 1.4 * u, -1.0 * u, Math.sin(angle) * 0.4 * u);
  lower.rotation.z = -angle * 0.7;
  joint.position.set(Math.cos(angle) * 0.7 * u, -0.6 * u, 0);
  tip.position.set(Math.cos(angle) * 2.2 * u, -1.6 * u, Math.sin(angle) * 0.55 * u);
  tip.rotation.z = angle - Math.PI * 0.5;
  arm.add(upper, joint, lower, tip);
  root.add(arm);
  return arm;
}

function treadwellDroid(R, i, mats) {
  const droid = new THREE.Group();
  const u = 0.0068;
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2 * u, 0.7 * u, 2.2 * u), i % 2 ? mats.worn : mats.rust);
  const treadA = new THREE.Mesh(new THREE.BoxGeometry(3.4 * u, 0.32 * u, 0.36 * u), mats.dark);
  const treadB = treadA.clone();
  treadA.position.z = 1.22 * u;
  treadB.position.z = -1.22 * u;
  const torso = new THREE.Mesh(new THREE.ConeGeometry(1.2 * u, 2.3 * u, 6), mats.metal);
  torso.position.y = 1.45 * u;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * u, 0.18 * u, 2.0 * u, 8), mats.dark);
  neck.position.y = 3.5 * u;
  const head = new THREE.Group();
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(1.6 * u, 0.8 * u, 1.05 * u), mats.dark);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26 * u, 8, 6), mats.eye);
  eye.position.set(0, 0, -0.56 * u);
  head.add(headBox, eye);
  head.position.y = 4.55 * u;
  droid.add(chassis, treadA, treadB, torso, neck, head);
  const armA = addSegmentedArm(droid, mats, u, -0.75, true);
  armA.position.set(0.9 * u, 2.0 * u, -0.45 * u);
  const armB = addSegmentedArm(droid, mats, u, 0.65, false);
  armB.position.set(-0.8 * u, 1.7 * u, 0.55 * u);
  for (let a = -1; a <= 1; a++) {
    const tool = addSegmentedArm(droid, mats, u, a * 0.55, false);
    tool.position.set(a * 0.5 * u, 1.15 * u, 0.2 * u);
    tool.scale.setScalar(0.72);
  }
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.36 * u, 8, 6), mats.spark.clone());
  spark.position.set(3.1 * u, 0.6 * u, -1.3 * u);
  droid.add(spark);
  droid.position.set(0, 0.022 * R, 0);
  droid.scale.setScalar(0.82 + (i % 3) * 0.08);
  droid.userData.head = head;
  droid.userData.armA = armA;
  droid.userData.armB = armB;
  droid.userData.spark = spark;
  installCrawler(droid, i, R);
  swapWithGLB(droid, "assets/droid.glb", { height: 0.052 * R, object: "Starcloud treadwell service droid", scene: "Orbit Starcloud inspection" });
  return droid;
}

function mouseDroid(R, i, mats) {
  const droid = new THREE.Group();
  const u = 0.0073;
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6 * u, 0.9 * u, 2.2 * u), mats.dark);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.15 * u, 1.8 * u, 4), mats.worn);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 2.45 * u;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22 * u, 8, 6), mats.red);
  lamp.position.set(2.05 * u, 0.18 * u, -0.9 * u);
  const antennaA = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * u, 0.06 * u, 2.1 * u, 6), mats.metal);
  const antennaB = antennaA.clone();
  antennaA.position.set(-0.8 * u, 1.25 * u, -0.55 * u);
  antennaB.position.set(-1.2 * u, 1.1 * u, 0.55 * u);
  antennaA.rotation.z = 0.25;
  antennaB.rotation.z = -0.18;
  for (const x of [-1.1, 1.1]) {
    for (const z of [-0.86, 0.86]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * u, 0.28 * u, 0.26 * u, 8), mats.metal);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x * u, -0.55 * u, z * u);
      droid.add(wheel);
    }
  }
  droid.add(body, nose, lamp, antennaA, antennaB);
  droid.position.set(0, 0.018 * R, 0);
  droid.userData.redLamp = lamp;
  installCrawler(droid, i, R, true);
  swapWithGLB(droid, "assets/droid.glb", { height: 0.045 * R, object: "Starcloud mouse service droid", scene: "Orbit Starcloud inspection" });
  return droid;
}

function technicianDroid(R, i, mats) {
  const droid = new THREE.Group();
  const u = 0.013;
  const hips = new THREE.Mesh(new THREE.BoxGeometry(1.7 * u, 0.7 * u, 1.0 * u), mats.dark);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.78 * u, 0.95 * u, 1.85 * u, 8), mats.worn);
  torso.position.y = 1.35 * u;
  const head = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72 * u, 10, 6), mats.metal);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16 * u, 8, 6), mats.eye);
  eye.position.set(0.38 * u, 0.02 * u, -0.42 * u);
  head.add(dome, eye);
  head.position.y = 2.65 * u;
  droid.add(hips, torso, head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * u, 0.14 * u, 1.25 * u, 6), mats.dark);
    leg.position.set(side * 0.42 * u, -0.85 * u, 0);
    leg.rotation.z = side * 0.08;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.64 * u, 0.18 * u, 0.95 * u), mats.dark);
    foot.position.set(side * 0.52 * u, -1.52 * u, -0.15 * u);
    const arm = addSegmentedArm(droid, mats, u, side * 0.5, false);
    arm.position.set(side * 0.78 * u, 1.45 * u, 0);
    arm.scale.x = side;
    droid.add(leg, foot);
  }
  droid.position.set(0, 0.027 * R, 0);
  droid.userData.head = head;
  installCrawler(droid, i, R);
  swapWithGLB(droid, "assets/droid.glb", { height: 0.052 * R, object: "Starcloud technician service droid", scene: "Orbit Starcloud inspection" });
  return droid;
}

function buildProxyDroids(parent, R) {
  const droids = new THREE.Group();
  const metal = mat.droidMetal;
  const lamp = mat.emissiveAmber;
  const u = 0.008;
  for (let i = 0; i < 12; i++) {
    const droid = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4 * u, 0.8 * u, 1.4 * u), metal);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22 * u, 6, 4), lamp);
    dot.position.set(0.9 * u, 0.35 * u, -0.74 * u);
    droid.add(body, dot);
    droid.position.y = 0.021 * R;
    installCrawler(droid, i, R, i % 4 === 0);
    swapWithGLB(droid, "assets/droid.glb", { height: 0.04 * R, object: "Starcloud proxy service droid", scene: "Orbit Starcloud inspection" });
    droids.add(droid);
  }
  parent.add(droids);
  return droids;
}

export function buildServiceDroids(parent, R) {
  const droids = new THREE.Group();
  const mats = makeDroidMaterials();
  for (let i = 0; i < 12; i++) {
    if (i % 5 === 1 || i % 5 === 4) droids.add(mouseDroid(R, i, mats));
    else if (i % 6 === 2) droids.add(technicianDroid(R, i, mats));
    else droids.add(treadwellDroid(R, i, mats));
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
  const focusStarcloud = () => focusOnObject(focusAnchor, 0.78 * R, {
    pauseRoot: group,
    orbitMin: 0.018 * R,
    orbitMax: 1.95 * R,
    exitDistance: 1.72 * R,
    canInspect: true,
    inspectionRoot: root,
    inspectionLocalTarget: new THREE.Vector3(0.82, 0.34, 0.02)
  });
  const solarTex = makeSolarCellTexture();
  const arrayMat = mat.starcloudArray.clone();
  arrayMat.map = solarTex;
  arrayMat.emissive = new THREE.Color(0x111a35);
  arrayMat.emissiveIntensity = 0.18;
  const trussMat = mat.hullSteel;
  const amberMat = mat.amber;
  const goldMat = mat.goldMli.clone();
  goldMat.side = THREE.DoubleSide;
  const animatedBeams = [];

  addTrussSpine(root, R, trussMat, amberMat, goldMat);
  for (const x of [-0.17 * R, 0, 0.17 * R]) {
    addSolarWing(root, R, x, 1, arrayMat, trussMat);
    addSolarWing(root, R, x, -1, arrayMat, trussMat);
  }
  addComputeSpine(root, detailRoot, R, interactive, focusStarcloud);
  addLaserTerminals(root, animatedBeams, R);
  addDragonCapsule(root, R);
  addHabitationMassing(root, R);
  addHumanScaleMarkers(detailRoot);
  addRakingInspectionLight(root);
  addInteractive(interactive, root, "Starcloud Atlas", focusStarcloud, "A ~50GW orbital data haven watched by service droids and laser uplinks");

  const radiatorMat = mat.starcloudRadiator;
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
    paused: false,
    visualSpin: 0,
    droids: null,
    droidTier: "none"
  };
  focusAnchor.userData.pauseRoot = group;
  hit.userData.pauseRoot = group;
  root.userData.pauseRoot = group;
  group.userData.tick = (t, dt = 0) => {
    const d = group.userData;
    if (!d.paused) {
      const a = d.phase + t * d.speed;
      const p = new THREE.Vector3(Math.cos(a) * d.radius, 0, Math.sin(a) * d.radius);
      p.applyAxisAngle(new THREE.Vector3(1, 0, 0), d.inclination);
      p.applyAxisAngle(new THREE.Vector3(0, 1, 0), d.ascendingNode);
      group.position.copy(p);
    }
    d.visualSpin += dt * d.spinSpeed * (d.paused ? 0.12 : 1);
    root.rotation.y = d.visualSpin;
    root.rotation.z = Math.sin(t * 0.18) * 0.05;
    detailRoot.rotation.copy(root.rotation);
    for (const beam of animatedBeams) beam.userData.tick?.(t);

    const focusedHere = camState && camState.isFocused && (camState.focusPauseRoot === group || camState.focusedObject === focusAnchor);
    const tier = focusedHere && (camState.inspectionActive || camState.orbitDistance < 0.30 * R)
      ? "close"
      : focusedHere && camState.orbitDistance < 0.92 * R
        ? "mid"
        : "none";
    if (tier !== d.droidTier) {
      if (d.droids) detailRoot.remove(d.droids);
      d.droids = null;
      d.droidTier = tier;
      if (tier === "mid") d.droids = buildProxyDroids(detailRoot, R);
      if (tier === "close") d.droids = buildServiceDroids(detailRoot, R);
    }
    detailRoot.visible = tier !== "none";
    if (d.droids) {
      for (const droid of d.droids.children) droid.userData.tick?.(t);
    }
  };
  animated.push(group);
  addInteractive(interactive, hit, "Starcloud Atlas", focusStarcloud, "A ~50GW orbital data haven watched by service droids and laser uplinks");
  hit.userData.focusable = true;
  const title = label(scene, "STARCLOUD ATLAS // MEMORY ORBITAL", new THREE.Vector3(), 0.54, "hero");
  title.position.set(0, 0.54 * R, 0);
  const sub = label(scene, "DARK SOLAR WINGS · SERVICE CAPSULE · LASER COMM ARRAY", new THREE.Vector3(), 0.4, "telemetry");
  sub.position.set(0, 0.42 * R, 0);
  addInteractive(interactive, title, "Starcloud Atlas", focusStarcloud, "Enter inspection range for the orbital megastructure");
  addInteractive(interactive, sub, "Starcloud Atlas", focusStarcloud, "Enter inspection range for the orbital megastructure");
  group.add(title, sub);
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}
