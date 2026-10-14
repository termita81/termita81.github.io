import { animationTime } from './animation-clock.js';
import { $, cloneTemplate } from './dom.js';
import { PHOTO_W, PHOTO_H, ISO, APERTURE, SHUTTER, FOCAL, CAPTURE_SAMPLES } from './constants.js';
import { state, settingsEV } from './state.js';
import { scenes } from './scenes.js';
import { renderer, expose } from './renderer.js';
import { cameraView } from './exposure.js';
import { verdict } from './format.js';
import { jpegWithExif } from './jpeg-exif.js';

export function createCapture({ shots, addToRoll, syncRoll, resetTiming }) {
  const lightbox = $('lightbox');
  let shotSeq = 0;
  function fire() {
    if (lightbox.open || $('welcome').open || !state.selected) return;
    const time = animationTime();
    const ev = settingsEV();
    const spoken = [];

    for (const sc of scenes) {
      if (state.selected !== sc.id) continue;
      expose(sc, cameraView(sc, time, CAPTURE_SAMPLES, Math.floor(Math.random() * 1e6), true), {
        width: PHOTO_W, height: PHOTO_H,
      });
      const copy = cloneTemplate('canvas-template');
      copy.width = PHOTO_W; copy.height = PHOTO_H;
      copy.getContext('2d').drawImage(renderer.domElement, 0, 0);

      const shot = {
        id: ++shotSeq, url: '', capturedAt: new Date(),
        scene: sc.name, sceneEV: sc.ev, mode: state.mode,
        iso: ISO[state.iso], aperture: APERTURE[state.aperture], shutter: SHUTTER[state.shutter], focal: FOCAL[state.focal],
        sv: state.iso, av: state.aperture, tv: state.shutter,
        focusMode: state.focusMode, focusDistance: state.focusMode === 'mf' ? state.focusDistance : sc.autofocusDistance ?? null,
        ev, delta: sc.ev - ev,
      };
      shots.unshift(shot);
      copy.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error('JPEG capture failed.');
          const jpeg = await jpegWithExif(blob, shot, PHOTO_W, PHOTO_H);
          shot.url = URL.createObjectURL(jpeg);
          addToRoll(shot);
        } catch (error) {
          const index = shots.indexOf(shot);
          if (index >= 0) shots.splice(index, 1);
          syncRoll();
          $('announce').textContent = 'Could not save the JPEG photo.';
          console.error(error);
        }
      }, 'image/jpeg', 0.95);

      $('viewfinder').classList.remove('fired');
      void $('viewfinder').offsetWidth;            // restart the blink animation
      $('viewfinder').classList.add('fired');
      spoken.push(`${sc.name}, ${verdict(shot.delta).toLowerCase()}`);
    }
    $('announce').textContent = `Photo taken. ${spoken.join('; ')}.`;
    resetTiming();                            // do not let the capture count as a slow preview frame
  }
  $('shutter').addEventListener('click', fire);

  return { fire };
}
