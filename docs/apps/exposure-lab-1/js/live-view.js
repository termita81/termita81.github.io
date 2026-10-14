import { animationTime } from './animation-clock.js';
import { $ } from './dom.js';
import { state } from './state.js';
import { scenes } from './scenes.js';
import { W, H, FOCAL, PREVIEW_MIN, PREVIEW_MAX } from './constants.js';
import { renderer, expose } from './renderer.js';
import { cameraView } from './exposure.js';
export function createLiveView({ syncFocusDistance }) {
  let frameNo = 0, lastFrame = 0, avgMs = 16.7, cooldown = 0;
  let previewSamples = 24, previewCeiling = PREVIEW_MAX;

  function frame(now) {
    requestAnimationFrame(frame);
    if ($('lightbox').open) { lastFrame = 0; return; }

    // Keep the preview smooth: fewer samples on slow GPUs, more on fast ones.
    if (lastFrame) {
      avgMs += (Math.min(now - lastFrame, 60) - avgMs) * 0.1;
      if (--cooldown <= 0) {
        if (avgMs > 24 && previewSamples > PREVIEW_MIN) {
          previewSamples = Math.max(PREVIEW_MIN, Math.round(previewSamples * 0.8));
          previewCeiling = previewSamples;
          cooldown = 20;
        } else if (avgMs < 18.5 && previewSamples < previewCeiling) {
          previewSamples = Math.min(previewCeiling, previewSamples + 2);
          cooldown = 20;
        }
      }
    }
    lastFrame = now;
    frameNo++;

    const time = animationTime();
    scenes.forEach((sc, index) => {
      if (state.selected === sc.id) {
        if (state.focusMode === 'af' && sc.focusPoint) {
          sc.focusAt(sc.focusPoint.x, sc.focusPoint.y, FOCAL[state.focal], time);
          syncFocusDistance();
        }
        if (sc.focusPoint) {
          const canvas = $('viewfinder-canvas');
          const scale = Math.min(canvas.clientWidth / W, canvas.clientHeight / H);
          $('focus-point').style.left = `${(canvas.clientWidth - W * scale) / 2 + sc.focusPoint.x * W * scale}px`;
          $('focus-point').style.top = `${(canvas.clientHeight - H * scale) / 2 + sc.focusPoint.y * H * scale}px`;
        }
        expose(sc, cameraView(sc, time, previewSamples, (frameNo * 16 + index) % 1048576, false));
        $('viewfinder-canvas').getContext('2d').drawImage(renderer.domElement, 0, 0);
      }
    });
  }
  function resetTiming() { lastFrame = 0; }
  function start() { requestAnimationFrame(frame); }

  return { start, resetTiming };
}
