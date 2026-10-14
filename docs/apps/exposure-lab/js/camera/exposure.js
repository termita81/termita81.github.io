/**
 * Exposure maths on whole stops. Settings are indices into the scales in settings.js, so adding
 * one to any of them changes the exposure by exactly one stop.
 */
import { APERTURE, SHUTTER } from './settings.js';

const MAX_APERTURE = APERTURE.length - 1;
const MAX_SHUTTER = SHUTTER.length - 1;

/** Program mode does not stop down beyond f/8 of its own accord. */
const PROGRAM_SMALLEST_APERTURE = 6;

/** The settings the camera takes over in each exposure mode. */
const CAMERA_CONTROLLED = {
  P: ['aperture', 'shutter'],
  A: ['shutter'],
  S: ['aperture'],
  M: [],
};

const clampStop = (value, max) => Math.max(0, Math.min(max, Math.round(value)));

/** The scene brightness (EV) the settings are balanced for. */
export const settingsEv = ({ aperture, shutter, iso }) => aperture + shutter - iso;

/** Stops between scene and settings: negative is underexposed, positive overexposed. */
export const exposureDelta = (sceneEv, settings) => sceneEv - settingsEv(settings);

export const isCameraControlled = (setting, mode) => CAMERA_CONTROLLED[mode].includes(setting);

/** Prefer a moderate aperture, opening it in low light, within the available range. */
function programAperture(target) {
  const preferred = Math.min(PROGRAM_SMALLEST_APERTURE, Math.round(target / 3));
  return clampStop(Math.max(target - MAX_SHUTTER, preferred), MAX_APERTURE);
}

/** What each mode sets, given the target sum of aperture and shutter stops. */
const AUTO_EXPOSURE = {
  P(target) {
    const aperture = programAperture(target);
    return { aperture, shutter: clampStop(target - aperture, MAX_SHUTTER) };
  },
  A: (target, { aperture }) => ({ shutter: clampStop(target - aperture, MAX_SHUTTER) }),
  S: (target, { shutter }) => ({ aperture: clampStop(target - shutter, MAX_APERTURE) }),
  M: () => ({}),
};

/** The settings with whatever the current mode controls adjusted to balance `sceneEv`. */
export function applyExposureMode(settings, sceneEv) {
  const target = sceneEv + settings.iso;
  return { ...settings, ...AUTO_EXPOSURE[settings.mode](target, settings) };
}
