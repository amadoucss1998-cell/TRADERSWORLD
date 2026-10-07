import * as THREE from 'three';
import { Vehicle } from './vehicles.js';
import { clamp, wrapAngle } from './utils.js';

const STAR_HEAT = [1, 70, 160, 300, 480];
const COPS_FOR_STARS = [0, 2, 3, 4, 5, 7];

// Wanted level, chasing police cruisers and a helicopter at high heat.
export class Police {
  constructor(game) {
    this.game = game;
    this.heat = 0;
    this.evade = 0;
    this.bust = 0;
    this.cops = [];
    this.spawnCooldown = 0;
    this.heli = this.makeHeli();
    game.scene.add(this.heli.group);
  }

  get stars() {
    let s = 0;
    for (const h of STAR_HEAT) if (this.heat >= h) s++;
    return s;
  }

  get evading() {
    return this.stars > 0 && this.evade > 1;
  }

  addHeat(n, minStars = 1) {
    const before = this.stars;
    this.heat = Math.min(700, this.heat + n);
    if (this.stars < minStars) this.heat = Math.max(this.heat, STAR_HEAT[minStars - 1]);
    this.evade = 0;
    if (this.stars > before) this.game.hud.flashStars();
  }

  setStars(n) {
    this.heat = n > 0 ? STAR_HEAT[n - 1] + 5 : 0;
    this.evade = 0;
  }

  clear() {
    this.heat = 0;
    this.evade = 0;
    this.bust = 0;
    for (const c of this.cops) {
      c.sirenOn = false;
      c.chase = false;
    }
  }

  makeHeli() {
    const group = new THREE.Group();
    const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), m(0x0a2463));
    body.scale.set(1, 0.9, 1.6);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 6), m(0x0a2463));
    tail.position.z = -4.5;
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 0.4), m(0x222222));
    rotor.position.y = 1.7;
    const rotor2 = rotor.clone();
    rotor2.rotation.y = Math.PI / 2;
    const rotors = new THREE.Group();
    rotors.add(rotor, rotor2);
    const skid = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 3), m(0x333333));
    skid.position.y = -1.6;
    group.add(body, tail, rotors, skid);
    const light = new THREE.SpotLight(0xffffff, 0, 120, 0.22, 0.4, 1);
    light.position.set(0, -1, 1);
    group.add(light, light.target);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(7, 45, 16, 1, true).translate(0, -22.5, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.08, depthWrite: false }),
    );
    group.add(beam);
    group.visible = false;
    group.position.set(0, 60, 0);
    return { group, rotors, light, beam, angle: 0 };
  }

  spawnCop(near) {
    const t = this.game.traffic.findSpawnEdge(near, 110, 190);
    if (!t) return null;
    const v = new Vehicle('police', t.p.x, t.p.z, Math.atan2(t.p.fx, t.p.fz));
    v.driverKind = 'police';
    v.driver.visible = true;
    v.chase = true;
    v.sirenOn = true;
    v.cop = { path: [], repath: 0, stuck: 0, reverse: 0 };
    this.cops.push(v);
    this.game.addVehicle(v);
    return v;
  }

  removeCop(v) {
    this.cops = this.cops.filter((c) => c !== v);
    this.game.removeVehicle(v);
  }

  update(dt) {
    const g = this.game;
    const player = g.player;
    const target = player.vehicle ? player.vehicle.pos : player.pos;
    const stars = this.stars;
    this.cops = this.cops.filter((c) => g.vehicles.includes(c) && c.driverKind === 'police');

    // spawn or retire cruisers
    const want = COPS_FOR_STARS[stars];
    const active = this.cops.filter((c) => !c.destroyed);
    this.spawnCooldown -= dt;
    if (active.length < want && this.spawnCooldown <= 0) {
      this.spawnCop(target);
      this.spawnCooldown = 2.5;
    }
    let nearest = Infinity;
    for (const c of [...this.cops]) {
      const d = Math.hypot(c.pos.x - target.x, c.pos.z - target.z);
      if (stars === 0) {
        c.sirenOn = false;
        if (d > 110 || c.destroyed) this.removeCop(c);
        else c.update(dt, { throttle: 0, steer: 0, handbrake: true }, g.collision, g.events);
        continue;
      }
      if (c.destroyed) {
        c.update(dt, {}, g.collision, g.events);
        if (d > 150) this.removeCop(c);
        continue;
      }
      if (d > 420) {
        this.removeCop(c);
        continue;
      }
      nearest = Math.min(nearest, d);
      this.chase(c, dt, target, d);
    }

    // escaping: stay out of sight to cool down
    if (stars > 0) {
      if (nearest > 95) {
        this.evade += dt;
        if (this.evade > 7) this.heat = Math.max(0, this.heat - 28 * dt);
      } else {
        this.evade = 0;
      }
      // busted: police right next to a slow or on-foot player
      const slow = player.vehicle ? Math.abs(player.vehicle.speed) < 1.5 : true;
      const close = player.vehicle ? 7 : 5;
      if (nearest < close && slow) this.bust += dt;
      else this.bust = Math.max(0, this.bust - dt * 2);
      if (this.bust > (player.vehicle ? 3 : 1.8)) {
        this.bust = 0;
        g.busted();
      }
    } else {
      this.bust = 0;
    }

    // helicopter at 3+ stars
    const h = this.heli;
    const heliOn = stars >= 3;
    h.group.visible = heliOn || h.group.position.y < 58;
    if (heliOn) {
      h.angle += dt * 0.35;
      const tx = target.x + Math.cos(h.angle) * 25;
      const tz = target.z + Math.sin(h.angle) * 25;
      const p = h.group.position;
      p.x += (tx - p.x) * Math.min(1, dt * 0.8);
      p.z += (tz - p.z) * Math.min(1, dt * 0.8);
      p.y += (42 - p.y) * Math.min(1, dt * 0.5);
      h.group.lookAt(target.x, p.y, target.z);
      h.light.target.position.set(0, -40, 8);
      h.light.intensity = g.sky.night > 0.3 ? 400 : 0;
      h.beam.visible = g.sky.night > 0.3;
      h.beam.lookAt(target.x, 0, target.z);
      h.beam.rotateX(-Math.PI / 2);
    } else if (h.group.visible) {
      h.group.position.y += dt * 15;
      if (h.group.position.y > 120) {
        h.group.visible = false;
        h.group.position.y = 120;
      }
    } else {
      h.group.position.set(target.x + 200, 120, target.z);
    }
    h.rotors.rotation.y += dt * 30;
  }

  chase(c, dt, target, d) {
    const g = this.game;
    const roads = g.roads;
    const cop = c.cop;
    let tx = target.x;
    let tz = target.z;
    const pv = g.player.vehicle;
    if (d > 40) {
      cop.repath -= dt;
      if (cop.repath <= 0 || !cop.path.length) {
        cop.repath = 1.5;
        const a = roads.nearestNode(c.pos.x, c.pos.z);
        const b = roads.nearestNode(target.x, target.z);
        cop.path = roads.path(a, b) || [];
        // skip the first node if we are already past it
        if (cop.path.length > 1) {
          const n0 = cop.path[0];
          const n1 = cop.path[1];
          const toN0 = (n0.x - c.pos.x) * (n1.x - n0.x) + (n0.z - c.pos.z) * (n1.z - n0.z);
          if (toN0 < 0) cop.path.shift();
        }
      }
      while (cop.path.length && Math.hypot(cop.path[0].x - c.pos.x, cop.path[0].z - c.pos.z) < 9) cop.path.shift();
      if (cop.path.length) {
        tx = cop.path[0].x;
        tz = cop.path[0].z;
      }
    } else if (pv) {
      tx += pv.vx * 0.4;
      tz += pv.vz * 0.4;
    }
    const want = Math.atan2(tx - c.pos.x, tz - c.pos.z);
    const diff = wrapAngle(want - c.heading);
    let steer = clamp(-diff * 2.5, -1, 1);
    let throttle = 1;
    if (Math.abs(diff) > 0.9 && c.speed > 14) throttle = -0.6;
    if (!pv && d < 9) throttle = clamp((d - 5) * 0.2, -1, 0.4) - (c.speed > 4 ? 0.6 : 0);
    if (Math.abs(diff) > 2.2 && d < 25) {
      // target is behind us: back up while turning
      throttle = -0.7;
      steer = -steer;
    }
    if (cop.reverse > 0) {
      cop.reverse -= dt;
      throttle = -1;
      steer = -steer;
    } else if (throttle > 0.3 && Math.abs(c.speed) < 0.8) {
      cop.stuck += dt;
      if (cop.stuck > 1.6) {
        cop.stuck = 0;
        cop.reverse = 1.2;
      }
    } else {
      cop.stuck = Math.max(0, cop.stuck - dt);
    }
    c.sirenOn = true;
    c.update(dt, { throttle, steer, handbrake: Math.abs(diff) > 1.2 && c.speed > 10 }, g.collision, g.events);
  }
}
