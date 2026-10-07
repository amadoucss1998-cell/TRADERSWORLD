import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function dampAngle(a, b, rate, dt) {
  return a + wrapAngle(b - a) * (1 - Math.exp(-rate * dt));
}

export const pick = (rand, arr) => arr[Math.floor(rand() * arr.length) % arr.length];

export function rectsOverlap(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

export function makeMatrix(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(sx, sy, sz);
  return _m.clone().compose(_p, _q, _s);
}

// Collects many coloured primitives into one BufferGeometry so a whole city costs a few draw calls.
export class MeshBuilder {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.colors = [];
    this.uvs = [];
    this.indices = [];
  }

  get vertexCount() {
    return this.positions.length / 3;
  }

  addGeometry(geometry, matrix, color, uvFixed = null) {
    const geo = geometry.index ? geometry : geometry;
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const base = this.vertexCount;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const v = new THREE.Vector3();
    const c = color instanceof THREE.Color ? color : new THREE.Color(color);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      this.positions.push(v.x, v.y, v.z);
      v.fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize();
      this.normals.push(v.x, v.y, v.z);
      this.colors.push(c.r, c.g, c.b);
      if (uvFixed) this.uvs.push(uvFixed[0], uvFixed[1]);
      else if (uv) this.uvs.push(uv.getX(i), uv.getY(i));
      else this.uvs.push(0, 0);
    }
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) this.indices.push(base + geo.index.getX(i));
    } else {
      for (let i = 0; i < pos.count; i++) this.indices.push(base + i);
    }
  }

  // Axis-aligned box whose side faces get world-scaled UVs (for window textures).
  // Top and bottom faces sample a fixed texel so roofs stay plain.
  addBox(x0, y0, z0, x1, y1, z1, color, uScale = 1 / 32, vScale = 1 / 28, uOffset = 0) {
    const c = color instanceof THREE.Color ? color : new THREE.Color(color);
    const faces = [
      // [normal, 4 corners (ccw from outside), uv axis]
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 'x'],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], 'x'],
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], 'z'],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], 'z'],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], null],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], null],
    ];
    for (const [n, corners, axis] of faces) {
      const base = this.vertexCount;
      const len = axis === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const us = [0, len, len, 0];
      corners.forEach((p, i) => {
        this.positions.push(p[0], p[1], p[2]);
        this.normals.push(n[0], n[1], n[2]);
        this.colors.push(c.r, c.g, c.b);
        if (axis) this.uvs.push(uOffset + us[i] * uScale, (p[1] - y0) * vScale);
        else this.uvs.push(0.002, 0.002);
      });
      this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    const IndexArray = this.vertexCount > 65535 ? Uint32Array : Uint16Array;
    g.setIndex(new THREE.BufferAttribute(new IndexArray(this.indices), 1));
    g.computeBoundingSphere();
    return g;
  }
}
