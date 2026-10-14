import {
  createAddMaterial,
  createDevelopMaterial,
  createFillMaterial,
  createPassRunner,
} from './passes.js';
import { createTargetPool } from './render-targets.js';
import { subExposure } from './sampling.js';

/**
 * Turns a scene into a picture the way a camera does: many sharp, instantaneous samples are
 * averaged across the lens opening and the shutter time, then "developed" by a simulated sensor.
 */
export function createExposurePipeline(renderer, defaultSize) {
  const runPass = createPassRunner(renderer);
  const targetsFor = createTargetPool(renderer);
  const fillMaterial = createFillMaterial();
  const addMaterial = createAddMaterial();
  const developMaterial = createDevelopMaterial();

  function resizeCanvas({ width, height }) {
    const canvas = renderer.domElement;
    if (canvas.width !== width || canvas.height !== height) renderer.setSize(width, height, false);
  }

  function clear(target) {
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, false, false);
  }

  function accumulate(targets, weight) {
    addMaterial.uniforms.tSrc.value = targets.sample.texture;
    addMaterial.uniforms.uWeight.value = weight;
    runPass(addMaterial, targets.accumulation);
  }

  function develop(accumulation, view) {
    const { uniforms } = developMaterial;
    uniforms.tAccum.value = accumulation.texture;
    uniforms.uLight.value = view.light;
    uniforms.uIso.value = view.iso;
    uniforms.uNoise.value = view.noise;
    uniforms.uSeed.value = view.seed;
    runPass(developMaterial, null);
  }

  /**
   * Take one exposure of a scene and leave the developed image on the WebGL canvas.
   * `view` comes from camera/camera-view.js.
   */
  function expose(scene, view, size = defaultSize) {
    const targets = targetsFor(size);
    const count = scene.isFlat ? 1 : view.samples;
    const randomOffset = () => (view.randomize ? Math.random() : 0);
    const shifts = { shiftA: randomOffset(), shiftB: randomOffset() };
    resizeCanvas(size);
    clear(targets.accumulation);
    for (let index = 0; index < count; index++) {
      const random = { ...shifts, timeOffset: view.randomize ? Math.random() : 0.5 };
      const lens = { focal: view.focal, focusDistance: view.focusDistance };
      const sample = { ...subExposure(index, count, view, random), ...lens, ...size };
      scene.renderSample(targets.sample, sample);
      accumulate(targets, 1 / count);
    }
    develop(targets.accumulation, view);
  }

  /** Fill a render target with one linear gray value. */
  function fill(target, value) {
    fillMaterial.uniforms.uColor.value.setScalar(value);
    runPass(fillMaterial, target);
  }

  return { canvas: renderer.domElement, expose, fill };
}
