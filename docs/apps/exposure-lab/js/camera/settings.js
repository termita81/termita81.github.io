/**
 * The camera's setting scales. The app state stores an index into each scale; for ISO, aperture
 * and shutter, one index step is one stop.
 */

export const ISO = [100, 200, 400, 800, 1600, 3200, 6400];

export const APERTURE = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32];

/** Shutter times in seconds, as labelled on a camera. */
// prettier-ignore
export const SHUTTER = [
  '1', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60',
  '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000', '1/8000',
];

/** Focal lengths in mm. */
export const FOCAL = [10, 24, 35, 42, 50, 85, 100, 200, 300];

/** Sensor size in mm. */
export const SENSOR = { width: 36, height: 24 };
