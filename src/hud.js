import { LAND, LANDMARKS, SPRAY_SHOPS } from './config.js';

const X0 = -400;
const Z0 = -450;
const X1 = 620;
const Z1 = 200;
const S = 2; // base map pixels per metre

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor(roads, collision) {
    this.el = {
      money: $('money'), stars: $('stars'), health: $('health-fill'), clock: $('clock'),
      street: $('street'), district: $('district'), center: $('center-msg'), centerTitle: $('center-title'),
      centerSub: $('center-sub'), objective: $('objective'), timer: $('timer'), help: $('helpbox'),
      car: $('carinfo'), carName: $('car-name'), speed: $('speed'), carHealth: $('car-health-fill'),
      mini: $('minimap'), bigmap: $('bigmap'), bigCanvas: $('bigmap-canvas'), toasts: $('toasts'),
      flash: $('flash'), bust: $('bust-fill'), bustWrap: $('bust'),
      crosshair: $('crosshair'), weapon: $('weapon-name'), ammo: $('ammo'),
    };
    this.moneyShown = 0;
    this.moneyTarget = 0;
    this.centerTimer = 0;
    this.helpTimer = 0;
    this.lastStars = -1;
    this.base = this.renderBase(roads, collision);
    this.miniCtx = this.el.mini.getContext('2d');
  }

  renderBase(roads, collision) {
    const c = document.createElement('canvas');
    c.width = (X1 - X0) * S;
    c.height = (Z1 - Z0) * S;
    const g = c.getContext('2d');
    g.fillStyle = '#1d5470';
    g.fillRect(0, 0, c.width, c.height);
    const R = (x0, z0, x1, z1) => g.fillRect((x0 - X0) * S, (z0 - Z0) * S, (x1 - x0) * S, (z1 - z0) * S);
    for (const l of LAND) {
      g.fillStyle = l.type === 'sand' ? '#d9c38c' : l.type === 'bridge' ? '#9a9a96' : '#6f8a4e';
      R(l.x0, l.z0, l.x1, l.z1);
    }
    for (const l of LAND) if (l.type === 'ground') { g.fillStyle = '#6f8a4e'; R(l.x0, l.z0, l.x1, l.z1); }
    g.fillStyle = 'rgba(40,45,35,0.45)';
    for (const b of collision.boxes) if (b.h > 2.5 && b.x1 - b.x0 < 80) R(b.x0, b.z0, b.x1, b.z1);
    g.fillStyle = '#e6e2d6';
    for (const r of roads.rects) R(r.x0, r.z0, r.x1, r.z1);
    return c;
  }

  toMap(x, z) {
    return [(x - X0) * S, (z - Z0) * S];
  }

  setMoney(n, instant = false) {
    this.moneyTarget = n;
    if (instant) this.moneyShown = n;
  }

  setHealth(h) {
    this.el.health.style.width = `${Math.max(0, h)}%`;
    this.el.health.classList.toggle('low', h < 30);
  }

  setStars(n, evading) {
    if (n !== this.lastStars || evading !== this.lastEvading) {
      this.el.stars.innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join('');
      this.lastStars = n;
      this.lastEvading = evading;
      this.el.stars.classList.toggle('evading', !!evading);
    }
  }

  flashStars() {
    this.el.stars.classList.remove('pulse');
    void this.el.stars.offsetWidth;
    this.el.stars.classList.add('pulse');
  }

  setWeapon(name, ammo, aiming) {
    const label = name === 'pistol' ? 'PISTOL' : 'FISTS';
    if (this.el.weapon.textContent !== label) this.el.weapon.textContent = label;
    const a = name === 'pistol' || ammo > 0 ? `${ammo}` : '';
    if (this.el.ammo.textContent !== a) this.el.ammo.textContent = a;
    this.el.crosshair.hidden = !aiming;
  }

  setBust(k) {
    this.el.bustWrap.hidden = k <= 0.01;
    this.el.bust.style.width = `${Math.min(100, k * 100)}%`;
  }

  setVehicle(v) {
    if (!v) {
      this.el.car.hidden = true;
      return;
    }
    this.el.car.hidden = false;
    this.el.carName.textContent = v.spec.name;
    this.el.speed.textContent = Math.round(Math.abs(v.speed) * 3.6);
    this.el.carHealth.style.width = `${Math.max(0, v.health)}%`;
    this.el.carHealth.classList.toggle('low', v.health < 30);
  }

  setLocation(street, district) {
    if (this.el.street.textContent !== (street || '')) this.el.street.textContent = street || '';
    if (this.el.district.textContent !== district) this.el.district.textContent = district;
  }

  setClock(s) {
    this.el.clock.textContent = s;
  }

  big(title, sub = '', seconds = 3, cls = '') {
    this.el.centerTitle.textContent = title;
    this.el.centerSub.textContent = sub;
    this.el.center.className = cls;
    this.el.center.hidden = false;
    this.centerTimer = seconds;
  }

  objective(text) {
    this.el.objective.textContent = text || '';
    this.el.objective.hidden = !text;
  }

  timer(seconds) {
    if (seconds == null) {
      this.el.timer.hidden = true;
      return;
    }
    this.el.timer.hidden = false;
    const s = Math.max(0, Math.ceil(seconds));
    this.el.timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    this.el.timer.classList.toggle('low', s <= 10);
  }

  help(text, seconds = 4) {
    this.el.help.innerHTML = text;
    this.el.help.hidden = false;
    this.helpTimer = seconds;
  }

  toast(text, cls = '') {
    const d = document.createElement('div');
    d.className = `toast ${cls}`;
    d.textContent = text;
    this.el.toasts.appendChild(d);
    setTimeout(() => d.classList.add('out'), 2200);
    setTimeout(() => d.remove(), 2800);
  }

  flash(color = 'rgba(255,0,0,0.35)') {
    const f = this.el.flash;
    f.style.background = color;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  update(dt) {
    if (this.moneyShown !== this.moneyTarget) {
      const diff = this.moneyTarget - this.moneyShown;
      const step = Math.sign(diff) * Math.max(1, Math.abs(diff) * Math.min(1, dt * 6));
      this.moneyShown = Math.abs(step) >= Math.abs(diff) ? this.moneyTarget : Math.round(this.moneyShown + step);
      this.el.money.textContent = `L$${this.moneyShown.toLocaleString()}`;
    }
    if (this.centerTimer > 0) {
      this.centerTimer -= dt;
      if (this.centerTimer <= 0) this.el.center.hidden = true;
    }
    if (this.helpTimer > 0) {
      this.helpTimer -= dt;
      if (this.helpTimer <= 0) this.el.help.hidden = true;
    }
  }

  // blips: [{x, z, color, size, shape: 'dot'|'square'|'star', edge: bool}]
  drawMinimap(px, pz, yaw, heading, blips, zoom = 1) {
    const g = this.miniCtx;
    const W = this.el.mini.width;
    const R = W / 2;
    const k = 0.6 * zoom; // screen px per base px
    g.save();
    g.clearRect(0, 0, W, W);
    g.beginPath();
    g.arc(R, R, R - 2, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = '#1d5470';
    g.fillRect(0, 0, W, W);
    g.translate(R, R);
    g.rotate(yaw - Math.PI);
    g.scale(k, k);
    const [mx, my] = this.toMap(px, pz);
    g.drawImage(this.base, -mx, -my);
    const lim = (R - 8) / k;
    for (const b of blips) {
      let [bx, by] = this.toMap(b.x, b.z);
      bx -= mx;
      by -= my;
      const d = Math.hypot(bx, by);
      if (d > lim) {
        if (!b.edge) continue;
        bx *= lim / d;
        by *= lim / d;
      }
      g.fillStyle = b.color;
      g.strokeStyle = '#000';
      g.lineWidth = 1.5 / k;
      const s = (b.size || 4) / k;
      g.beginPath();
      if (b.shape === 'square') g.rect(bx - s, by - s, s * 2, s * 2);
      else g.arc(bx, by, s, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    // player arrow
    g.rotate(Math.atan2(Math.cos(heading), Math.sin(heading)));
    g.fillStyle = '#fff';
    g.strokeStyle = '#000';
    g.lineWidth = 1.5 / k;
    g.beginPath();
    const a = 8 / k;
    g.moveTo(a * 1.2, 0);
    g.lineTo(-a * 0.8, a * 0.75);
    g.lineTo(-a * 0.4, 0);
    g.lineTo(-a * 0.8, -a * 0.75);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
    // north marker
    const th = yaw - Math.PI;
    const nx = R + Math.sin(th) * (R - 13);
    const ny = R - Math.cos(th) * (R - 13);
    g.fillStyle = '#111';
    g.beginPath();
    g.arc(nx, ny, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 12px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('N', nx, ny + 1);
  }

  toggleBigMap(show, px, pz, blips) {
    this.el.bigmap.hidden = !show;
    if (!show) return;
    const c = this.el.bigCanvas;
    const g = c.getContext('2d');
    const scale = Math.min(c.width / this.base.width, c.height / this.base.height);
    g.fillStyle = '#1d5470';
    g.fillRect(0, 0, c.width, c.height);
    const ox = (c.width - this.base.width * scale) / 2;
    const oy = (c.height - this.base.height * scale) / 2;
    g.drawImage(this.base, ox, oy, this.base.width * scale, this.base.height * scale);
    const T = (x, z) => {
      const [a, b] = this.toMap(x, z);
      return [ox + a * scale, oy + b * scale];
    };
    g.font = '600 13px system-ui, sans-serif';
    g.textAlign = 'center';
    for (const l of LANDMARKS) {
      const [x, y] = T(l.pos[0], l.pos[1]);
      g.fillStyle = '#ffd166';
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,0.75)';
      const w = g.measureText(l.name).width + 8;
      const lx = Math.min(c.width - w / 2 - 4, Math.max(w / 2 + 4, x));
      g.fillRect(lx - w / 2, y - 22, w, 16);
      g.fillStyle = '#fff';
      g.fillText(l.name, lx, y - 10);
    }
    for (const s of SPRAY_SHOPS) {
      const [x, y] = T(s.x, s.z);
      g.fillStyle = '#ff006e';
      g.fillRect(x - 5, y - 5, 10, 10);
    }
    for (const b of blips) {
      const [x, y] = T(b.x, b.z);
      g.fillStyle = b.color;
      g.strokeStyle = '#000';
      g.beginPath();
      g.arc(x, y, (b.size || 4) + 1, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    const [x, y] = T(px, pz);
    g.fillStyle = '#fff';
    g.strokeStyle = '#000';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
}
