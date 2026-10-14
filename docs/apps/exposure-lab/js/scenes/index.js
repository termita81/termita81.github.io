import { beachScene } from './beach/beach-scene.js';
import { GOLDEN_HOUR_BEACH, SUNNY_BEACH } from './beach/variants.js';
import { grayCardScene } from './flat-scene.js';
import { galleryScene } from './gallery-scene.js';
import { nightStreetScene } from './night-street-scene.js';
import { shapesScene } from './shapes-scene.js';

/**
 * What the rest of the app knows about a scene.
 *
 * @typedef {object} Scene
 * @property {string} id
 * @property {string} name
 * @property {string} note                 Description shown above the viewfinder.
 * @property {number} ev                   Scene brightness.
 * @property {string} thumbnail            File name in ./images.
 * @property {boolean} isFlat              One sample is enough: no depth and no movement.
 * @property {boolean} canLookAround       Has `rotateBy`, `resetView` and `focusAt`.
 * @property {{x: number, y: number}|null} focusPoint  Where autofocus measures (0…1).
 * @property {number} [autofocusDistance]  Metres; undefined when there is nothing to focus on.
 * @property {string} [focusHint]          Replaces the usual focus hint.
 * @property {(target: object, sample: object) => void} renderSample
 */

/** Every scene, in the order it appears in the scene browser. */
export function createScenes(renderer, fill) {
  return [
    galleryScene(renderer),
    shapesScene(renderer),
    nightStreetScene(renderer),
    beachScene(renderer, SUNNY_BEACH),
    beachScene(renderer, GOLDEN_HOUR_BEACH),
    grayCardScene(fill),
  ];
}
