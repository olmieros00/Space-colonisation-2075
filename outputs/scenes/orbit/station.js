import * as THREE from "three";
import { addInteractive, cylinderBetween, label, mat } from "../../core/materials.js";

function buildGatewayStation(R, animated) {
  const station = new THREE.Group();
  const ringRadius = 0.18 * R;
  const tubeRadius = 0.022 * R;
  const ringGap = 0.07 * R;
  const copper = new THREE.MeshStandardMaterial({ color: 0x7a4a32, metalness: 0.52, roughness: 0.48 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe8b0 });
  const assembly = new THREE.Group();

  for (const z of [-ringGap, ringGap]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, tubeRadius, 20, 96), mat.white);
    ring.position.z = z;
    assembly.add(ring);
    for (let i = 0; i < 40; i++) {
      const a = i * Math.PI * 2 / 40;
      const exposed = a > Math.PI * 1.45 && a < Math.PI * 1.95;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.035 * R, 0.012 * R, 0.035 * R),
        exposed ? copper : (i % 2 ? mat.beskar : mat.white)
      );
      box.position.set(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius, z);
      box.rotation.z = a;
      assembly.add(box);
      if (!exposed && i % 3 === 0) {
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.012 * R, 0.004 * R, 0.004 * R), windowMat);
        light.position.set(Math.cos(a) * (ringRadius + tubeRadius * 1.08), Math.sin(a) * (ringRadius + tubeRadius * 1.08), z);
        light.rotation.z = a;
        assembly.add(light);
      }
      if (exposed) {
        const inner = new THREE.Vector3(Math.cos(a) * (ringRadius - tubeRadius), Math.sin(a) * (ringRadius - tubeRadius), z);
        const outer = new THREE.Vector3(Math.cos(a + 0.045) * (ringRadius + tubeRadius), Math.sin(a + 0.045) * (ringRadius + tubeRadius), z);
        assembly.add(cylinderBetween(inner, outer, 0.0045 * R, copper));
      }
    }
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 + 0.2;
      assembly.add(cylinderBetween(new THREE.Vector3(0, 0, z), new THREE.Vector3(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius, z), 0.018 * R, mat.beskar));
    }
  }

  const hub = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const rib = new THREE.Mesh(
      new THREE.CylinderGeometry((0.042 + (i % 2) * 0.012) * R, (0.048 + (i % 2) * 0.012) * R, 0.035 * R, 32),
      i % 2 ? mat.beskar : mat.white
    );
    rib.rotation.x = Math.PI / 2;
    rib.position.z = (i - 4) * 0.04 * R;
    hub.add(rib);
  }
  assembly.add(hub);
  assembly.userData.tick = (t) => { assembly.rotation.z = t * 0.18; };
  animated.push(assembly);
  station.add(assembly);
  return station;
}

export function buildStation(scene, R, interactive, animated, travel) {
  const gateway = buildGatewayStation(R, animated);
  gateway.position.set(1.7 * R, 0.35 * R, -0.7 * R);
  gateway.rotation.y = -0.35;
  scene.add(gateway);
  const gatewayHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.42 * R, 24, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  gatewayHit.position.copy(gateway.position);
  scene.add(addInteractive(interactive, gatewayHit, "Gateway Station", () => travel("gateway"), "Click to enter docking bay interior"));
  label(scene, "GATEWAY STATION", gateway.position.clone().add(new THREE.Vector3(0, 0.45 * R, 0)), 0.68);
  return gateway;
}
