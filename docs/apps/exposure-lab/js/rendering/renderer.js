import * as THREE from 'three';

/** The browser or device cannot run the simulator. The message is written for the user. */
export class UnsupportedDeviceError extends Error {}

function createWebGLRenderer() {
  try {
    return new THREE.WebGLRenderer({
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
  } catch {
    throw new UnsupportedDeviceError(
      'This page needs WebGL 2, which this browser or device does not provide.',
    );
  }
}

function supportsFloatTargets({ capabilities, extensions }) {
  const canRenderFloats =
    extensions.has('EXT_color_buffer_float') || extensions.has('EXT_color_buffer_half_float');
  return capabilities.isWebGL2 && canRenderFloats;
}

/**
 * One hidden WebGL canvas renders every live frame and photo; the result is copied into ordinary
 * 2D canvases.
 */
export function createRenderer({ width, height }) {
  const renderer = createWebGLRenderer();
  if (!supportsFloatTargets(renderer)) {
    throw new UnsupportedDeviceError(
      'This page needs WebGL 2 with floating-point render targets, ' +
        'which this browser or device does not provide.',
    );
  }
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.autoClear = false;
  renderer.shadowMap.enabled = true;
  return renderer;
}
