import { isCameraControlled } from '../camera/exposure.js';
import { lensFocusDistance } from '../camera/focus.js';
import { formatAperture, formatFocal, formatFocusDistance } from '../camera/format.js';
import { APERTURE, FOCAL, ISO, SHUTTER } from '../camera/settings.js';
import { $ } from './dom.js';

const MODE_NAMES = {
  P: 'Program',
  A: 'Aperture priority',
  S: 'Shutter priority',
  M: 'Manual',
};

/** Four value buttons select one of the existing editors, without changing camera settings. */
export function createPhoneSettings(store) {
  const buttons = [...document.querySelectorAll('.setting-buttons button')];
  const editors = ['aperture', 'shutter', 'iso', 'focus'].map((key) => ({
    key,
    element: $(key === 'focus' ? 'focus-control' : `editor-${key}`),
  }));
  let selected = 'iso';

  function renderSelection(state) {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.setting === selected));
    }
    for (const editor of editors) {
      editor.element.dataset.selected = String(editor.key === selected);
    }
    const automatic = isCameraControlled(selected, state.mode);
    const hint = $('phone-setting-hint');
    hint.hidden = !automatic;
    const modes = selected === 'aperture' ? 'A or M' : 'S or M';
    const name = selected === 'aperture' ? 'Aperture' : 'Shutter speed';
    hint.textContent = automatic
      ? `${name} is set automatically in ${MODE_NAMES[state.mode]}. Choose ${modes} to adjust it.`
      : '';
  }

  function renderFocus(state, scene) {
    const distance = formatFocusDistance(lensFocusDistance(state, scene));
    $('phone-focus-mode').textContent = state.focusMode.toUpperCase();
    $('phone-focus-distance').textContent = distance;
    $('setting-focus').setAttribute(
      'aria-label',
      `Focus: ${state.focusMode === 'af' ? 'Autofocus' : 'Manual focus'}, ${distance}. Edit focus.`,
    );
  }

  function render(state, scene) {
    const values = {
      aperture: formatAperture(APERTURE[state.aperture]),
      shutter: SHUTTER[state.shutter],
      iso: String(ISO[state.iso]),
    };
    for (const [key, value] of Object.entries(values)) {
      const button = $(`setting-${key}`);
      const automatic = isCameraControlled(key, state.mode);
      button.querySelector('[data-field="value"]').textContent = value;
      const badge = button.querySelector('[data-field="auto"]');
      if (badge) badge.hidden = !automatic;
      const label = key === 'shutter' ? `Shutter speed: ${value} seconds` : `${key}: ${value}`;
      button.setAttribute(
        'aria-label',
        `${label}${automatic ? ', automatically controlled' : ''}. Edit setting.`,
      );
    }
    $('phone-lens-value').textContent = formatFocal(FOCAL[state.focal]);
    $('lens-shorter').disabled = state.focal === 0;
    $('lens-longer').disabled = state.focal === FOCAL.length - 1;
    renderSelection(state);
    renderFocus(state, scene);
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      selected = button.dataset.setting;
      renderSelection(store.getState());
    });
  }
  for (const [id, direction] of [
    ['lens-shorter', -1],
    ['lens-longer', 1],
  ]) {
    $(id).addEventListener('click', () => {
      const focal = Math.max(0, Math.min(FOCAL.length - 1, store.getState().focal + direction));
      store.update({ focal });
    });
  }

  return { render, renderFocus };
}
