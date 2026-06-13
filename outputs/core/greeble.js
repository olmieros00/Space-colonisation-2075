import * as THREE from "three";

function greebleRand(i) {
  const x = Math.sin(i * 91.7 + 13.1) * 43758.5453;
  return x - Math.floor(x);
}

function basisFromNormal(normal) {
  const n = normal.clone().normalize();
  const helper = Math.abs(n.y) > 0.82 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(helper, n).normalize();
  const up = new THREE.Vector3().crossVectors(n, right).normalize();
  return { n, right, up };
}

export function greeble(targetGroup, area, count = 240) {
  const center = area.center || new THREE.Vector3();
  const width = area.width || 10;
  const height = area.height || 10;
  const { n, right, up } = basisFromNormal(area.normal || new THREE.Vector3(0, 1, 0));
  const material = area.material || new THREE.MeshStandardMaterial({
    color: 0x7a8a9c,
    metalness: 0.58,
    roughness: 0.5,
    envMapIntensity: 0.9
  });
  const panelGeo = new THREE.BoxGeometry(1, 1, 1);
  const panels = new THREE.InstancedMesh(panelGeo, material, count);
  const dummy = new THREE.Object3D();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);

  for (let i = 0; i < count; i++) {
    const x = (greebleRand(i) - 0.5) * width;
    const y = (greebleRand(i + 300) - 0.5) * height;
    const pos = center.clone()
      .addScaledVector(right, x)
      .addScaledVector(up, y)
      .addScaledVector(n, area.lift ?? 0.035);
    const sx = THREE.MathUtils.lerp(area.minSize || 0.08, area.maxSize || 0.42, greebleRand(i + 20));
    const sy = THREE.MathUtils.lerp(area.minSize || 0.08, area.maxSize || 0.42, greebleRand(i + 40));
    const sz = THREE.MathUtils.lerp(area.depth || 0.018, (area.depth || 0.018) * 2.2, greebleRand(i + 60));
    dummy.position.copy(pos);
    dummy.quaternion.copy(q);
    dummy.rotateZ(greebleRand(i + 90) * Math.PI * 2);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    panels.setMatrixAt(i, dummy.matrix);
  }
  panels.castShadow = true;
  panels.receiveShadow = true;
  panels.instanceMatrix.needsUpdate = true;
  targetGroup.add(panels);
  return panels;
}
