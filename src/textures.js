import * as THREE from 'three';
import { mulberry32 } from './utils.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function noise(ctx, w, h, rand, alpha, count, size = 2) {
  for (let i = 0; i < count; i++) {
    const v = Math.floor(rand() * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(rand() * w, rand() * h, size, size);
  }
}

// One tile = 8 window columns x 8 floors (32m x 28m). The corner texel is plain wall, which
// roofs sample. The emissive twin lights a random subset of windows for night time.
export function makeBuildingTextures() {
  const S = 512;
  const cols = 8;
  const rows = 8;
  const rand = mulberry32(7);
  const map = canvas(S, S);
  const emi = canvas(S, S);
  const m = map.getContext('2d');
  const e = emi.getContext('2d');
  m.fillStyle = '#ffffff';
  m.fillRect(0, 0, S, S);
  noise(m, S, S, rand, 0.06, 6000, 3);
  e.fillStyle = '#000000';
  e.fillRect(0, 0, S, S);
  const cw = S / cols;
  const ch = S / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.22;
      const y = r * ch + ch * 0.25;
      const w = cw * 0.56;
      const h = ch * 0.5;
      // canvas y grows downward while texture v grows upward; the corner texel (0,0 in UV)
      // is the bottom-left of the canvas, which stays wall because of the margins.
      m.fillStyle = '#2a3440';
      m.fillRect(x, y, w, h);
      m.fillStyle = 'rgba(160,200,230,0.25)';
      m.fillRect(x + 2, y + 2, w * 0.4, h - 4);
      m.fillStyle = 'rgba(0,0,0,0.25)';
      m.fillRect(x - 2, y + h, w + 4, 4); // sill shadow
      if (rand() < 0.42) {
        const warm = rand();
        e.fillStyle = warm < 0.7 ? '#ffd27a' : warm < 0.9 ? '#fff1c9' : '#9fd0ff';
        e.fillRect(x, y, w, h);
      }
    }
  }
  return { map: toTexture(map), emissiveMap: toTexture(emi) };
}

export function makeRoadTexture() {
  const W = 256;
  const H = 256;
  const rand = mulberry32(11);
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#3a3b3e';
  g.fillRect(0, 0, W, H);
  noise(g, W, H, rand, 0.12, 5000, 2);
  // patches and potholes, Monrovia roads are well loved
  for (let i = 0; i < 10; i++) {
    g.fillStyle = `rgba(20,20,22,${0.15 + rand() * 0.2})`;
    g.beginPath();
    g.ellipse(rand() * W, rand() * H, 6 + rand() * 18, 4 + rand() * 10, rand() * 3, 0, Math.PI * 2);
    g.fill();
  }
  // u runs along the road (one tile = 12m), v across it (one tile = full width)
  g.fillStyle = '#e8c547';
  g.fillRect(0, H / 2 - 3, W * 0.5, 6);
  g.fillStyle = 'rgba(235,235,235,0.85)';
  g.fillRect(0, 10, W, 4);
  g.fillRect(0, H - 14, W, 4);
  return toTexture(c);
}

export function makeGroundTexture(base, speck, seed) {
  const S = 256;
  const rand = mulberry32(seed);
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = speck[Math.floor(rand() * speck.length)];
    g.globalAlpha = 0.25 + rand() * 0.3;
    g.beginPath();
    g.ellipse(rand() * S, rand() * S, 4 + rand() * 22, 3 + rand() * 14, rand() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  noise(g, S, S, rand, 0.1, 4000, 2);
  return toTexture(c);
}

export function makeSidewalkTexture() {
  const S = 128;
  const rand = mulberry32(5);
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#a9a39a';
  g.fillRect(0, 0, S, S);
  noise(g, S, S, rand, 0.12, 1500, 2);
  g.strokeStyle = 'rgba(60,55,50,0.35)';
  g.lineWidth = 2;
  for (let i = 0; i <= S; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, S);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(S, i);
    g.stroke();
  }
  return toTexture(c);
}

export function makeWaterNormal() {
  const S = 256;
  const rand = mulberry32(3);
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,255)';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 400; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 4 + rand() * 18;
    const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, 'rgba(170,170,255,0.5)');
    grad.addColorStop(1, 'rgba(90,90,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// A sign rendered to a canvas, for landmark lettering.
export function makeSignTexture(text, { bg = '#1b2a4a', fg = '#ffffff', w = 512, h = 128, font = 'bold 64px sans-serif' } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The Liberian flag: eleven red and white stripes with a white star on a blue canton.
export function makeFlagTexture() {
  const W = 330;
  const H = 176;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const sh = H / 11;
  for (let i = 0; i < 11; i++) {
    g.fillStyle = i % 2 === 0 ? '#bf0a30' : '#ffffff';
    g.fillRect(0, i * sh, W, sh + 1);
  }
  g.fillStyle = '#002868';
  g.fillRect(0, 0, sh * 5, sh * 5);
  drawStar(g, sh * 2.5, sh * 2.5, sh * 1.9, '#ffffff');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function drawStar(g, cx, cy, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.4;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}
