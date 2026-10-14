import { distanceToSlider, lensFocusDistance, sliderToDistance } from '../camera/focus.js';
import { formatFocusDistance } from '../camera/format.js';
import { $ } from './dom.js';

function focusHint(state, scene) {
  if (scene.focusHint) return scene.focusHint;
  if (document.documentElement.classList.contains('compact-camera')) {
    return state.focusMode === 'mf' ? 'Choose the focus distance.' : 'Tap the viewfinder to focus.';
  }
  return state.focusMode === 'mf'
    ? 'Drag to look around; choose the focus distance below.'
    : 'Drag to look around; click to choose a focus point.';
}

/** The AF / MF switch and the focus-distance slider. */
export function createFocusPanel(store) {
  const slider = $('focus-distance');
  const readout = $('focus-distance-value');

  /** Cheap enough to call every frame while autofocus tracks a moving subject. */
  function renderDistance(state, scene) {
    const distance = lensFocusDistance(state, scene);
    const text = formatFocusDistance(distance);
    readout.textContent = text;
    slider.setAttribute('aria-valuetext', text);
    if (distance !== null) slider.value = distanceToSlider(distance);
  }

  function render(state, scene) {
    $('focus-control').dataset.focusMode = state.focusMode;
    for (const input of document.querySelectorAll('input[name="focus-mode"]')) {
      input.checked = input.value === state.focusMode;
    }
    slider.disabled = state.focusMode !== 'mf';
    renderDistance(state, scene);
    $('focus-hint').textContent = focusHint(state, scene);
  }

  for (const input of document.querySelectorAll('input[name="focus-mode"]')) {
    input.addEventListener('change', () => store.update({ focusMode: input.value }));
  }
  slider.addEventListener('input', () => {
    store.update({ focusDistance: sliderToDistance(Number(slider.value)) });
  });

  return { render, renderDistance };
}
