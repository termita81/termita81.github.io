import { state } from './state.js';
import { scenes } from './scenes.js';
import { FOCAL, REFERENCE_SAMPLES } from './constants.js';

export const MODE_HINTS = {
  P: 'Program: the camera sets aperture and shutter. You choose ISO.',
  A: 'Aperture priority: you choose aperture and ISO; the camera sets shutter.',
  S: 'Shutter priority: you choose shutter and ISO; the camera sets aperture.',
  M: 'Manual: you choose aperture, shutter, and ISO.',
};

export function applyExposureMode() {
  const target = scenes.find(sc => sc.id === state.selected).ev + state.iso;
  const clampStop = value => Math.max(0, Math.min(10, Math.round(value)));
  if (state.mode === 'A') state.shutter = clampStop(target - state.aperture);
  if (state.mode === 'S') state.aperture = clampStop(target - state.shutter);
  if (state.mode === 'P') {
    // Prefer a moderate aperture, opening it in low light, within the available range.
    state.aperture = clampStop(Math.max(target - 10, Math.min(6, Math.round(target / 3))));
    state.shutter = clampStop(target - state.aperture);
  }
}
export function cameraView(sc, time, samples, seed, randomize) {
  return {
    focal: FOCAL[state.focal],
    focusDistance: state.focusMode === 'mf' ? state.focusDistance : sc.autofocusDistance ?? null,
    fNumber: 2 ** (state.aperture / 2),
    shutter: 2 ** -state.shutter,
    light: 2 ** (sc.ev - state.aperture - state.shutter),
    iso: 2 ** state.iso,
    noise: 1, seed, time, samples, randomize,
  };
}
export function referenceView(time) {              // how an unselected scene is shown: sharp, frozen, correctly exposed
  return { focal: 50, fNumber: Infinity, shutter: 0, light: 1, iso: 1, noise: 0, seed: 0, time, samples: REFERENCE_SAMPLES, randomize: false };
}
