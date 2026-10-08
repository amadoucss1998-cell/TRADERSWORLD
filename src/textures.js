import * as THREE from 'three';
import { mulberry32, pick } from './utils.js';

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

// Facade atlas styled on downtown Monrovia: one tile = 8 bays x 8 floors (32m x 28m). The bottom row is the
// ground floor (shop shutters and open stalls), the floors above mix louvre windows, burglar bars and wooden
// shutters, with rust and rain streaks under every sill. The corner texel stays plain wall for roofs. The
// emissive twin lights a random subset of windows and shops at night.
export function makeBuildingTextures() {
  const S = 1024;
  const cols = 8;
  const rows = 8;
  const rand = mulberry32(7);
  const map = canvas(S, S);
  const emi = canvas(S, S);
  const m = map.getContext('2d');
  const e = emi.getContext('2d');
  m.fillStyle = '#ffffff';
  m.fillRect(0, 0, S, S);
  noise(m, S, S, rand, 0.07, 20000, 3);
  // weathered blotches of mould and faded paint
  for (let i = 0; i < 90; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 20 + rand() * 90;
    const grad = m.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${60 + rand() * 40},${60 + rand() * 30},${40 + rand() * 20},${0.08 + rand() * 0.1})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = grad;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  e.fillStyle = '#000000';
  e.fillRect(0, 0, S, S);
  const cw = S / cols;
  const ch = S / rows;
  const streak = (x, y, w, len) => {
    const g = m.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(50,40,30,0.35)');
    g.addColorStop(1, 'rgba(50,40,30,0)');
    m.fillStyle = g;
    m.fillRect(x, y, w, len);
  };
  const shutterColors = ['#2f6b3a', '#1f4e79', '#7a3b1f', '#5b6b2f', '#3a7ca5', '#8c2f39'];
  const doorColors = ['#7d8a96', '#4f6d7a', '#2a6f4e', '#8a8f94', '#355c7d', '#6b705c'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = c * cw;
      const by = r * ch;
      if (r === rows - 1) {
        // ground floor: plinth, then a roll-up shutter or an open shop front
        m.fillStyle = 'rgba(70,70,70,0.55)';
        m.fillRect(bx, by + ch * 0.9, cw, ch * 0.1);
        const x = bx + cw * 0.1;
        const y = by + ch * 0.18;
        const w = cw * 0.8;
        const h = ch * 0.72;
        if (rand() < 0.55) {
          m.fillStyle = pick(rand, doorColors);
          m.fillRect(x, y, w, h);
          m.fillStyle = 'rgba(0,0,0,0.22)';
          for (let k = 0; k < h; k += 6) m.fillRect(x, y + k, w, 2);
          m.fillStyle = 'rgba(0,0,0,0.4)';
          m.fillRect(x + w / 2 - 4, y + h - 10, 8, 4);
          if (rand() < 0.3) {
            e.fillStyle = 'rgba(255,200,120,0.15)';
            e.fillRect(x, y, w, h);
          }
        } else {
          m.fillStyle = '#1d1a17';
          m.fillRect(x, y, w, h);
          // shelves of stock: a few rows of boxes and bags in muted colours
          const goods = ['#8c3b2f', '#c49a3a', '#3f6f63', '#d8d2c0', '#5b4a7a', '#a8572b'];
          for (let row = 0; row < 3; row++) {
            const sy = y + h * (0.32 + row * 0.22);
            m.fillStyle = 'rgba(120,100,80,0.6)';
            m.fillRect(x + 4, sy + 14, w - 8, 2);
            for (let gx = x + 6; gx < x + w - 14; gx += 12 + rand() * 6) {
              m.fillStyle = pick(rand, goods);
              m.fillRect(gx, sy, 9, 14);
            }
          }
          e.fillStyle = rand() < 0.6 ? '#ffcf87' : '#000';
          e.fillRect(x, y, w, h);
        }
        m.fillStyle = 'rgba(0,0,0,0.25)';
        m.fillRect(bx, by + ch * 0.1, cw, 4);
        continue;
      }
      const kind = rand();
      const x = bx + cw * 0.22;
      const y = by + ch * 0.22;
      const w = cw * 0.56;
      const h = ch * 0.52;
      // frame
      m.fillStyle = 'rgba(0,0,0,0.3)';
      m.fillRect(x - 3, y - 3, w + 6, h + 6);
      if (kind < 0.4) {
        // louvre (jalousie) glass
        m.fillStyle = '#3b4a55';
        m.fillRect(x, y, w, h);
        m.fillStyle = 'rgba(200,220,235,0.45)';
        for (let k = 3; k < h; k += 7) m.fillRect(x + 2, y + k, w - 4, 3);
      } else if (kind < 0.7) {
        // dark glass behind iron burglar bars
        m.fillStyle = '#26303a';
        m.fillRect(x, y, w, h);
        m.fillStyle = 'rgba(160,200,230,0.18)';
        m.fillRect(x + 3, y + 3, w * 0.4, h - 6);
        m.fillStyle = '#151515';
        for (let k = 0; k <= w; k += 9) m.fillRect(x + k, y, 2, h);
        for (let k = 0; k <= h; k += 16) m.fillRect(x, y + k, w, 2);
      } else {
        // wooden shutters, often one open
        const col = pick(rand, shutterColors);
        m.fillStyle = '#1e2328';
        m.fillRect(x, y, w, h);
        m.fillStyle = col;
        m.fillRect(x, y, w / 2 - 1, h);
        if (rand() < 0.5) m.fillRect(x + w / 2 + 1, y, w / 2 - 1, h);
        m.fillStyle = 'rgba(0,0,0,0.25)';
        for (let k = 4; k < h; k += 6) m.fillRect(x, y + k, w, 2);
      }
      // sill, rust and rain streaks
      m.fillStyle = 'rgba(0,0,0,0.3)';
      m.fillRect(x - 6, y + h + 3, w + 12, 5);
      streak(x + rand() * w * 0.3, y + h + 8, w * (0.3 + rand() * 0.5), ch * (0.2 + rand() * 0.35));
      if (rand() < 0.15) {
        // window AC unit
        m.fillStyle = '#d8d8d2';
        m.fillRect(x + w * 0.55, y + h * 0.55, w * 0.4, h * 0.38);
        m.fillStyle = 'rgba(0,0,0,0.35)';
        for (let k = 4; k < h * 0.38; k += 4) m.fillRect(x + w * 0.57, y + h * 0.55 + k, w * 0.36, 1);
      }
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
