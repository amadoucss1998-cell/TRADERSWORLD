import * as THREE from 'three';
import { LANDMARKS, ROAD_HALF, SIDEWALK } from './config.js';

export function makeMarker(color = 0xffd166, radius = 2.4, height = 2.4) {
  const group = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 28, 1, true), m);
  cyl.position.y = height / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.9, radius, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 4), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 }));
  arrow.rotation.x = Math.PI;
  arrow.position.y = height + 2.4;
  group.add(cyl, ring, arrow);
  group.userData = { arrow, base: height + 2.4 };
  return group;
}

const DEFS = [
  {
    id: 'market', name: 'Waterside Hustle', start: [-100, -130], color: '#ffd166', reward: 1200,
    blurb: 'Ma Fatu needs her pepper sacks at Red Light before they spoil.',
  },
  {
    id: 'ducor', name: 'Ducor Dash', start: [-300, -84], color: '#4cc9f0', reward: 2000,
    blurb: 'A street race from Mamba Point to the Executive Mansion.',
  },
  {
    id: 'freeport', name: 'Freeport Run', start: [300, 133], color: '#f72585', reward: 2500,
    blurb: 'A buyer at the docks wants a red Hilux. No questions asked.',
  },
  {
    id: 'heat', name: 'Lose the Heat', start: [-139, -45], color: '#90e0ef', reward: 2000,
    blurb: 'Rattle the LNP, then shake them off.',
  },
];

const RACE = [[-200, -75], [-200, 25], [10, 25], [10, 125], [160, 125], [200, 120]];

export class Missions {
  constructor(game) {
    this.game = game;
    this.defs = DEFS;
    this.active = null;
    this.markers = new Map();
    this.target = makeMarker(0xffd166, 3.2, 3);
    this.target.visible = false;
    game.scene.add(this.target);
    this.cooldownId = null;
    for (const d of DEFS) {
      const mk = makeMarker(new THREE.Color(d.color).getHex());
      mk.position.set(d.start[0], 0, d.start[1]);
      game.scene.add(mk);
      this.markers.set(d.id, mk);
    }
    this.t = 0;
  }

  get done() {
    return this.game.save.done;
  }

  setTarget(x, z, r = 6, color = 0xffd166) {
    this.goal = { x, z, r };
    this.target.visible = true;
    this.target.position.set(x, 0, z);
    this.target.scale.setScalar(r / 3.2);
    this.target.children[0].material.color.set(color);
    this.target.children[1].material.color.set(color);
  }

  clearTarget() {
    this.goal = null;
    this.target.visible = false;
  }

  near(x, z, r) {
    const p = this.game.playerPos;
    return Math.hypot(p.x - x, p.z - z) < r;
  }

  start(def) {
    const g = this.game;
    this.active = { def, step: 0, time: null, data: {} };
    g.hud.big(def.name, def.blurb, 3.5, 'mission');
    g.audio.checkpoint();
    this[`start_${def.id}`](this.active);
  }

  pass(extra = 0) {
    const g = this.game;
    const a = this.active;
    const reward = a.def.reward + extra;
    g.addMoney(reward);
    g.hud.big('MISSION PASSED!', `+L$${reward.toLocaleString()}`, 4, 'passed');
    g.audio.passed();
    if (a.def.id !== 'taxi' && !this.done.includes(a.def.id)) this.done.push(a.def.id);
    g.persist();
    this.end();
  }

  fail(reason) {
    const g = this.game;
    if (!this.active) return;
    g.hud.big('MISSION FAILED', reason, 3.5, 'failed');
    g.audio.failed();
    this.end();
  }

  end() {
    const a = this.active;
    if (a?.data.car) a.data.car.keep = false;
    this.cooldownId = a?.def.id;
    this.active = null;
    this.clearTarget();
    this.game.hud.objective('');
    this.game.hud.timer(null);
  }

  // called by the game when the player is wasted or busted
  onPlayerDown(kind) {
    if (this.active) this.fail(kind === 'busted' ? 'You got busted.' : 'You got wasted.');
  }

  // --- Waterside Hustle ---
  start_market(a) {
    a.step = 0;
    this.setTarget(-130, -121, 6);
  }

  update_market(a, dt) {
    const g = this.game;
    const v = g.player.vehicle;
    if (a.step === 0) {
      g.hud.objective(v ? 'Drive to the market stalls on Water Street to load the pepper sacks.' : 'Get a vehicle, then load the pepper sacks at Waterside Market.');
      if (v && this.near(-130, -121, 7) && Math.abs(v.speed) < 6) {
        a.step = 1;
        a.time = 105;
        g.audio.checkpoint();
        g.hud.toast('Pepper sacks loaded!');
        this.setTarget(520, 75, 7);
      }
    } else {
      a.time -= dt;
      g.hud.objective(v ? 'Deliver the pepper to Red Light Market in Paynesville before it spoils!' : 'Get back in a vehicle!');
      if (a.time <= 0) return this.fail('The pepper spoiled in the heat.');
      if (v && this.near(520, 75, 8)) return this.pass(Math.round(a.time) * 10);
    }
  }

  // --- Ducor Dash ---
  start_ducor(a) {
    const car = this.game.spawnParked('sports', -300, -79, Math.PI / 2, 0xff5400);
    car.keep = true;
    a.data.car = car;
    a.data.cp = 0;
    this.setTarget(car.pos.x, car.pos.z, 3, 0x4cc9f0);
  }

  update_ducor(a, dt) {
    const g = this.game;
    const car = a.data.car;
    if (car.destroyed) return this.fail('The Fine Boy GT got wrecked.');
    if (a.step === 0) {
      g.hud.objective('Get in the orange Fine Boy GT.');
      this.setTarget(car.pos.x, car.pos.z, 3, 0x4cc9f0);
      if (g.player.vehicle === car) {
        a.step = 1;
        a.time = 82;
        g.hud.big('GO!', 'Hit every checkpoint', 1.5, 'mission');
        g.audio.checkpoint();
      }
      return;
    }
    a.time -= dt;
    if (a.time <= 0) return this.fail('Too slow, my man.');
    if (g.player.vehicle !== car) {
      g.hud.objective('Get back in the Fine Boy GT!');
    } else {
      g.hud.objective(`Race checkpoint ${a.data.cp + 1} of ${RACE.length}`);
    }
    const [x, z] = RACE[a.data.cp];
    this.setTarget(x, z, 9, 0x4cc9f0);
    if (g.player.vehicle === car && this.near(x, z, 10)) {
      a.data.cp++;
      g.audio.checkpoint();
      if (a.data.cp >= RACE.length) return this.pass(Math.round(a.time) * 25);
    }
  }

  // --- Freeport Run ---
  start_freeport(a) {
    const car = this.game.spawnParked('pickup', 336, 119.2, -Math.PI / 2, 0xc1121f);
    car.keep = true;
    a.data.car = car;
    this.setTarget(car.pos.x, car.pos.z, 3, 0xf72585);
  }

  update_freeport(a) {
    const g = this.game;
    const car = a.data.car;
    if (car.destroyed) return this.fail('The Hilux is scrap metal now.');
    if (a.step === 0) {
      g.hud.objective('Steal the red Hilux parked on the Coastal Road.');
      this.setTarget(car.pos.x, car.pos.z, 3, 0xf72585);
      if (g.player.vehicle === car) {
        a.step = 1;
        g.police.addHeat(75, 2);
        g.hud.toast('The owner called the police!', 'bad');
        this.setTarget(80, -355, 7, 0xf72585);
      }
      return;
    }
    g.hud.objective(g.player.vehicle === car ? 'Deliver the Hilux to the Freeport docks on Bushrod Island.' : 'Get back in the Hilux!');
    if (g.player.vehicle === car && this.near(80, -355, 8) && Math.abs(car.speed) < 8) {
      const bonus = Math.round(car.health) * 10;
      g.exitVehicle(true);
      car.keep = false;
      car.driverKind = null;
      return this.pass(bonus);
    }
  }

  // --- Lose the Heat ---
  start_heat() {
    this.game.police.setStars(3);
    this.game.hud.toast('You insulted the Inspector General!', 'bad');
  }

  update_heat() {
    const g = this.game;
    g.hud.objective('Lose your wanted level. Spray shops (pink) clear it instantly.');
    if (g.police.stars === 0) return this.pass();
  }

  // --- Taxi side job ---
  startTaxi() {
    const def = { id: 'taxi', name: 'Taxi Driver', reward: 0, blurb: 'Pick up fares around Monrovia. Press T to stop.' };
    this.active = { def, step: 0, time: null, data: { fares: 0, earned: 0 } };
    this.game.hud.big('TAXI DRIVER', def.blurb, 3, 'mission');
    this.newFare();
  }

  newFare() {
    const g = this.game;
    const a = this.active;
    const p = g.playerPos;
    let node = null;
    for (let i = 0; i < 50; i++) {
      const n = g.roads.nodes[Math.floor(Math.random() * g.roads.nodes.length)];
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d > 70 && d < 260 && n.adj.length > 1) {
        node = n;
        break;
      }
    }
    node = node || g.roads.nodes[0];
    const e = node.adj[0].node;
    const pt = g.roads.lanePoint(node, e, 0.5, ROAD_HALF + SIDEWALK / 2);
    a.step = 0;
    a.data.pick = { x: pt.x, z: pt.z };
    a.time = Math.hypot(pt.x - p.x, pt.z - p.z) / 9 + 25;
    this.setTarget(pt.x, pt.z, 6, 0xffd166);
  }

  endTaxi(msg) {
    const a = this.active;
    this.game.hud.big('TAXI JOB OVER', `${a.data.fares} fares · L$${a.data.earned.toLocaleString()} earned${msg ? ` · ${msg}` : ''}`, 4, 'mission');
    this.end();
  }

  update_taxi(a, dt) {
    const g = this.game;
    const v = g.player.vehicle;
    if (!v || v.type !== 'taxi') return this.endTaxi('You left the taxi.');
    a.time -= dt;
    if (a.time <= 0) return this.endTaxi(a.step === 0 ? 'The passenger took a keke instead.' : 'The passenger got out, vex.');
    if (a.step === 0) {
      g.hud.objective('Pick up the passenger waiting on the sidewalk.');
      if (this.near(a.data.pick.x, a.data.pick.z, 8) && Math.abs(v.speed) < 4) {
        const choices = LANDMARKS.filter((l) => Math.hypot(l.pos[0] - v.pos.x, l.pos[1] - v.pos.z) > 150);
        const dest = choices[Math.floor(Math.random() * choices.length)];
        const n = g.roads.nearestNode(dest.pos[0], dest.pos[1]);
        a.data.dest = { x: n.x, z: n.z, name: dest.name };
        const dist = Math.hypot(n.x - v.pos.x, n.z - v.pos.z);
        a.data.fare = Math.round(60 + dist * 1.3);
        a.time = dist / 10 + 22;
        a.step = 1;
        g.audio.checkpoint();
        g.hud.toast(`Passenger: "Take me to ${dest.name}, please."`);
        this.setTarget(n.x, n.z, 8, 0xffd166);
      }
    } else {
      g.hud.objective(`Take the passenger to ${a.data.dest.name}.`);
      if (this.near(a.data.dest.x, a.data.dest.z, 10) && Math.abs(v.speed) < 4) {
        const tip = Math.round(a.time * 4);
        const pay = a.data.fare + tip;
        a.data.fares++;
        a.data.earned += pay;
        g.addMoney(pay);
        g.audio.cash();
        g.hud.toast(`Fare L$${a.data.fare} + tip L$${tip}`, 'good');
        this.newFare();
      }
    }
  }

  update(dt) {
    const g = this.game;
    this.t += dt;
    for (const [id, mk] of this.markers) {
      mk.visible = !this.active;
      void id;
      mk.userData.arrow.position.y = mk.userData.base + Math.sin(this.t * 3) * 0.3;
      mk.userData.arrow.rotation.y = this.t * 2;
    }
    this.target.userData.arrow.position.y = this.target.userData.base + Math.sin(this.t * 3) * 0.3;
    this.target.userData.arrow.rotation.y = this.t * 2;

    if (!this.active) {
      g.hud.timer(null);
      for (const d of DEFS) {
        const inside = this.near(d.start[0], d.start[1], 2.6);
        if (inside && this.cooldownId !== d.id && !g.dead) {
          if (d.id === 'heat' || g.police.stars === 0) this.start(d);
          else g.hud.help('Lose the police before starting a mission.', 1);
          break;
        }
        if (!inside && this.cooldownId === d.id) this.cooldownId = null;
      }
      return;
    }
    const a = this.active;
    this[`update_${a.def.id}`](a, dt);
    if (this.active) g.hud.timer(this.active.time);
  }

  blips() {
    const out = [];
    if (!this.active) {
      for (const d of DEFS) out.push({ x: d.start[0], z: d.start[1], color: d.color, size: 6, shape: 'square', edge: true });
    }
    if (this.goal) out.push({ x: this.goal.x, z: this.goal.z, color: '#ffd166', size: 6, edge: true });
    return out;
  }
}
