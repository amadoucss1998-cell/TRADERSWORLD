import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { assets, skinnedTexture, PEOPLE_MODELS } from './assets.js';

// Liberian skin tones, applied to the character textures.
export const SKIN_TONES = [0x8d5524, 0x7a4a2c, 0x9c6b43, 0x6e4128, 0xa0704a, 0x5e3a22];

const HEIGHT = 1.75;
const BONES = ['Hips', 'Spine', 'Chest', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg'];
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const qc = new THREE.Quaternion();
const fit = new Map();

function fitFor(model) {
  if (!fit.has(model)) {
    const box = new THREE.Box3().setFromObject(assets.people[model], true);
    const h = box.max.y - box.min.y || 1;
    fit.set(model, { scale: HEIGHT / h, y: -box.min.y * (HEIGHT / h) });
  }
  return fit.get(model);
}

// A rigged Kenney character posed procedurally (walk, run, idle, punch, fall). Faces +z.
export function createHuman({ model = PEOPLE_MODELS[0], skin = SKIN_TONES[0], shirtHue = null, scale = 1 } = {}) {
  const obj = cloneSkinned(assets.people[model]);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    const m = o.material.clone();
    if (m.map) m.map = skinnedTexture(model, o.material.map, skin, shirtHue);
    // the baked vertex colours darken faces under game lighting; a little self-light keeps faces readable
    m.vertexColors = false;
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveMap = m.map;
    m.emissiveIntensity = 0.18;
    o.material = m;
  });
  obj.updateMatrixWorld(true);
  const bones = {};
  const rootQInv = obj.getWorldQuaternion(new THREE.Quaternion()).invert();
  for (const name of BONES) {
    const b = obj.getObjectByName(name);
    if (!b) continue;
    const P = b.parent.getWorldQuaternion(new THREE.Quaternion()).premultiply(rootQInv);
    bones[name] = { b, rest: b.quaternion.clone(), P, Pinv: P.clone().invert() };
  }
  const f = fitFor(model);
  const g = new THREE.Group();
  const body = new THREE.Group();
  obj.scale.setScalar(f.scale);
  obj.position.y = f.y;
  body.add(obj);
  g.add(body);
  g.scale.setScalar(scale);

  // rotate a bone by a model-space rotation q, measured from its rest pose
  // a pistol held in the right hand, shown while aiming
  const gun = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.6 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.22), gunMat);
  slide.position.set(0, 0.02, 0.06);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.06), gunMat);
  grip.position.set(0, -0.05, -0.02);
  grip.rotation.x = 0.25;
  gun.add(slide, grip);
  gun.visible = false;
  g.add(gun);

  const pose = (name, q) => {
    const e = bones[name];
    if (!e) return;
    e.b.quaternion.copy(e.Pinv).multiply(q).multiply(e.P).multiply(e.rest);
  };
  const rot = (axis, a, out = new THREE.Quaternion()) => out.setFromAxisAngle(axis, a);

  return {
    group: g,
    body,
    phase: Math.random() * 10,
    punch: 0,
    aiming: false,
    gun,
    animate(dt, speed, airborne = false) {
      const run = Math.min(1, Math.max(0, (speed - 4.5) / 3));
      const amp = Math.min(1, speed / 4.4) * (0.55 + run * 0.35);
      this.phase += dt * (speed > 0.1 ? 3.2 + speed * 1.15 : 1.4);
      const s = Math.sin(this.phase);
      const c = Math.cos(this.phase);
      if (airborne) {
        pose('LeftUpLeg', rot(X, -0.7));
        pose('RightUpLeg', rot(X, 0.2));
        pose('LeftLeg', rot(X, 0.9));
        pose('RightLeg', rot(X, 0.5));
        pose('LeftArm', rot(Z, 0.4));
        pose('RightArm', rot(Z, -0.4));
        return;
      }
      const idle = speed < 0.1 ? Math.sin(this.phase) * 0.03 : 0;
      // legs
      pose('LeftUpLeg', rot(X, -s * amp * 0.9));
      pose('RightUpLeg', rot(X, s * amp * 0.9));
      pose('LeftLeg', rot(X, Math.max(0, -c) * amp * (1.1 + run * 0.6)));
      pose('RightLeg', rot(X, Math.max(0, c) * amp * (1.1 + run * 0.6)));
      // arms hang from the T-pose, swing opposite to the legs
      const lower = 1.25;
      rot(Z, -lower, qa);
      pose('LeftArm', qb.setFromAxisAngle(X, s * amp * 0.8 + idle).multiply(qa));
      rot(Z, lower, qa);
      let right = qb.setFromAxisAngle(X, -s * amp * 0.8 - idle).multiply(qa);
      if (this.punch > 0) {
        this.punch -= dt;
        const k = Math.sin((Math.max(0, this.punch) / 0.3) * Math.PI);
        right = qc.copy(right).slerp(rot(Y, 1.45, qa), k);
      }
      if (this.aiming) right = rot(Y, 1.5, qc);
      pose('RightArm', right);
      const elbow = 0.25 + run * 0.9;
      pose('LeftForeArm', rot(Y, -elbow));
      pose('RightForeArm', rot(Y, this.punch > 0 || this.aiming ? 0 : elbow));
      gun.visible = this.aiming;
      if (this.aiming) gun.position.set(-0.18, 1.42, 0.62);
      pose('Spine', rot(X, run * 0.22 + idle));
      body.position.y = Math.abs(c) * amp * 0.07;
    },
    // knocked down: lie flat on the back
    downPose() {
      body.rotation.x = -Math.PI / 2;
      body.position.y = 0.2;
      body.position.z = -0.9;
      pose('LeftArm', rot(Z, -0.3));
      pose('RightArm', rot(Z, 0.3));
      pose('LeftUpLeg', rot(X, -0.1));
      pose('RightUpLeg', rot(X, 0.15));
    },
    resetPose() {
      body.rotation.set(0, 0, 0);
      body.position.set(0, 0, 0);
    },
  };
}
