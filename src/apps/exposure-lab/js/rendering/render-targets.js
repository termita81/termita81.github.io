import * as THREE from 'three';

const OPTIONS = {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  stencilBuffer: false,
};

/** Full floats blend most precisely; half floats are the fallback. */
function accumulationType({ extensions }) {
  const canBlendFloats =
    extensions.has('EXT_color_buffer_float') && extensions.has('EXT_float_blend');
  return canBlendFloats ? THREE.FloatType : THREE.HalfFloatType;
}

/**
 * Returns `targetsFor(size)`, which creates the pair of render targets for an image size once
 * and then reuses it:
 *
 * - `sample`: one sharp, instantaneous view of the scene (linear light; 0.18 is mid gray at the
 *   scene's EV).
 * - `accumulation`: the average of many such views taken across the lens opening and the
 *   shutter time.
 */
export function createTargetPool(renderer) {
  const pool = new Map();
  const type = accumulationType(renderer);

  const create = (width, height) => ({
    sample: new THREE.WebGLRenderTarget(width, height, { ...OPTIONS, type: THREE.HalfFloatType }),
    accumulation: new THREE.WebGLRenderTarget(width, height, {
      ...OPTIONS,
      type,
      depthBuffer: false,
    }),
  });

  return function targetsFor({ width, height }) {
    const key = `${width}x${height}`;
    if (!pool.has(key)) pool.set(key, create(width, height));
    return pool.get(key);
  };
}
