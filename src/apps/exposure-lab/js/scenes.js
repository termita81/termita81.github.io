import { renderer, fillMat, runPass } from './renderer.js';
import { W, H } from './constants.js';
import { galleryScene } from './gallery-scene.js';
import { shapesScene } from './shapes-scene.js';
import { nightStreetScene } from './night-street.js';
import { beachScene } from './beach-scene.js';

function flatScene({ id, name, note, ev, value = 0.18 }) {
  return {
    id, name, note, ev, isStatic: true,
    renderSample(target) {
      fillMat.uniforms.uColor.value.setScalar(value);
      runPass(fillMat, target);
    },
  };
}
export const scenes = [
  galleryScene(renderer, W, H),
  shapesScene({
    id: 'shapes', name: 'Floating shapes', ev: 12,
    note: 'The ring spins fast, the green ball bobs slowly. Click the viewfinder in AF to choose a focus point, or use MF to choose a distance.',
  }),
  nightStreetScene(renderer, W, H),
  beachScene(renderer, W, H),
  beachScene(renderer, W, H, { goldenHour: true }),
  flatScene({
    id: 'gray', name: 'Gray card', ev: 8,
    note: 'Uniform 18% gray: only brightness and noise change here.',
  }),
];
