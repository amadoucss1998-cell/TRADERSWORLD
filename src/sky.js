import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

// [hour, skyTop, horizon, sunColor, sunIntensity, hemiIntensity]
const KEYS = [
  [0, 0x050a1a, 0x0e1a33, 0x8899ff, 0.0, 0.35],
  [5, 0x0a1530, 0x1c2b4f, 0x8899ff, 0.0, 0.35],
  [6.2, 0x3a5a8c, 0xf4a261, 0xffb27a, 0.8, 0.6],
  [8, 0x2f7fd6, 0xbfe3f5, 0xfff1d6, 2.6, 1.0],
  [16.5, 0x2f7fd6, 0xbfe3f5, 0xfff1d6, 2.6, 1.0],
  [18.3, 0x3d3a6b, 0xff7b54, 0xff9a5a, 1.0, 0.65],
  [19.4, 0x0c1430, 0x2b2d5c, 0x8899ff, 0.0, 0.4],
  [24, 0x050a1a, 0x0e1a33, 0x8899ff, 0.0, 0.35],
];

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.hour = 9;
    this.night = 0;
    this.uniforms = {
      top: { value: new THREE.Color() },
      horizon: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunCol: { value: new THREE.Color() },
    };
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(3000, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: this.uniforms,
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 c = mix(horizon, top, pow(max(h,0.0), 0.55));
            float s = max(dot(normalize(vDir), sunDir), 0.0);
            c += sunCol * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.25);
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    dome.renderOrder = -1;
    dome.frustumCulled = false;
    scene.add(dome);
    this.dome = dome;

    // stars
    const sp = [];
    for (let i = 0; i < 1500; i++) {
      const v = new THREE.Vector3().randomDirection();
      if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
      v.multiplyScalar(2500);
      sp.push(v.x, v.y, v.z);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
    this.stars.frustumCulled = false;
    scene.add(this.stars);

    this.moon = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf5f3ce, fog: false }));
    scene.add(this.moon);

    this.hemi = new THREE.HemisphereLight(0xbfe3f5, 0x5a4a32, 1);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -110;
    sc.right = 110;
    sc.top = 110;
    sc.bottom = -110;
    sc.near = 1;
    sc.far = 600;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.05;
    scene.add(this.sun, this.sun.target);
    this.moonLight = new THREE.DirectionalLight(0x8899ff, 0);
    scene.add(this.moonLight, this.moonLight.target);
    scene.fog = new THREE.Fog(0xbfe3f5, 220, 1500);
    this.tmpA = new THREE.Color();
    this.tmpB = new THREE.Color();
  }

  sample(hour) {
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hour) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = clamp((hour - a[0]) / (b[0] - a[0]), 0, 1);
    const mix = (ca, cb) => new THREE.Color(ca).lerp(new THREE.Color(cb), t);
    return { top: mix(a[1], b[1]), horizon: mix(a[2], b[2]), sunCol: mix(a[3], b[3]), sunI: lerp(a[4], b[4], t), hemiI: lerp(a[5], b[5], t) };
  }

  update(dt, center, hoursPerSecond) {
    this.hour = (this.hour + dt * hoursPerSecond) % 24;
    const k = this.sample(this.hour);
    const ang = ((this.hour - 6) / 12) * Math.PI; // 6am rise, 6pm set
    const dir = new THREE.Vector3(Math.cos(ang) * 0.8, Math.sin(ang), 0.45).normalize();
    this.uniforms.top.value.copy(k.top);
    this.uniforms.horizon.value.copy(k.horizon);
    this.uniforms.sunDir.value.copy(dir);
    this.uniforms.sunCol.value.copy(k.sunCol).multiplyScalar(dir.y > -0.05 ? 1 : 0);
    this.night = clamp(1 - k.sunI / 1.2, 0, 1);
    this.sun.color.copy(k.sunCol);
    this.sun.intensity = k.sunI;
    this.sun.position.set(center.x + dir.x * 300, Math.max(dir.y, 0.15) * 300, center.z + dir.z * 300);
    this.sun.target.position.set(center.x, 0, center.z);
    this.hemi.intensity = k.hemiI;
    this.hemi.color.copy(k.horizon).lerp(new THREE.Color(0xffffff), 0.4);
    this.moonLight.intensity = this.night * 0.5;
    this.moonLight.position.set(center.x - dir.x * 300, 200, center.z - 100);
    this.moonLight.target.position.set(center.x, 0, center.z);
    this.scene.fog.color.copy(k.horizon);
    this.stars.material.opacity = this.night;
    this.stars.position.set(center.x, 0, center.z);
    this.dome.position.set(center.x, 0, center.z);
    this.moon.visible = this.night > 0.2;
    this.moon.position.set(center.x - dir.x * 2200, Math.abs(dir.y) * 1600 + 300, center.z - dir.z * 2200);
  }

  get clock() {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
