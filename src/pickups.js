import * as THREE from 'three';
import { mulberry32 } from './utils.js';
import { onLand } from './collision.js';

function starShape(r = 0.7) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export const LONE_STAR_COUNT = 24;

// Hidden Lone Star tokens (the star from the Liberian flag) and cash dropped in the street.
export class Pickups {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.stars = [];
    this.cash = [];
    const starGeo = new THREE.ExtrudeGeometry(starShape(0.8), { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }).center();
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.3 });
    const discGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.12, 24).rotateX(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x002868, emissive: 0x002868, emissiveIntensity: 0.5 });
    this.cashGeo = new THREE.BoxGeometry(0.7, 0.12, 0.35);
    this.cashMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, emissive: 0x2d6a4f, emissiveIntensity: 0.5 });

    // place stars deterministically in open spots
    const rand = mulberry32(26071847);
    const { collision, roads } = game;
    let tries = 0;
    while (this.stars.length < LONE_STAR_COUNT && tries++ < 5000) {
      const x = -360 + rand() * 950;
      const z = -425 + rand() * 600;
      if (!onLand(x, z, 3)) continue;
      if (collision.pointInside(x, 1, z) || collision.query(x, z, 2.5).some((b) => x > b.x0 - 1.5 && x < b.x1 + 1.5 && z > b.z0 - 1.5 && z < b.z1 + 1.5)) continue;
      if (roads.onRoad(x, z, -1)) continue;
      if (this.stars.some((s) => Math.hypot(s.x - x, s.z - z) < 60)) continue;
      const id = this.stars.length;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(discGeo, discMat), new THREE.Mesh(starGeo, starMat));
      g.children[1].position.z = 0.1;
      const back = new THREE.Mesh(starGeo, starMat);
      back.position.z = -0.1;
      back.rotation.y = Math.PI;
      g.add(back);
      g.position.set(x, 1.4, z);
      game.scene.add(g);
      this.stars.push({ id, x, z, mesh: g, taken: false });
    }
    for (const s of this.stars) {
      if (game.save.stars.includes(s.id)) {
        s.taken = true;
        s.mesh.visible = false;
      }
    }
  }

  // Ammo crates: fixed spots that refill after a minute.
  placeAmmo() {
    const g = this.game;
    const rand = mulberry32(4471);
    const geo = new THREE.BoxGeometry(0.9, 0.55, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4b5320, roughness: 0.7 });
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.62), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.4 }));
    this.ammo = [];
    let tries = 0;
    while (this.ammo.length < 10 && tries++ < 4000) {
      const x = -340 + rand() * 900;
      const z = -420 + rand() * 580;
      if (!onLand(x, z, 3) || g.roads.onRoad(x, z, -1) || !g.roads.onRoad(x, z, 6)) continue;
      if (g.collision.query(x, z, 1.5).some((b) => x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1)) continue;
      if (this.ammo.some((a) => Math.hypot(a.x - x, a.z - z) < 80)) continue;
      const m = new THREE.Group();
      const crate = new THREE.Mesh(geo, mat);
      crate.castShadow = true;
      m.add(crate, band.clone());
      m.position.set(x, 0.3, z);
      g.scene.add(m);
      this.ammo.push({ x, z, mesh: m, wait: 0 });
    }
  }

  dropCash(x, z, amount) {
    const m = new THREE.Mesh(this.cashGeo, this.cashMat);
    m.position.set(x, 0.3, z);
    this.game.scene.add(m);
    this.cash.push({ x, z, amount, mesh: m, life: 30 });
  }

  get collected() {
    return this.stars.filter((s) => s.taken).length;
  }

  update(dt) {
    const g = this.game;
    this.t += dt;
    const p = g.playerPos;
    const r = g.player.vehicle ? 3 : 1.6;
    for (const s of this.stars) {
      if (s.taken) continue;
      s.mesh.rotation.y = this.t * 2;
      s.mesh.position.y = 1.4 + Math.sin(this.t * 2 + s.id) * 0.2;
      if (Math.abs(p.x - s.x) < r && Math.abs(p.z - s.z) < r) {
        s.taken = true;
        s.mesh.visible = false;
        g.save.stars.push(s.id);
        const n = this.collected;
        g.addMoney(250);
        g.audio.pickup();
        g.hud.toast(`Lone Star ${n}/${LONE_STAR_COUNT} found  +L$250`, 'good');
        if (n === LONE_STAR_COUNT) {
          g.addMoney(5000);
          g.hud.big('ALL LONE STARS FOUND!', '+L$5,000 · The Lone Star forever!', 5, 'passed');
          g.audio.passed();
        }
        g.persist();
      }
    }
    if (!this.ammo) this.placeAmmo();
    for (const a of this.ammo) {
      if (a.wait > 0) {
        a.wait -= dt;
        a.mesh.visible = a.wait <= 0;
        continue;
      }
      a.mesh.rotation.y += dt;
      if (!g.player.vehicle && Math.abs(p.x - a.x) < 1.6 && Math.abs(p.z - a.z) < 1.6) {
        a.wait = 60;
        a.mesh.visible = false;
        g.combat.addAmmo(24);
        g.audio.pickup();
        g.hud.toast('Pistol ammo +24  (press Tab for the pistol)', 'good');
      }
    }
    for (const c of this.cash) {
      c.life -= dt;
      c.mesh.rotation.y += dt * 3;
      if (Math.abs(p.x - c.x) < r && Math.abs(p.z - c.z) < r && !g.player.vehicle) {
        c.life = 0;
        g.addMoney(c.amount);
        g.audio.cash();
      }
      if (c.life <= 0) g.scene.remove(c.mesh);
    }
    this.cash = this.cash.filter((c) => c.life > 0);
  }

  ammoBlips() {
    return (this.ammo || []).filter((a) => a.wait <= 0).map((a) => ({ x: a.x, z: a.z, color: '#9acd32', size: 3, shape: 'square' }));
  }

  blips(showAll) {
    if (!showAll) return [];
    return this.stars.filter((s) => !s.taken).map((s) => ({ x: s.x, z: s.z, color: '#ffffff', size: 3 }));
  }
}
