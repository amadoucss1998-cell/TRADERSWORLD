import * as THREE from 'three';

const RANGE = 110;
const STEP = 0.5;

// Pistol, bullets, tracers and police gunfire.
export class Combat {
  constructor(game) {
    this.game = game;
    this.weapon = 'fists';
    this.ammo = 36;
    this.cooldown = 0;
    this.copFire = 0;
    this.tracers = [];
    this.tracerMat = new THREE.LineBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.9 });
  }

  get armed() {
    return this.weapon === 'pistol' && !this.game.player.vehicle && !this.game.dead;
  }

  select(w) {
    if (w === 'pistol' && this.ammo <= 0) {
      this.game.hud.toast('No pistol ammo. Find an ammo crate.', 'bad');
      return;
    }
    this.weapon = w;
  }

  toggle() {
    this.select(this.weapon === 'pistol' ? 'fists' : 'pistol');
  }

  addAmmo(n) {
    this.ammo += n;
  }

  tracer(from, to) {
    const g = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(g, this.tracerMat);
    this.game.scene.add(line);
    this.tracers.push({ line, life: 0.06 });
  }

  // Walks a ray through the world; returns what it hits first.
  cast(origin, dir, ignore = null) {
    const g = this.game;
    const p = new THREE.Vector3();
    for (let t = 1; t < RANGE; t += STEP) {
      p.copy(origin).addScaledVector(dir, t);
      if (p.y < 0.02) return { kind: 'ground', point: p.clone() };
      if (g.collision.pointInside(p.x, p.y, p.z)) return { kind: 'wall', point: p.clone() };
      for (const q of g.peds.list) {
        if (q.state === 'down') continue;
        const dx = q.pos.x - p.x;
        const dz = q.pos.z - p.z;
        if (dx * dx + dz * dz < 0.22 && p.y < 1.95) return { kind: 'ped', ped: q, point: p.clone() };
      }
      for (const v of g.vehicles) {
        if (v === ignore || p.y > v.spec.h + 0.2) continue;
        if (Math.abs(v.pos.x - p.x) > 4 || Math.abs(v.pos.z - p.z) > 4) continue;
        // the car body is a capsule between its front and rear circles
        const [c0, c1] = v.circles();
        const sx = c1.x - c0.x;
        const sz = c1.z - c0.z;
        const k = Math.max(0, Math.min(1, ((p.x - c0.x) * sx + (p.z - c0.z) * sz) / (sx * sx + sz * sz || 1)));
        const qx = c0.x + sx * k - p.x;
        const qz = c0.z + sz * k - p.z;
        if (qx * qx + qz * qz < v.radius * v.radius) return { kind: 'vehicle', vehicle: v, point: p.clone() };
      }
    }
    return { kind: 'none', point: p.clone() };
  }

  fire() {
    const g = this.game;
    if (!this.armed || this.cooldown > 0) return;
    if (this.ammo <= 0) {
      g.audio.tone(900, 0.04, 'square', 0.05);
      this.weapon = 'fists';
      g.hud.toast('Out of ammo', 'bad');
      return;
    }
    this.ammo--;
    this.cooldown = 0.28;
    const cam = g.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    // start the ray at the player's shoulder so it can't hit things behind the player
    const shoulder = new THREE.Vector3(g.player.pos.x, g.player.y + 1.45, g.player.pos.z);
    const camToShoulder = shoulder.clone().sub(cam.position).dot(dir);
    const origin = cam.position.clone().addScaledVector(dir, Math.max(0, camToShoulder));
    const hit = this.cast(origin, dir);
    const muzzle = new THREE.Vector3(Math.sin(g.player.heading), 0, Math.cos(g.player.heading)).multiplyScalar(0.7).add(shoulder);
    this.tracer(muzzle, hit.point);
    g.particles.sparks(muzzle.x, muzzle.y, muzzle.z);
    g.audio.gunshot();
    g.cam.shake = Math.max(g.cam.shake, 0.15);
    g.peds.scare(g.player.pos.x, g.player.pos.z, 35);
    const copsNear = g.copsNear(70);
    if (hit.kind === 'ped') {
      g.peds.knockDown(hit.ped, dir.x, dir.z, 5);
      g.police.addHeat(copsNear ? 110 : 55);
      if (Math.random() < 0.7) g.pickups.dropCash(hit.ped.pos.x, hit.ped.pos.z, 15 + Math.floor(Math.random() * 60));
    } else if (hit.kind === 'vehicle') {
      const v = hit.vehicle;
      v.health -= 12;
      g.particles.sparks(hit.point.x, hit.point.y, hit.point.z);
      g.audio.tone(1800, 0.05, 'square', 0.04);
      if (v.type === 'police') g.police.addHeat(60);
      else if (copsNear) g.police.addHeat(30);
      if (v.driverKind === 'ai' && v.ai) v.ai.cruise = 18; // the driver floors it
    } else if (hit.kind === 'wall' || hit.kind === 'ground') {
      g.particles.dust(hit.point.x, hit.point.z);
      if (copsNear) g.police.addHeat(20);
    }
  }

  update(dt) {
    const g = this.game;
    this.cooldown -= dt;
    for (const t of this.tracers) {
      t.life -= dt;
      if (t.life <= 0) {
        g.scene.remove(t.line);
        t.line.geometry.dispose();
      }
    }
    this.tracers = this.tracers.filter((t) => t.life > 0);
    g.player.human.aiming = this.armed;

    // police open fire from 2 stars when they can see you
    if (g.police.stars < 2 || g.dead) return;
    this.copFire -= dt;
    if (this.copFire > 0) return;
    this.copFire = 2.2 - Math.min(1, g.police.stars * 0.2);
    const target = g.playerPos;
    let shooter = null;
    let best = 38;
    for (const c of g.police.cops) {
      if (c.destroyed) continue;
      const d = Math.hypot(c.pos.x - target.x, c.pos.z - target.z);
      if (d < best) {
        best = d;
        shooter = c;
      }
    }
    if (!shooter) return;
    const from = new THREE.Vector3(shooter.pos.x, 1.4, shooter.pos.z);
    const to = new THREE.Vector3(target.x, 1.1, target.z);
    const dir = to.clone().sub(from).normalize();
    const hit = this.cast(from, dir, shooter);
    const reached = hit.kind === 'none' || hit.point.distanceTo(from) >= best - 2.5 || (g.player.vehicle && hit.vehicle === g.player.vehicle);
    this.tracer(from, reached ? to : hit.point);
    g.audio.gunshot(from, 0.7);
    if (!reached) return;
    const chance = 0.32 - best / 110;
    if (Math.random() > chance) return;
    if (g.player.vehicle) {
      g.player.vehicle.health -= 5;
      g.hurt(1.5);
    } else {
      g.hurt(4 + Math.random() * 4);
    }
  }
}
