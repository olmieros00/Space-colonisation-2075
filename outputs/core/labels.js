import * as THREE from "three";
import { getMaxAnisotropy } from "./materials.js";

const labelTiers = {
  hero: {
    font: "64px Bungee Inline, Orbitron, sans-serif",
    altFont: "900 62px Orbitron, Audiowide, sans-serif",
    fill: "#ffd23f",
    stroke: "#ffd23f",
    strokeWidth: 6,
    glow: "#ffae00",
    glowBlur: 18,
    spacing: 5,
    panelAlpha: 0.22,
    y: 170
  },
  subsystem: {
    font: "50px Russo One, Oxanium, sans-serif",
    fill: "#e8e8e0",
    stroke: "rgba(6,8,12,0.9)",
    strokeWidth: 3,
    glow: "#ff9a3c",
    glowBlur: 9,
    spacing: 4,
    panelAlpha: 0.42,
    y: 146
  },
  telemetry: {
    font: "28px Share Tech Mono, monospace",
    fill: "rgba(232,232,224,0.72)",
    stroke: "rgba(6,8,12,0.72)",
    strokeWidth: 2,
    glow: null,
    glowBlur: 0,
    spacing: 1.5,
    panelAlpha: 0.32,
    y: 142
  }
};

function labelOptions(tierOrColor, maybeOptions) {
  const knownTier = typeof tierOrColor === "string" && labelTiers[tierOrColor];
  if (knownTier) return { tier: tierOrColor, ...maybeOptions };
  if (typeof tierOrColor === "string") return { tier: "subsystem", color: tierOrColor, ...maybeOptions };
  return { tier: "subsystem", ...(tierOrColor || {}) };
}

function drawTrackedText(ctx, text, x, y, tracking, stroke = false) {
  const letters = Array.from(text.toUpperCase());
  let cursor = x;
  for (const letter of letters) {
    if (stroke) ctx.strokeText(letter, cursor, y);
    else ctx.fillText(letter, cursor, y);
    cursor += ctx.measureText(letter).width + tracking;
  }
}

function trackedWidth(ctx, text, tracking) {
  return Array.from(text.toUpperCase()).reduce((sum, letter) => sum + ctx.measureText(letter).width + tracking, -tracking);
}

function labelLines(text, tierName) {
  if (tierName !== "hero") return [text];
  if (text.includes(" // ")) return text.split(" // ").slice(0, 2);
  if (text.includes(" · ")) {
    const parts = text.split(" · ");
    return [parts[0], parts.slice(1).join(" · ")];
  }
  if (text.includes(" — ")) return text.split(" — ").slice(0, 2);
  if (text.length < 24) return [text];
  const words = text.split(" ");
  const lines = [""];
  for (const word of words) {
    const candidate = `${lines[lines.length - 1]} ${word}`.trim();
    if (candidate.length > 18 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  return lines;
}

function scaleFont(font, factor) {
  return font.replace(/(\d+(?:\.\d+)?)px/g, (_, px) => `${Math.max(18, Number(px) * factor)}px`);
}

export function label(scene, text, pos, size = 0.9, tierOrColor = "subsystem", maybeOptions = {}) {
  const opts = labelOptions(tierOrColor, maybeOptions);
  const tier = labelTiers[opts.tier] || labelTiers.subsystem;
  const heroAlt = opts.tier === "hero" && text.length % 2 === 0;
  const cnv = document.createElement("canvas");
  cnv.width = opts.tier === "hero" ? 1280 : 1024;
  cnv.height = opts.tier === "hero" ? 384 : 256;
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.font = heroAlt ? tier.altFont : tier.font;
  ctx.textBaseline = "middle";

  ctx.fillStyle = `rgba(4,6,10,${tier.panelAlpha})`;
  const panelY = opts.tier === "hero" ? 82 : 58;
  const panelH = opts.tier === "hero" ? 210 : 112;
  ctx.beginPath();
  ctx.moveTo(42, panelY);
  ctx.lineTo(cnv.width - 42, panelY);
  ctx.lineTo(cnv.width - 18, panelY + panelH * 0.28);
  ctx.lineTo(cnv.width - 66, panelY + panelH);
  ctx.lineTo(66, panelY + panelH);
  ctx.lineTo(18, panelY + panelH * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,154,60,.68)";
  ctx.lineWidth = opts.tier === "hero" ? 5 : 3;
  ctx.stroke();

  let tracking = tier.spacing;
  let lines = labelLines(text, opts.tier);
  let fitWidth = Math.max(...lines.map(line => trackedWidth(ctx, line, tracking)));
  let attempts = 0;
  const maxWidth = opts.tier === "hero" ? 1140 : 930;
  while (fitWidth > maxWidth && attempts < 10) {
    ctx.font = scaleFont(ctx.font, 0.92);
    tracking *= 0.9;
    fitWidth = Math.max(...lines.map(line => trackedWidth(ctx, line, tracking)));
    attempts++;
  }
  ctx.lineJoin = "round";
  const lineGap = opts.tier === "hero" ? 72 : 0;
  const y0 = opts.tier === "hero" && lines.length > 1 ? tier.y - 36 : tier.y;

  if (tier.glow) {
    ctx.shadowColor = tier.glow;
    ctx.shadowBlur = tier.glowBlur;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const x = Math.max(44, (cnv.width - trackedWidth(ctx, line, tracking)) * 0.5);
    const y = y0 + i * lineGap;
    if (opts.tier === "hero") {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(0,0,0,0.96)";
      ctx.lineWidth = (opts.strokeWidth || tier.strokeWidth) + 8;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.shadowColor = tier.glow;
      ctx.shadowBlur = tier.glowBlur;
      ctx.strokeStyle = opts.stroke || tier.stroke;
      ctx.lineWidth = opts.strokeWidth || tier.strokeWidth;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, y - 34, 0, y + 36);
      gradient.addColorStop(0, "#fff2a6");
      gradient.addColorStop(0.5, opts.color || tier.fill);
      gradient.addColorStop(1, "#ff9a3c");
      ctx.fillStyle = gradient;
    } else {
      ctx.strokeStyle = opts.stroke || tier.stroke;
      ctx.lineWidth = opts.strokeWidth || tier.strokeWidth;
      drawTrackedText(ctx, line, x, y, tracking, true);
      ctx.fillStyle = opts.color || tier.fill;
    }
    drawTrackedText(ctx, line, x, y, tracking, false);
  }
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(cnv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = getMaxAnisotropy();
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.copy(pos);
  sprite.scale.set(size * (opts.tier === "hero" ? 8.4 : 7.2), size * (opts.tier === "hero" ? 2.55 : 1.8), 1);
  scene.add(sprite);
  return sprite;
}
