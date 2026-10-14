/** The wording used to describe a photo, wherever it is shown. */
import {
  exposureVerdict,
  formatAperture,
  formatEv,
  formatFocal,
  formatFocusDistance,
  formatIso,
  formatShutter,
  formatSettingsEvCalculation,
  formatStops,
} from '../camera/format.js';

const join = (...parts) => parts.join(' · ');

const focusMode = (photo) => photo.focusMode.toUpperCase();

export const photoAltText = (photo) =>
  `${photo.scene}, ${exposureVerdict(photo.delta).toLowerCase()}`;

export const photoTitle = (photo) => `#${photo.id} · ${photo.scene}`;

export const downloadName = (photo) => `exposure-lab-${photo.id}.jpg`;

/** "ISO 100 · f/2 · 1/30 s" */
export const exposureSettings = (photo) =>
  join(formatIso(photo.iso), formatAperture(photo.aperture), formatShutter(photo.shutter));

/** "f/2 · 1/30 s" */
export const apertureAndShutter = (photo) =>
  join(formatAperture(photo.aperture), formatShutter(photo.shutter));

/** "ISO 100 · 50 mm" */
export const isoAndFocal = (photo) => join(formatIso(photo.iso), formatFocal(photo.focal));

export const comparisonOptionLabel = (photo) =>
  join(photoTitle(photo), exposureSettings(photo), formatFocal(photo.focal));

/** Two lines shown under each photo while comparing. */
export function comparisonCaption(photo) {
  const focus = `${focusMode(photo)} ${formatFocusDistance(photo.focusDistance)}`;
  return [
    join(photoTitle(photo), exposureVerdict(photo.delta)),
    join(photo.mode, exposureSettings(photo), formatFocal(photo.focal), focus),
  ].join('\
');
}

/** One sentence on why the photo came out as bright as it did. */
export function exposureExplanation(photo) {
  const settings = `The settings expose for ${formatEv(photo.ev)}`;
  if (photo.delta === 0) return `${settings}, which matches the scene.`;
  const under = photo.delta < 0;
  const stops = Math.abs(photo.delta);
  return (
    `${settings}, ${stops} ${under ? 'above' : 'below'} the scene’s ${formatEv(photo.sceneEv)}, ` +
    `so the photo is ${formatStops(stops)} too ${under ? 'dark' : 'bright'}.`
  );
}

/** [term, value] rows for the photo's details list. */
export function photoDetails(photo) {
  return [
    ['Scene brightness', formatEv(photo.sceneEv)],
    ['Mode', photo.mode],
    ['ISO', formatIso(photo.iso)],
    ['Aperture', formatAperture(photo.aperture)],
    ['Shutter speed', formatShutter(photo.shutter)],
    ['Focal length', formatFocal(photo.focal)],
    ['Focus', join(focusMode(photo), formatFocusDistance(photo.focusDistance))],
    ['Settings EV', formatEv(photo.ev)],
    ['Calculation', formatSettingsEvCalculation(photo.stops)],
  ];
}
