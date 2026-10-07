import { EW_STREETS, NS_STREETS, ROAD_HALF, LANE_OFFSET } from './config.js';

// Road network graph built from the street lists: nodes at every intersection and street end.
export class RoadGraph {
  constructor() {
    this.nodes = [];
    this.byKey = new Map();
    this.edges = []; // {a, b, street, axis}
    this.rects = []; // road surface rectangles

    const node = (x, z) => {
      const key = `${x},${z}`;
      let n = this.byKey.get(key);
      if (!n) {
        n = { id: this.nodes.length, x, z, adj: [] };
        this.nodes.push(n);
        this.byKey.set(key, n);
      }
      return n;
    };
    const link = (a, b, street, axis) => {
      const e = { a, b, street, axis, len: Math.hypot(b.x - a.x, b.z - a.z) };
      this.edges.push(e);
      a.adj.push({ node: b, edge: e });
      b.adj.push({ node: a, edge: e });
    };

    for (const s of EW_STREETS) {
      const xs = new Set([s.x0, s.x1]);
      for (const n of NS_STREETS) if (n.x >= s.x0 && n.x <= s.x1 && s.z >= n.z0 && s.z <= n.z1) xs.add(n.x);
      const sorted = [...xs].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) link(node(sorted[i], s.z), node(sorted[i + 1], s.z), s, 'x');
      this.rects.push({ x0: s.x0 - ROAD_HALF, x1: s.x1 + ROAD_HALF, z0: s.z - ROAD_HALF, z1: s.z + ROAD_HALF, axis: 'x', street: s });
    }
    for (const s of NS_STREETS) {
      const zs = new Set([s.z0, s.z1]);
      for (const e of EW_STREETS) if (e.z >= s.z0 && e.z <= s.z1 && s.x >= e.x0 && s.x <= e.x1) zs.add(e.z);
      const sorted = [...zs].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) link(node(s.x, sorted[i]), node(s.x, sorted[i + 1]), s, 'z');
      this.rects.push({ x0: s.x - ROAD_HALF, x1: s.x + ROAD_HALF, z0: s.z0 - ROAD_HALF, z1: s.z1 + ROAD_HALF, axis: 'z', street: s });
    }
    this.intersections = this.nodes.filter((n) => n.adj.length >= 3);
  }

  nearestNode(x, z) {
    let best = null;
    let bd = Infinity;
    for (const n of this.nodes) {
      const d = (n.x - x) ** 2 + (n.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  // Name of the street under (x, z), or null.
  streetAt(x, z) {
    let best = null;
    let bd = Infinity;
    for (const r of this.rects) {
      if (x < r.x0 - 4 || x > r.x1 + 4 || z < r.z0 - 4 || z > r.z1 + 4) continue;
      const d = r.axis === 'x' ? Math.abs(z - r.street.z) : Math.abs(x - r.street.x);
      if (d < bd) {
        bd = d;
        best = r.street;
      }
    }
    if (!best) return null;
    const coord = best.z !== undefined && best.x0 !== undefined ? x : z;
    for (const [limit, name] of best.names) if (coord <= limit) return name;
    return best.names[best.names.length - 1][1];
  }

  onRoad(x, z, pad = 0) {
    for (const r of this.rects) if (x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad) return true;
    return false;
  }

  // Dijkstra over the small graph; returns a list of nodes from start to goal.
  path(start, goal) {
    if (start === goal) return [start];
    const dist = new Float64Array(this.nodes.length).fill(Infinity);
    const prev = new Array(this.nodes.length).fill(null);
    const done = new Uint8Array(this.nodes.length);
    dist[start.id] = 0;
    for (;;) {
      let u = -1;
      let ud = Infinity;
      for (let i = 0; i < dist.length; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
      if (u < 0) return null;
      if (u === goal.id) break;
      done[u] = 1;
      for (const { node, edge } of this.nodes[u].adj) {
        const nd = ud + edge.len;
        if (nd < dist[node.id]) {
          dist[node.id] = nd;
          prev[node.id] = this.nodes[u];
        }
      }
    }
    const out = [];
    for (let n = goal; n; n = prev[n.id]) out.unshift(n);
    return out;
  }

  // Point on the right-hand lane of travelling from a to b, at parameter t (0..1).
  lanePoint(a, b, t, offset = LANE_OFFSET) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const fx = dx / len;
    const fz = dz / len;
    // right of forward (fx, fz) is (-fz, fx)
    return { x: a.x + dx * t - fz * offset, z: a.z + dz * t + fx * offset, fx, fz, len };
  }

  randomEdge(rand) {
    return this.edges[Math.floor(rand() * this.edges.length)];
  }
}
