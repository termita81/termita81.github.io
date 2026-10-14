/**
 * Sampling maths for the exposure pipeline: where on the lens, where within the pixel and when
 * during the shutter time each sub-exposure is taken. Pure functions.
 */

/** The `index`-th value of the Halton low-discrepancy sequence for `base`, in [0, 1). */
export function halton(index, base) {
  let fraction = 1;
  let result = 0;
  for (let i = index; i > 0; i = Math.floor(i / base)) {
    fraction /= base;
    result += fraction * (i % base);
  }
  return result;
}

/** Radius of the lens opening in metres. */
export const lensRadius = (focalMm, fNumber) => focalMm / 1000 / (2 * fNumber);

/**
 * The `index`-th of the `count` sub-exposures that make up one exposure.
 *
 * `random` is { shiftA, shiftB, timeOffset }, each in [0, 1). Shifts of 0 and a time offset of
 * 0.5 give a repeatable pattern; random values decorrelate repeated exposures.
 */
export function subExposure(index, count, view, random) {
  const spread = (base, shift) => (halton(index + 1, base) + shift) % 1;
  const radius = lensRadius(view.focal, view.fNumber) * Math.sqrt(spread(2, random.shiftA));
  const angle = 2 * Math.PI * spread(3, random.shiftB);
  return {
    lensX: radius * Math.cos(angle), // a point on the lens opening
    lensY: radius * Math.sin(angle),
    jitterX: spread(5, random.shiftA) - 0.5, // sub-pixel offset (anti-aliasing)
    jitterY: spread(7, random.shiftB) - 0.5,
    time: view.time + (view.shutter * (index + random.timeOffset)) / count,
  };
}
