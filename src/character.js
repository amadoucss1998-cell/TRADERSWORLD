import * as THREE from 'three';
import { MeshBuilder, makeMatrix } from './utils.js';

const unit = new THREE.BoxGeometry(1, 1, 1);
const sharedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });

export const SKIN_TONES = [0x4a2c1d, 0x5c3824, 0x3b2216, 0x6b4128, 0x2e1a10];
export const SHIRTS = [0xe63946, 0xf4a261, 0x2a9d8f, 0xffd166, 0x118ab2, 0xef476f, 0x06d6a0, 0xffffff, 0x8338ec, 0xfb5607, 0x3a86ff, 0x222222];
export const PANTS = [0x22223b, 0x3d405b, 0x6b705c, 0x1d3557, 0x463f3a, 0xc9ada7, 0x111111];

// Each limb is one vertex-coloured mesh, so a person costs six draw calls.
function limb(parts) {
  const b = new MeshBuilder();
  for (const [color, x, y, z, sx, sy, sz] of parts) b.addGeometry(unit, makeMatrix(x, y, z, 0, 0, 0, sx, sy, sz), color);
  const m = new THREE.Mesh(b.build(), sharedMat);
  m.castShadow = true;
  return m;
}

// A blocky low-poly person with swinging limbs. Facing +z.
export function createHuman({ skin, shirt, pants, hair = 0x111111, cap = null, scale = 1 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const leg = () => limb([
    [pants, 0, -0.45, 0, 0.2, 0.9, 0.22],
    [0x1a1a1a, 0, -0.88, 0.04, 0.21, 0.1, 0.32],
  ]);
  const arm = () => limb([
    [shirt, 0, -0.33, 0, 0.16, 0.66, 0.18],
    [skin, 0, -0.74, 0, 0.14, 0.16, 0.14],
  ]);
  const legL = leg();
  const legR = leg();
  legL.position.set(-0.13, 0.95, 0);
  legR.position.set(0.13, 0.95, 0);
  const torso = limb([[shirt, 0, 0, 0, 0.52, 0.66, 0.3]]);
  torso.position.set(0, 1.28, 0);
  const armL = arm();
  const armR = arm();
  armL.position.set(-0.35, 1.56, 0);
  armR.position.set(0.35, 1.56, 0);
  const headParts = [
    [skin, 0, 0, 0, 0.28, 0.3, 0.28],
    [hair, 0, 0.17, 0, 0.3, 0.1, 0.3],
    [0xffffff, -0.07, 0.03, 0.145, 0.05, 0.04, 0.02],
    [0xffffff, 0.07, 0.03, 0.145, 0.05, 0.04, 0.02],
  ];
  if (cap !== null) headParts.push([cap, 0, 0.2, 0.05, 0.32, 0.08, 0.42]);
  const head = limb(headParts);
  head.position.set(0, 1.78, 0);
  body.add(legL, legR, torso, armL, armR, head);
  g.scale.setScalar(scale);

  return {
    group: g,
    body,
    parts: { legL, legR, armL, armR, torso, head },
    phase: Math.random() * 10,
    punch: 0,
    // speed in m/s drives the gait
    animate(dt, speed, airborne = false) {
      const p = this.parts;
      if (airborne) {
        p.legL.rotation.x = -0.5;
        p.legR.rotation.x = 0.3;
        p.armL.rotation.x = -2.4;
        p.armR.rotation.x = -2.4;
        return;
      }
      this.phase += dt * (2 + speed * 1.9);
      const amp = Math.min(1, speed / 6) * 0.9;
      const s = Math.sin(this.phase);
      p.legL.rotation.x = s * amp;
      p.legR.rotation.x = -s * amp;
      p.armL.rotation.x = -s * amp * 0.9;
      p.armR.rotation.x = s * amp * 0.9;
      body.position.y = Math.abs(Math.cos(this.phase)) * amp * 0.08;
      if (this.punch > 0) {
        this.punch -= dt;
        const k = Math.sin((Math.max(0, this.punch) / 0.3) * Math.PI);
        p.armR.rotation.x = -1.6 * k - 0.2;
        p.torso.rotation.y = -0.3 * k;
      } else {
        p.torso.rotation.y = 0;
      }
    },
    // knocked down: lie flat
    downPose() {
      body.rotation.x = -Math.PI / 2;
      body.position.y = 0.2;
      body.position.z = -0.9;
    },
    resetPose() {
      body.rotation.set(0, 0, 0);
      body.position.set(0, 0, 0);
    },
  };
}
