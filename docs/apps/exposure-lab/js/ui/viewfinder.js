import { exposureDelta } from '../camera/exposure.js';
import {
  exposureState,
  exposureVerdict,
  formatFocal,
  formatFocusDistance,
} from '../camera/format.js';
import { lensFocusDistance } from '../camera/focus.js';
import { FOCAL } from '../camera/settings.js';
import { $, restartAnimation } from './dom.js';
import { containedBox } from './geometry.js';

/** The live picture and its overlays. Gestures live in viewfinder-gestures.js. */
export function createViewfinder(size) {
  const frame = $('viewfinder');
  const canvas = $('viewfinder-canvas');
  const context = canvas.getContext('2d');
  const focusMarker = $('focus-point');
  const status = $('viewfinder-status');

  function renderFocus(state, scene) {
    const distance = formatFocusDistance(lensFocusDistance(state, scene));
    $('viewfinder-focus').textContent =
      state.focusMode === 'mf'
        ? `Manual focus · ${distance}`
        : scene.canLookAround
          ? 'Tap to focus'
          : '';
  }

  function render(state, scene) {
    const delta = exposureDelta(scene.ev, state);
    canvas.classList.toggle('rotatable', scene.canLookAround);
    canvas.tabIndex = scene.canLookAround ? 0 : -1;
    canvas.setAttribute('aria-label', `${scene.name}: live view with current camera settings`);
    $('reset-view').hidden = !scene.canLookAround;
    $('viewfinder-hint').hidden = !scene.canLookAround;
    focusMarker.hidden = state.focusMode === 'mf' || !scene.focusPoint;
    status.textContent = exposureVerdict(delta);
    status.dataset.state = exposureState(delta);
    $('viewfinder-focal').textContent = formatFocal(FOCAL[state.focal]);
    $('viewfinder-hint').textContent = document.documentElement.classList.contains('compact-camera')
      ? 'Drag to look'
      : 'Drag to look · Click to focus · Arrow keys to rotate';
    renderFocus(state, scene);
  }

  /** Show a finished frame. */
  function draw(image) {
    context.drawImage(image, 0, 0);
  }

  /** Put the focus marker over `point`, given in image coordinates (0…1). */
  function positionFocusMarker(point) {
    const box = containedBox(canvas.clientWidth, canvas.clientHeight, size);
    focusMarker.style.left = `${box.left + point.x * box.width}px`;
    focusMarker.style.top = `${box.top + point.y * box.height}px`;
  }

  /** Flash black, like a shutter closing. */
  function blink() {
    restartAnimation(frame, 'fired');
  }

  return { render, renderFocus, draw, positionFocusMarker, blink };
}
