import * as THREE from 'three';
import { createHuman, SKIN_TONES } from './character.js';
import { PEOPLE_MODELS } from './assets.js';
import { ROAD_HALF, SIDEWALK } from './config.js';
import { onLand } from './collision.js';
import { pick } from './utils.js';

const SIDE_OFFSET = ROAD_HALF + SIDEWALK / 2;

// Pedestrians wander the sidewalks, cross streets, flee from danger and can be knocked down.
export class Peds {
  constructor(scene, roads, collision, count = 45) {
    this.scene = scene;
    this.roads = roads;
    this.collision = collision;
    this.list = [];
    for (let i = 0; i < count; i++) this.spawn();
  }

  spawn(near) {
    const h = createHuman({
      model: pick(Math.random, PEOPLE_MODELS),
      skin: pick(Math.random, SKIN_TONES),
      shirtHue: Math.floor(Math.random() * 6) / 6,
      scale: 0.92 + Math.random() * 0.14,
    });
    this.scene.add(h.group);
    const p = { human: h, state: 'walk', timer: 0, speed: 1.2 + Math.random() * 0.6, pos: new THREE.Vector3(), heading: 0 };
    this.place(p, near);
    this.list.push(p);
    return p;
  }

  place(p, near) {
    const nodes = this.roads.nodes;
    let a;
    for (let tries = 0; tries < 30; tries++) {
      a = nodes[Math.floor(Math.random() * nodes.length)];
      if (!near) break;
      const d = Math.hypot(a.x - near.x, a.z - near.z);
      if (d > 60 && d < 180) break;
    }
    const nb = a.adj[Math.floor(Math.random() * a.adj.length)];
    p.a = a;
    p.b = nb.node;
    p.side = Math.random() < 0.5 ? 1 : -1;
    p.t = Math.random();
    p.state = 'walk';
    p.human.resetPose();
    const pt = this.sidePoint(p, p.t);
    p.pos.set(pt.x, 0, pt.z);
    if (!onLand(pt.x, pt.z, 0.5)) {
      // sidewalk over water (bridge): keep them on the deck instead
      p.side *= 0.3;
    }
  }

  sidePoint(p, t) {
    const pt = this.roads.lanePoint(p.a, p.b, t, SIDE_OFFSET * p.side);
    return pt;
  }

  // threat: {x, z} that makes nearby peds run
  scare(x, z, radius = 18) {
    for (const p of this.list) {
      if (p.state === 'down') continue;
      if (Math.hypot(p.pos.x - x, p.pos.z - z) < radius) {
        p.state = 'flee';
        p.timer = 4 + Math.random() * 3;
        p.fleeFrom = { x, z };
      }
    }
  }

  knockDown(p, dirX, dirZ, force) {
    if (p.state === 'down') return false;
    p.state = 'down';
    p.timer = 14;
    p.fling = { x: dirX * force, z: dirZ * force, y: Math.min(6, force * 0.4) };
    p.y = 0;
    return true;
  }

  update(dt, playerPos) {
    for (const p of this.list) {
      const h = p.human;
      if (p.state === 'down') {
        p.timer -= dt;
        if (p.fling) {
          p.pos.x += p.fling.x * dt;
          p.pos.z += p.fling.z * dt;
          p.y += p.fling.y * dt;
          p.fling.y -= 20 * dt;
          p.fling.x *= Math.exp(-3 * dt);
          p.fling.z *= Math.exp(-3 * dt);
          if (p.y <= 0) {
            p.y = 0;
            p.fling = null;
          }
          this.collision.resolveCircle(p.pos, 0.4, 0.5);
        }
        h.downPose();
        h.group.position.set(p.pos.x, p.y || 0, p.pos.z);
        if (p.timer <= 0) this.place(p, playerPos);
        continue;
      }
      let speed = p.speed;
      let tx;
      let tz;
      if (p.state === 'flee') {
        p.timer -= dt;
        speed = 4.5;
        const dx = p.pos.x - p.fleeFrom.x;
        const dz = p.pos.z - p.fleeFrom.z;
        const d = Math.hypot(dx, dz) || 1;
        tx = p.pos.x + (dx / d) * 5;
        tz = p.pos.z + (dz / d) * 5;
        if (p.timer <= 0) {
          p.state = 'walk';
          // rejoin the nearest sidewalk
          const n = this.roads.nearestNode(p.pos.x, p.pos.z);
          p.a = n;
          p.b = n.adj[Math.floor(Math.random() * n.adj.length)].node;
          p.t = 0;
        }
      } else if (p.state === 'idle') {
        p.timer -= dt;
        speed = 0;
        if (p.timer <= 0) p.state = 'walk';
        tx = p.pos.x;
        tz = p.pos.z;
      } else {
        const len = Math.hypot(p.b.x - p.a.x, p.b.z - p.a.z) || 1;
        const target = this.sidePoint(p, p.t);
        const dx = target.x - p.pos.x;
        const dz = target.z - p.pos.z;
        if (dx * dx + dz * dz < 1.5) {
          p.t += (speed * 1.5) / len;
          if (p.t >= 0.97) {
            const opts = p.b.adj.filter((o) => o.node !== p.a);
            const next = opts.length ? opts[Math.floor(Math.random() * opts.length)] : p.b.adj[0];
            p.a = p.b;
            p.b = next.node;
            p.t = 0.03;
            if (Math.random() < 0.15) {
              p.state = 'idle';
              p.timer = 2 + Math.random() * 5;
            }
          }
        }
        tx = target.x;
        tz = target.z;
      }
      const dx = tx - p.pos.x;
      const dz = tz - p.pos.z;
      const d = Math.hypot(dx, dz);
      let moving = 0;
      if (d > 0.05 && speed > 0) {
        const step = Math.min(d, speed * dt);
        const nx = p.pos.x + (dx / d) * step;
        const nz = p.pos.z + (dz / d) * step;
        if (onLand(nx, nz, 0.5)) {
          p.pos.x = nx;
          p.pos.z = nz;
        }
        this.collision.resolveCircle(p.pos, 0.35, 0.5);
        const want = Math.atan2(dx, dz);
        let diff = want - p.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.heading += diff * Math.min(1, dt * 8);
        moving = speed;
      }
      h.animate(dt, moving);
      h.group.position.set(p.pos.x, 0, p.pos.z);
      h.group.rotation.y = p.heading;
      // recycle peds that wandered far from the player
      if (playerPos && Math.abs(p.pos.x - playerPos.x) + Math.abs(p.pos.z - playerPos.z) > 320) this.place(p, playerPos);
    }
  }
}
