import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// CC0 models by Kenney (kenney.nl), via the pmndrs market asset collection.
const files = import.meta.glob('./assets/models/*.glb', { query: '?url', import: 'default', eager: true });
const url = (name) => files[`./assets/models/${name}.glb`];

export const CAR_MODELS = ['taxi', 'police-car', 'sedan', 'sports-sedan', 'suv', 'suv-luxury', 'truck', 'van', 'delivery-truck', 'ambulance'];
export const PEOPLE_MODELS = ['male', 'survivor-male', 'survivor-female', 'skater-male', 'skater-female'];

export const assets = { cars: {}, people: {}, palm: null };

export async function loadAssets(onProgress) {
  const loader = new GLTFLoader();
  const names = [...CAR_MODELS, ...PEOPLE_MODELS, 'palm-detailed-long'];
  let done = 0;
  await Promise.all(names.map(async (n) => {
    const gltf = await loader.loadAsync(url(n));
    if (CAR_MODELS.includes(n)) assets.cars[n] = gltf.scene;
    else if (PEOPLE_MODELS.includes(n)) assets.people[n] = gltf.scene;
    else assets.palm = gltf.scene;
    onProgress?.(++done / names.length);
  }));
  return assets;
}

// Recolours the flat peach skin of a Kenney character texture to a given tone, keeping shading.
const texCache = new Map();
export function skinnedTexture(model, srcTex, skin, shirtHue) {
  const key = `${model}|${skin}|${shirtHue}`;
  if (texCache.has(key)) return texCache.get(key);
  const img = srcTex.image;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  // the face texel sits near the top-left of the atlas
  const sample = (x, y) => {
    const i = (Math.floor(y * c.height) * c.width + Math.floor(x * c.width)) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const ref = sample(0.12, 0.35);
  const refL = (ref[0] + ref[1] + ref[2]) / 3 || 1;
  const target = new THREE.Color(skin);
  const tr = target.r * 255;
  const tg = target.g * 255;
  const tb = target.b * 255;
  const hsl = { h: 0, s: 0, l: 0 };
  const col = new THREE.Color();
  // light hair would blend into darker skin, so hair goes black-brown
  const hair = sample(0.05, 0.2);
  const hairL = (hair[0] + hair[1] + hair[2]) / 3 || 1;
  const darkenHair = hairL > 70;
  for (let i = 0; i < d.length; i += 4) {
    if (darkenHair) {
      const hr = d[i] - hair[0];
      const hg = d[i + 1] - hair[1];
      const hb = d[i + 2] - hair[2];
      if (hr * hr + hg * hg + hb * hb < 1600) {
        const k = (d[i] + d[i + 1] + d[i + 2]) / 3 / hairL;
        d[i] = 32 * k;
        d[i + 1] = 22 * k;
        d[i + 2] = 16 * k;
        continue;
      }
    }
    const dr = d[i] - ref[0];
    const dg = d[i + 1] - ref[1];
    const db = d[i + 2] - ref[2];
    if (dr * dr + dg * dg + db * db < 2400) {
      const k = (d[i] + d[i + 1] + d[i + 2]) / 3 / refL;
      d[i] = Math.min(255, tr * k);
      d[i + 1] = Math.min(255, tg * k);
      d[i + 2] = Math.min(255, tb * k);
    } else if (shirtHue !== null && !((i / 4) % c.width < c.width * 0.63 && (i / 4) / c.width < c.height * 0.48)) {
      // (the head and hair sit in the top-left of the atlas and keep their colours)
      // shift saturated clothing colours to vary the crowd
      col.setRGB(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
      col.getHSL(hsl);
      if (hsl.s > 0.35 && hsl.l > 0.15 && hsl.l < 0.85) {
        col.setHSL((hsl.h + shirtHue) % 1, hsl.s, hsl.l);
        d[i] = col.r * 255;
        d[i + 1] = col.g * 255;
        d[i + 2] = col.b * 255;
      }
    }
  }
  g.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = srcTex.flipY;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = srcTex.magFilter;
  t.minFilter = srcTex.minFilter;
  t.wrapS = srcTex.wrapS;
  t.wrapT = srcTex.wrapT;
  texCache.set(key, t);
  return t;
}
