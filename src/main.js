import * as THREE from 'three';
import './style.css';
import {
  SPAWN, HOSPITAL_SPAWN, POLICE_SPAWN, SPRAY_SHOPS, DISTRICTS, DAY_LENGTH_SECONDS, ROAD_HALF,
} from './config.js';
import { Collision, onLand } from './collision.js';
import { RoadGraph } from './roads.js';
import { buildWorld } from './world.js';
import { Sky } from './sky.js';
import { Audio } from './audio.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { Particles } from './effects.js';
import { Player } from './player.js';
import { Peds } from './peds.js';
import { Traffic, randomType } from './traffic.js';
import { Police } from './police.js';
import { Missions } from './missions.js';
import { Pickups, LONE_STAR_COUNT } from './pickups.js';
import { Vehicle, collideVehicles, lightsMat, frontLightMat, backLightMat } from './vehicles.js';
import { loadAssets } from './assets.js';
import { buildPhotoBillboards, PHOTOS } from './photos.js';
import { clamp, dampAngle, damp } from './utils.js';

const SAVE_KEY = 'monrovia-city-save-v1';

function loadSave() {
  const fresh = { money: 500, done: [], stars: [] };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh;
    const s = JSON.parse(raw);
    return { money: Number(s.money) || 0, done: Array.isArray(s.done) ? s.done : [], stars: Array.isArray(s.stars) ? s.stars : [] };
  } catch {
    return fresh;
  }
}

class Game {
  constructor() {
    const canvas = document.getElementById('game');
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    const mobile = matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 5000);
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });

    this.collision = new Collision();
    this.roads = new RoadGraph();
    this.world = buildWorld(this.scene, this.collision, this.roads);
    const markers = [[-100, -130], [-300, -84], [300, 133], [-139, -45], [SPAWN.x, SPAWN.z]];
    this.photos = buildPhotoBillboards(this.scene, this.roads, this.collision, markers);
    this.sky = new Sky(this.scene);
    if (mobile) this.sky.sun.shadow.mapSize.set(1024, 1024);
    this.audio = new Audio();
    this.hud = new HUD(this.roads, this.collision);
    this.input = new Input(canvas);
    this.particles = new Particles(this.scene);
    this.save = loadSave();
    this.vehicles = [];
    this.events = [];

    this.player = new Player(this.scene);
    this.player.setPosition(SPAWN.x + 8.2, SPAWN.z + 5, SPAWN.heading);
    this.peds = new Peds(this.scene, this.roads, this.collision, 45);
    this.traffic = new Traffic(this, 28);
    this.police = new Police(this);
    this.missions = new Missions(this);
    this.pickups = new Pickups(this);

    // starter rides
    this.spawnParked('taxi', SPAWN.x + 5.8, SPAWN.z + 8, Math.PI).keep = true;
    this.spawnParked('keke', SPAWN.x + 5.8, SPAWN.z - 4, Math.PI);
    this.spawnParked('police', -105, -44, Math.PI / 2).keep = true;
    this.spawnParked('police', -88, -44, Math.PI / 2).keep = true;
    this.spawnParked('suv', -290, -96, Math.PI / 2, 0xffffff);
    this.spawnParked('sports', 205, 132, -Math.PI / 2, 0xd00000);
    this.spawnParked('ambulance', 265, 66, Math.PI / 2).keep = true;
    for (let i = 0; i < 6; i++) this.traffic.spawn(this.player.pos, 30, 200);
    for (let i = 0; i < 24; i++) this.spawnParkedRandom(this.player.pos, 20, 240);

    this.headlight = new THREE.SpotLight(0xfff3d6, 0, 70, 0.55, 0.5, 1.2);
    this.headlight.position.set(0, 1, 1.5);
    this.headlight.target.position.set(0, 0, 14);
    this.scene.add(this.headlight);

    this.cam = { yaw: SPAWN.heading + Math.PI, pitch: 0.32, lastLook: -10, far: false, shake: 0 };
    this.time = 0;
    this.started = false;
    this.paused = false;
    this.dead = null;
    this.mapOpen = false;
    this.lastHurt = -100;
    this.locTimer = 0;
    this.parkTimer = 0;
    this.heatHitCooldown = 0;
    this.sprayCooldown = 0;
    this.hud.setMoney(this.save.money, true);
    this.hud.el.money.textContent = `L$${this.save.money.toLocaleString()}`;

    this.clock = new THREE.Timer();
    this.renderer.setAnimationLoop(() => this.frame());
    this.setupMenus();
  }

  setupMenus() {
    this.setupTravel();
    this.setupPhotos();
    const play = document.getElementById('play');
    play.disabled = false;
    play.textContent = this.save.money !== 500 || this.save.done.length ? 'Continue' : 'Play';
    play.addEventListener('click', () => {
      this.audio.init();
      document.getElementById('title').hidden = true;
      document.getElementById('hud').hidden = false;
      this.started = true;
      if (!this.input.touch) {
        try {
          const r = this.canvas.requestPointerLock?.();
          if (r && r.catch) r.catch(() => {});
        } catch {
          /* drag to look instead */
        }
      }
      this.hud.help(this.input.touch
        ? 'Left stick to move. Drag the screen to look. Tap <b>CAR</b> next to a vehicle to jack it.'
        : 'Walk with <kbd>W A S D</kbd>. Steal the yellow taxi beside you with <kbd>F</kbd>.<br/>Coloured markers start jobs. <kbd>M</kbd> opens the map.', 9);
    });
    document.getElementById('resume').addEventListener('click', () => this.setPaused(false));
  }

  // Quick travel from the map. Places are road spots; you arrive in your car if you have one.
  setupTravel() {
    const places = [
      ['Broad Street', -30, -25],
      ['Ducor Hotel', -300, -75],
      ['Waterside Market', -110, -120],
      ['Capitol Hill', 120, 25],
      ['Executive Mansion', 200, 125],
      ['Sinkor Beach', 320, 125],
      ['Red Light Market', 520, 75],
      ['Providence Island', -60, -228],
      ['Freeport', 80, -355],
    ];
    const bar = document.getElementById('travel');
    for (const [name, x, z] of places) {
      const b = document.createElement('button');
      b.textContent = name;
      b.addEventListener('click', () => this.travelTo(x, z));
      bar.appendChild(b);
    }
  }

  travelTo(x, z) {
    if (this.dead) return;
    if (this.police.stars > 0) {
      this.hud.help('Lose the police before you travel.', 3);
      this.toggleMap(false);
      return;
    }
    const n = this.roads.nearestNode(x, z);
    const next = n.adj.find((o) => o.edge.axis === (Math.abs(z - n.z) < Math.abs(x - n.x) ? 'x' : 'z')) || n.adj[0];
    const v = this.player.vehicle;
    const p = this.roads.lanePoint(n, next.node, Math.min(0.5, 20 / next.edge.len), v ? 3.4 : ROAD_HALF + 2.5);
    if (v) {
      v.pos.set(p.x, 0, p.z);
      v.heading = Math.atan2(p.fx, p.fz);
      v.vx = v.vz = 0;
      v.syncMesh();
      this.player.pos.set(p.x, 0, p.z);
    } else {
      this.player.setPosition(p.x, p.z, Math.atan2(p.fx, p.fz));
    }
    this.cam.yaw = Math.atan2(p.fx, p.fz);
    for (let i = 0; i < 8; i++) this.traffic.spawn(this.playerPos, 25, 160);
    this.toggleMap(false);
  }

  // Title-screen slideshow and the credits list for the real Monrovia photos.
  setupPhotos() {
    if (!PHOTOS.length) return;
    const credit = (p) => `${p.title} · ${p.artist} · ${p.license}`;
    const list = document.getElementById('credit-list');
    for (const p of PHOTOS) {
      const li = document.createElement('li');
      if (p.source) {
        const a = document.createElement('a');
        a.href = p.source;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = credit(p);
        li.appendChild(a);
      } else {
        li.textContent = credit(p);
      }
      list.appendChild(li);
    }
    document.getElementById('credits').hidden = false;
    const box = document.getElementById('title-photo');
    const cap = box.querySelector('.credit');
    box.hidden = false;
    let i = 0;
    const show = () => {
      const p = PHOTOS[i++ % PHOTOS.length];
      box.style.backgroundImage = `url("${p.url}")`;
      cap.textContent = `Photo: ${credit(p)}`;
    };
    show();
    this.slideshow = setInterval(() => {
      if (this.started) clearInterval(this.slideshow);
      else show();
    }, 6000);
  }

  setPaused(p) {
    this.paused = p;
    document.getElementById('pause').hidden = !p;
    if (p) {
      document.getElementById('stats').innerHTML = `Money: <b>L$${this.save.money.toLocaleString()}</b><br/>Jobs completed: <b>${this.save.done.length}/4</b><br/>Lone Stars: <b>${this.pickups.collected}/${LONE_STAR_COUNT}</b>`;
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }

  get playerPos() {
    return this.player.vehicle ? this.player.vehicle.pos : this.player.pos;
  }

  addVehicle(v) {
    this.vehicles.push(v);
    this.scene.add(v.mesh);
  }

  removeVehicle(v) {
    if (v === this.player.vehicle) return;
    const i = this.vehicles.indexOf(v);
    if (i >= 0) this.vehicles.splice(i, 1);
    this.scene.remove(v.mesh);
  }

  spawnParked(type, x, z, heading, color) {
    const v = new Vehicle(type, x, z, heading, color);
    v.driverKind = null;
    this.addVehicle(v);
    return v;
  }

  spawnParkedRandom(near, minD, maxD) {
    for (let i = 0; i < 30; i++) {
      const e = this.roads.edges[Math.floor(Math.random() * this.roads.edges.length)];
      if (e.len < 40) continue;
      const flip = Math.random() < 0.5;
      const a = flip ? e.b : e.a;
      const b = flip ? e.a : e.b;
      const p = this.roads.lanePoint(a, b, 0.25 + Math.random() * 0.5, ROAD_HALF - 1.2);
      const d = Math.hypot(p.x - near.x, p.z - near.z);
      if (d < minD || d > maxD || !onLand(p.x, p.z, 1)) continue;
      if (this.vehicles.some((v) => Math.abs(v.pos.x - p.x) + Math.abs(v.pos.z - p.z) < 9)) continue;
      return this.spawnParked(randomType(), p.x, p.z, Math.atan2(p.fx, p.fz));
    }
    return null;
  }

  addMoney(n) {
    this.save.money = Math.max(0, this.save.money + n);
    this.hud.setMoney(this.save.money);
    this.persist();
  }

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch {
      /* storage unavailable: progress lasts for this session only */
    }
  }

  // ---------- vehicles ----------
  nearestEnterable() {
    const p = this.player.pos;
    let best = null;
    let bd = Infinity;
    for (const v of this.vehicles) {
      if (v.destroyed) continue;
      for (const c of v.circles()) {
        const d = Math.hypot(c.x - p.x, c.z - p.z) - v.radius;
        if (d < 2.8 && d < bd) {
          bd = d;
          best = v;
        }
      }
    }
    return best;
  }

  enterVehicle(v) {
    const pl = this.player;
    if (v.driverKind === 'ai' || v.driverKind === 'police') {
      this.ejectDriver(v);
      if (v.driverKind === 'police') {
        this.police.addHeat(110, 2);
        this.hud.toast('You jacked an LNP cruiser!', 'bad');
      } else if (this.copsNear(55)) {
        this.police.addHeat(60);
      }
      this.hud.toast(`Jacked a ${v.spec.name}`);
    } else if (v.type === 'police' && v.keep) {
      this.police.addHeat(110, 2);
      this.hud.toast('You stole a police car from LNP HQ!', 'bad');
    }
    v.keep = v.keep && this.missions.active?.data.car === v;
    v.driverKind = 'player';
    v.ai = null;
    v.cop = null;
    v.chase = false;
    v.sirenOn = false;
    v.driver.visible = true;
    pl.vehicle = v;
    pl.human.group.visible = false;
    this.cam.lastLook = -10;
    if (v.type === 'taxi' && !this.missions.active) this.hud.help(this.input.touch ? 'Tap <b>TAXI</b> to start a taxi job.' : 'Press <kbd>T</kbd> to start a taxi job.', 4);
    else if (v.type === 'police' && !this.input.touch) this.hud.help('Press <kbd>Q</kbd> for the siren.', 3);
  }

  exitVehicle(force = false) {
    const pl = this.player;
    const v = pl.vehicle;
    if (!v) return;
    const f = v.forward;
    let placed = false;
    // driver's door (left) first, then the right side
    for (const [sx, sz] of [[f.z, -f.x], [-f.z, f.x]]) {
      const x = v.pos.x + sx * (v.spec.wid / 2 + 0.9);
      const z = v.pos.z + sz * (v.spec.wid / 2 + 0.9);
      if (onLand(x, z, 0.3) && !this.collision.pointInside(x, 1, z)) {
        pl.setPosition(x, z, v.heading);
        placed = true;
        break;
      }
    }
    if (!placed && !force) {
      const x = v.pos.x + f.x * (v.spec.len / 2 + 1);
      const z = v.pos.z + f.z * (v.spec.len / 2 + 1);
      pl.setPosition(x, z, v.heading);
    }
    if (Math.abs(v.speed) > 9) {
      this.hurt(Math.abs(v.speed) * 0.8);
      pl.kx = v.vx * 0.6;
      pl.kz = v.vz * 0.6;
    }
    v.driverKind = null;
    v.driver.visible = false;
    v.sirenOn = false;
    pl.vehicle = null;
    pl.human.group.visible = true;
    pl.human.resetPose();
  }

  ejectDriver(v) {
    const p = this.peds.list.filter((q) => q.state !== 'down').sort((a, b) => b.pos.distanceToSquared(this.player.pos) - a.pos.distanceToSquared(this.player.pos))[0];
    if (!p) return;
    const f = v.forward;
    p.pos.set(v.pos.x + f.z * 2.2, 0, v.pos.z - f.x * 2.2);
    p.state = 'flee';
    p.timer = 6;
    p.fleeFrom = { x: this.player.pos.x, z: this.player.pos.z };
    this.peds.scare(v.pos.x, v.pos.z, 15);
  }

  copsNear(r) {
    const p = this.playerPos;
    return this.vehicles.some((v) => v.type === 'police' && v.driverKind === 'police' && Math.hypot(v.pos.x - p.x, v.pos.z - p.z) < r);
  }

  hurt(n) {
    if (this.dead) return;
    this.player.health -= n;
    this.lastHurt = this.time;
    this.hud.flash('rgba(200,0,0,0.35)');
    if (this.player.health <= 0) this.wasted();
  }

  wasted() {
    if (this.dead) return;
    this.player.health = 0;
    this.dead = { kind: 'wasted', t: 4.5 };
    this.canvas.classList.add('wasted');
    this.hud.big('WASTED', 'Waking up at JFK Medical Center…', 4.5, 'wasted');
    this.audio.wasted();
    this.missions.onPlayerDown('wasted');
  }

  busted() {
    if (this.dead) return;
    this.dead = { kind: 'busted', t: 4 };
    this.canvas.classList.add('busted');
    this.hud.big('BUSTED', 'The LNP took you downtown…', 4, 'busted');
    this.audio.failed();
    this.missions.onPlayerDown('busted');
  }

  respawn() {
    const kind = this.dead.kind;
    this.canvas.classList.remove('wasted', 'busted');
    if (this.player.vehicle) {
      const v = this.player.vehicle;
      this.player.vehicle = null;
      v.driverKind = null;
      v.driver.visible = false;
      this.player.human.group.visible = true;
    }
    this.player.human.resetPose();
    const fee = kind === 'wasted' ? Math.min(this.save.money, 200) : Math.min(this.save.money, Math.max(150, Math.round(this.save.money * 0.1)));
    this.addMoney(-fee);
    const sp = kind === 'wasted' ? HOSPITAL_SPAWN : POLICE_SPAWN;
    this.player.setPosition(sp.x, sp.z, 0);
    this.player.health = 100;
    this.police.clear();
    for (const c of [...this.police.cops]) this.police.removeCop(c);
    this.hud.toast(kind === 'wasted' ? `Hospital bill: L$${fee}` : `Bribe paid: L$${fee}`, 'bad');
    this.cam.yaw = Math.PI;
    this.dead = null;
  }

  // ---------- main loop ----------
  frame() {
    this.clock.update();
    const raw = Math.min(this.clock.getDelta(), 0.1);
    const input = this.input;
    if (this.started && input.wasPressed('KeyP', 'Escape')) {
      if (this.mapOpen) this.toggleMap(false);
      else this.setPaused(!this.paused);
    }
    if (!this.started || this.paused) {
      // keep the city alive behind the menu
      if (!this.started) this.idleCamera(raw);
      this.renderer.render(this.scene, this.camera);
      input.endFrame();
      return;
    }
    if (input.wasPressed('KeyM')) this.toggleMap(!this.mapOpen);
    if (this.mapOpen) {
      this.renderer.render(this.scene, this.camera);
      input.endFrame();
      return;
    }
    const steps = raw > 1 / 45 ? 2 : 1;
    const dt = raw / steps;
    this.handleInput(raw);
    for (let i = 0; i < steps; i++) this.simulate(dt);
    this.updateWorld(raw);
    this.updateCamera(raw);
    this.updateHUD(raw);
    this.renderer.render(this.scene, this.camera);
    input.endFrame();
  }

  idleCamera(dt) {
    this.time += dt;
    const t = this.time * 0.05;
    this.camera.position.set(-60 + Math.cos(t) * 160, 70, -40 + Math.sin(t) * 160);
    this.camera.lookAt(-60, 0, -40);
    this.sky.update(dt, this.camera.position, 24 / DAY_LENGTH_SECONDS);
    this.world.update(dt, this.time, this.sky.night);
    this.traffic.update(dt);
    collideVehicles(this.vehicles, (this.events = []));
    this.peds.update(dt, this.player.pos);
  }

  toggleMap(open) {
    this.mapOpen = open;
    if (open && document.pointerLockElement) document.exitPointerLock();
    const blips = [...this.missions.blips(), ...this.policeBlips()];
    this.hud.toggleBigMap(open, this.playerPos.x, this.playerPos.z, blips);
  }

  handleInput() {
    const input = this.input;
    const pl = this.player;
    if (this.dead) return;
    if (input.wasPressed('KeyF', 'KeyE', 'Enter')) {
      if (pl.vehicle) {
        if (Math.abs(pl.vehicle.speed) < 14) this.exitVehicle();
      } else {
        const v = this.nearestEnterable();
        if (v) this.enterVehicle(v);
      }
    }
    if (input.wasPressed('KeyC')) this.cam.far = !this.cam.far;
    if (input.wasPressed('KeyR')) {
      this.audio.radioOn = !this.audio.radioOn;
      this.hud.toast(this.audio.radioOn ? 'Radio: LONE STAR FM 104' : 'Radio off');
    }
    if (input.wasPressed('KeyH')) {
      this.audio.horn(null, 1);
      const p = this.playerPos;
      this.peds.scare(p.x, p.z, 9);
    }
    if (input.wasPressed('KeyQ') && pl.vehicle?.type === 'police') pl.vehicle.sirenOn = !pl.vehicle.sirenOn;
    if (input.wasPressed('KeyT')) {
      if (this.missions.active?.def.id === 'taxi') this.missions.endTaxi('You clocked off.');
      else if (!this.missions.active && pl.vehicle?.type === 'taxi') this.missions.startTaxi();
    }
    if (!pl.vehicle && input.wasPressed('KeyJ', 'Mouse0') && pl.punch()) {
      this.pendingPunch = 0.13;
    }
  }

  simulate(dt) {
    const pl = this.player;
    const input = this.input;
    this.time += dt;
    this.events = [];
    const ev = this.events;

    // player
    if (pl.vehicle) {
      const v = pl.vehicle;
      const m = this.dead ? { x: 0, y: 0 } : input.move;
      v.update(dt, { throttle: m.y, steer: m.x, handbrake: !this.dead && input.isDown('Space') }, this.collision, ev);
      pl.pos.set(v.pos.x, 0, v.pos.z);
      if (v.destroyed) this.wasted();
      if (v.health <= 0 && !v.destroyed && Math.random() < dt * 2) this.hud.help('Your ride is on fire. <b>Get out!</b>', 1.5);
    } else if (!this.dead) {
      pl.updateOnFoot(dt, input.move, this.cam.yaw, input.isDown('ShiftLeft', 'ShiftRight'), input.isDown('Space'), this.collision);
      if (this.pendingPunch > 0) {
        this.pendingPunch -= dt;
        if (this.pendingPunch <= 0) this.resolvePunch();
      }
    } else if (this.dead.kind === 'wasted') {
      pl.human.downPose();
    }

    // everyone else
    this.traffic.update(dt);
    this.police.update(dt);
    for (const v of this.vehicles) {
      if (v.driverKind !== null) continue;
      const moving = Math.abs(v.vx) + Math.abs(v.vz) > 0.05 || v.health <= 0;
      if (moving) v.update(dt, { throttle: 0, steer: 0, handbrake: true }, this.collision, ev);
    }
    this.peds.update(dt, this.playerPos);
    collideVehicles(this.vehicles, ev);
    this.vehicleHits(dt);
    this.processEvents(ev);
  }

  resolvePunch() {
    const pl = this.player;
    const fx = Math.sin(pl.heading);
    const fz = Math.cos(pl.heading);
    for (const p of this.peds.list) {
      if (p.state === 'down') continue;
      const dx = p.pos.x - pl.pos.x;
      const dz = p.pos.z - pl.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.8 && (dx * fx + dz * fz) / (d || 1) > 0.4) {
        this.peds.knockDown(p, fx, fz, 4);
        this.audio.punch();
        this.peds.scare(p.pos.x, p.pos.z, 14);
        this.police.addHeat(this.copsNear(60) ? 70 : 20);
        if (Math.random() < 0.6) this.pickups.dropCash(p.pos.x + fx, p.pos.z + fz, 10 + Math.floor(Math.random() * 60));
        return;
      }
    }
    this.audio.tone(200, 0.06, 'sine', 0.05);
  }

  vehicleHits() {
    const pl = this.player;
    for (const v of this.vehicles) {
      const sp = Math.hypot(v.vx, v.vz);
      const cs = v.circles();
      // pedestrians
      if (sp > 0.5) {
        for (const p of this.peds.list) {
          if (p.state === 'down') continue;
          if (Math.abs(p.pos.x - v.pos.x) > 5 || Math.abs(p.pos.z - v.pos.z) > 5) continue;
          for (const c of cs) {
            const dx = p.pos.x - c.x;
            const dz = p.pos.z - c.z;
            const d = Math.hypot(dx, dz);
            if (d > v.radius + 0.35) continue;
            if (sp > 4) {
              this.peds.knockDown(p, v.vx / sp, v.vz / sp, sp * 0.7);
              this.audio.crash(sp, p.pos);
              this.peds.scare(p.pos.x, p.pos.z, 16);
              if (v === pl.vehicle) {
                this.police.addHeat(this.copsNear(70) ? 80 : 30);
                if (Math.random() < 0.5) this.pickups.dropCash(p.pos.x, p.pos.z, 10 + Math.floor(Math.random() * 40));
              }
            } else {
              p.pos.x += (dx / (d || 1)) * 0.3;
              p.pos.z += (dz / (d || 1)) * 0.3;
            }
            break;
          }
        }
      }
      // the player on foot
      if (!pl.vehicle && !this.dead && pl.y < 1.4) {
        for (const c of cs) {
          const dx = pl.pos.x - c.x;
          const dz = pl.pos.z - c.z;
          const d = Math.hypot(dx, dz);
          const r = v.radius + 0.38;
          if (d >= r) continue;
          const nx = dx / (d || 1);
          const nz = dz / (d || 1);
          pl.pos.x += nx * (r - d);
          pl.pos.z += nz * (r - d);
          const toward = v.vx * nx + v.vz * nz;
          if (sp > 4 && toward > 2) {
            this.hurt(sp * 2.2);
            pl.kx = v.vx * 0.8 + nx * 4;
            pl.kz = v.vz * 0.8 + nz * 4;
            pl.vy = Math.min(7, sp * 0.4);
            this.audio.crash(sp);
            this.cam.shake = 0.5;
          }
          break;
        }
      }
    }
  }

  processEvents(ev) {
    const pl = this.player;
    this.heatHitCooldown -= 1 / 60;
    for (const e of ev) {
      if (e.type === 'crash') {
        const mine = e.vehicle === pl.vehicle;
        if (mine || Math.random() < 0.3) this.audio.crash(e.speed, e.vehicle.pos);
        if (e.speed > 6) this.particles.sparks(e.vehicle.pos.x, 0.8, e.vehicle.pos.z);
        if (mine) {
          this.cam.shake = Math.min(1, e.speed / 20);
          if (e.speed > 14) this.hurt((e.speed - 14) * 1.2);
        }
      } else if (e.type === 'carhit') {
        const mine = e.a === pl.vehicle ? e.b : e.b === pl.vehicle ? e.a : null;
        if (mine && this.heatHitCooldown <= 0) {
          if (mine.type === 'police' && mine.driverKind === 'police') {
            this.police.addHeat(35);
            this.heatHitCooldown = 1;
          } else if (e.speed > 8 && this.copsNear(50)) {
            this.police.addHeat(25);
            this.heatHitCooldown = 1;
          }
        }
      } else if (e.type === 'explosion') {
        this.particles.explosion(e.x, e.z);
        this.audio.explosion({ x: e.x, z: e.z });
        const p = this.playerPos;
        const d = Math.hypot(p.x - e.x, p.z - e.z);
        if (d < 40) this.cam.shake = Math.max(this.cam.shake, 1 - d / 40);
        if (!pl.vehicle && d < 9) {
          this.hurt((9 - d) * 12);
          pl.kx = ((p.x - e.x) / (d || 1)) * 8;
          pl.kz = ((p.z - e.z) / (d || 1)) * 8;
          pl.vy = 5;
        }
        for (const q of this.peds.list) {
          const dd = Math.hypot(q.pos.x - e.x, q.pos.z - e.z);
          if (dd < 9) this.peds.knockDown(q, (q.pos.x - e.x) / (dd || 1), (q.pos.z - e.z) / (dd || 1), 10);
        }
        this.peds.scare(e.x, e.z, 40);
        for (const v of this.vehicles) {
          if (v === e.vehicle || v.destroyed) continue;
          const dd = Math.hypot(v.pos.x - e.x, v.pos.z - e.z);
          if (dd < 8) {
            v.health -= 50;
            v.vx += ((v.pos.x - e.x) / (dd || 1)) * 6;
            v.vz += ((v.pos.z - e.z) / (dd || 1)) * 6;
          }
        }
        if (e.vehicle === pl.vehicle) this.wasted();
        else if (e.vehicle.type === 'police' && d < 60) this.police.addHeat(60);
      }
    }
  }

  updateWorld(dt) {
    const pl = this.player;
    // death / arrest sequence
    if (this.dead) {
      this.dead.t -= dt;
      if (this.dead.t <= 0) this.respawn();
    }
    // slow health regen when things are calm
    if (!this.dead && this.time - this.lastHurt > 8 && pl.health < 100) pl.health = Math.min(100, pl.health + dt * 3);

    // spray shops
    this.sprayCooldown -= dt;
    const v = pl.vehicle;
    if (v && this.sprayCooldown <= 0) {
      for (const s of SPRAY_SHOPS) {
        if (Math.hypot(v.pos.x - s.x, v.pos.z - s.z) < s.r && Math.abs(v.speed) < 4) {
          const needs = this.police.stars > 0 || v.health < 100;
          if (!needs) {
            this.hud.help(`${s.name}: nothing to fix, boss.`, 2);
          } else {
            const cost = this.police.stars > 0 ? 100 * this.police.stars : 50;
            if (this.save.money >= cost) {
              this.addMoney(-cost);
              this.police.clear();
              v.repair();
              this.hud.big('RESPRAYED', `${s.name} · L$${cost} · Wanted level cleared`, 3, 'passed');
              this.audio.cash();
            } else {
              this.hud.help(`You need L$${cost} for a respray.`, 3);
            }
          }
          this.sprayCooldown = 6;
        }
      }
    }

    // keep some parked cars around
    this.parkTimer -= dt;
    if (this.parkTimer <= 0) {
      this.parkTimer = 2;
      const parked = this.vehicles.filter((q) => q.driverKind === null && !q.keep).length;
      if (parked < 26) this.spawnParkedRandom(this.playerPos, 50, 220);
    }

    // vehicle damage effects
    for (const q of this.vehicles) {
      if (Math.abs(q.pos.x - this.playerPos.x) > 150 || Math.abs(q.pos.z - this.playerPos.z) > 150) continue;
      const f = q.forward;
      const hx = q.pos.x + f.x * (q.spec.len / 2 - 0.6);
      const hz = q.pos.z + f.z * (q.spec.len / 2 - 0.6);
      if (q.destroyed) {
        if (Math.random() < dt * 6) this.particles.smoke(q.pos.x, 1.4, q.pos.z, true);
      } else if (q.health <= 0) {
        for (let i = 0; i < 2; i++) this.particles.fire(hx, 1.1, hz);
        if (Math.random() < dt * 10) this.particles.smoke(hx, 1.6, hz, true);
      } else if (q.health < 35 && Math.random() < dt * 8) {
        this.particles.smoke(hx, 1.2, hz, q.health < 18);
      }
      if (q === v && Math.abs(q.lateral) > 5 && Math.random() < dt * 30) {
        const b = q.circles()[1];
        this.particles.dust(b.x, b.z);
      }
    }

    this.missions.update(dt);
    this.pickups.update(dt);
    this.particles.update(dt);
    this.sky.update(dt, this.playerPos, 24 / DAY_LENGTH_SECONDS);
    this.world.update(dt, this.time, this.sky.night);
    this.photos.update(this.sky.night);
    lightsMat.color.setScalar(0.75 + this.sky.night * 1.2);
    frontLightMat.color.setRGB(1, 0.96, 0.84).multiplyScalar(0.8 + this.sky.night * 1.6);
    backLightMat.color.setRGB(0.82, 0.06, 0.06).multiplyScalar(0.8 + this.sky.night * 1.8);

    // player headlights at night
    if (v && this.sky.night > 0.35 && !v.destroyed) {
      const f = v.forward;
      this.headlight.intensity = 260;
      this.headlight.position.set(v.pos.x + f.x * 2.2, 1.0, v.pos.z + f.z * 2.2);
      this.headlight.target.position.set(v.pos.x + f.x * 18, 0, v.pos.z + f.z * 18);
      this.headlight.target.updateMatrixWorld();
    } else {
      this.headlight.intensity = 0;
    }

    // audio
    const a = this.audio;
    a.listener = this.playerPos;
    if (v) {
      const rpm = (Math.abs(v.speed) / v.spec.maxSpeed) * 3 % 1 * 0.5 + Math.abs(v.speed) / v.spec.maxSpeed * 0.6;
      a.setEngine(!v.destroyed, rpm, Math.max(0, this.input.move.y));
    } else {
      a.setEngine(false, 0, 0);
    }
    let siren = 0;
    for (const q of this.vehicles) {
      if (!q.sirenOn) continue;
      const d = Math.hypot(q.pos.x - this.playerPos.x, q.pos.z - this.playerPos.z);
      siren = Math.max(siren, q === v ? 1 : clamp(1 - d / 150, 0, 1));
    }
    a.setSiren(siren);
    const p = this.playerPos;
    const coast = Math.min(Math.abs(p.z - 178), Math.abs(p.z + 150), Math.abs(p.x + 370));
    a.setSurf(clamp(1 - coast / 60, 0, 1));
    a.updateRadio(!!v && !this.dead);
  }

  updateCamera(dt) {
    const cam = this.cam;
    const pl = this.player;
    const input = this.input;
    const v = pl.vehicle;
    const sens = input.touch ? 0.004 : 0.0026;
    if (input.lookDX || input.lookDY) {
      cam.yaw -= input.lookDX * sens;
      cam.pitch = clamp(cam.pitch + input.lookDY * sens * 0.8, -0.3, 1.25);
      cam.lastLook = this.time;
    }
    const since = this.time - cam.lastLook;
    let target;
    let dist;
    if (v) {
      target = new THREE.Vector3(v.pos.x, 1.5, v.pos.z);
      dist = 6 + v.spec.len * 0.7 + Math.abs(v.speed) * 0.05;
      if (since > 1.2) {
        const back = v.speed < -2 ? v.heading + Math.PI : v.heading;
        cam.yaw = dampAngle(cam.yaw, back, 2.6, dt);
        cam.pitch = damp(cam.pitch, 0.24, 2, dt);
      }
    } else {
      target = new THREE.Vector3(pl.pos.x, pl.y + 1.65, pl.pos.z);
      dist = 4.8;
      if (since > 2.5 && pl.moveSpeed > 1 && input.move.y > 0.2) cam.yaw = dampAngle(cam.yaw, pl.heading, 1.2, dt);
    }
    if (cam.far) dist *= 1.7;
    if (this.dead) {
      dist = 12;
      cam.yaw += dt * 0.3;
      cam.pitch = damp(cam.pitch, 0.6, 1, dt);
    }
    const fx = Math.sin(cam.yaw);
    const fz = Math.cos(cam.yaw);
    const cp = Math.cos(cam.pitch);
    const sp = Math.sin(cam.pitch);
    // pull in when a building is in the way
    let d = dist;
    for (let s = 0.6; s <= dist; s += 0.4) {
      const x = target.x - fx * s * cp;
      const y = target.y + s * sp;
      const z = target.z - fz * s * cp;
      if (this.collision.pointInside(x, y, z) || y < 0.3) {
        d = Math.max(0.8, s - 0.5);
        break;
      }
    }
    cam.dist = cam.dist == null ? d : d < cam.dist ? d : damp(cam.dist, d, 4, dt);
    const pos = new THREE.Vector3(target.x - fx * cam.dist * cp, Math.max(0.4, target.y + cam.dist * sp), target.z - fz * cam.dist * cp);
    if (cam.shake > 0) {
      cam.shake = Math.max(0, cam.shake - dt * 2.5);
      const s = cam.shake * 0.35;
      pos.x += (Math.random() - 0.5) * s;
      pos.y += (Math.random() - 0.5) * s;
      pos.z += (Math.random() - 0.5) * s;
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(target.x, target.y + 0.2, target.z);
    const fov = 65 + (v ? clamp(Math.abs(v.speed) - 10, 0, 30) * 0.45 : 0);
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = damp(this.camera.fov, fov, 3, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  policeBlips() {
    const flash = Math.floor(this.time * 4) % 2;
    return this.vehicles
      .filter((v) => v.type === 'police' && v.driverKind === 'police' && !v.destroyed)
      .map((v) => ({ x: v.pos.x, z: v.pos.z, color: flash ? '#e63946' : '#3a86ff', size: 4 }));
  }

  updateHUD(dt) {
    const hud = this.hud;
    const pl = this.player;
    const v = pl.vehicle;
    hud.update(dt);
    hud.setHealth(pl.health);
    hud.setStars(this.police.stars, this.police.evading);
    hud.setBust(this.police.bust / (v ? 3 : 1.8));
    hud.setVehicle(v);
    hud.setClock(this.sky.clock);
    this.locTimer -= dt;
    if (this.locTimer <= 0) {
      this.locTimer = 0.3;
      const p = this.playerPos;
      const district = DISTRICTS.find((d) => p.x >= d.x0 && p.x < d.x1 && p.z >= d.z0 && p.z < d.z1)?.name || 'Monrovia';
      hud.setLocation(this.roads.streetAt(p.x, p.z), district);
      // context help
      if (!v && !this.dead) {
        const near = this.nearestEnterable();
        if (near && near !== this.lastNear) {
          const steal = near.driverKind === 'ai' || near.driverKind === 'police';
          hud.help(`${this.input.touch ? 'Tap <b>CAR</b>' : 'Press <kbd>F</kbd>'} to ${steal ? 'jack' : 'get in'} the <b>${near.spec.name}</b>`, 2);
        }
        this.lastNear = near;
      } else {
        this.lastNear = null;
      }
    }
    const p = this.playerPos;
    const blips = [
      ...SPRAY_SHOPS.map((s) => ({ x: s.x, z: s.z, color: '#ff006e', size: 5, shape: 'square' })),
      { x: HOSPITAL_SPAWN.x, z: HOSPITAL_SPAWN.z, color: '#ffffff', size: 4, shape: 'square' },
      ...this.pickups.stars.filter((s) => !s.taken && Math.hypot(s.x - p.x, s.z - p.z) < 45).map((s) => ({ x: s.x, z: s.z, color: '#ffffff', size: 3 })),
      ...this.policeBlips(),
      ...this.missions.blips(),
    ];
    const heading = v ? v.heading : pl.heading;
    hud.drawMinimap(p.x, p.z, this.cam.yaw, heading, blips, v ? 0.8 + 0.4 * (1 - Math.min(1, Math.abs(v.speed) / 40)) : 1.25);
  }
}

const play = document.getElementById('play');
loadAssets((k) => {
  play.textContent = `Loading Monrovia… ${Math.round(k * 100)}%`;
})
  .then(() => {
    window.game = new Game();
  })
  .catch((err) => {
    console.error(err);
    play.textContent = 'Could not load the game. Reload to try again.';
  });
