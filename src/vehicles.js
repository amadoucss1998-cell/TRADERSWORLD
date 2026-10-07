import * as THREE from 'three';
import { onLand } from './collision.js';
import { clamp, pick, MeshBuilder, makeMatrix } from './utils.js';
import { makeSignTexture } from './textures.js';

export const VEHICLE_TYPES = {
  taxi: { name: 'Yellow Taxi', len: 4.4, wid: 1.85, h: 1.45, maxSpeed: 38, accel: 14, mass: 1, colors: [0xf6c90e], body: 'sedan' },
  sedan: { name: 'Corolla', len: 4.5, wid: 1.85, h: 1.45, maxSpeed: 40, accel: 14, mass: 1, colors: [0xb8c0c8, 0x1d3557, 0x7f0000, 0x2f3e46, 0xf1faee, 0x588157, 0x9d0208], body: 'sedan' },
  suv: { name: 'Land Cruiser', len: 4.9, wid: 2.05, h: 1.95, maxSpeed: 38, accel: 13, mass: 1.4, colors: [0xffffff, 0x111111, 0x6c757d, 0x264653, 0xe9e5dc], body: 'suv' },
  pickup: { name: 'Hilux Pickup', len: 5.2, wid: 2.0, h: 1.8, maxSpeed: 37, accel: 13, mass: 1.3, colors: [0xc1121f, 0xffffff, 0x1d3557, 0x606c38], body: 'pickup' },
  bus: { name: 'Money Bus', len: 5.8, wid: 2.1, h: 2.4, maxSpeed: 29, accel: 8, mass: 2, colors: [0xf6c90e, 0xffffff, 0x8ecae6], body: 'bus' },
  keke: { name: 'Keke', len: 2.9, wid: 1.4, h: 1.85, maxSpeed: 21, accel: 10, mass: 0.6, colors: [0xf6c90e], body: 'keke' },
  police: { name: 'LNP Cruiser', len: 4.7, wid: 1.9, h: 1.55, maxSpeed: 46, accel: 18, mass: 1.2, colors: [0xffffff], body: 'police' },
  sports: { name: 'Fine Boy GT', len: 4.4, wid: 1.95, h: 1.2, maxSpeed: 58, accel: 24, mass: 1, colors: [0xff5400, 0xd00000, 0x00b4d8, 0x111111], body: 'sports' },
};

const WHEEL_R = 0.36;
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoWheel = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.26, 12).rotateZ(Math.PI / 2);
const matCache = new Map();
const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.3, ...opts });
    m.userData.mergeable = true;
    matCache.set(key, m);
  }
  return m;
};
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1b2631, roughness: 0.1, metalness: 0.6 });
glassMat.userData.mergeable = true;
const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff6d5 });
const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
// merged car bodies use vertex colours; lights are unlit and brightened at night
const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.3 });
export const lightsMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const wheelGeo = (() => {
  const b = new MeshBuilder();
  b.addGeometry(geoWheel, new THREE.Matrix4(), 0x151515);
  b.addGeometry(geoBox, makeMatrix(0, 0, 0, 0, 0, 0, 0.28, 0.32, 0.08), 0xb0b0b0);
  return b.build();
})();
const wheelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
const charredMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
const sirenRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0 });
const sirenBlue = new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x0044ff, emissiveIntensity: 0 });
const driverGeo = (() => {
  const b = new MeshBuilder();
  b.addGeometry(geoBox, makeMatrix(0, 0.3, 0, 0, 0, 0, 0.45, 0.55, 0.3), 0x3a86ff);
  b.addGeometry(geoBox, makeMatrix(0, 0.75, 0, 0, 0, 0, 0.26, 0.28, 0.26), 0x4a2c1d);
  return b.build();
})();
const driverMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
let taxiSignMat;
let policeTextMat;

function part(group, geo, material, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  group.add(m);
  return m;
}

// Folds every static painted part into one vertex-coloured mesh, and all lamps into another.
function mergeParts(body) {
  const paintB = new MeshBuilder();
  const lightB = new MeshBuilder();
  for (const m of [...body.children]) {
    if (!m.isMesh) continue;
    const lamp = m.material === headlightMat || m.material === taillightMat;
    if (!lamp && !m.material.userData.mergeable) continue;
    m.updateMatrix();
    (lamp ? lightB : paintB).addGeometry(m.geometry, m.matrix, m.material.color);
    body.remove(m);
  }
  const paint = new THREE.Mesh(paintB.build(), bodyMat);
  paint.castShadow = true;
  body.add(paint);
  if (lightB.vertexCount) body.add(new THREE.Mesh(lightB.build(), lightsMat));
}

function buildMesh(type, color) {
  const s = VEHICLE_TYPES[type];
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const paint = mat(color);
  const L = s.len;
  const W = s.wid;
  const H = s.h;
  const base = WHEEL_R * 0.9;
  const wheels = [];
  const front = [];
  const addWheel = (x, z, isFront) => {
    const w = new THREE.Group();
    w.position.set(x, WHEEL_R, z);
    const tyre = new THREE.Mesh(wheelGeo, wheelMat);
    tyre.castShadow = true;
    w.add(tyre);
    g.add(w);
    wheels.push(tyre);
    if (isFront) front.push(w);
  };

  if (s.body === 'keke') {
    part(body, geoBox, paint, 0, base + 0.45, -0.2, W, 0.5, L * 0.75);
    part(body, geoBox, mat(0x111111), 0, base + 1.65, -0.15, W + 0.05, 0.08, L * 0.85); // canopy
    for (const [x, z] of [[-W / 2, 0.9], [W / 2, 0.9], [-W / 2, -1.2], [W / 2, -1.2]]) part(body, geoBox, mat(0x222222), x, base + 1.1, z, 0.06, 1.1, 0.06);
    part(body, geoBox, glassMat, 0, base + 1.15, 1.0, W * 0.8, 0.6, 0.05);
    part(body, geoBox, paint, 0, base + 0.55, 1.05, 0.5, 0.6, 0.6);
    part(body, geoBox, headlightMat, 0, base + 0.7, L / 2 - 0.05, 0.25, 0.18, 0.08);
    part(body, geoBox, taillightMat, -W / 2 + 0.15, base + 0.55, -L / 2 + 0.25, 0.2, 0.12, 0.05);
    part(body, geoBox, taillightMat, W / 2 - 0.15, base + 0.55, -L / 2 + 0.25, 0.2, 0.12, 0.05);
    addWheel(0, L / 2 - 0.35, true);
    addWheel(-W / 2 + 0.1, -L / 2 + 0.5, false);
    addWheel(W / 2 - 0.1, -L / 2 + 0.5, false);
  } else {
    const lowerH = s.body === 'bus' ? H * 0.5 : s.body === 'sports' ? H * 0.42 : H * 0.42;
    part(body, geoBox, paint, 0, base + lowerH / 2 + 0.1, 0, W, lowerH, L);
    let cabLen = L * 0.48;
    let cabZ = -L * 0.05;
    let cabH = H - lowerH - 0.15;
    if (s.body === 'suv') { cabLen = L * 0.68; cabZ = -L * 0.1; }
    if (s.body === 'pickup') { cabLen = L * 0.32; cabZ = L * 0.08; }
    if (s.body === 'bus') { cabLen = L * 0.9; cabZ = -L * 0.03; }
    if (s.body === 'sports') { cabLen = L * 0.38; cabZ = -L * 0.08; cabH = H - lowerH - 0.05; }
    const cabY = base + lowerH + 0.1 + cabH / 2;
    part(body, geoBox, glassMat, 0, cabY, cabZ, W * 0.88, cabH, cabLen);
    part(body, geoBox, paint, 0, cabY + cabH / 2 + 0.04, cabZ, W * 0.9, 0.08, cabLen * 0.96); // roof
    // pillars so the cabin reads as painted metal with windows
    part(body, geoBox, paint, 0, cabY, cabZ - cabLen / 2 + 0.05, W * 0.9, cabH, 0.1);
    if (s.body === 'bus') {
      for (let z = -L / 2 + 1; z < L / 2 - 0.5; z += 1.1) part(body, geoBox, paint, 0, cabY, cabZ + z * 0.9, W * 0.9, cabH, 0.12);
      part(body, geoBox, mat(0x2a9d8f), 0, base + lowerH * 0.6, 0, W + 0.02, 0.18, L * 0.98);
      part(body, geoBox, mat(0x333333), 0, cabY + cabH / 2 + 0.25, -0.3, W * 0.7, 0.3, L * 0.5); // luggage rack
    }
    if (s.body === 'pickup') {
      const bedZ = -L * 0.22;
      for (const x of [-W / 2 + 0.06, W / 2 - 0.06]) part(body, geoBox, paint, x, base + lowerH + 0.35, bedZ, 0.1, 0.5, L * 0.48);
      part(body, geoBox, paint, 0, base + lowerH + 0.35, bedZ - L * 0.24, W, 0.5, 0.1);
    }
    if (s.body === 'sports') {
      part(body, geoBox, mat(0x111111), 0, base + lowerH + 0.35, -L / 2 + 0.2, W * 0.9, 0.06, 0.4); // spoiler
      part(body, geoBox, mat(0x111111), -W * 0.35, base + lowerH + 0.17, -L / 2 + 0.2, 0.06, 0.3, 0.1);
      part(body, geoBox, mat(0x111111), W * 0.35, base + lowerH + 0.17, -L / 2 + 0.2, 0.06, 0.3, 0.1);
    }
    // lights
    const ly = base + lowerH * 0.7 + 0.1;
    part(body, geoBox, headlightMat, -W / 2 + 0.3, ly, L / 2 + 0.01, 0.35, 0.16, 0.05);
    part(body, geoBox, headlightMat, W / 2 - 0.3, ly, L / 2 + 0.01, 0.35, 0.16, 0.05);
    part(body, geoBox, taillightMat, -W / 2 + 0.25, ly, -L / 2 - 0.01, 0.3, 0.14, 0.05);
    part(body, geoBox, taillightMat, W / 2 - 0.25, ly, -L / 2 - 0.01, 0.3, 0.14, 0.05);
    part(body, geoBox, mat(0x222222), 0, base + 0.25, L / 2 + 0.03, W * 0.95, 0.22, 0.08); // bumpers
    part(body, geoBox, mat(0x222222), 0, base + 0.25, -L / 2 - 0.03, W * 0.95, 0.22, 0.08);
    const roofTop = cabY + cabH / 2 + 0.08;
    if (type === 'taxi') {
      if (!taxiSignMat) taxiSignMat = new THREE.MeshStandardMaterial({ map: makeSignTexture('TAXI', { bg: '#111', fg: '#ffd166', w: 256, h: 96 }), emissive: 0xffffff, emissiveIntensity: 0.3 });
      taxiSignMat.emissiveMap = taxiSignMat.map;
      part(body, geoBox, taxiSignMat, 0, roofTop + 0.15, cabZ, 0.7, 0.25, 0.3);
      part(body, geoBox, mat(0x111111), 0, base + lowerH * 0.45 + 0.1, 0, W + 0.02, 0.12, L * 0.7);
    }
    let lights = null;
    if (type === 'police') {
      part(body, geoBox, mat(0x0a2463), 0, base + lowerH * 0.5 + 0.1, 0, W + 0.02, 0.22, L * 0.98);
      const r = part(body, geoBox, sirenRed.clone(), -0.3, roofTop + 0.1, cabZ, 0.5, 0.16, 0.3);
      const b = part(body, geoBox, sirenBlue.clone(), 0.3, roofTop + 0.1, cabZ, 0.5, 0.16, 0.3);
      lights = { r, b };
      if (!policeTextMat) policeTextMat = new THREE.MeshStandardMaterial({ map: makeSignTexture('POLICE', { bg: '#0a2463', fg: '#ffffff', w: 256, h: 64, font: 'bold 44px sans-serif' }) });
      const t1 = part(body, new THREE.PlaneGeometry(1, 1), policeTextMat, W / 2 + 0.02, base + lowerH * 0.5 + 0.1, 0, 1.8, 0.45, 1);
      t1.rotation.y = Math.PI / 2;
      const t2 = part(body, new THREE.PlaneGeometry(1, 1), policeTextMat, -W / 2 - 0.02, base + lowerH * 0.5 + 0.1, 0, 1.8, 0.45, 1);
      t2.rotation.y = -Math.PI / 2;
    }
    const ax = L / 2 - 0.85;
    addWheel(-W / 2 + 0.12, ax, true);
    addWheel(W / 2 - 0.12, ax, true);
    addWheel(-W / 2 + 0.12, -ax, false);
    addWheel(W / 2 - 0.12, -ax, false);
    g.userData.lights = lights;
  }
  mergeParts(body);
  // a driver silhouette
  const driver = new THREE.Mesh(driverGeo, driverMat);
  driver.position.set(s.body === 'keke' ? 0 : -0.4, base + 0.55, s.body === 'keke' ? 0.55 : s.body === 'bus' ? L * 0.3 : 0.1);
  body.add(driver);
  return { group: g, body, wheels, front, driver, lights: g.userData.lights };
}

export class Vehicle {
  constructor(type, x, z, heading, color) {
    this.type = type;
    this.spec = VEHICLE_TYPES[type];
    this.color = color ?? pick(Math.random, this.spec.colors);
    const built = buildMesh(type, this.color);
    Object.assign(this, built);
    this.mesh = built.group;
    this.pos = new THREE.Vector3(x, 0, z);
    this.heading = heading;
    this.vx = 0;
    this.vz = 0;
    this.speed = 0; // forward speed, signed
    this.lateral = 0;
    this.steerAngle = 0;
    this.health = 100;
    this.driverKind = null; // 'player' | 'ai' | 'police' | null (parked)
    this.destroyed = false;
    this.burnTimer = 0;
    this.lastImpact = 0;
    this.radius = this.spec.wid / 2 + 0.1;
    this.sirenOn = false;
    this.sirenT = 0;
    this.roll = 0;
    this.pitch = 0;
    this.prevSpeed = 0;
    this.driver.visible = false;
    this.syncMesh();
  }

  get forward() {
    return { x: Math.sin(this.heading), z: Math.cos(this.heading) };
  }

  circles() {
    const f = this.forward;
    const o = Math.max(0, this.spec.len / 2 - this.radius);
    return [
      { x: this.pos.x + f.x * o, z: this.pos.z + f.z * o },
      { x: this.pos.x - f.x * o, z: this.pos.z - f.z * o },
    ];
  }

  // ctrl: { throttle: -1..1, steer: -1..1 (positive = right), handbrake: bool }
  update(dt, ctrl, collision, events) {
    const s = this.spec;
    if (this.destroyed) ctrl = { throttle: 0, steer: 0, handbrake: true };
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    const rx = -fz;
    const rz = fx;
    let vF = this.vx * fx + this.vz * fz;
    let vL = this.vx * rx + this.vz * rz;
    const thr = ctrl.throttle || 0;
    const healthFactor = this.health < 25 ? 0.6 : 1;
    if (thr > 0) {
      if (vF < -0.5) vF += 22 * thr * dt;
      else vF += s.accel * thr * healthFactor * dt * Math.max(0, 1 - vF / s.maxSpeed);
    } else if (thr < 0) {
      if (vF > 0.5) vF += 24 * thr * dt;
      else vF = Math.max(-s.maxSpeed * 0.35, vF + s.accel * 0.7 * thr * dt);
    } else {
      vF -= Math.sign(vF) * Math.min(Math.abs(vF), 2.5 * dt);
    }
    vF -= vF * 0.08 * dt;
    if (ctrl.handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 9 * dt);

    const speedK = Math.min(1, Math.abs(vF) / s.maxSpeed);
    const maxSteer = 0.62 * (1 - speedK * 0.55);
    const target = clamp(ctrl.steer || 0, -1, 1) * maxSteer;
    this.steerAngle += (target - this.steerAngle) * Math.min(1, dt * 8);
    const wheelBase = s.len * 0.62;
    const yawRate = (vF / wheelBase) * Math.tan(this.steerAngle) * (ctrl.handbrake ? 1.35 : 1);
    this.heading -= yawRate * dt;

    const grip = ctrl.handbrake ? 1.4 : 7.5 - speedK * 2.5;
    vL *= Math.exp(-grip * dt);
    const nfx = Math.sin(this.heading);
    const nfz = Math.cos(this.heading);
    this.vx = nfx * vF + -nfz * vL;
    this.vz = nfz * vF + nfx * vL;
    this.lateral = vL;

    const px = this.pos.x;
    const pz = this.pos.z;
    this.pos.x += this.vx * dt;
    this.pos.z += this.vz * dt;

    // keep wheels on land; the sea is not a road
    for (const c of this.circles()) {
      if (!onLand(c.x, c.z, 0.4)) {
        this.pos.x = px;
        this.pos.z = pz;
        const imp = Math.hypot(this.vx, this.vz);
        this.vx *= -0.25;
        this.vz *= -0.25;
        this.impact(imp, events);
        break;
      }
    }

    // buildings
    for (let k = 0; k < 2; k++) {
      const cs = this.circles();
      for (let i = 0; i < 2; i++) {
        const c = cs[i];
        const before = { x: c.x, z: c.z };
        const hit = collision.resolveCircle(c, this.radius, 0.3);
        if (hit) {
          this.pos.x += c.x - before.x;
          this.pos.z += c.z - before.z;
          const vn = this.vx * hit.nx + this.vz * hit.nz;
          if (vn < 0) {
            this.vx -= hit.nx * vn * 1.25;
            this.vz -= hit.nz * vn * 1.25;
            this.impact(-vn, events);
          }
        }
      }
    }
    this.prevSpeed = this.speed;
    this.speed = this.vx * Math.sin(this.heading) + this.vz * Math.cos(this.heading);

    // damage states
    if (this.health <= 0 && !this.destroyed) {
      this.burnTimer += dt;
      if (this.burnTimer > 4) this.explode(events);
    }
    if (this.lights) {
      this.sirenT += dt;
      const on = this.sirenOn && !this.destroyed;
      const phase = Math.floor(this.sirenT * 6) % 2;
      this.lights.r.material.emissiveIntensity = on ? 3 : 0.2;
      this.lights.b.material.emissiveIntensity = on ? 3 : 0.2;
      this.lights.r.visible = !on || phase === 0;
      this.lights.b.visible = !on || phase === 1;
    }
    this.syncMesh(dt);
  }

  impact(speed, events) {
    if (speed < 3) return;
    const dmg = (speed - 3) * 2.2 / this.spec.mass;
    this.health -= dmg;
    this.lastImpact = speed;
    events?.push({ type: 'crash', vehicle: this, speed });
  }

  explode(events) {
    this.destroyed = true;
    this.health = 0;
    this.vx *= 0.2;
    this.vz *= 0.2;
    this.mesh.traverse((o) => {
      if (o.isMesh) o.material = charredMat;
    });
    events?.push({ type: 'explosion', x: this.pos.x, z: this.pos.z, vehicle: this });
  }

  repair() {
    if (this.destroyed) return;
    this.health = 100;
    this.burnTimer = 0;
  }

  syncMesh(dt = 0) {
    this.mesh.position.set(this.pos.x, 0, this.pos.z);
    this.mesh.rotation.y = this.heading;
    if (dt > 0) {
      const accel = (this.speed - this.prevSpeed) / dt;
      this.roll += (clamp(this.lateral * 0.025 + this.steerAngle * this.speed * 0.006, -0.12, 0.12) - this.roll) * Math.min(1, dt * 6);
      this.pitch += (clamp(-accel * 0.006, -0.06, 0.06) - this.pitch) * Math.min(1, dt * 5);
      this.body.rotation.z = this.roll;
      this.body.rotation.x = this.pitch;
      for (const w of this.wheels) w.rotation.x += (this.speed / WHEEL_R) * dt;
      for (const f of this.front) f.rotation.y = -this.steerAngle;
    }
  }
}

// Resolves vehicle-vehicle overlaps with a simple impulse exchange.
export function collideVehicles(vehicles, events) {
  for (let i = 0; i < vehicles.length; i++) {
    const a = vehicles[i];
    for (let j = i + 1; j < vehicles.length; j++) {
      const b = vehicles[j];
      const reach = (a.spec.len + b.spec.len) / 2 + 0.5;
      const dx0 = b.pos.x - a.pos.x;
      const dz0 = b.pos.z - a.pos.z;
      if (dx0 * dx0 + dz0 * dz0 > reach * reach) continue;
      const ca = a.circles();
      const cb = b.circles();
      for (const p of ca) {
        for (const q of cb) {
          const dx = q.x - p.x;
          const dz = q.z - p.z;
          const r = a.radius + b.radius;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r || d2 < 1e-6) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const nz = dz / d;
          const pen = r - d;
          const ma = a.spec.mass;
          const mb = b.spec.mass;
          const ta = mb / (ma + mb);
          const tb = ma / (ma + mb);
          a.pos.x -= nx * pen * ta;
          a.pos.z -= nz * pen * ta;
          b.pos.x += nx * pen * tb;
          b.pos.z += nz * pen * tb;
          const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
          if (rv < 0) {
            const jimp = (-1.3 * rv) / (1 / ma + 1 / mb);
            a.vx -= (jimp / ma) * nx;
            a.vz -= (jimp / ma) * nz;
            b.vx += (jimp / mb) * nx;
            b.vz += (jimp / mb) * nz;
            a.impact(-rv * 0.8, events);
            b.impact(-rv * 0.8, events);
            if (-rv > 2) events.push({ type: 'carhit', a, b, speed: -rv });
          }
        }
      }
    }
  }
}
