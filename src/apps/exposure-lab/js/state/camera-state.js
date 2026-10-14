import { applyExposureMode } from '../camera/exposure.js';
import { followAutofocus } from '../camera/focus.js';

/**
 * Everything the user sets on the camera. `iso`, `aperture`, `shutter` and `focal` are indices
 * into the scales in camera/settings.js.
 */
export const INITIAL_STATE = {
  mode: 'P',
  iso: 0,
  // What Program mode meters for the initial EV 7 gallery at ISO 100: f/2 at 1/30 s.
  aperture: 2,
  shutter: 5,
  focal: 4,
  sceneId: 'gallery',
  focusMode: 'af',
  focusDistance: 5,
  dragToMoveRoom: true,
};

/**
 * The store's reducer: merge a change into the state, then let the exposure mode set whichever
 * of aperture and shutter the camera controls. `findScene(id)` looks a scene up.
 */
export function createCameraReducer(findScene) {
  return (state, change) => {
    // Autofocus may have moved the lens since the last change.
    const current = followAutofocus(state, findScene(state.sceneId).autofocusDistance);
    const next = { ...current, ...change };
    return applyExposureMode(next, findScene(next.sceneId).ev);
  };
}
