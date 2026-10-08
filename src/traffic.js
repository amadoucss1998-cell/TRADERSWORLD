import { Vehicle } from './vehicles.js';
import { LANE_OFFSET, ROAD_HALF } from './config.js';
import { clamp, wrapAngle } from './utils.js';

const TYPE_WEIGHTS = [
  ['taxi', 34], ['keke', 12], ['sedan', 18], ['suv', 12], ['bus', 9], ['pickup', 8], ['delivery', 4], ['sports', 3],
];

export function randomType() {
  const total = TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of TYPE_WEIGHTS) {
    r -= w;
    if (r <= 0) return t;
  }
  return 'taxi';
}

// Lane-following AI for civilian traffic.
export class Traffic {
  constructor(game, count = 30) {
    this.game = game;
    this.target = count;
  }

  get roads() {
    return this.game.roads;
  }

  findSpawnEdge(near, minD, maxD) {
    const { roads } = this;
    // downtown Broad Street gets a big share of the traffic, like the real thing
    const broad = this.broadEdges || (this.broadEdges = roads.edges.filter((e) => e.axis === 'x' && e.a.z === -25 && Math.max(e.a.x, e.b.x) <= 165));
    for (let tries = 0; tries < 40; tries++) {
      const pool = tries < 20 && Math.random() < 0.35 ? broad : roads.edges;
      const e = pool[Math.floor(Math.random() * pool.length)];
      const flip = Math.random() < 0.5;
      const a = flip ? e.b : e.a;
      const b = flip ? e.a : e.b;
      const t = 0.2 + Math.random() * 0.6;
      const p = roads.lanePoint(a, b, t);
      if (near) {
        const d = Math.hypot(p.x - near.x, p.z - near.z);
        if (d < minD || d > maxD) continue;
      }
      if (this.game.vehicles.some((v) => Math.abs(v.pos.x - p.x) + Math.abs(v.pos.z - p.z) < 12)) continue;
      return { a, b, t, p };
    }
    return null;
  }

  spawn(near, minD = 0, maxD = Infinity, type = randomType()) {
    const s = this.findSpawnEdge(near, minD, maxD);
    if (!s) return null;
    const heading = Math.atan2(s.p.fx, s.p.fz);
    const v = new Vehicle(type, s.p.x, s.p.z, heading);
    v.driverKind = 'ai';
    v.driver.visible = true;
    v.ai = { a: s.a, b: s.b, next: null, stuck: 0, reverse: 0, cruise: 9 + Math.random() * 5, honk: 0 };
    const sp = Math.min(v.ai.cruise, 8);
    v.vx = s.p.fx * sp;
    v.vz = s.p.fz * sp;
    this.game.addVehicle(v);
    return v;
  }

  chooseNext(a, b) {
    const opts = b.adj.filter((o) => o.node !== a);
    if (!opts.length) return a; // dead end: U-turn
    return opts[Math.floor(Math.random() * opts.length)].node;
  }

  update(dt) {
    const g = this.game;
    const player = g.player;
    const ppos = player.vehicle ? player.vehicle.pos : player.pos;
    let aiCount = 0;
    for (const v of [...g.vehicles]) {
      if (v.driverKind !== 'ai') continue;
      aiCount++;
      const far = Math.abs(v.pos.x - ppos.x) + Math.abs(v.pos.z - ppos.z);
      if (far > 380 || (v.destroyed && far > 120)) {
        g.removeVehicle(v);
        continue;
      }
      if (v.destroyed) {
        v.update(dt, {}, g.collision, g.events);
        continue;
      }
      this.drive(v, dt);
    }
    // parked and abandoned cars far away get cleaned up
    for (const v of [...g.vehicles]) {
      if (v.driverKind === null && !v.keep) {
        const far = Math.abs(v.pos.x - ppos.x) + Math.abs(v.pos.z - ppos.z);
        if (far > 420) g.removeVehicle(v);
      }
    }
    if (aiCount < this.target) this.spawn(ppos, 70, 260);
  }

  drive(v, dt, depth = 0) {
    const g = this.game;
    const ai = v.ai;
    const roads = this.roads;
    const lane = roads.lanePoint(ai.a, ai.b, 0);
    const L = lane.len;
    const rx = v.pos.x - lane.x;
    const rz = v.pos.z - lane.z;
    const s = rx * lane.fx + rz * lane.fz;
    if (!ai.next) ai.next = this.chooseNext(ai.a, ai.b);
    const distToB = Math.hypot(v.pos.x - ai.b.x, v.pos.z - ai.b.z);
    if (depth < 3 && (s > L - 2 || distToB < ROAD_HALF - 1)) {
      ai.a = ai.b;
      ai.b = ai.next;
      ai.next = this.chooseNext(ai.a, ai.b);
      return this.drive(v, dt, depth + 1);
    }
    const speed = v.speed;
    const look = s + 6 + Math.max(0, speed) * 0.45;
    let tx;
    let tz;
    if (look <= L - LANE_OFFSET) {
      const p = roads.lanePoint(ai.a, ai.b, look / L);
      tx = p.x;
      tz = p.z;
    } else {
      const n = roads.lanePoint(ai.b, ai.next, 0);
      const over = look - (L - LANE_OFFSET);
      const p = roads.lanePoint(ai.b, ai.next, Math.min(1, (over + LANE_OFFSET) / n.len));
      tx = p.x;
      tz = p.z;
    }
    // slow for turns
    let targetSpeed = ai.cruise;
    const nextDir = roads.lanePoint(ai.b, ai.next, 0);
    const turning = Math.abs(nextDir.fx * lane.fx + nextDir.fz * lane.fz) < 0.5;
    const uturn = nextDir.fx * lane.fx + nextDir.fz * lane.fz < -0.5;
    if ((turning || uturn) && L - s < 22) targetSpeed = uturn ? 3.5 : 6.5;

    // brake for whatever is in front
    const fx = Math.sin(v.heading);
    const fz = Math.cos(v.heading);
    const brakeDist = 5 + Math.max(0, speed) * 1.1;
    const check = (ox, oz, half) => {
      const dx = ox - v.pos.x;
      const dz = oz - v.pos.z;
      const ahead = dx * fx + dz * fz;
      if (ahead <= 0 || ahead > brakeDist + half) return;
      const lat = Math.abs(dx * -fz + dz * fx);
      if (lat > 2.4) return;
      const gap = ahead - half - v.spec.len / 2;
      targetSpeed = Math.min(targetSpeed, Math.max(0, gap - 1.5) * 0.9);
      return true;
    };
    for (const o of g.vehicles) {
      if (o === v) continue;
      if (Math.abs(o.pos.x - v.pos.x) + Math.abs(o.pos.z - v.pos.z) > 30) continue;
      if (check(o.pos.x, o.pos.z, o.spec.len / 2) && o.driverKind === 'player') ai.honk += dt;
    }
    if (!g.player.vehicle) {
      if (check(g.player.pos.x, g.player.pos.z, 0.4)) ai.honk += dt;
    }
    for (const p of g.peds.list) {
      if (p.state === 'down') continue;
      if (Math.abs(p.pos.x - v.pos.x) + Math.abs(p.pos.z - v.pos.z) > 20) continue;
      check(p.pos.x, p.pos.z, 0.3);
    }
    if (ai.honk > 1.2) {
      ai.honk = -3;
      g.audio.horn(v.pos, 0.35);
    }

    const want = Math.atan2(tx - v.pos.x, tz - v.pos.z);
    const diff = wrapAngle(want - v.heading);
    let steer = clamp(-diff * 2.2, -1, 1);
    let throttle = clamp((targetSpeed - speed) * 0.45, -1, 1);

    // unstick by reversing
    if (ai.reverse > 0) {
      ai.reverse -= dt;
      throttle = -0.8;
      steer = -steer;
    } else if (throttle > 0.3 && Math.abs(speed) < 0.6) {
      ai.stuck += dt;
      if (ai.stuck > 2.5) {
        ai.stuck = 0;
        ai.reverse = 1.4;
      }
    } else {
      ai.stuck = Math.max(0, ai.stuck - dt);
    }
    v.update(dt, { throttle, steer, handbrake: false }, g.collision, g.events);
  }
}
