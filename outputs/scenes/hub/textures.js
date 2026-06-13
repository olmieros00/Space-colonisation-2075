import * as THREE from "three";

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function makeConcreteTexture() {
  const tex = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#777b74";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 36000; i++) {
      const v = 96 + Math.random() * 48;
      ctx.fillStyle = `rgba(${v},${v + 2},${v - 6},${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    ctx.strokeStyle = "rgba(65,70,68,0.45)";
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 42; i++) {
      const x = w * (0.35 + Math.random() * 0.28);
      const y = h * (0.4 + Math.random() * 0.22);
      const r = 18 + Math.random() * 86;
      const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
      g.addColorStop(0, "rgba(20,18,16,0.18)");
      g.addColorStop(1, "rgba(20,18,16,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  return tex;
}

export function makeSolarTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#081326");
    grad.addColorStop(0.55, "#12264a");
    grad.addColorStop(1, "#050b16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(90,130,190,0.45)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
}

export function makeLogoTexture(text = "FRONTIER", vertical = false) {
  return canvasTexture(vertical ? 256 : 768, vertical ? 768 : 180, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(244,246,243,0.96)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#252a30";
    ctx.font = `900 ${vertical ? 54 : 82}px Arial Black, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (vertical) {
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, w * 0.54, h * 0.54);
      ctx.strokeStyle = "rgba(60,68,76,0.48)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.72);
      ctx.quadraticCurveTo(w * 0.47, h * 0.14, w * 0.88, h * 0.32);
      ctx.stroke();
      ctx.fillStyle = "#ff9a3c";
      ctx.beginPath();
      ctx.moveTo(w * 0.09, h * 0.28);
      ctx.lineTo(w * 0.18, h * 0.18);
      ctx.lineTo(w * 0.23, h * 0.28);
      ctx.lineTo(w * 0.18, h * 0.38);
      ctx.closePath();
      ctx.fill();
    }
  });
}
