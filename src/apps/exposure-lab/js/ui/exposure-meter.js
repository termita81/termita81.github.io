import { exposureDelta, settingsEv } from '../camera/exposure.js';
import {
  exposureState,
  exposureVerdict,
  formatEv,
  formatSettingsEvCalculation,
  formatSigned,
} from '../camera/format.js';
import { $ } from './dom.js';

// Stops shown either side of zero.
const METER_RANGE = 5;
const MODE_DESCRIPTIONS = {
  P: 'Program: the camera sets aperture and shutter. You choose ISO.',
  A: 'Aperture priority: you choose aperture and ISO; the camera sets shutter.',
  S: 'Shutter priority: you choose shutter and ISO; the camera sets aperture.',
  M: 'Manual: you choose aperture, shutter, and ISO.',
};
const MODE_NAMES = {
  P: 'Program',
  A: 'Aperture priority',
  S: 'Shutter priority',
  M: 'Manual',
};

/** Where the mark sits along the meter, in percent. */
export function meterPosition(delta) {
  const clamped = Math.max(-METER_RANGE, Math.min(METER_RANGE, delta));
  return (clamped + METER_RANGE) * (100 / (2 * METER_RANGE));
}

function renderReadout(state, scene, delta) {
  $('settings-ev').textContent = formatEv(settingsEv(state));
  $('scene-ev').textContent = formatEv(scene.ev);
  const compact = document.documentElement.classList.contains('compact-camera');
  const result = $('exposure-result');
  result.textContent =
    delta === 0
      ? compact
        ? 'Balanced'
        : 'Correct'
      : compact
        ? `${formatSigned(delta)} stop${Math.abs(delta) === 1 ? '' : 's'}`
        : exposureVerdict(delta);
  result.title = `Show ${MODE_NAMES[state.mode]} mode explanation`;
  const atLimit = state.mode !== 'M' && delta !== 0;
  $('exposure-explanation-text').textContent =
    MODE_DESCRIPTIONS[state.mode] +
    (atLimit ? ' An automatic setting has reached its limit; adjust ISO or the setting you chose.' : '');
  $('exposure-panel').dataset.state = exposureState(delta);
  const meter = $('phone-meter');
  if (meter) meter.dataset.state = exposureState(delta);
  const brightness =
    delta > 0
      ? `${2 ** delta} times balanced brightness`
      : `1/${2 ** -delta} of balanced brightness`;
  $('exposure-difference').textContent =
    `${formatEv(scene.ev)} - ${formatEv(settingsEv(state))} = ${formatSigned(delta)} stop${Math.abs(delta) === 1 ? '' : 's'}.`;
  $('exposure-calculation').textContent = formatSettingsEvCalculation(state);
  $('exposure-outcome').textContent =
    delta === 0 ? 'These settings match the scene.' : `The photo is ${brightness}.`;
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

function positionExplanation(explanation, result, nativePopover) {
  if (nativePopover ? !explanation.matches(':popover-open') : explanation.hidden) return;
  const anchor = result.getBoundingClientRect();
  const box = explanation.getBoundingClientRect();
  const left = Math.max(12, Math.min(anchor.right - box.width, window.innerWidth - box.width - 12));
  const below = anchor.bottom + 8;
  const top = below + box.height <= window.innerHeight - 12 ? below : anchor.top - box.height - 8;
  explanation.style.left = `${left}px`;
  explanation.style.top = `${Math.max(12, top)}px`;
}

/** The exposure meter and its on-demand mode explanation. */
export function createExposureMeter() {
  const explanation = $('exposure-explanation');
  const result = $('exposure-result');
  const close = explanation.querySelector('button');
  const nativePopover = typeof explanation.showPopover === 'function';
  if (!nativePopover) explanation.hidden = true;
  const reposition = () => positionExplanation(explanation, result, nativePopover);
  explanation.addEventListener('toggle', () => {
    result.setAttribute('aria-expanded', String(explanation.matches(':popover-open')));
    reposition();
  });
  result.addEventListener('click', () => {
    if (nativePopover) {
      if (explanation.matches(':popover-open')) explanation.hidePopover();
      else explanation.showPopover();
      return;
    }
    explanation.hidden = !explanation.hidden;
    result.setAttribute('aria-expanded', String(!explanation.hidden));
    reposition();
  });
  close.addEventListener('click', () => {
    if (nativePopover) {
      explanation.hidePopover();
      return;
    }
    explanation.hidden = true;
    result.setAttribute('aria-expanded', 'false');
  });
  window.addEventListener('resize', reposition);
  document.addEventListener('scroll', reposition, { capture: true, passive: true });

  return {
    render(state, scene) {
      const delta = exposureDelta(scene.ev, state);
      renderReadout(state, scene, delta);
      renderMark(delta);
      renderEquation(state);
      reposition();
    },
  };
}
