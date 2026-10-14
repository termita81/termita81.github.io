/**
 * Scene time in seconds. The clock stands still while `isPaused()` is true. Call `sync()`
 * whenever the paused state may have changed so the switch is timed accurately.
 */
export function createAnimationClock(isPaused, now = () => performance.now()) {
  let elapsed = 0;
  let previous = now();
  let paused = isPaused();

  function sync() {
    const current = now();
    if (!paused) elapsed += current - previous;
    previous = current;
    paused = isPaused();
  }

  function time() {
    sync();
    return elapsed / 1000;
  }

  return { sync, time };
}
