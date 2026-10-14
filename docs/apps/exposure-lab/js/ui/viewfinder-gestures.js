/** Looking around and choosing a focus point in the viewfinder, by pointer or keyboard. */
import { angleOfView } from '../camera/lens.js';
import { FOCAL, SENSOR } from '../camera/settings.js';
import { $ } from './dom.js';
import { containedBox } from './geometry.js';

// Pixels a press may wander before it counts as a drag.
const DRAG_THRESHOLD = 5;
const KEY_STEPS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** One arrow-key press turns the camera by a tenth of the view. */
const KEY_STEP_BOX = { width: 10, height: 10 };

const isInsideImage = ({ x, y }) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

/** The camera rotation that shifts the view by (dx, dy) pixels of an image shown at `box` size. */
export function dragRotation(dx, dy, box, focal) {
  return {
    yaw: (-dx / box.width) * angleOfView(SENSOR.width, focal),
    pitch: (-dy / box.height) * angleOfView(SENSOR.height, focal),
  };
}

/** The changes a gesture can make to a scene's view. Each ends with `onViewChange()`. */
function createViewActions({ store, getScene, clock, onViewChange }) {
  const focal = () => FOCAL[store.getState().focal];

  function rotate(scene, dx, dy, box) {
    const { yaw, pitch } = dragRotation(dx, dy, box, focal());
    scene.rotateBy(yaw, pitch);
    // The point no longer covers what it was placed on.
    scene.focusPoint = null;
    onViewChange();
  }

  function focusOn(scene, point) {
    const autofocus = store.getState().focusMode === 'af';
    if (!autofocus || getScene() !== scene || !isInsideImage(point)) return;
    scene.focusPoint = { x: point.x, y: point.y };
    scene.focusAt(scene.focusPoint, focal(), clock.time());
    onViewChange();
  }

  function reset() {
    const scene = getScene();
    if (!scene.canLookAround) return;
    scene.resetView();
    scene.focusPoint = null;
    onViewChange();
  }

  return { rotate, focusOn, reset };
}

/** Pinching changes the simulated lens, snapping to the existing focal-length scale. */
function zoomIndex(startIndex, ratio) {
  const target = FOCAL[startIndex] * ratio;
  return FOCAL.reduce(
    (best, focal, index) =>
      Math.abs(Math.log(focal / target)) < Math.abs(Math.log(FOCAL[best] / target)) ? index : best,
    0,
  );
}

const pointerDistance = (pointers) => {
  const [first, second] = [...pointers.values()];
  return Math.hypot(first.x - second.x, first.y - second.y);
};

/** Single-pointer drag/tap, two-pointer lens zoom, and optional double-tap fullscreen. */
function bindPointerGestures(canvas, actions, { size, store, getScene, onDoubleTap }) {
  const pointers = new Map();
  let gesture = null;
  let pinch = null;
  let multiTouch = false;
  let lastTap = null;

  function imagePoint(event) {
    const rect = canvas.getBoundingClientRect();
    const box = containedBox(rect.width, rect.height, size);
    return {
      x: (event.clientX - rect.left - box.left) / box.width,
      y: (event.clientY - rect.top - box.top) / box.height,
      box,
    };
  }

  function start(event) {
    if (event.button !== 0 || pointers.has(event.pointerId) || !isInsideImage(imagePoint(event)))
      return;
    const scene = getScene();
    const position = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, position);
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      gesture = {
        scene,
        pointer: event.pointerId,
        origin: position,
        last: position,
        dragging: false,
      };
      canvas.focus({ preventScroll: true });
    } else {
      multiTouch = true;
      gesture = null;
      lastTap = null;
      canvas.classList.remove('rotating');
      if (pointers.size === 2)
        pinch = {
          scene,
          distance: pointerDistance(pointers),
          focal: store.getState().focal,
        };
    }
  }

  function zoom() {
    if (!pinch || pointers.size < 2 || pinch.scene !== getScene() || pinch.distance < 1) return;
    const distance = pointerDistance(pointers);
    if (distance < 1) return;
    const focal = zoomIndex(pinch.focal, distance / pinch.distance);
    if (focal !== store.getState().focal) store.update({ focal });
  }

  function move(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (multiTouch) {
      zoom();
      return;
    }
    if (!gesture || getScene() !== gesture.scene || !gesture.scene.canLookAround) return;
    const { origin, last } = gesture;
    const travelled = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    if (!gesture.dragging && travelled < DRAG_THRESHOLD) return;
    gesture.dragging = true;
    lastTap = null;
    canvas.classList.add('rotating');
    // With "Drag to move room" the room follows the pointer; otherwise the camera does.
    const direction = store.getState().dragToMoveRoom ? -1 : 1;
    const dx = (event.clientX - last.x) * direction;
    const dy = (event.clientY - last.y) * direction;
    actions.rotate(gesture.scene, dx, dy, imagePoint(event).box);
    gesture.last = { x: event.clientX, y: event.clientY };
  }

  function tap(event, scene) {
    const compact = Boolean(canvas.closest('.phone-screen'));
    const nearLast =
      lastTap && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 24;
    if (
      compact &&
      event.pointerType === 'touch' &&
      nearLast &&
      event.timeStamp - lastTap.time < 300
    ) {
      lastTap = null;
      onDoubleTap();
      return;
    }
    lastTap = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    if (scene.canLookAround) actions.focusOn(scene, imagePoint(event));
  }

  function finish(event) {
    if (!pointers.has(event.pointerId)) return;
    const finished = gesture;
    pointers.delete(event.pointerId);
    gesture = null;
    canvas.classList.remove('rotating');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (pointers.size < 2) pinch = null;
    const clicked = event.type === 'pointerup' && !multiTouch && finished && !finished.dragging;
    if (clicked) tap(event, finished.scene);
    if (!pointers.size) multiTouch = false;
  }

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(type, finish);
}

/** Arrow keys turn the camera; Home returns to the starting view. */
function bindKeyboard(canvas, actions, getScene) {
  canvas.addEventListener('keydown', (event) => {
    const scene = getScene();
    if (!scene.canLookAround || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Home') {
      event.preventDefault();
      actions.reset();
    }
    const step = KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    actions.rotate(scene, step[0], step[1], KEY_STEP_BOX);
  });
}

function bindDragPreference(store) {
  const checkbox = $('drag-to-move-room');
  checkbox.checked = store.getState().dragToMoveRoom;
  checkbox.addEventListener('change', () => store.update({ dragToMoveRoom: checkbox.checked }));
}

/**
 * Options: `size` (of the live image), `store`, `getScene()`, `clock`, and `onViewChange()`,
 * which is called after a scene's aim or focus point changed.
 */
export function setupViewfinderGestures(options) {
  const canvas = $('viewfinder-canvas');
  const actions = createViewActions(options);
  bindPointerGestures(canvas, actions, options);
  bindKeyboard(canvas, actions, options.getScene);
  bindDragPreference(options.store);
  $('reset-view').addEventListener('click', actions.reset);
}
