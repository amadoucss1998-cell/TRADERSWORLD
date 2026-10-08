import * as THREE from 'three';
import {
  LAND, EW_STREETS, NS_STREETS, ROAD_HALF, SIDEWALK, LOT_MARGIN, LANDMARKS, WATER_LEVEL, DISTRICTS,
} from './config.js';
import { MeshBuilder, mulberry32, makeMatrix, pick, rectsOverlap } from './utils.js';
import {
  makeBuildingTextures, makeRoadTexture, makeGroundTexture, makeSidewalkTexture, makeWaterNormal,
  makeSignTexture, makeFlagTexture,
} from './textures.js';
import { onLand } from './collision.js';
import { assets, PEOPLE_MODELS } from './assets.js';
import { createHuman, SKIN_TONES } from './character.js';

const WALL_COLORS = [
  0xf2e8cf, 0xf6d6a8, 0xd8e2dc, 0xa8dadc, 0xffcdb2, 0xe9c46a, 0xb5e48c, 0xf4acb7, 0xffffff, 0xd4a373,
  0xcdb4db, 0x90be6d, 0xf9dcc4, 0xbde0fe, 0xe5989b, 0xfefae0,
];
const ROOF_COLORS = [0x8d99ae, 0xa3492f, 0x9a8c7a, 0x7d4f3a, 0xb0b7bc, 0x6f5e53];
const SHOP_SIGNS = [
  ['PEPPER SOUP JOINT', '#c1121f'], ['KEKE SPARE PARTS', '#264653'], ['LONE STAR PHONES', '#003049'],
  ['PALM BUTTER CAFE', '#606c38'], ['CASSAVA LEAF HOUSE', '#2a9d8f'], ['MAMA JUAH COOK SHOP', '#e76f51'],
  ['MONROVIA MONEY XCHANGE', '#1d3557'], ['GOD IS ABLE BARBER', '#6a040f'], ['FINE BOY TAILORING', '#7b2cbf'],
  ['KRU TOWN BLOCK FACTORY', '#495057'], ['ATLANTIC PHARMACY', '#2d6a4f'], ['ZOGO-FREE ZONE GYM', '#000000'],
];

export function buildWorld(scene, collision, roads) {
  const rand = mulberry32(1847); // the year of Liberian independence
  const animated = []; // objects that need per-frame updates
  const reserves = LANDMARKS.filter((l) => l.reserve).map((l) => ({
    x0: l.reserve[0], x1: l.reserve[1], z0: l.reserve[2], z1: l.reserve[3],
  }));
  const roadKeepOut = roads.rects.map((r) => ({ x0: r.x0 - SIDEWALK - 0.5, x1: r.x1 + SIDEWALK + 0.5, z0: r.z0 - SIDEWALK - 0.5, z1: r.z1 + SIDEWALK + 0.5 }));
  const blocked = (r) => reserves.some((q) => rectsOverlap(r, q)) || roadKeepOut.some((q) => rectsOverlap(r, q));

  const tex = makeBuildingTextures();
  const windowMat = new THREE.MeshStandardMaterial({
    vertexColors: true, map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85,
  });
  const plainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const windowed = new MeshBuilder();
  const plain = new MeshBuilder();
  const glowing = new MeshBuilder(); // lit at night
  const glowMat = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.5 });

  const box = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
  const cone = new THREE.ConeGeometry(0.5, 1, 8);
  const sphere = new THREE.SphereGeometry(0.5, 16, 10);
  const hemi = new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const prism = (() => {
    // unit gable roof: base 1x1 at y=0, ridge along x at y=1
    const g = new THREE.BufferGeometry();
    const p = [
      -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, -0.5, 1, 0, // south slope
      0.5, 0, -0.5, -0.5, 0, -0.5, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 1, 0, 0.5, 1, 0, // north slope
      -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0, // west gable
      0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 1, 0, // east gable
    ];
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    return g;
  })();

  const P = (geo, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, target = plain) =>
    target.addGeometry(geo, makeMatrix(x, y, z, rx, ry, rz, sx, sy, sz), color);
  // solid box resting on the ground, with a collider
  const solid = (x0, z0, x1, z1, h, color, target = plain, y0 = 0) => {
    if (target === windowed) windowed.addBox(x0, y0, z0, x1, y0 + h, z1, color);
    else P(box, color, (x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, 0, 0, 0, target);
    collision.add(x0, z0, x1, z1, y0 + h, y0);
  };

  // ---------- water ----------
  const waterNormal = makeWaterNormal();
  waterNormal.repeat.set(120, 120);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshStandardMaterial({ color: 0x1b6f8a, roughness: 0.15, metalness: 0.2, normalMap: waterNormal, normalScale: new THREE.Vector2(0.6, 0.6) }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_LEVEL;
  water.receiveShadow = true;
  scene.add(water);
  animated.push((dt, t) => {
    waterNormal.offset.x = t * 0.004;
    waterNormal.offset.y = t * 0.0025;
  });
  // surf line along the beach
  const surf = new THREE.Mesh(
    new THREE.PlaneGeometry(940, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
  );
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(132, WATER_LEVEL + 0.05, 181);
  scene.add(surf);
  animated.push((dt, t) => {
    surf.position.z = 181 + Math.sin(t * 0.8) * 1.5;
    surf.material.opacity = 0.35 + Math.sin(t * 0.8 + 1) * 0.15;
  });

  // ---------- land ----------
  const groundTex = makeGroundTexture('#7e8f4a', ['#a0522d', '#8b5a2b', '#6b8e23', '#9c6b3c', '#556b2f'], 21);
  const sandTex = makeGroundTexture('#e3cf9c', ['#d6bd84', '#efdcae', '#cbb27a'], 22);
  for (const r of LAND) {
    if (r.type === 'bridge') continue;
    const w = r.x1 - r.x0;
    const d = r.z1 - r.z0;
    const t = (r.type === 'sand' ? sandTex : groundTex).clone();
    t.needsUpdate = true;
    t.repeat.set(w / 24, d / 24);
    const top = r.type === 'sand' ? -0.04 : 0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 6, d), [
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 1 }),
    ]);
    m.position.set(r.x0 + w / 2, top - 3, r.z0 + d / 2);
    m.receiveShadow = true;
    scene.add(m);
  }

  // ---------- bridge ----------
  {
    const b = LAND.find((l) => l.type === 'bridge');
    P(box, 0x8a8a85, (b.x0 + b.x1) / 2, -0.4, (b.z0 + b.z1) / 2, b.x1 - b.x0, 0.85, b.z1 - b.z0);
    for (let z = b.z0 + 10; z < b.z1 - 5; z += 22) {
      if (onLandSolid(-60, z)) continue;
      P(box, 0x6f6f6a, -66, WATER_LEVEL - 3, z, 2.2, 6, 2.2);
      P(box, 0x6f6f6a, -54, WATER_LEVEL - 3, z, 2.2, 6, 2.2);
    }
    // railings, broken where the bridge crosses Providence Island
    for (const [z0, z1] of [[-302, -253], [-204, -150]]) {
      for (const x of [-67.6, -52.4]) {
        P(box, 0xd9d9d0, x, 0.55, (z0 + z1) / 2, 0.5, 1.1, z1 - z0);
        collision.add(x - 0.4, z0, x + 0.4, z1, 1.2);
      }
    }
  }

  // ---------- roads ----------
  const roadTex = makeRoadTexture();
  const roadB = new MeshBuilder();
  const quad = (x0, z0, x1, z1, y, uAlongX, uScale, vScale) => {
    const base = roadB.vertexCount;
    const pts = [[x0, z1], [x1, z1], [x1, z0], [x0, z0]];
    for (const [x, z] of pts) {
      roadB.positions.push(x, y, z);
      roadB.normals.push(0, 1, 0);
      roadB.colors.push(1, 1, 1);
      if (uAlongX === null) roadB.uvs.push(0.7, 0.3);
      else if (uAlongX) roadB.uvs.push((x - x0) * uScale, (z - z0) * vScale);
      else roadB.uvs.push((z - z0) * uScale, (x - x0) * vScale);
    }
    roadB.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (const r of roads.rects) {
    if (r.axis === 'x') quad(r.x0, r.z0, r.x1, r.z1, 0.03, true, 1 / 12, 1 / 14);
    else quad(r.x0, r.z0, r.x1, r.z1, 0.035, false, 1 / 12, 1 / 14);
  }
  for (const n of roads.nodes) {
    if (n.adj.length < 2) continue;
    const axes = new Set(n.adj.map((a) => a.edge.axis));
    if (axes.size < 2) continue;
    quad(n.x - ROAD_HALF, n.z - ROAD_HALF, n.x + ROAD_HALF, n.z + ROAD_HALF, 0.045, null);
  }
  const roadMesh = new THREE.Mesh(roadB.build(), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9 }));
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // zebra crossings at big intersections
  const zebra = new MeshBuilder();
  for (const n of roads.intersections) {
    if (n.adj.length < 4 || rand() < 0.4) continue;
    for (const { node: o } of n.adj) {
      const dx = Math.sign(o.x - n.x);
      const dz = Math.sign(o.z - n.z);
      for (let i = -5; i <= 5; i += 1.6) {
        const cx = n.x + dx * (ROAD_HALF + 1.6) + (dz ? i : 0);
        const cz = n.z + dz * (ROAD_HALF + 1.6) + (dx ? i : 0);
        zebra.addGeometry(box, makeMatrix(cx, 0.05, cz, 0, 0, 0, dx ? 2.4 : 0.8, 0.02, dz ? 2.4 : 0.8), 0xe9e9e9);
      }
    }
  }
  if (zebra.vertexCount) scene.add(Object.assign(new THREE.Mesh(zebra.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })), { receiveShadow: true }));

  // ---------- sidewalks ----------
  const swTex = makeSidewalkTexture();
  const swB = new MeshBuilder();
  const swBox = (x0, z0, x1, z1) => {
    swB.addBox(x0, 0, z0, x1, 0.12, z1, 0xffffff, 1 / 4, 1 / 4);
  };
  // red-and-white painted kerbs, as on Monrovia's main streets (one red + one white block = 3m)
  const curbB = new MeshBuilder();
  const curbTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 8;
    const g = c.getContext('2d');
    g.fillStyle = '#b3202a';
    g.fillRect(0, 0, 32, 8);
    g.fillStyle = '#efefe8';
    g.fillRect(32, 0, 32, 8);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    return t;
  })();
  for (const r of roads.rects) {
    const sides = r.axis === 'x'
      ? [[r.z0 - SIDEWALK, r.z0], [r.z1, r.z1 + SIDEWALK]]
      : [[r.x0 - SIDEWALK, r.x0], [r.x1, r.x1 + SIDEWALK]];
    const a0 = r.axis === 'x' ? r.x0 - SIDEWALK : r.z0 - SIDEWALK;
    const a1 = r.axis === 'x' ? r.x1 + SIDEWALK : r.z1 + SIDEWALK;
    for (const [c0, c1] of sides) {
      let run = null;
      const flush = (end) => {
        if (run !== null && end - run > 1) {
          if (r.axis === 'x') swBox(run, c0, end, c1);
          else swBox(c0, run, c1, end);
          const edge = c1 === r.z0 || c1 === r.x0 ? c1 : c0;
          const k0 = edge === c1 ? edge - 0.3 : edge;
          const k1 = k0 + 0.3;
          if (r.axis === 'x') curbB.addBox(run, 0, k0, end, 0.2, k1, 0xffffff, 1 / 3, 1, run / 3, 'x');
          else curbB.addBox(k0, 0, run, k1, 0.2, end, 0xffffff, 1 / 3, 1, run / 3, 'z');
        }
        run = null;
      };
      for (let a = a0; a < a1; a += 1) {
        const mid = a + 0.5;
        const cx = r.axis === 'x' ? mid : (c0 + c1) / 2;
        const cz = r.axis === 'x' ? (c0 + c1) / 2 : mid;
        const ok = onLandSolid(cx, cz) && !roads.onRoad(cx, cz, -0.01);
        if (ok && run === null) run = a;
        if (!ok) flush(a);
      }
      flush(a1);
    }
  }
  const curbMesh = new THREE.Mesh(curbB.build(), new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.8 }));
  curbMesh.receiveShadow = true;
  scene.add(curbMesh);
  const swMesh = new THREE.Mesh(swB.build(), new THREE.MeshStandardMaterial({ map: swTex, roughness: 0.95 }));
  swMesh.receiveShadow = true;
  scene.add(swMesh);

  function onLandSolid(x, z) {
    for (const r of LAND) if (r.type !== 'bridge' && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return true;
    return false;
  }

  // ---------- procedural buildings ----------
  const districtOf = (x, z) => DISTRICTS.find((d) => x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1)?.name || '';
  const signs = [];
  const emptyLots = [];

  const building = (x0, z0, x1, z1) => {
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const dist = districtOf(cx, cz);
    let h;
    // Monrovia is mostly 2 to 5 storeys, with the odd office block downtown
    if (dist === 'Downtown Monrovia') h = rand() < 0.08 ? 28 + rand() * 14 : 7 + rand() * 12;
    else if (dist === 'Snapper Hill' || dist === 'Waterside') h = 6 + rand() * 9;
    else if (dist === 'Capitol Hill' || dist === 'Mamba Point') h = 5 + rand() * 11;
    else if (dist === 'Bushrod Island' || dist === 'Freeport of Monrovia') h = 4 + rand() * 7;
    else h = rand() < 0.1 ? 14 + rand() * 12 : 3.6 + rand() * 7;
    if ((dist === 'Sinkor' || dist === 'Paynesville') && rand() < 0.22) {
      emptyLots.push({ x0, z0, x1, z1 });
      return;
    }
    if (rand() < 0.06) {
      emptyLots.push({ x0, z0, x1, z1 });
      return;
    }
    h = Math.round(h / 3.5) * 3.5;
    if (h < 3.5) h = 3.5;
    // faded paint: pull the colour toward a dusty concrete grey
    const color = new THREE.Color(pick(rand, WALL_COLORS)).lerp(new THREE.Color(0xb9b2a4), 0.25 + rand() * 0.25).multiplyScalar(0.8 + rand() * 0.18);
    windowed.addBox(x0, 0, z0, x1, h, z1, color, 1 / 32, 1 / 28, Math.floor(rand() * 8) / 8);
    collision.add(x0, z0, x1, z1, h);
    if (h <= 10.5 && rand() < 0.8) {
      // corrugated zinc roof, the signature look of Monrovia's low-rise buildings
      const along = x1 - x0 > z1 - z0;
      const rh = 1.2 + rand() * 1.2;
      P(prism, pick(rand, ROOF_COLORS), cx, h, cz, (along ? x1 - x0 : z1 - z0) + 0.8, rh, (along ? z1 - z0 : x1 - x0) + 0.8, along ? 0 : Math.PI / 2);
    } else {
      P(box, 0x8e8e88, cx, h + 0.4, cz, x1 - x0, 0.8, z1 - z0); // parapet slab
      // black plastic water tanks, everywhere on Monrovia roofs
      const tanks = rand() < 0.75 ? 1 + Math.floor(rand() * 3) : 0;
      for (let k = 0; k < tanks; k++) P(cyl, 0x1c1c1e, x0 + 2 + k * 2.6, h + 1.9, z0 + 2.2, 2.2, 2.2, 2.2);
      if (rand() < 0.35) P(box, 0xd0d0d0, cx + 2, h + 1.6, cz - 1, 3, 1.6, 2); // stair house
      if (rand() < 0.45) {
        // satellite dish on a short pole
        const sx = x1 - 2;
        const sz = z1 - 2;
        P(cyl, 0x777777, sx, h + 1.4, sz, 0.08, 1.4, 0.08);
        P(hemi, 0xe8e8e8, sx, h + 2.1, sz, 1.4, 0.5, 1.4, rand() * 6, 1.1);
      }
      if (rand() < 0.3) {
        // rebar left sticking up for the next storey, which may come one day
        for (let rx = x0 + 1; rx < x1 - 0.5; rx += 3.5) {
          for (const rz of [z0 + 1, z1 - 1]) P(box, 0x6b4a32, rx, h + 1.6, rz, 0.06, 2.4, 0.06);
        }
      }
      if (rand() < 0.25) {
        P(cyl, 0x777777, cx - 2, h + 4, cz + 2, 0.15, 7, 0.15); // antenna
      }
    }
    // balconies with iron railings on the street side of most multi-storey buildings
    if (h >= 7 && rand() < 0.55) {
      const faces = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [fx, fz] of faces) {
        const px = cx + fx * ((x1 - x0) / 2 + 8);
        const pz = cz + fz * ((z1 - z0) / 2 + 8);
        if (!roads.onRoad(px, pz, 2)) continue;
        const len = (fz ? x1 - x0 : z1 - z0) - 2;
        if (len < 4) continue;
        const ex = fx ? (fx > 0 ? x1 : x0) : cx;
        const ez = fz ? (fz > 0 ? z1 : z0) : cz;
        const railCol = pick(rand, [0x2b2b2b, 0x3a5a40, 0x1f4e79, 0x8c2f39]);
        for (let y = 3.5; y < h - 0.5; y += 3.5) {
          if (rand() < 0.25) continue;
          const bx = ex + fx * 0.6;
          const bz = ez + fz * 0.6;
          P(box, 0x9a958a, bx, y, bz, fz ? len : 1.2, 0.15, fz ? 1.2 : len);
          P(box, railCol, ex + fx * 1.15, y + 0.95, ez + fz * 1.15, fz ? len : 0.06, 0.06, fz ? 0.06 : len);
          for (let k = -len / 2; k <= len / 2; k += 1.2) {
            P(box, railCol, ex + fx * 1.15 + (fz ? k : 0), y + 0.5, ez + fz * 1.15 + (fx ? k : 0), 0.04, 0.8, 0.04);
          }
        }
        break;
      }
    }
    // shop sign on the side facing the nearest street
    // Broad Street is lined with shops, so nearly every building there gets a sign
    const onBroad = Math.abs(cz + 25) < 34 && cx < 165;
    if (h >= 7 && h <= (onBroad ? 60 : 14) && rand() < (onBroad ? 0.9 : 0.3)) {
      const faces = [
        [cx, z1, 0, x1 - x0], [cx, z0, Math.PI, x1 - x0], [x1, cz, Math.PI / 2, z1 - z0], [x0, cz, -Math.PI / 2, z1 - z0],
      ];
      let bestF = null;
      let bd = Infinity;
      for (const f of faces) {
        const nx = Math.sin(f[2]);
        const nz = Math.cos(f[2]);
        const px = f[0] + nx * 8;
        const pz = f[1] + nz * 8;
        if (roads.onRoad(px, pz, 2)) {
          const d = 0;
          if (d < bd) { bd = d; bestF = f; }
        }
      }
      if (bestF && bestF[3] > 7) signs.push({ x: bestF[0], z: bestF[1], ry: bestF[2], w: Math.min(bestF[3] - 2, 9), text: pick(rand, SHOP_SIGNS) });
    }
  };

  const groundRects = LAND.filter((l) => l.type === 'ground');
  for (const land of groundRects) {
    const xs = new Set([land.x0, land.x1]);
    const zs = new Set([land.z0, land.z1]);
    for (const s of NS_STREETS) if (s.x > land.x0 && s.x < land.x1) xs.add(s.x);
    for (const s of EW_STREETS) if (s.z > land.z0 && s.z < land.z1) zs.add(s.z);
    const X = [...xs].sort((a, b) => a - b);
    const Z = [...zs].sort((a, b) => a - b);
    for (let i = 0; i < X.length - 1; i++) {
      for (let j = 0; j < Z.length - 1; j++) {
        const cx0 = X[i] + (X[i] === land.x0 ? 4 : LOT_MARGIN);
        const cx1 = X[i + 1] - (X[i + 1] === land.x1 ? 4 : LOT_MARGIN);
        const cz0 = Z[j] + (Z[j] === land.z0 ? 4 : LOT_MARGIN);
        const cz1 = Z[j + 1] - (Z[j + 1] === land.z1 ? 4 : LOT_MARGIN);
        if (cx1 - cx0 < 8 || cz1 - cz0 < 8) continue;
        // split the block into lots
        const cuts = (a0, a1) => {
          const out = [a0];
          let a = a0;
          while (a1 - a > 30) {
            a += 13 + rand() * 12;
            out.push(a);
          }
          out.push(a1);
          return out;
        };
        const cxs = cuts(cx0, cx1);
        const czs = cuts(cz0, cz1);
        for (let a = 0; a < cxs.length - 1; a++) {
          for (let b = 0; b < czs.length - 1; b++) {
            const lot = { x0: cxs[a] + 1, x1: cxs[a + 1] - 1, z0: czs[b] + 1, z1: czs[b + 1] - 1 };
            if (lot.x1 - lot.x0 < 5 || lot.z1 - lot.z0 < 5) continue;
            if (blocked(lot)) continue;
            // inner lots (not touching the block edge) are sometimes yards
            const inner = a > 0 && a < cxs.length - 2 && b > 0 && b < czs.length - 2;
            if (inner && rand() < 0.5) {
              emptyLots.push(lot);
              continue;
            }
            const sx = rand() * 1.5;
            const sz = rand() * 1.5;
            building(lot.x0 + sx, lot.z0 + sz, lot.x1 - (1.5 - sx), lot.z1 - (1.5 - sz));
          }
        }
      }
    }
  }

  // shop signs
  const signMats = new Map();
  const signGeo = new THREE.PlaneGeometry(1, 1);
  for (const s of signs) {
    const [text, bg] = s.text;
    let m = signMats.get(text);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ map: makeSignTexture(text, { bg, font: 'bold 44px sans-serif' }), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 });
      m.emissiveMap = m.map;
      signMats.set(text, m);
    }
    const mesh = new THREE.Mesh(signGeo, m);
    const nx = Math.sin(s.ry);
    const nz = Math.cos(s.ry);
    mesh.position.set(s.x + nx * 0.08, 3.9, s.z + nz * 0.08);
    mesh.rotation.y = s.ry;
    mesh.scale.set(s.w, s.w / 4, 1);
    scene.add(mesh);
    // a shade awning over the shop front, in the sign's colour
    P(box, new THREE.Color(bg).lerp(new THREE.Color(0xffffff), 0.15), s.x + nx * 0.9, 2.75, s.z + nz * 0.9, Math.abs(nz) > 0.5 ? s.w : 1.8, 0.12, Math.abs(nz) > 0.5 ? 1.8 : s.w);
  }

  // ---------- West Point: a dense township of zinc-roofed shacks ----------
  {
    const wp = LANDMARKS.find((l) => l.id === 'westpoint').reserve;
    for (let x = wp[0] + 2; x < wp[1] - 4; x += 5.5 + rand() * 2) {
      for (let z = wp[2] + 3; z < wp[3] - 3; z += 5 + rand() * 2.5) {
        if (rand() < 0.12) continue; // alleys
        const w = 3 + rand() * 2;
        const d = 3 + rand() * 1.8;
        const r = { x0: x, z0: z, x1: x + w, z1: z + d };
        if (roadKeepOut.some((q) => rectsOverlap(r, q))) continue;
        const h = 2.4 + rand() * 1.2;
        const c = new THREE.Color(pick(rand, [0xc9b79c, 0x8d7b68, 0xa4907c, 0x5e8c61, 0x4f6d7a, 0xd8a48f, 0xb7b7a4]));
        solid(x, z, x + w, z + d, h, c);
        P(prism, pick(rand, [0x9aa0a6, 0x8b4a2f, 0x7a7a74, 0xa65e2e]), x + w / 2, h, z + d / 2, w + 0.6, 0.6 + rand() * 0.4, d + 0.6, rand() < 0.5 ? 0 : Math.PI / 2);
      }
    }
    // canoes on the river bank
    for (let i = 0; i < 6; i++) canoe(-260 + i * 9, -147.5, rand() * 0.4);
  }

  function canoe(x, z, ry) {
    const col = pick(rand, [0xd62828, 0x003049, 0xf77f00, 0x2a9d8f, 0xfcbf49]);
    P(box, col, x, 0.35, z, 1.4, 0.7, 7, ry);
    P(box, 0x3d2b1f, x, 0.72, z, 1.1, 0.06, 6.4, ry);
    P(cone, col, x + Math.sin(ry) * 3.9, 0.35, z + Math.cos(ry) * 3.9, 1.4, 1.2, 0.7, ry, Math.PI / 2);
  }

  // ---------- trees ----------
  const palms = [];
  const leafy = [];
  const palm = (x, z, h = 7 + rand() * 5) => {
    palms.push({ x, z, h, lean: (rand() - 0.5) * 0.25, ry: rand() * Math.PI * 2 });
    collision.add(x - 0.35, z - 0.35, x + 0.35, z + 0.35, h);
  };
  const tree = (x, z, s = 1) => {
    leafy.push({ x, z, s: s * (0.8 + rand() * 0.6) });
    collision.add(x - 0.4, z - 0.4, x + 0.4, z + 0.4, 6);
  };
  for (let x = -320; x < 590; x += 9 + rand() * 12) palm(x, 152 + rand() * 20);
  for (const lot of emptyLots) {
    const n = Math.floor(((lot.x1 - lot.x0) * (lot.z1 - lot.z0)) / 140) + 1;
    for (let i = 0; i < n; i++) {
      const x = lot.x0 + 2 + rand() * (lot.x1 - lot.x0 - 4);
      const z = lot.z0 + 2 + rand() * (lot.z1 - lot.z0 - 4);
      if (rand() < 0.5) palm(x, z);
      else tree(x, z);
    }
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const x = -60 + Math.cos(a) * (12 + rand() * 25);
    const z = -228 + Math.sin(a) * (8 + rand() * 12);
    if (Math.abs(x + 60) > 10) (rand() < 0.5 ? palm : tree)(x, z);
  }

  // ---------- street lamps ----------
  const lamps = [];
  for (const e of roads.edges) {
    const { a, b } = e;
    const len = e.len;
    for (let t = 14; t < len - 14; t += 34) {
      const k = t / len;
      const x = a.x + (b.x - a.x) * k;
      const z = a.z + (b.z - a.z) * k;
      const side = Math.floor(t / 34) % 2 ? 1 : -1;
      const off = ROAD_HALF + 0.6;
      const lx = e.axis === 'x' ? x : x + side * off;
      const lz = e.axis === 'x' ? z + side * off : z;
      if (!onLand(lx, lz)) continue;
      lamps.push({ x: lx, z: lz, ry: e.axis === 'x' ? (side > 0 ? Math.PI : 0) : side > 0 ? -Math.PI / 2 : Math.PI / 2 });
      collision.add(lx - 0.15, lz - 0.15, lx + 0.15, lz + 0.15, 8);
    }
  }

  // ---------- landmarks ----------
  const flagTex = makeFlagTexture();
  const flags = [];
  const flagpole = (x, z, h = 12, y = 0) => {
    P(cyl, 0xdddddd, x, y + h / 2, z, 0.18, h, 0.18);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.6, 10, 2), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.7 }));
    f.position.set(x + 1.55, y + h - 1, z);
    f.castShadow = true;
    scene.add(f);
    flags.push(f);
  };
  animated.push((dt, t) => {
    for (const f of flags) {
      const pos = f.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + 1.5;
        pos.setZ(i, Math.sin(t * 5 + x * 2.2 + f.position.x) * 0.12 * x);
      }
      pos.needsUpdate = true;
    }
  });
  const sign = (text, x, y, z, w, ry = 0, opts = {}) => {
    const m = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ map: makeSignTexture(text, opts), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 }));
    m.material.emissiveMap = m.material.map;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.scale.set(w, w / 4, 1);
    scene.add(m);
    signMeshes.push(m);
    return m;
  };
  const signMeshes = [];
  const columns = (x0, x1, z, h, n, color = 0xf5f5f0, rot = false) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = x0 + (x1 - x0) * t;
      if (rot) P(cyl, color, z, h / 2, x, 1.1, h, 1.1);
      else P(cyl, color, x, h / 2, z, 1.1, h, 1.1);
    }
  };

  // Ducor Hotel: the modernist hotel on Mamba Point's hilltop
  {
    const x0 = -322; const x1 = -278; const z0 = -132; const z1 = -118;
    windowed.addBox(x0, 0, z0, x1, 33, z1, 0xf1f1ea, 1 / 32, 1 / 28);
    collision.add(x0, z0, x1, z1, 33);
    for (let y = 3.5; y < 33; y += 3.5) P(box, 0xe0e0d8, -300, y, z1 + 0.8, 45, 0.35, 1.8); // balconies
    P(box, 0xd8d8d0, -300, 34.5, -125, 20, 3, 10);
    P(box, 0xe8e8e0, -300, 2, -110, 30, 4, 6); // lobby wing
    collision.add(-315, -113, -285, -107, 4);
    sign('DUCOR HOTEL', -300, 34.8, -119.9, 18, 0, { bg: '#0b132b', fg: '#ffd166' });
    flagpole(-280, -106, 14);
  }
  // Cape Mesurado lighthouse
  let beam;
  {
    const lx = -355; const lz = -136;
    for (let i = 0; i < 6; i++) P(cyl, i % 2 ? 0xc1121f : 0xffffff, lx, 1.8 + i * 3.6, lz, 3.6 - i * 0.2, 3.6, 3.6 - i * 0.2);
    P(cyl, 0x222222, lx, 22.5, lz, 3.4, 0.6, 3.4);
    glowing.addGeometry(cyl, makeMatrix(lx, 24, lz, 0, 0, 0, 2, 2.4, 2), 0xfff3b0);
    P(cone, 0xc1121f, lx, 26, lz, 2.8, 2, 2.8);
    collision.add(lx - 2, lz - 2, lx + 2, lz + 2, 26);
    beam = new THREE.Mesh(
      new THREE.ConeGeometry(6, 90, 16, 1, true).translate(0, -45, 0).rotateZ(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
    );
    beam.position.set(lx, 24, lz);
    scene.add(beam);
    animated.push((dt, t, night) => {
      beam.rotation.y = t * 0.9;
      beam.visible = night > 0.3;
    });
  }
  // Waterside Market: rows of stalls under colourful tarps
  {
    const tarp = [0xe63946, 0xffb703, 0x219ebc, 0x2a9d8f, 0xf77f00, 0x8338ec, 0x06d6a0];
    for (let x = -190; x < -72; x += 7) {
      for (const z of [-146, -139, -133]) {
        if (rand() < 0.1) continue;
        P(box, 0x6b4f3a, x + 2, 0.5, z, 3.6, 1, 2.2); // table
        P(box, 0x5a4636, x + 0.3, 1.2, z, 0.12, 2.4, 0.12);
        P(box, 0x5a4636, x + 3.7, 1.2, z, 0.12, 2.4, 0.12);
        P(box, pick(rand, tarp), x + 2, 2.5, z, 4.4, 0.08, 3.2, 0, 0.12);
        for (let k = 0; k < 4; k++) P(sphere, pick(rand, [0xff6b35, 0xffd23f, 0x6a994e, 0xbc4749, 0xf2e8cf]), x + 0.8 + k * 0.8, 1.15, z + (rand() - 0.5), 0.5, 0.35, 0.5);
        collision.add(x + 0.2, z - 1.1, x + 3.8, z + 1.1, 2.6);
      }
    }
    sign('WATERSIDE MARKET', -130, 4.5, -128.5, 14, 0, { bg: '#7b2cbf', fg: '#fff' });
    P(box, 0x5a4636, -137.5, 2.25, -128.5, 0.3, 4.5, 0.3);
    P(box, 0x5a4636, -122.5, 2.25, -128.5, 0.3, 4.5, 0.3);
  }
  // Masonic Temple on Snapper Hill
  {
    const [x0, x1, z0, z1] = [-252, -218, -8, 8];
    solid(x0, z0, x1, z1, 20, 0xe6dfcf);
    for (let y = 3; y < 19; y += 4) {
      for (let x = x0 + 3; x < x1 - 2; x += 4) P(box, 0x2b2d42, x, y, z1 + 0.05, 1.4, 2.2, 0.1);
    }
    columns(x0 + 2, x1 - 2, z1 + 3, 16, 8);
    P(box, 0xd9d2c0, (x0 + x1) / 2, 16.5, z1 + 3, x1 - x0, 1, 5);
    P(prism, 0xd9d2c0, (x0 + x1) / 2, 17, z1 + 2, x1 - x0, 4, 8);
    collision.add(x0, z1, x1, z1 + 5, 16);
  }
  // LNP Headquarters
  {
    solid(-116, -62, -74, -50, 12, 0x5c7aa6, windowed);
    P(box, 0xffffff, -95, 12.5, -56, 42, 1, 12);
    sign('LIBERIA NATIONAL POLICE', -95, 9.5, -49.9, 20, 0, { bg: '#0a2463', fg: '#ffffff', font: 'bold 40px sans-serif' });
    flagpole(-78, -44, 11);
  }
  // City Hall
  {
    solid(-46, 39, -4, 57, 14, 0xf8f4ec, windowed);
    columns(-42, -8, 59, 12, 8);
    P(box, 0xeeeeee, -25, 12.5, 59.5, 40, 1, 4);
    collision.add(-46, 57, -4, 61, 12);
    sign('MONROVIA CITY HALL', -25, 15.5, 57.1, 14, 0, { bg: '#ffffff', fg: '#1d3557' });
    flagpole(-25, 63, 10);
  }
  // Capitol Building
  {
    solid(98, 41, 142, 59, 14, 0xf3ead7, windowed);
    P(cyl, 0xf3ead7, 120, 17, 50, 16, 6, 16);
    columns(104, 136, 61, 12, 9);
    P(box, 0xece2cc, 120, 12.5, 61.5, 40, 1, 4);
    collision.add(98, 59, 142, 63, 12);
    P(hemi, 0xd9d9d9, 120, 20, 50, 15, 10, 15);
    P(cyl, 0xd9d9d9, 120, 25.5, 50, 1.5, 3, 1.5);
    flagpole(120, 27, 8, 26);
    sign('CAPITOL BUILDING', 120, 15.5, 59.1, 14, 0, { bg: '#f3ead7', fg: '#3d405b' });
  }
  // Executive Mansion, fenced compound with a gate onto the Coastal Road
  {
    windowed.addBox(182, 0, 92, 218, 24.5, 106, 0xffffff, 1 / 32, 1 / 28);
    collision.add(182, 92, 218, 106, 24.5);
    P(box, 0xf0f0f0, 200, 25, 99, 38, 1, 16);
    columns(186, 214, 108, 7, 8);
    P(box, 0xf6f6f6, 200, 7.3, 108.5, 34, 0.6, 4);
    flagpole(200, 99, 8, 25.5);
    // fence (gate gap in the south)
    const fence = (x0, z0, x1, z1) => solid(x0, z0, x1, z1, 2.2, 0xe5e5e5);
    fence(172, 87, 228, 88);
    fence(172, 87, 173, 113);
    fence(227, 87, 228, 113);
    fence(172, 112, 194, 113);
    fence(206, 112, 228, 113);
    P(box, 0x40916c, 200, 0.06, 100, 54, 0.1, 24);
    sign('EXECUTIVE MANSION', 200, 5.2, 113.2, 9, 0, { bg: '#1b4332', fg: '#ffd166' });
  }
  // JFK Medical Center
  {
    solid(256, 41, 304, 57, 17.5, 0xf8f9fa, windowed);
    P(box, 0xffffff, 280, 3, 60, 14, 0.4, 6);
    P(box, 0x6c757d, 274, 1.5, 62.5, 0.3, 3, 0.3);
    P(box, 0x6c757d, 286, 1.5, 62.5, 0.3, 3, 0.3);
    sign('JFK MEDICAL CENTER', 280, 14.5, 57.1, 18, 0, { bg: '#ffffff', fg: '#c1121f' });
    // red cross
    glowing.addGeometry(box, makeMatrix(262, 12, 57.2, 0, 0, 0, 4, 1.2, 0.2), 0xd00000);
    glowing.addGeometry(box, makeMatrix(262, 12, 57.2, 0, 0, 0, 1.2, 4, 0.2), 0xd00000);
  }
  // Samuel Kanyon Doe Sports Complex
  {
    const cx = 440; const cz = 25; const rx = 26; const rz = 36;
    P(box, 0x55a630, cx, 0.06, cz, 30, 0.1, 46);
    P(box, 0xffffff, cx, 0.08, cz, 0.4, 0.1, 46);
    const segs = 28;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      if (Math.abs(Math.sin(a)) < 0.12 && Math.cos(a) > 0) continue; // east gate
      const x = cx + Math.cos(a) * rx;
      const z = cz + Math.sin(a) * rz;
      const seglen = (2 * Math.PI * Math.sqrt((rx * rx + rz * rz) / 2)) / segs + 0.5;
      const ry = Math.atan2(-Math.cos(a) * rz, -Math.sin(a) * rx);
      P(box, i % 2 ? 0x2b9348 : 0xeeeeee, x, 5, z, seglen, 10, 3, ry);
      P(box, 0xbfbfbf, x - Math.cos(a) * 2.2, 2.5, z - Math.sin(a) * 2.2, seglen, 5, 2, ry);
      collision.add(x - 3.4, z - 3.4, x + 3.4, z + 3.4, 10);
    }
    for (const [x, z] of [[cx - 24, cz - 34], [cx + 24, cz - 34], [cx - 24, cz + 34], [cx + 24, cz + 34]]) {
      P(box, 0x6c757d, x, 11, z, 0.8, 22, 0.8);
      glowing.addGeometry(box, makeMatrix(x, 22.5, z, 0, 0, 0, 4, 2, 0.6), 0xffffff);
      collision.add(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 22);
    }
    sign('SKD SPORTS COMPLEX', cx + 29, 12, cz, 14, Math.PI / 2, { bg: '#2b9348', fg: '#fff' });
  }
  // Red Light Market, Paynesville
  {
    const umb = [0xe63946, 0xffb703, 0x219ebc, 0xf77f00, 0x8338ec, 0x06d6a0, 0xff006e];
    for (let x = 495; x < 546; x += 6) {
      for (let z = -10; z < 61; z += 6) {
        if (rand() < 0.3) continue;
        const ux = x + rand() * 2;
        const uz = z + rand() * 2;
        P(box, 0x6b4f3a, ux, 0.45, uz, 2.2, 0.9, 1.6);
        P(cyl, 0x444444, ux, 1.4, uz, 0.08, 2.8, 0.08);
        P(cone, pick(rand, umb), ux, 2.9, uz, 3.8, 0.9, 3.8);
        collision.add(ux - 1.1, uz - 0.8, ux + 1.1, uz + 0.8, 1.2);
      }
    }
    sign('RED LIGHT MARKET', 520, 4.5, 64, 14, 0, { bg: '#d00000', fg: '#fff' });
    P(box, 0x444444, 513, 2.25, 64, 0.3, 4.5, 0.3);
    P(box, 0x444444, 527, 2.25, 64, 0.3, 4.5, 0.3);
  }
  // Providence Island monument
  {
    solid(-35, -230, -29, -224, 1, 0xbcb8b1);
    P(box, 0xe9ecef, -32, 7, -227, 2.4, 12, 2.4);
    P(cone, 0xe9ecef, -32, 14, -227, 3.4, 2.5, 3.4, Math.PI / 4);
    flagpole(-42, -236, 10);
    sign('PROVIDENCE ISLAND', -32, 2.6, -223.9, 6, 0, { bg: '#2d6a4f', fg: '#fff' });
  }
  // Freeport: containers, cranes, a cargo ship
  {
    const ccol = [0xc1121f, 0x003049, 0x2a9d8f, 0xf77f00, 0x6c757d, 0x1d3557, 0xe9c46a];
    for (let x = 100; x < 160; x += 7) {
      for (let z = -420; z < -340; z += 3) {
        if (rand() < 0.25) continue;
        const stack = 1 + Math.floor(rand() * 3);
        for (let s = 0; s < stack; s++) P(box, pick(rand, ccol), x + 3, 1.3 + s * 2.6, z + 1.25, 6, 2.5, 2.4);
        collision.add(x, z, x + 6, z + 2.5, stack * 2.6);
      }
    }
    for (const z of [-410, -360]) {
      for (const dz of [-6, 6]) {
        P(box, 0xffb703, 166, 14, z + dz, 1.2, 28, 1.2);
        P(box, 0xffb703, 176, 14, z + dz, 1.2, 28, 1.2);
        collision.add(165.2, z + dz - 0.7, 166.8, z + dz + 0.7, 28);
        collision.add(175.2, z + dz - 0.7, 176.8, z + dz + 0.7, 28);
      }
      P(box, 0xffb703, 178, 28.5, z, 34, 1.6, 14);
      P(box, 0x333333, 168, 27, z, 3, 3, 3);
    }
    // ship moored beside the docks
    P(box, 0x1d3557, 196, WATER_LEVEL + 2, -365, 14, 6, 70);
    P(box, 0xc1121f, 196, WATER_LEVEL - 0.6, -365, 14.1, 1.2, 70.1);
    P(box, 0xffffff, 196, WATER_LEVEL + 8, -392, 12, 6, 10);
    P(box, 0x222222, 196, WATER_LEVEL + 13, -394, 2, 4, 2);
    for (let z = -385; z < -340; z += 9) P(box, pick(rand, ccol), 196, WATER_LEVEL + 6.3, z, 12, 2.6, 8);
    // warehouse
    windowed.addBox(105, 0, -332, 160, 9, -312, 0xb8b8aa, 1 / 32, 1 / 28);
    collision.add(105, -332, 160, -312, 9);
    P(prism, 0x8d99ae, 132.5, 9, -322, 56, 3, 21);
    sign('FREEPORT OF MONROVIA', 132.5, 6, -311.9, 16, 0, { bg: '#003049', fg: '#fff' });
  }
  // Spray shops: drive in to clear your wanted level
  const sprayGarage = (x0, z0, x1, z1, openSide, label) => {
    const h = 6;
    const col = 0x495057;
    if (openSide !== 'n') solid(x0, z0, x1, z0 + 0.6, h, col);
    if (openSide !== 's') solid(x0, z1 - 0.6, x1, z1, h, col);
    solid(x0, z0, x0 + 0.6, z1, h, col);
    solid(x1 - 0.6, z0, x1, z1, h, col);
    P(box, 0x343a40, (x0 + x1) / 2, h + 0.3, (z0 + z1) / 2, x1 - x0, 0.6, z1 - z0);
    const sz = openSide === 's' ? z1 + 0.1 : z0 - 0.1;
    sign(label, (x0 + x1) / 2, h - 1, sz, 12, openSide === 's' ? 0 : Math.PI, { bg: '#ff006e', fg: '#fff' });
    P(box, 0x22223b, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, x1 - x0 - 1.4, 0.06, z1 - z0 - 1.4);
  };
  sprayGarage(348, 92, 372, 114, 's', 'SPRAY & FIX');
  sprayGarage(-172, -358, -148, -334, 'n', 'VAI TOWN GARAGE');

  // a few billboards along the main roads
  {
    const boards = [
      ['WELCOME TO MONROVIA', '#002868', -150, -40, 0],
      ['LONE STAR FOREVER', '#bf0a30', 300, -40, 0],
      ['SINKOR BEACH →', '#2a9d8f', 200, 140, Math.PI],
      ['DRIVE SLOW - KIDS PLAYING', '#e76f51', 470, 90, -Math.PI / 2],
    ];
    for (const [text, bg, x, z, ry] of boards) {
      P(box, 0x555555, x - 4, 4, z, 0.4, 8, 0.4);
      P(box, 0x555555, x + 4, 4, z, 0.4, 8, 0.4);
      sign(text, x, 8.5, z + 0.3, 12, ry, { bg, fg: '#fff', font: 'bold 46px sans-serif' });
      collision.add(x - 4.3, z - 0.3, x - 3.7, z + 0.3, 8);
      collision.add(x + 3.7, z - 0.3, x + 4.3, z + 0.3, 8);
    }
  }

  // beach life: canoes and umbrellas
  for (let i = 0; i < 14; i++) canoe(-200 + i * 52 + rand() * 20, 168 + rand() * 6, Math.PI / 2 + (rand() - 0.5) * 0.4);
  for (let i = 0; i < 18; i++) {
    const x = -280 + rand() * 860;
    const z = 158 + rand() * 12;
    P(cyl, 0xdddddd, x, 1.3, z, 0.08, 2.6, 0.08);
    P(cone, pick(rand, [0xe63946, 0xffb703, 0x219ebc, 0xffffff]), x, 2.7, z, 3.4, 0.8, 3.4);
  }

  // distant hills on the horizon
  for (let i = 0; i < 16; i++) {
    const a = -0.4 - (i / 16) * 2.6;
    const r = 950 + rand() * 300;
    const hill = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ color: 0x3f6e3a, roughness: 1 }));
    hill.position.set(250 + Math.cos(a) * r, -20, Math.sin(a) * r);
    hill.scale.set(400 + rand() * 300, 140 + rand() * 120, 300 + rand() * 200);
    scene.add(hill);
  }

  // ---------- Broad Street: shade trees, sidewalk vendors and a radio tower ----------
  const vendors = [];
  {
    const BZ = EW_STREETS[2].z;
    const nearCross = (x, gap) => NS_STREETS.some((n) => Math.abs(n.x - x) < gap && BZ >= n.z0 && BZ <= n.z1);
    const clear = (x, z, r) => !collision.query(x, z, r).some((b) => x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1);
    const southZ = BZ + ROAD_HALF + SIDEWALK - 1.2;
    for (let x = -322; x < 160; x += 10 + rand() * 3) {
      if (nearCross(x, 13) || !clear(x, southZ, 1.2)) continue;
      tree(x, southZ, 1.15);
    }
    const northZ = BZ - ROAD_HALF - SIDEWALK + 1.4;
    const goods = [0xff6b35, 0xffd23f, 0x6a994e, 0xbc4749, 0xf2e8cf, 0x8338ec];
    for (let x = -300; x < 150; x += 19 + rand() * 8) {
      if (nearCross(x, 15) || !clear(x, northZ, 2)) continue;
      P(box, 0x6b4f3a, x, 0.5, northZ, 2.4, 1, 1.4);
      for (let k = 0; k < 4; k++) P(sphere, pick(rand, goods), x - 0.8 + k * 0.55, 1.1, northZ + (rand() - 0.5) * 0.6, 0.45, 0.3, 0.45);
      P(cyl, 0x444444, x, 1.4, northZ - 0.6, 0.08, 2.8, 0.08);
      P(cone, pick(rand, [0xe63946, 0xffb703, 0x219ebc, 0xf77f00, 0xffffff]), x, 2.9, northZ - 0.6, 3.6, 0.8, 3.6);
      collision.add(x - 1.2, northZ - 0.7, x + 1.2, northZ + 0.7, 1.2);
      const v = createHuman({ model: pick(rand, PEOPLE_MODELS), skin: pick(rand, SKIN_TONES), shirtHue: Math.floor(rand() * 6) / 6 });
      v.group.position.set(x + 0.4, 0, northZ - 1.3);
      v.group.rotation.y = 0;
      scene.add(v.group);
      vendors.push(v);
    }
    // a lattice radio mast on the LNP headquarters roof, like the ones over downtown
    const tx = -84;
    const tz = -57;
    const base = 13;
    const H = 26;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      P(box, 0xd0d0d0, tx + dx * 0.7, base + H / 2, tz + dz * 0.7, 0.15, H, 0.15, 0, -dz * 0.035, dx * 0.035);
    }
    for (let y = base + 2; y < base + H; y += 2.5) {
      const w = 1.6 - ((y - base) / H) * 1.0;
      P(box, 0xc1121f, tx, y, tz - w / 2, w, 0.08, 0.08);
      P(box, 0xc1121f, tx, y, tz + w / 2, w, 0.08, 0.08);
      P(box, 0xc1121f, tx - w / 2, y, tz, 0.08, 0.08, w);
      P(box, 0xc1121f, tx + w / 2, y, tz, 0.08, 0.08, w);
    }
    P(cyl, 0xbbbbbb, tx, base + H + 3, tz, 0.08, 6, 0.08);
    glowing.addGeometry(sphere, makeMatrix(tx, base + H + 6, tz, 0, 0, 0, 0.5, 0.5, 0.5), 0xff2020);
  }

  // ---------- power lines: wooden poles with sagging wires along the streets ----------
  {
    const poles = [];
    const wire = [];
    const off = ROAD_HALF + SIDEWALK - 0.5;
    const freeAt = (x, z) => !collision.query(x, z, 1).some((b) => x + 0.6 > b.x0 && x - 0.6 < b.x1 && z + 0.6 > b.z0 && z - 0.6 < b.z1);
    for (const e of roads.edges) {
      if (e.len < 30) continue;
      const fx = (e.b.x - e.a.x) / e.len;
      const fz = (e.b.z - e.a.z) / e.len;
      // left-hand side of the edge's direction, so each street gets one line of poles
      const sx = fz;
      const sz = -fx;
      let prev = null;
      for (let t = 12; t <= e.len - 12; t += 26) {
        const x = e.a.x + fx * t + sx * off;
        const z = e.a.z + fz * t + sz * off;
        if (!onLandSolid(x, z) || !freeAt(x, z)) {
          prev = null;
          continue;
        }
        poles.push({ x, z, ry: Math.atan2(fx, fz) });
        collision.add(x - 0.18, z - 0.18, x + 0.18, z + 0.18, 9);
        if (prev) {
          for (const [dy, dl] of [[9, -0.7], [9, 0.7], [8.3, 0]]) {
            let px = prev.x + (Math.abs(fx) > 0.5 ? 0 : dl);
            let pz = prev.z + (Math.abs(fz) > 0.5 ? 0 : dl);
            const qx = x + (Math.abs(fx) > 0.5 ? 0 : dl);
            const qz = z + (Math.abs(fz) > 0.5 ? 0 : dl);
            let py = dy;
            for (let k = 1; k <= 6; k++) {
              const u = k / 6;
              const nx = px + (qx - px) / (7 - k);
              const nz = pz + (qz - pz) / (7 - k);
              const ny = dy - 0.9 * 4 * u * (1 - u);
              wire.push(px, py, pz, nx, ny, nz);
              px = nx;
              pz = nz;
              py = ny;
            }
          }
        }
        prev = { x, z };
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.17, 9.4, 6).translate(0, 4.7, 0);
    const armGeo = new THREE.BoxGeometry(2, 0.12, 0.12).translate(0, 8.95, 0);
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
    const pm = new THREE.InstancedMesh(poleGeo, wood, poles.length);
    const am = new THREE.InstancedMesh(armGeo, wood, poles.length);
    poles.forEach((p, i) => {
      // the cross-arm spans across the street direction so the wires run along it
      const m = makeMatrix(p.x, 0, p.z, 0, p.ry, 0);
      pm.setMatrixAt(i, m);
      am.setMatrixAt(i, m);
    });
    pm.castShadow = true;
    scene.add(pm, am);
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
    scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
  }

  // ---------- finalize merged meshes ----------
  const mWindowed = new THREE.Mesh(windowed.build(), windowMat);
  const mPlain = new THREE.Mesh(plain.build(), plainMat);
  const mGlow = new THREE.Mesh(glowing.build(), glowMat);
  for (const m of [mWindowed, mPlain, mGlow]) {
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }

  // palms: instanced trunks + crowns
  {
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 1, 6).translate(0, 0.5, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 1 });
    // Kenney's detailed palm model, instanced; each part is re-centred on the trunk base
    const src = assets.palm;
    src.updateMatrixWorld(true);
    const pbox = new THREE.Box3().setFromObject(src);
    const pc = pbox.getCenter(new THREE.Vector3());
    const ph = pbox.max.y - pbox.min.y;
    const recentre = new THREE.Matrix4().makeTranslation(-pc.x, -pbox.min.y, -pc.z);
    src.traverse((o) => {
      if (!o.isMesh) return;
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(recentre);
      const mesh = new THREE.InstancedMesh(geo, o.material, palms.length);
      palms.forEach((p, i) => {
        const k = p.h / ph;
        mesh.setMatrixAt(i, makeMatrix(p.x, 0, p.z, p.lean * 0.5, p.ry, 0, k * 1.1, k, k * 1.1));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    });
    const crownGeo = new THREE.IcosahedronGeometry(1, 0);
    const trunk2 = new THREE.InstancedMesh(trunkGeo, trunkMat, leafy.length);
    const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9, flatShading: true }), leafy.length);
    leafy.forEach((t, i) => {
      trunk2.setMatrixAt(i, makeMatrix(t.x, 0, t.z, 0, 0, 0, 1.5 * t.s, 3.2 * t.s, 1.5 * t.s));
      crowns.setMatrixAt(i, makeMatrix(t.x, 4.6 * t.s, t.z, 0, t.x, 0, 3 * t.s, 2.4 * t.s, 3 * t.s));
      crowns.setColorAt(i, new THREE.Color().setHSL(0.28 + rand() * 0.08, 0.5, 0.25 + rand() * 0.1));
    });
    for (const m of [trunk2, crowns]) {
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }
  }

  // street lamps: instanced poles + glowing bulbs
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1c1, emissive: 0xffd27a, emissiveIntensity: 0 });
  {
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 8, 6).translate(0, 4, 0);
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 2.2).translate(0, 7.9, 1.1);
    const bulbGeo = new THREE.BoxGeometry(0.5, 0.2, 0.9).translate(0, 7.75, 2.0);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.6 });
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lamps.length);
    const arms = new THREE.InstancedMesh(armGeo, poleMat, lamps.length);
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, lamps.length);
    lamps.forEach((l, i) => {
      const m = makeMatrix(l.x, 0, l.z, 0, l.ry, 0);
      poles.setMatrixAt(i, m);
      arms.setMatrixAt(i, m);
      bulbs.setMatrixAt(i, m);
    });
    poles.castShadow = true;
    scene.add(poles, arms, bulbs);
  }

  return {
    water,
    signMeshes: [...signMeshes],
    update(dt, t, night) {
      for (const fn of animated) fn(dt, t, night);
      for (const v of vendors) v.animate(dt, 0);
      windowMat.emissiveIntensity = night * 0.9;
      glowMat.emissiveIntensity = 0.15 + night * 1.2;
      bulbMat.emissiveIntensity = night * 3;
      for (const m of signMats.values()) m.emissiveIntensity = night * 0.5;
      for (const m of signMeshes) m.material.emissiveIntensity = night * 0.5;
    },
  };
}
