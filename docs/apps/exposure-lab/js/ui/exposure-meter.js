import { exposureDelta, settingsEv } from '../camera/exposure.js';
import { exposureState, exposureVerdict, formatEv, formatSigned } from '../camera/format.js';
import { $ } from './dom.js';

// Stops shown either side of zero.
const METER_RANGE = 5;

/** Where the mark sits along the meter, in percent. */
export function meterPosition(delta) {
  const clamped = Math.max(-METER_RANGE, Math.min(METER_RANGE, delta));
  return (clamped + METER_RANGE) * (100 / (2 * METER_RANGE));
}

function renderReadout(state, scene, delta) {
  $('settings-ev').textContent = formatEv(settingsEv(state));
  $('scene-ev').textContent = formatEv(scene.ev);
  $('exposure-scene').textContent = scene.name;
  const compact = document.documentElement.classList.contains('compact-camera');
  $('exposure-result').textContent =
    delta === 0
      ? compact
        ? 'Balanced'
        : 'Correct'
      : compact
        ? `${formatSigned(delta)} stop${Math.abs(delta) === 1 ? '' : 's'}`
        : exposureVerdict(delta);
  $('exposure-result').setAttribute('aria-label', exposureVerdict(delta));
  $('exposure-panel').dataset.state = exposureState(delta);
  const meter = $('phone-meter');
  if (meter) meter.dataset.state = exposureState(delta);
  const brightness =
    delta > 0
      ? `${2 ** delta} times balanced brightness`
      : `1/${2 ** -delta} of balanced brightness`;
  $('exposure-difference').textContent =
    `${formatEv(scene.ev)} - ${formatEv(settingsEv(state))} = ${formatSigned(delta)} stop${Math.abs(delta) === 1 ? '' : 's'}. ${delta === 0 ? 'These settings match the scene.' : `The photo is ${brightness}.`}`;
}

function renderMark(delta) {
  const mark = $('exposure-mark');
  mark.style.left = `${meterPosition(delta)}%`;
  mark.classList.toggle('beyond', Math.abs(delta) > METER_RANGE);
}

function renderEquation(state) {
  $('eq-aperture').textContent = state.aperture;
  $('eq-shutter').textContent = state.shutter;
  $('eq-iso').textContent = state.iso;
}

/** The exposure panel: what the settings suit, what the scene needs, and the difference. */
export function createExposureMeter() {
  return {
    render(state, scene) {
      const delta = exposureDelta(scene.ev, state);
      renderReadout(state, scene, delta);
      renderMark(delta);
      renderEquation(state);
    },
  };
}
