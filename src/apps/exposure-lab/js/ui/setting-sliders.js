import { isCameraControlled } from '../camera/exposure.js';
import { formatAperture, formatFocal, formatIso, formatShutter } from '../camera/format.js';
import { APERTURE, FOCAL, ISO, SHUTTER } from '../camera/settings.js';
import { $, cloneTemplate } from './dom.js';

/** One slider per camera setting. `low` and `high` say what each end of the scale does. */
const SLIDERS = [
  {
    key: 'iso',
    label: 'ISO',
    values: ISO,
    format: formatIso,
    low: ['darker', 'clean'],
    high: ['brighter', 'noisy'],
  },
  {
    key: 'aperture',
    label: 'Aperture',
    values: APERTURE,
    format: formatAperture,
    low: ['brighter', 'shallow focus'],
    high: ['darker', 'deep focus'],
  },
  {
    key: 'shutter',
    label: 'Shutter speed',
    values: SHUTTER,
    format: formatShutter,
    low: ['brighter', 'motion blur'],
    high: ['darker', 'frozen motion'],
  },
  {
    key: 'focal',
    label: 'Focal length',
    values: FOCAL,
    format: formatFocal,
    low: ['wide view', 'deep focus'],
    high: ['narrow view', 'shallow focus'],
  },
];

function describeEnd(element, [effect, sideEffect]) {
  element.querySelector('b').textContent = effect;
  element.querySelector('[data-field="effect"]').textContent = sideEffect;
}

function buildSlider(slider, onInput) {
  const element = cloneTemplate('control-template');
  element.id = `editor-${slider.key}`;
  const input = element.querySelector('input');
  const label = element.querySelector('label');
  const output = element.querySelector('output');
  const [lowEnd, highEnd] = element.querySelectorAll('.ctl-ends > span');
  const ticks = slider.values.map(() => cloneTemplate('tick-template'));

  input.id = `ctl-${slider.key}`;
  input.max = slider.values.length - 1;
  label.htmlFor = input.id;
  label.textContent = slider.label;
  output.htmlFor = input.id;
  element.querySelector('.ctl-ticks').replaceChildren(...ticks);
  describeEnd(lowEnd, slider.low);
  describeEnd(highEnd, slider.high);
  input.addEventListener('input', () => onInput(Number(input.value)));
  return { element, input, output };
}

function renderSlider({ slider, input, output }, state) {
  const text = slider.format(slider.values[state[slider.key]]);
  input.value = state[slider.key];
  input.disabled = isCameraControlled(slider.key, state.mode);
  input.setAttribute('aria-valuetext', text);
  output.textContent = text;
}

/** The ISO, aperture, shutter and focal-length sliders. */
export function createSettingSliders(store) {
  const container = $('controls');
  const sliders = SLIDERS.map((slider) => {
    const built = buildSlider(slider, (value) => store.update({ [slider.key]: value }));
    container.append(built.element);
    return { slider, ...built };
  });

  return {
    render: (state) => sliders.forEach((entry) => renderSlider(entry, state)),
  };
}
