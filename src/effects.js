import * as THREE from 'three';

// GPU point particles for smoke, fire, sparks and explosions.
export class Particles {
  constructor(scene, max = 600) {
    this.max = max;
    this.items = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float size; attribute vec4 color; varying vec4 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec4 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          gl_FragColor = vec4(vColor.rgb, vColor.a * smoothstep(0.5, 0.15, d));
        }`,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.geo = g;
  }

  spawn(x, y, z, { vx = 0, vy = 1, vz = 0, life = 1.5, size = 1, grow = 1, color = [0.5, 0.5, 0.5], alpha = 0.6, gravity = 0 } = {}) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push({ x, y, z, vx, vy, vz, life, maxLife: life, size, grow, color, alpha, gravity });
  }

  smoke(x, y, z, dark = false) {
    const c = dark ? 0.12 : 0.55;
    this.spawn(x, y, z, {
      vx: (Math.random() - 0.5) * 0.8, vy: 1.5 + Math.random(), vz: (Math.random() - 0.5) * 0.8,
      life: 1.8, size: 1.2, grow: 2.5, color: [c, c, c], alpha: 0.5,
    });
  }

  fire(x, y, z) {
    this.spawn(x + (Math.random() - 0.5), y, z + (Math.random() - 0.5), {
      vx: (Math.random() - 0.5) * 0.6, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 0.6,
      life: 0.6, size: 1.4, grow: -1.2, color: [1, 0.45 + Math.random() * 0.3, 0.1], alpha: 0.9,
    });
  }

  explosion(x, z) {
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 3 + Math.random() * 10;
      this.spawn(x, 1, z, {
        vx: Math.cos(a) * s, vy: 2 + Math.random() * 9, vz: Math.sin(a) * s, life: 0.9 + Math.random() * 0.6,
        size: 2.5, grow: 2, color: [1, 0.35 + Math.random() * 0.4, 0.05], alpha: 1, gravity: -6,
      });
    }
    for (let i = 0; i < 30; i++) this.smoke(x + (Math.random() - 0.5) * 3, 1 + Math.random() * 2, z + (Math.random() - 0.5) * 3, true);
  }

  sparks(x, y, z) {
    for (let i = 0; i < 8; i++) {
      this.spawn(x, y, z, {
        vx: (Math.random() - 0.5) * 8, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 8,
        life: 0.35, size: 0.35, grow: 0, color: [1, 0.85, 0.4], alpha: 1, gravity: -15,
      });
    }
  }

  dust(x, z) {
    this.spawn(x, 0.3, z, {
      vx: (Math.random() - 0.5), vy: 0.6, vz: (Math.random() - 0.5), life: 0.9, size: 0.8, grow: 1.6,
      color: [0.62, 0.45, 0.32], alpha: 0.35,
    });
  }

  update(dt) {
    let n = 0;
    const out = [];
    for (const p of this.items) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y = Math.max(0.05, p.y + p.vy * dt);
      p.z += p.vz * dt;
      p.size = Math.max(0.05, p.size + p.grow * dt);
      out.push(p);
      const k = p.life / p.maxLife;
      this.pos[n * 3] = p.x;
      this.pos[n * 3 + 1] = p.y;
      this.pos[n * 3 + 2] = p.z;
      this.col[n * 4] = p.color[0];
      this.col[n * 4 + 1] = p.color[1];
      this.col[n * 4 + 2] = p.color[2];
      this.col[n * 4 + 3] = p.alpha * k;
      this.size[n] = p.size;
      n++;
    }
    this.items = out;
    this.geo.setDrawRange(0, n);
    for (const k of ['position', 'color', 'size']) this.geo.attributes[k].needsUpdate = true;
  }
}
