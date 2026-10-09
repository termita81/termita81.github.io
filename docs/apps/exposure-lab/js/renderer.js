import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { W, H } from './constants.js';
import { $, cloneTemplate } from './dom.js';

function fail(message) {
  $('boot').dataset.failed = '1';
  $('boot').textContent = message;
  throw new Error(message);
}

/* ====================================================================
 *  Renderer: one hidden WebGL canvas renders every tile and photo,
 *  the result is copied into ordinary 2D canvases.
 * ==================================================================== */
export let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: cloneTemplate('canvas-template'), antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
} catch (err) {
  fail('This page needs WebGL 2, which this browser or device does not provide.');
}
const canFloat = renderer.extensions.has('EXT_color_buffer_float');
if (!renderer.capabilities.isWebGL2 || !(canFloat || renderer.extensions.has('EXT_color_buffer_half_float'))) {
  fail('This page needs WebGL 2 with floating-point render targets, which this browser or device does not provide.');
}
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.autoClear = false;
renderer.shadowMap.enabled = true;

// rtSample: one sharp, instantaneous view of the scene (linear light, 0.18 = mid gray at the scene's EV).
// rtAccum:  the average of many such views taken across the lens opening and the shutter time.
const targetOptions = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, stencilBuffer: false };
const accumType = canFloat && renderer.extensions.has('EXT_float_blend') ? THREE.FloatType : THREE.HalfFloatType;
const targets = new Map();

function targetsFor(width, height) {
  const key = `${width}x${height}`;
  if (!targets.has(key)) {
    targets.set(key, {
      rtSample: new THREE.WebGLRenderTarget(width, height, { ...targetOptions, type: THREE.HalfFloatType }),
      rtAccum: new THREE.WebGLRenderTarget(width, height, { ...targetOptions, type: accumType, depthBuffer: false }),
    });
  }
  return targets.get(key);
}

const passCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const passScene = new THREE.Scene();
const passQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
passQuad.frustumCulled = false;
passScene.add(passQuad);

const PASS_VERTEX = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const passMaterial = (fragmentShader, uniforms, extra = {}) => new THREE.ShaderMaterial({
  vertexShader: PASS_VERTEX, fragmentShader, uniforms,
  depthTest: false, depthWrite: false, blending: THREE.NoBlending, ...extra,
});

// Fills the frame with one linear colour (used by flat scenes such as the gray card).
export const fillMat = passMaterial(`
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }`,
  { uColor: { value: new THREE.Vector3() } });

// Adds one sample into the accumulation buffer.
const addMat = passMaterial(`
  uniform sampler2D tSrc;
  uniform float uWeight;
  varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * uWeight, 1.0); }`,
  { tSrc: { value: null }, uWeight: { value: 1 } },
  { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });

// The "sensor": scales by the light let in, adds photon + read noise, applies ISO gain, clips, encodes sRGB.
const developMat = passMaterial(`
  precision highp float;
  precision highp int;
  uniform sampler2D tAccum;
  uniform float uLight;   // light reaching the sensor relative to a correct ISO 100 exposure
  uniform float uIso;     // ISO gain, 1.0 = ISO 100
  uniform float uNoise;   // 1.0 = simulate sensor noise
  uniform float uSeed;
  varying vec2 vUv;

  const float FULL_WELL = 8000.0;  // electrons at clipping, ISO 100 (small on purpose so noise is easy to see)
  const float READ_VAR  = 4.0;     // read noise variance in electrons^2

  uint pcgHash(uint v) {
    uint s = v * 747796405u + 2891336453u;
    uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return (w >> 22u) ^ w;
  }
  float rand01(uint h) { return (float(h >> 8u) + 0.5) / 16777216.0; }

  vec3 toDisplay(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
  }

  void main() {
    vec3 radiance = max(texture2D(tAccum, vUv).rgb, vec3(0.0));
    vec3 electrons = radiance * uLight * FULL_WELL;
    if (uNoise > 0.5) {
      uvec2 p = uvec2(gl_FragCoord.xy);
      uint h = pcgHash(p.x + pcgHash(p.y + pcgHash(uint(uSeed))));
      uint a = pcgHash(h);
      uint b = pcgHash(a);
      uint c = pcgHash(b);
      uint d = pcgHash(c);
      float r1 = sqrt(-2.0 * log(rand01(a)));
      float r2 = sqrt(-2.0 * log(rand01(c)));
      float t1 = 6.2831853 * rand01(b);
      float t2 = 6.2831853 * rand01(d);
      vec3 gauss = vec3(r1 * cos(t1), r1 * sin(t1), r2 * cos(t2));
      electrons += sqrt(electrons + READ_VAR) * gauss;
    }
    vec3 linear = clamp(electrons / FULL_WELL * uIso, 0.0, 1.0);
    gl_FragColor = vec4(toDisplay(linear), 1.0);
  }`,
  { tAccum: { value: null }, uLight: { value: 1 }, uIso: { value: 1 }, uNoise: { value: 0 }, uSeed: { value: 0 } });

export function runPass(material, target) {
  passQuad.material = material;
  renderer.setRenderTarget(target);
  renderer.render(passScene, passCamera);
}

function halton(i, base) {
  let f = 1, r = 0;
  while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
  return r;
}

/* Take one exposure of a scene and leave the developed image on the WebGL canvas.
 * view = { focal (mm), fNumber, shutter (s), time (s), samples, randomize, light, iso, noise, seed } */
const sample = { focal: 50, lensX: 0, lensY: 0, jitterX: 0, jitterY: 0, time: 0, focusDistance: null };
export function expose(sc, view, { width = W, height = H } = {}) {
  const { rtSample, rtAccum } = targetsFor(width, height);
  if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
    renderer.setSize(width, height, false);
  }
  const n = sc.isStatic ? 1 : view.samples;
  const lensRadius = view.focal / 1000 / (2 * view.fNumber);     // metres
  const shiftA = view.randomize ? Math.random() : 0;
  const shiftB = view.randomize ? Math.random() : 0;

  renderer.setRenderTarget(rtAccum);
  renderer.setClearColor(0x000000, 1);
  renderer.clear(true, false, false);

  sample.focal = view.focal;
  sample.width = width;
  sample.height = height;
  sample.focusDistance = view.focusDistance ?? null;
  for (let i = 0; i < n; i++) {
    const radius = lensRadius * Math.sqrt((halton(i + 1, 2) + shiftA) % 1);
    const angle = 2 * Math.PI * ((halton(i + 1, 3) + shiftB) % 1);
    sample.lensX = radius * Math.cos(angle);                     // a point on the lens opening
    sample.lensY = radius * Math.sin(angle);
    sample.jitterX = (halton(i + 1, 5) + shiftA) % 1 - 0.5;      // sub-pixel offset (anti-aliasing)
    sample.jitterY = (halton(i + 1, 7) + shiftB) % 1 - 0.5;
    sample.time = view.time + view.shutter * (i + (view.randomize ? Math.random() : 0.5)) / n;
    sc.renderSample(rtSample, sample);
    addMat.uniforms.tSrc.value = rtSample.texture;
    addMat.uniforms.uWeight.value = 1 / n;
    runPass(addMat, rtAccum);
  }

  const u = developMat.uniforms;
  u.tAccum.value = rtAccum.texture;
  u.uLight.value = view.light;
  u.uIso.value = view.iso;
  u.uNoise.value = view.noise;
  u.uSeed.value = view.seed;
  runPass(developMat, null);
}
