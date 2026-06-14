import * as THREE from "three";
import { mat } from "../../core/materials.js";
import { canvasTexture } from "./textures.js";

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x3595df) },
      horizon: { value: new THREE.Color(0xbfdbed) },
      ground: { value: new THREE.Color(0xe7d0ab) }
    },
    vertexShader: "varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}",
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 top;
      uniform vec3 horizon;
      uniform vec3 ground;
      void main(){
        float h=normalize(vWorld).y;
        vec3 sky=mix(horizon,top,smoothstep(-0.02,0.42,h));
        vec3 col=mix(ground,sky,smoothstep(-0.16,0.12,h));
        float haze=1.0-smoothstep(0.0,0.34,abs(h));
        col=mix(col,vec3(0.90,0.94,0.96),haze*0.08);
        gl_FragColor=vec4(col,1.0);
      }`
  });
}

function makeSandTexture() {
  const tex = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#b9aa84";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18000; i++) {
      const c = 146 + Math.random() * 54;
      ctx.fillStyle = `rgba(${c + 16},${c + 8},${c - 18},${Math.random() * 0.055})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}

export function configureDaylight(scene, state) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2200, 48, 24), skyMaterial());
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(state.renderer);
  const skyScene = new THREE.Scene();
  skyScene.add(sky.clone());
  scene.environment = pmrem.fromScene(skyScene, 0.04, 0.1, 2400).texture;
  pmrem.dispose();

  const sun = new THREE.DirectionalLight(0xffefd3, 1.28);
  sun.position.set(-68, 82, 54);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -88;
  sun.shadow.camera.right = 88;
  sun.shadow.camera.top = 78;
  sun.shadow.camera.bottom = -78;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 230;
  sun.shadow.bias = -0.00012;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbcd6f0, 0xd5b487, 0.52));
  scene.add(new THREE.AmbientLight(0xd7e8f5, 0.08));
  state.activeSun = sun;
}

export function addHorizonGround(scene) {
  const horizonSand = mat.sand.clone();
  horizonSand.map = makeSandTexture();
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(1700, 1700),
    horizonSand
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.08;
  sand.receiveShadow = true;
  sand.renderOrder = -5;
  scene.add(sand);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1700, 420),
    mat.water
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.065, 310);
  water.receiveShadow = true;
  water.renderOrder = -4;
  scene.add(water);
}
