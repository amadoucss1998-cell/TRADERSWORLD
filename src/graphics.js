import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const QUALITY = ['low', 'high', 'ultra'];
const KEY = 'monrovia-city-graphics';

// Warm West African colour grade plus a soft vignette, applied after tone mapping.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, warmth: { value: 0.04 }, vignette: { value: 0.35 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float warmth; uniform float vignette; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += vec3(warmth, warmth * 0.4, -warmth * 0.6);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, 1.08); // a touch more saturation
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - vignette * dot(d, d) * 1.6;
      gl_FragColor = c;
    }`,
};

export function defaultQuality() {
  try {
    const saved = localStorage.getItem(KEY);
    if (QUALITY.includes(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return matchMedia('(pointer: coarse)').matches ? 'low' : 'high';
}

// Image-based lighting, bloom, ambient occlusion, MSAA and grading, scaled by a quality level.
export class Graphics {
  constructor(renderer, scene, camera, sun) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sun = sun;
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.composer = null;
    this.setQuality(defaultQuality());
  }

  setQuality(q) {
    this.quality = q;
    try {
      localStorage.setItem(KEY, q);
    } catch {
      /* storage unavailable */
    }
    const r = this.renderer;
    const low = q === 'low';
    r.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : q === 'ultra' ? 2 : 1.5));
    r.shadowMap.enabled = true;
    this.sun.shadow.mapSize.set(low ? 1024 : q === 'ultra' ? 4096 : 2048, low ? 1024 : q === 'ultra' ? 4096 : 2048);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.scene.environment = low ? null : this.envMap;
    this.composer?.dispose();
    this.composer = null;
    if (!low) {
      const size = r.getDrawingBufferSize(new THREE.Vector2());
      const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
      const c = new EffectComposer(r, target);
      c.addPass(new RenderPass(this.scene, this.camera));
      if (q === 'ultra') {
        const ao = new GTAOPass(this.scene, this.camera, size.x, size.y);
        ao.output = GTAOPass.OUTPUT.Default;
        ao.blendIntensity = 0.85;
        ao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 2, scale: 1 });
        c.addPass(ao);
      }
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.25, 0.5, 0.88);
      c.addPass(this.bloom);
      c.addPass(new OutputPass());
      this.grade = new ShaderPass(GradeShader);
      c.addPass(this.grade);
      this.composer = c;
      c.setSize(innerWidth, innerHeight);
    }
    this.resize();
  }

  cycle() {
    const i = QUALITY.indexOf(this.quality);
    this.setQuality(QUALITY[(i + 1) % QUALITY.length]);
    return this.quality;
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer?.setSize(innerWidth, innerHeight);
  }

  // night: 0 (day) .. 1 (night)
  update(night) {
    // reflections and glow: subtle by day (only truly bright things bloom), rich at night
    this.scene.environmentIntensity = 0.22 - night * 0.14;
    if (this.bloom) {
      this.bloom.strength = 0.12 + night * 0.6;
      this.bloom.threshold = 1.25 - night * 0.5;
    }
    if (this.grade) {
      this.grade.uniforms.warmth.value = 0.035 - night * 0.05;
    }
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
