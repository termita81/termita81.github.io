const MIN_DISTANCE = 40; // pixels
const HORIZONTAL_BIAS = 1.5;

/** +1 for a swipe towards the next photo (leftwards), −1 for the previous one, otherwise 0. */
export function swipeDirection(dx, dy) {
  // Ignore taps and mostly vertical gestures so scrolling does not change photos.
  const isHorizontal =
    Math.abs(dx) >= MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS;
  if (!isHorizontal) return 0;
  return dx < 0 ? 1 : -1;
}

/**
 * Report horizontal swipes on `element`. `canStart()` says whether swiping makes sense at the
 * moment. Returns `cancel()`, which abandons a swipe in progress.
 */
export function trackSwipe(element, { canStart, onSwipe }) {
  let swipe = null;

  function cancel() {
    if (!swipe) return;
    const { pointer } = swipe;
    swipe = null;
    if (element.hasPointerCapture(pointer)) element.releasePointerCapture(pointer);
  }

  function start(event) {
    if (!event.isPrimary) {
      cancel();
      return;
    }
    if (event.button !== 0 || event.target.closest('button') || !canStart()) return;
    swipe = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
    element.setPointerCapture(event.pointerId);
  }

  function finish(event) {
    if (!swipe || event.pointerId !== swipe.pointer) return;
    const direction = swipeDirection(event.clientX - swipe.x, event.clientY - swipe.y);
    cancel();
    if (direction) onSwipe(direction);
  }

  element.addEventListener('pointerdown', start);
  element.addEventListener('pointerup', finish);
  element.addEventListener('pointercancel', cancel);
  element.addEventListener('lostpointercapture', cancel);
  return { cancel };
}
