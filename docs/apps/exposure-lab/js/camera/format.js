import { APERTURE, ISO, SHUTTER } from './settings.js';

/** Text for camera values. */
const MINUS = '−';

/** A number with a typographic minus sign. */
export const formatNumber = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));

/** A number with an explicit sign: "+2", "−1" or "0". */
export const formatSigned = (n) => (n === 0 ? '0' : `${n > 0 ? '+' : MINUS}${Math.abs(n)}`);

export const formatEv = (ev) => `EV ${formatNumber(ev)}`;
export const formatIso = (iso) => `ISO ${iso}`;
export const formatAperture = (fNumber) => `f/${fNumber}`;
export const formatShutter = (time) => `${time} s`;
export const formatFocal = (focal) => `${focal} mm`;
export const formatStops = (n) => `${n} stop${n === 1 ? '' : 's'}`;

/** The stop calculation for the current aperture, shutter and ISO indices. */
export function formatSettingsEvCalculation({ aperture, shutter, iso }) {
  return (
    `${aperture} (${formatAperture(APERTURE[aperture])}) + ` +
    `${shutter} (${SHUTTER[shutter]}s) - ${iso} (${formatIso(ISO[iso])}) = ` +
    formatNumber(aperture + shutter - iso)
  );
}

export function formatFocusDistance(distance) {
  if (distance == null) return 'N/A';
  return Number.isFinite(distance) ? `${distance.toFixed(1)} m` : '∞';
}

/** `delta` is scene EV − settings EV. */
export function exposureVerdict(delta) {
  if (delta === 0) return 'Correct exposure';
  return `${formatStops(Math.abs(delta))} ${delta < 0 ? 'under' : 'over'}`;
}

/** The `data-state` value the stylesheets use to colour an exposure result. */
export const exposureState = (delta) => (delta === 0 ? 'ok' : 'off');
