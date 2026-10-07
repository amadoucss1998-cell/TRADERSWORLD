import { LAND } from './config.js';

const CELL = 16;

// Static axis-aligned boxes (buildings, walls, trees) in a spatial hash.
export class Collision {
  constructor() {
    this.boxes = [];
    this.grid = new Map();
    this.stamp = 0;
  }

  key(cx, cz) {
    return cx * 73856093 ^ cz * 19349663;
  }

  add(x0, z0, x1, z1, h = 50, y0 = 0) {
    const b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h, y0, mark: 0 };
    this.boxes.push(b);
    for (let cx = Math.floor(b.x0 / CELL); cx <= Math.floor(b.x1 / CELL); cx++) {
      for (let cz = Math.floor(b.z0 / CELL); cz <= Math.floor(b.z1 / CELL); cz++) {
        const k = this.key(cx, cz);
        let list = this.grid.get(k);
        if (!list) this.grid.set(k, (list = []));
        list.push(b);
      }
    }
    return b;
  }

  query(x, z, r, out = []) {
    out.length = 0;
    this.stamp++;
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
        const list = this.grid.get(this.key(cx, cz));
        if (!list) continue;
        for (const b of list) {
          if (b.mark === this.stamp) continue;
          b.mark = this.stamp;
          out.push(b);
        }
      }
    }
    return out;
  }

  // Pushes a circle out of any boxes it overlaps. Returns the deepest push normal or null.
  resolveCircle(p, r, y = 0) {
    const list = this.query(p.x, p.z, r, this._tmp || (this._tmp = []));
    let hit = null;
    for (let iter = 0; iter < 2; iter++) {
      for (const b of list) {
        if (y > b.h || y + 1.6 < b.y0) continue;
        const cx = Math.max(b.x0, Math.min(p.x, b.x1));
        const cz = Math.max(b.z0, Math.min(p.z, b.z1));
        let dx = p.x - cx;
        let dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        let nx;
        let nz;
        let pen;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          nx = dx / d;
          nz = dz / d;
          pen = r - d;
        } else {
          // centre inside the box: push out along the shallowest axis
          const l = p.x - b.x0;
          const rr = b.x1 - p.x;
          const t = p.z - b.z0;
          const bt = b.z1 - p.z;
          const m = Math.min(l, rr, t, bt);
          if (m === l) { nx = -1; nz = 0; pen = l + r; }
          else if (m === rr) { nx = 1; nz = 0; pen = rr + r; }
          else if (m === t) { nx = 0; nz = -1; pen = t + r; }
          else { nx = 0; nz = 1; pen = bt + r; }
        }
        p.x += nx * pen;
        p.z += nz * pen;
        if (!hit || pen > hit.pen) hit = { nx, nz, pen };
      }
    }
    return hit;
  }

  pointInside(x, y, z) {
    const list = this.query(x, z, 0.1, this._tmp2 || (this._tmp2 = []));
    for (const b of list) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.h && y > b.y0) return true;
    return false;
  }

  // Height of the tallest box under a point (for things that sit on top of others).
  heightAt(x, z) {
    const list = this.query(x, z, 0.1, this._tmp2 || (this._tmp2 = []));
    let h = 0;
    for (const b of list) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) h = Math.max(h, b.h);
    return h;
  }
}

// Whether a point is on land (or the bridge), with `pad` metres kept from the shore.
export function onLand(x, z, pad = 0) {
  for (const r of LAND) {
    if (x > r.x0 + pad && x < r.x1 - pad && z > r.z0 + pad && z < r.z1 - pad) return true;
  }
  return false;
}
