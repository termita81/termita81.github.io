const SLOW_FRAME_MS = 24;
const FAST_FRAME_MS = 18.5;
const LONGEST_COUNTED_FRAME_MS = 60;
const SMOOTHING = 0.1;
const COOLDOWN_FRAMES = 20;

/**
 * Keeps the preview smooth: fewer samples on slow GPUs, more on fast ones. A sample count that
 * proved too slow becomes the ceiling, so the preview settles instead of oscillating.
 */
export function createPreviewQuality({ min, max, initial }) {
  let samples = initial;
  let ceiling = max;
  let averageMs = 16.7;
  let cooldown = 0;

  function adjust() {
    if (averageMs > SLOW_FRAME_MS && samples > min) {
      samples = Math.max(min, Math.round(samples * 0.8));
      ceiling = samples;
      cooldown = COOLDOWN_FRAMES;
    } else if (averageMs < FAST_FRAME_MS && samples < ceiling) {
      samples = Math.min(ceiling, samples + 2);
      cooldown = COOLDOWN_FRAMES;
    }
  }

  return {
    get samples() {
      return samples;
    },

    /** Record how long the latest frame took, in milliseconds. */
    record(frameMs) {
      averageMs += (Math.min(frameMs, LONGEST_COUNTED_FRAME_MS) - averageMs) * SMOOTHING;
      cooldown -= 1;
      if (cooldown <= 0) adjust();
    },
  };
}
