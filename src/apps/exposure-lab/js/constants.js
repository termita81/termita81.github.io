export const ISO      = [100, 200, 400, 800, 1600, 3200, 6400];
export const APERTURE = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32];
export const SHUTTER  = ['1', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000'];
// Focal lengths in mm on a 36 × 24 mm sensor.
export const FOCAL    = [10, 24, 42, 50, 100, 200, 300];

// Size of the live view and scene thumbnails.
export const W = 768, H = 512;
export const PHOTO_W = 1920;
export const PHOTO_H = Math.round(PHOTO_W * H / W);
export const SENSOR_W = 36, SENSOR_H = 24;        // mm
export const PREVIEW_MIN = 6, PREVIEW_MAX = 40;   // lens/time samples per live frame (adapts to the GPU)
export const REFERENCE_SAMPLES = 8;
export const CAPTURE_SAMPLES = 256;               // samples for a saved photo

export const CONTROLS = [
  { key: 'iso',      label: 'ISO',           values: ISO,      text: (v) => `ISO ${v}`, ends: [['darker', 'clean'], ['brighter', 'noisy']] },
  { key: 'aperture', label: 'Aperture',      values: APERTURE, text: (v) => `f/${v}`,   ends: [['brighter', 'shallow focus'], ['darker', 'deep focus']] },
  { key: 'shutter',  label: 'Shutter speed', values: SHUTTER,  text: (v) => `${v} s`,   ends: [['brighter', 'motion blur'], ['darker', 'frozen motion']] },
  { key: 'focal',    label: 'Focal length',  values: FOCAL,    text: (v) => `${v} mm`,  ends: [['wide view', 'deep focus'], ['narrow view', 'shallow focus']] },
];
