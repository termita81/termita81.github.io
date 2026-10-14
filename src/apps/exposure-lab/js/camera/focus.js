/** Focus maths: where the lens is focused, and the focus slider's scale. */

export const FOCUS_SLIDER_MAX = 1000;

/**
 * The distance the lens is focused at, in metres (Infinity allowed). `null` when autofocus has
 * nothing to measure, as on a flat scene.
 */
export const lensFocusDistance = (state, scene) =>
  state.focusMode === 'mf' ? state.focusDistance : (scene.autofocusDistance ?? null);

/**
 * While autofocus is active the lens follows the scene. Recording where it is lets manual focus
 * take over from the same distance.
 */
export function followAutofocus(state, autofocusDistance) {
  if (state.focusMode !== 'af' || autofocusDistance === undefined) return state;
  return { ...state, focusDistance: autofocusDistance };
}

/** Slider position → metres: 0 is 1 m and the far end is infinity. */
export function sliderToDistance(position) {
  if (position === FOCUS_SLIDER_MAX) return Infinity;
  return 1 / (1 - position / FOCUS_SLIDER_MAX);
}

/** Metres → slider position (the inverse of `sliderToDistance`). */
export function distanceToSlider(distance) {
  if (!Number.isFinite(distance)) return FOCUS_SLIDER_MAX;
  return Math.round(FOCUS_SLIDER_MAX * (1 - 1 / Math.max(1, distance)));
}
