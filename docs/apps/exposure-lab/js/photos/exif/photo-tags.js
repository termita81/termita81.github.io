/** Maps a photo record to EXIF tags. */
import { ascii, long, rational, short, undefinedBytes } from './tiff.js';

const TAG = {
  ImageDescription: 0x010e,
  Orientation: 0x0112,
  Software: 0x0131,
  DateTime: 0x0132,
  ExposureTime: 0x829a,
  FNumber: 0x829d,
  ExposureProgram: 0x8822,
  IsoSpeed: 0x8827,
  ExifVersion: 0x9000,
  DateTimeOriginal: 0x9003,
  OffsetTimeOriginal: 0x9011,
  SubjectDistance: 0x9206,
  FocalLength: 0x920a,
  ColorSpace: 0xa001,
  PixelXDimension: 0xa002,
  PixelYDimension: 0xa003,
  ExposureMode: 0xa402,
  FocalLengthIn35mmFilm: 0xa405,
};

const EXPOSURE_PROGRAM = { M: 1, P: 2, A: 3, S: 4 };
const SRGB = 1;
const MANUAL_EXPOSURE = 1;
const AUTO_EXPOSURE = 0;

/** "YYYY:MM:DD HH:MM:SS" in UTC. */
export const exifDate = (date) =>
  date.toISOString().slice(0, 19).replaceAll('-', ':').replace('T', ' ');

function describeFocus(distance) {
  if (distance === null) return 'not applicable';
  return Number.isFinite(distance) ? `${distance.toFixed(3)} m` : 'infinity';
}

/** A human-readable summary, for viewers that show only the image description. */
export function describePhoto(photo) {
  return [
    photo.scene,
    `mode ${photo.mode}`,
    `ISO ${photo.iso}`,
    `aperture f/${photo.aperture}`,
    `shutter ${photo.shutter} s`,
    `focal length ${photo.focal} mm`,
    `${photo.focusMode.toUpperCase()} focus ${describeFocus(photo.focusDistance)}`,
    `scene EV ${photo.sceneEv}`,
    `settings EV ${photo.ev}`,
    `exposure difference ${photo.delta} stops. Simulated camera.`,
  ].join('; ');
}

/** "1/250" → [1, 250]. */
function exposureTime(shutter) {
  const [numerator, denominator = 1] = shutter.split('/').map(Number);
  return [numerator, denominator];
}

/** EXIF defines an all-ones numerator as infinity, and zero as unknown. */
function subjectDistance(distance) {
  if (distance === null) return [0, 1];
  return Number.isFinite(distance) ? [Math.round(distance * 1000), 1000] : [0xffffffff, 1];
}

export function imageTags(photo) {
  return [
    ascii(TAG.ImageDescription, describePhoto(photo)),
    short(TAG.Orientation, 1),
    ascii(TAG.Software, 'Exposure Lab'),
    ascii(TAG.DateTime, exifDate(photo.capturedAt)),
  ];
}

export function exifTags(photo, { width, height }) {
  return [
    rational(TAG.ExposureTime, ...exposureTime(photo.shutter)),
    rational(TAG.FNumber, Math.round(photo.aperture * 10), 10),
    short(TAG.ExposureProgram, EXPOSURE_PROGRAM[photo.mode]),
    short(TAG.IsoSpeed, photo.iso),
    undefinedBytes(TAG.ExifVersion, '0232'),
    ascii(TAG.DateTimeOriginal, exifDate(photo.capturedAt)),
    ascii(TAG.OffsetTimeOriginal, '+00:00'),
    rational(TAG.SubjectDistance, ...subjectDistance(photo.focusDistance)),
    rational(TAG.FocalLength, photo.focal),
    short(TAG.ColorSpace, SRGB),
    long(TAG.PixelXDimension, width),
    long(TAG.PixelYDimension, height),
    short(TAG.ExposureMode, photo.mode === 'M' ? MANUAL_EXPOSURE : AUTO_EXPOSURE),
    short(TAG.FocalLengthIn35mmFilm, photo.focal), // the simulated sensor is 36 × 24 mm
  ];
}
