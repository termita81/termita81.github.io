import { lensFocusDistance } from './focus.js';
import { FOCAL } from './settings.js';

/**
 * Describe one exposure to the renderer in physical terms.
 * `sampling` is { time (s), samples, seed, randomize }.
 */
export function cameraView(state, scene, sampling) {
  return {
    focal: FOCAL[state.focal], // mm
    focusDistance: lensFocusDistance(state, scene), // m
    fNumber: 2 ** (state.aperture / 2),
    shutter: 2 ** -state.shutter, // s
    light: 2 ** (scene.ev - state.aperture - state.shutter), // 1 = a correct ISO 100 exposure
    iso: 2 ** state.iso, // gain, 1 = ISO 100
    noise: 1,
    ...sampling,
  };
}
