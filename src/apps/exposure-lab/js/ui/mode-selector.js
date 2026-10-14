import { exposureDelta } from '../camera/exposure.js';
import { $ } from './dom.js';

const MODE_HINTS = {
  P: 'Program: the camera sets aperture and shutter. You choose ISO.',
  A: 'Aperture priority: you choose aperture and ISO; the camera sets shutter.',
  S: 'Shutter priority: you choose shutter and ISO; the camera sets aperture.',
  M: 'Manual: you choose aperture, shutter, and ISO.',
};

const LIMIT_HINT = ' Setting limit reached; adjust ISO or your chosen setting.';
const MODE_NAMES = {
  P: 'Program',
  A: 'Aperture priority',
  S: 'Shutter priority',
  M: 'Manual',
};

/** The text under the mode buttons; says so when an automatic mode cannot balance the scene. */
export function modeHint(state, scene) {
  const atLimit = state.mode !== 'M' && exposureDelta(scene.ev, state) !== 0;
  return MODE_HINTS[state.mode] + (atLimit ? LIMIT_HINT : '');
}

/** The P / A / S / M buttons. */
export function createModeSelector(store) {
  for (const input of document.querySelectorAll('input[name="exposure-mode"]')) {
    input.addEventListener('change', () => store.update({ mode: input.value }));
  }

  return {
    render(state, scene) {
      $('mode-name').textContent = MODE_NAMES[state.mode];
      $('mode-hint').textContent = modeHint(state, scene);
    },
  };
}
