import * as THREE from 'three';
import { LANDMARKS, EW_STREETS, SIDEWALK, ROAD_HALF } from './config.js';
import { onLand } from './collision.js';
import { makeSignTexture } from './textures.js';
import manifest from './photos/photos.json';

// Real photos of Monrovia from Wikimedia Commons (see scripts/fetch-photos.mjs and the credits screen).
const urls = import.meta.glob('./photos/*.{jpg,png}', { query: '?url', import: 'default', eager: true });

export const PHOTOS = manifest
  .map((p) => ({ ...p, url: urls[`./photos/${p.file}`] }))
  .filter((p) => p.url);

const WIDTH = 9;

// Finds a free spot beside a road, near (tx, tz), for a billboard; returns {x, z, ry} or null.
function findSpot(tx, tz, radius, roads, collision, taken, avoid) {
  let best = null;
  let bestScore = Infinity;
  for (const r of roads.rects) {
    const sides = r.axis === 'x'
      ? [[r.z0 - SIDEWALK - 1.6, 0], [r.z1 + SIDEWALK + 1.6, Math.PI]]
      : [[r.x0 - SIDEWALK - 1.6, Math.PI / 2], [r.x1 + SIDEWALK + 1.6, -Math.PI / 2]];
    const a0 = r.axis === 'x' ? r.x0 : r.z0;
    const a1 = r.axis === 'x' ? r.x1 : r.z1;
    for (const [c, faceAway] of sides) {
      for (let a = a0 + 12; a < a1 - 12; a += 4) {
        const x = r.axis === 'x' ? a : c;
        const z = r.axis === 'x' ? c : a;
        const d = Math.hypot(x - tx, z - tz);
        if (d > radius || d >= bestScore) continue;
        if (!onLand(x, z, 2) || roads.onRoad(x, z, SIDEWALK + 1)) continue;
        if (taken.some((t) => Math.hypot(t.x - x, t.z - z) < 30)) continue;
        if (avoid.some(([ax, az]) => Math.hypot(ax - x, az - z) < 10)) continue;
        const half = WIDTH / 2 + 0.5;
        const hits = collision.query(x, z, half + 1).some((b) => b.h > 0.5 && x + half > b.x0 && x - half < b.x1 && z + half > b.z0 && z - half < b.z1);
        if (hits) continue;
        // face the road: the side value says which way the road lies
        const ry = r.axis === 'x' ? (faceAway === 0 ? 0 : Math.PI) : faceAway;
        best = { x, z, ry };
        bestScore = d;
      }
    }
  }
  return best;
}

// avoid: [[x, z]] spots to keep clear, such as mission markers
export function buildPhotoBillboards(scene, roads, collision, avoid = []) {
  const loader = new THREE.TextureLoader();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1b1f2a, roughness: 0.6 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.6 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const plane = new THREE.PlaneGeometry(1, 1);
  const lit = [];
  const taken = [];
  const placed = [];

  const roadside = PHOTOS.filter((p) => !p.landmark);
  const mainRoad = EW_STREETS[2]; // Broad Street / Tubman Boulevard
  PHOTOS.forEach((p, i) => {
    let spot = null;
    const lm = LANDMARKS.find((l) => l.id === p.landmark);
    if (lm) spot = findSpot(lm.pos[0], lm.pos[1], 90, roads, collision, taken, avoid);
    else if (p.near) spot = findSpot(p.near[0], p.near[1], 60, roads, collision, taken, avoid);
    if (!spot) {
      const k = roadside.indexOf(p) >= 0 ? roadside.indexOf(p) : i;
      const x = mainRoad.x0 + 40 + ((k * 0.618 + 0.1) % 1) * (mainRoad.x1 - mainRoad.x0 - 80);
      spot = findSpot(x, mainRoad.z + (k % 2 ? 1 : -1) * (ROAD_HALF + SIDEWALK + 2), 120, roads, collision, taken, avoid);
    }
    if (!spot) return;
    taken.push(spot);
    const g = new THREE.Group();
    g.position.set(spot.x, 0, spot.z);
    g.rotation.y = spot.ry;
    const tex = loader.load(p.url, (t) => {
      // keep the photo's aspect ratio: wide photos are 9m across, tall ones up to 8m high
      const ar = t.image.height / t.image.width;
      const w = ar > 0.72 ? Math.min(WIDTH, 8 / ar) : WIDTH;
      const h = w * ar;
      photo.scale.set(w, h, 1);
      frame.scale.set(w + 0.5, h + 0.5, 0.3);
      photo.position.y = frame.position.y = 3.2 + h / 2;
      caption.position.y = 2.7;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.7 });
    lit.push(mat);
    const photo = new THREE.Mesh(plane, mat);
    photo.position.set(0, 6, 0.17);
    photo.scale.set(WIDTH, 5, 1);
    const frame = new THREE.Mesh(box, frameMat);
    frame.position.set(0, 6, 0);
    frame.scale.set(WIDTH + 0.5, 5.5, 0.3);
    frame.castShadow = true;
    const label = LANDMARKS.find((l) => l.id === p.landmark)?.name || p.title;
    const capMat = new THREE.MeshStandardMaterial({ map: makeSignTexture(label.toUpperCase().slice(0, 34), { bg: '#002868', w: 1024, h: 96, font: 'bold 52px sans-serif' }), roughness: 0.6 });
    capMat.emissiveMap = capMat.map;
    capMat.emissive = new THREE.Color(0xffffff);
    capMat.emissiveIntensity = 0.2;
    lit.push(capMat);
    const caption = new THREE.Mesh(plane, capMat);
    caption.position.set(0, 2.7, 0.17);
    caption.scale.set(WIDTH, WIDTH * 96 / 1024, 1);
    g.add(photo, frame, caption);
    for (const sx of [-WIDTH / 2 + 0.6, WIDTH / 2 - 0.6]) {
      const post = new THREE.Mesh(box, postMat);
      post.position.set(sx, 1.6, -0.1);
      post.scale.set(0.3, 3.2, 0.3);
      post.castShadow = true;
      g.add(post);
      const wx = spot.x + Math.cos(spot.ry) * sx;
      const wz = spot.z - Math.sin(spot.ry) * sx;
      collision.add(wx - 0.3, wz - 0.3, wx + 0.3, wz + 0.3, 3.2);
    }
    scene.add(g);
    placed.push({ ...p, x: spot.x, z: spot.z });
  });

  return {
    placed,
    update(night) {
      for (const m of lit) m.emissiveIntensity = 0.2 + night * 0.7;
    },
  };
}
