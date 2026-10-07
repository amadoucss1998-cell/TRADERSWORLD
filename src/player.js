import * as THREE from 'three';
import { createHuman } from './character.js';
import { onLand } from './collision.js';
import { dampAngle } from './utils.js';

export class Player {
  constructor(scene) {
    this.human = createHuman({ model: 'survivor-male', skin: 0x7a4a2c });
    scene.add(this.human.group);
    this.pos = new THREE.Vector3();
    this.vy = 0;
    this.y = 0;
    this.kx = 0;
    this.kz = 0;
    this.heading = 0;
    this.health = 100;
    this.vehicle = null;
    this.moveSpeed = 0;
    this.punchCooldown = 0;
    this.pendingPunch = -1;
  }

  setPosition(x, z, heading = this.heading) {
    this.pos.set(x, 0, z);
    this.y = 0;
    this.vy = 0;
    this.heading = heading;
    this.sync();
  }

  sync() {
    this.human.group.position.set(this.pos.x, this.y, this.pos.z);
    this.human.group.rotation.y = this.heading;
  }

  // move: {x, y} in -1..1 relative to the camera; returns punch target time when punching
  updateOnFoot(dt, move, camYaw, sprint, jump, collision) {
    const fx = Math.sin(camYaw);
    const fz = Math.cos(camYaw);
    const rx = -fz;
    const rz = fx;
    let mx = fx * move.y + rx * move.x;
    let mz = fz * move.y + rz * move.x;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const speed = (sprint ? 8.2 : 4.4) * Math.min(1, len);
    this.moveSpeed += (speed - this.moveSpeed) * Math.min(1, dt * 10);
    if (len > 0.1) this.heading = dampAngle(this.heading, Math.atan2(mx, mz), 12, dt);
    const dirx = len > 0.1 ? mx / Math.max(len, 1e-6) * Math.min(1, len) : 0;
    const dirz = len > 0.1 ? mz / Math.max(len, 1e-6) * Math.min(1, len) : 0;
    let nx = this.pos.x + (dirx * this.moveSpeed + this.kx) * dt;
    let nz = this.pos.z + (dirz * this.moveSpeed + this.kz) * dt;
    this.kx *= Math.exp(-4 * dt);
    this.kz *= Math.exp(-4 * dt);
    if (!onLand(nx, this.pos.z, 0.3)) nx = this.pos.x;
    if (!onLand(nx, nz, 0.3)) nz = this.pos.z;
    this.pos.x = nx;
    this.pos.z = nz;
    // jumping and landing on low objects
    const ground = collision.heightAt(this.pos.x, this.pos.z);
    const floor = ground < 1.3 ? ground : 0;
    if (jump && this.y <= floor + 0.01) this.vy = 6.5;
    this.vy -= 20 * dt;
    this.y += this.vy * dt;
    if (this.y < floor) {
      this.y = floor;
      this.vy = 0;
    }
    collision.resolveCircle(this.pos, 0.38, this.y + 0.05);
    this.punchCooldown -= dt;
    this.human.animate(dt, len > 0.1 ? this.moveSpeed : 0, this.y > floor + 0.05);
    this.sync();
  }

  punch() {
    if (this.punchCooldown > 0) return false;
    this.punchCooldown = 0.45;
    this.human.punch = 0.3;
    return true;
  }
}
