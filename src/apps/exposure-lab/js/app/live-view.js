import { cameraView } from '../camera/camera-view.js';
import { FOCAL } from '../camera/settings.js';
import { PREVIEW_SAMPLES } from '../config.js';
import { createPreviewQuality } from './preview-quality.js';

const NOISE_SEEDS = 1048576; // the sensor-noise hash takes a 20-bit seed

/** A different noise pattern for every frame, and for every scene within a frame. */
export const noiseSeed = (frameNumber, sceneIndex) => (frameNumber * 16 + sceneIndex) % NOISE_SEEDS;

/** The render loop that keeps the viewfinder showing the selected scene with current settings. */
export function createLiveView(options) {
  const { scenes, getState, clock, pipeline, viewfinder, isPaused, onAutofocus } = options;
  const quality = createPreviewQuality(PREVIEW_SAMPLES);
  let frameNumber = 0;
  let lastFrame = 0;

  /** In AF the lens follows whatever is under the focus point, even as it moves. */
  function trackAutofocus(state, scene, time) {
    if (state.focusMode !== 'af' || !scene.focusPoint) return;
    scene.focusAt(scene.focusPoint, FOCAL[state.focal], time);
    onAutofocus();
  }

  function renderFrame() {
    const state = getState();
    const sceneIndex = scenes.findIndex((scene) => scene.id === state.sceneId);
    const scene = scenes[sceneIndex];
    const time = clock.time();
    trackAutofocus(state, scene, time);
    if (scene.focusPoint) viewfinder.positionFocusMarker(scene.focusPoint);
    const sampling = {
      time,
      samples: quality.samples,
      seed: noiseSeed(frameNumber, sceneIndex),
      randomize: false,
    };
    pipeline.expose(scene, cameraView(state, scene, sampling));
    viewfinder.draw(pipeline.canvas);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (isPaused()) {
      lastFrame = 0;
      return;
    }
    if (lastFrame) quality.record(now - lastFrame);
    lastFrame = now;
    frameNumber++;
    renderFrame();
  }

  return {
    start: () => requestAnimationFrame(frame),

    /** Forget when the last frame was drawn, so the next one is not measured as slow. */
    resetTiming() {
      lastFrame = 0;
    },
  };
}
