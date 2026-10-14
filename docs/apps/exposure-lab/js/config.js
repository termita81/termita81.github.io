/** Application-wide tuning values. */

/** Size of the live view in pixels. */
export const VIEW_SIZE = { width: 768, height: 512 };

/** Size of a saved photo in pixels (the same 3:2 shape as the live view). */
export const PHOTO_SIZE = { width: 1920, height: 1280 };

/** Lens/time samples per live frame; the live view adapts within this range to suit the GPU. */
export const PREVIEW_SAMPLES = { min: 6, max: 40, initial: 24 };

/** Lens/time samples for a saved photo. */
export const CAPTURE_SAMPLES = 256;

export const JPEG_QUALITY = 0.95;
