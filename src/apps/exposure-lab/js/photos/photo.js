import { settingsEv } from '../camera/exposure.js';
import { lensFocusDistance } from '../camera/focus.js';
import { APERTURE, FOCAL, ISO, SHUTTER } from '../camera/settings.js';

/** A record of one photo: what was shot and with which settings. `url` is set once saved. */
export function createPhoto({ id, capturedAt, state, scene }) {
  const ev = settingsEv(state);
  return {
    id,
    url: '',
    capturedAt,
    scene: scene.name,
    sceneEv: scene.ev,
    mode: state.mode,
    iso: ISO[state.iso],
    aperture: APERTURE[state.aperture],
    shutter: SHUTTER[state.shutter],
    focal: FOCAL[state.focal],
    stops: { iso: state.iso, aperture: state.aperture, shutter: state.shutter },
    focusMode: state.focusMode,
    focusDistance: lensFocusDistance(state, scene),
    ev,
    delta: scene.ev - ev,
  };
}
