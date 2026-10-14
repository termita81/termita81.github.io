import * as THREE from 'three';
import { ADD_FRAGMENT, DEVELOP_FRAGMENT, FILL_FRAGMENT, PASS_VERTEX } from './shaders.js';

function passMaterial(fragmentShader, uniforms, extra = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: PASS_VERTEX,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    ...extra,
  });
}

/** Fills the frame with one linear colour (used by flat scenes such as the gray card). */
export const createFillMaterial = () =>
  passMaterial(FILL_FRAGMENT, { uColor: { value: new THREE.Vector3() } });

/** Adds one sample into the accumulation buffer. */
export function createAddMaterial() {
  const uniforms = { tSrc: { value: null }, uWeight: { value: 1 } };
  return passMaterial(ADD_FRAGMENT, uniforms, {
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  });
}

/**
 * The "sensor": scales by the light let in, adds photon and read noise, applies ISO gain, clips
 * and encodes sRGB.
 */
export const createDevelopMaterial = () =>
  passMaterial(DEVELOP_FRAGMENT, {
    tAccum: { value: null },
    uLight: { value: 1 },
    uIso: { value: 1 },
    uNoise: { value: 0 },
    uSeed: { value: 0 },
  });

/** Returns `runPass(material, target)`, which draws a full-screen quad with the material. */
export function createPassRunner(renderer) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  scene.add(quad);

  return function runPass(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };
}
