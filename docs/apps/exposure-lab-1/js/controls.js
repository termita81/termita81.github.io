import { $, cloneTemplate } from './dom.js';
import { CONTROLS } from './constants.js';
import { state, settingsEV } from './state.js';
import { scenes } from './scenes.js';
import { num, formatFocus, verdict } from './format.js';
import { MODE_HINTS, applyExposureMode } from './exposure.js';
export function createControls() {
  for (const c of CONTROLS) {
    const el = cloneTemplate('control-template');
    const label = el.querySelector('label');
    label.htmlFor = `ctl-${c.key}`;
    label.textContent = c.label;
    const input = el.querySelector('input');
    input.id = `ctl-${c.key}`;
    input.max = c.values.length - 1;
    el.querySelector('output').htmlFor = input.id;
    el.querySelector('.ctl-ticks').replaceChildren(...c.values.map(() => cloneTemplate('tick-template')));
    const ends = el.querySelectorAll('.ctl-ends > span');
    ends.forEach((end, i) => {
      end.querySelector('b').textContent = c.ends[i][0];
      end.querySelector('[data-field="effect"]').textContent = c.ends[i][1];
    });
    c.input = el.querySelector('input');
    c.output = el.querySelector('output');
    c.input.addEventListener('input', () => { state[c.key] = Number(c.input.value); refresh(); });
    $('controls').append(el);
  }

  function syncFocusDistance() {
    const sc = scenes.find((scene) => scene.id === state.selected);
    const distance = state.focusMode === 'mf' ? state.focusDistance : sc.autofocusDistance;
    if (state.focusMode === 'af' && distance !== undefined) {
      state.focusDistance = distance;
    }
    const text = distance === undefined ? 'N/A' : formatFocus(distance);
    $('focus-distance-value').textContent = text;
    $('focus-distance').setAttribute('aria-valuetext', text);
    if (distance !== undefined) {
      $('focus-distance').value = Number.isFinite(distance)
        ? Math.round(1000 * (1 - 1 / Math.max(1, distance))) : 1000;
    }
  }
  for (const input of document.querySelectorAll('input[name="exposure-mode"]')) {
    input.addEventListener('change', () => { state.mode = input.value; refresh(); });
  }

  function refresh() {
    applyExposureMode();
    const ev = settingsEV();
    const manual = state.focusMode === 'mf';
    $('focus-distance').disabled = !manual;
    syncFocusDistance();
    $('focus-hint').textContent = state.selected === 'gray'
      ? 'The uniform gray card has no focus detail.'
      : manual ? 'Drag to look around; choose the focus distance below.' : 'Drag to look around; click to choose a focus point.';
    const selectedScene = scenes.find((sc) => sc.id === state.selected);
    $('viewfinder-canvas').classList.toggle('rotatable', !!selectedScene.rotateBy);
    $('viewfinder-canvas').tabIndex = selectedScene.rotateBy ? 0 : -1;
    $('reset-view').hidden = !selectedScene.rotateBy;
    $('viewfinder-hint').hidden = !selectedScene.rotateBy;
    $('focus-point').hidden = manual || !selectedScene.focusPoint;
    for (const c of CONTROLS) {
      const text = c.text(c.values[state[c.key]]);
      c.input.value = state[c.key];
      c.input.disabled = (c.key === 'aperture' && ['P', 'S'].includes(state.mode)) ||
        (c.key === 'shutter' && ['P', 'A'].includes(state.mode));
      c.input.setAttribute('aria-valuetext', text);
      c.output.textContent = text;
    }
    $('mode-hint').textContent = MODE_HINTS[state.mode] +
      (state.mode !== 'M' && selectedScene.ev !== ev ? ' Setting limit reached; adjust ISO or your chosen setting.' : '');
    $('evValue').textContent = `EV ${num(ev)}`;
    const delta = selectedScene.ev - ev;
    $('scene-ev').textContent = `EV ${num(selectedScene.ev)}`;
    $('exposure-scene').textContent = selectedScene.name;
    $('exposure-result').textContent = delta === 0 ? 'Correct' : verdict(delta);
    $('exposure-panel').dataset.state = delta === 0 ? 'ok' : 'off';
    $('exposure-mark').style.left = `${(Math.max(-5, Math.min(5, delta)) + 5) * 10}%`;
    $('exposure-mark').classList.toggle('beyond', Math.abs(delta) > 5);
    $('eqA').textContent = state.aperture;
    $('eqT').textContent = state.shutter;
    $('eqS').textContent = state.iso;

    let count = 0;
    for (const sc of scenes) {
      const on = state.selected === sc.id;
      const delta = sc.ev - ev;
      const kind = !on ? 'idle' : delta === 0 ? 'ok' : 'off';
      sc.tile.setAttribute('aria-pressed', String(on));
      if (on) {
        $('scene-name').textContent = sc.name;
        $('scene-description').textContent = sc.note;
        $('viewfinder-canvas').setAttribute('aria-label', `${sc.name}: live view with current camera settings`);
        $('viewfinder-status').textContent = verdict(delta);
        $('viewfinder-status').dataset.state = kind;
      }
      if (on) count++;
    }

    $('shutter').disabled = count === 0;
    $('shutterLabel').textContent = 'Take photo';
    $('footHint').textContent = count ? 'or press the space bar' : 'Select a scene first';
  }
  document.querySelectorAll('input[name="focus-mode"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.focusMode = input.value;
      refresh();
    });
  });
  $('focus-distance').addEventListener('input', (event) => {
    state.focusDistance = Number(event.target.value) === 1000 ? Infinity : 1 / (1 - Number(event.target.value) / 1000);
    refresh();
  });

  return { refresh, syncFocusDistance };
}
