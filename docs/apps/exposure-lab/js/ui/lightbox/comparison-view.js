import {
  comparisonCaption,
  comparisonOptionLabel,
  photoAltText,
} from '../../photos/photo-text.js';
import { $, cloneTemplate } from '../dom.js';

function createOption(photo) {
  const option = cloneTemplate('comparison-option-template');
  option.value = photo.id;
  option.textContent = comparisonOptionLabel(photo);
  return option;
}

/** The "Compare photos" toggle, the picker for the second photo, and the side-by-side stage. */
export function createComparisonView({ onToggle, onChoose }) {
  const button = $('lb-compare');
  const select = $('lb-comparison-select');

  function renderPicker(others, secondary) {
    select.replaceChildren(...others.map(createOption));
    if (secondary) select.value = secondary.id;
  }

  function renderToggle(comparing, canCompare) {
    button.disabled = !canCompare;
    button.setAttribute('aria-pressed', String(comparing));
    button.textContent = comparing ? 'Exit comparison' : 'Compare photos';
  }

  function renderLayout(comparing) {
    $('lb-comparison-picker').hidden = !comparing;
    $('lb-comparison-photo').hidden = !comparing;
    $('lb-primary-caption').hidden = !comparing;
    $('lb-stage').classList.toggle('comparing', comparing);
  }

  function renderPhotos({ comparing, primary, secondary }) {
    const image = $('lb-comparison-image');
    if (!comparing || !primary) {
      image.removeAttribute('src');
      return;
    }
    $('lb-primary-caption').textContent = comparisonCaption(primary);
    image.src = secondary.url;
    image.alt = photoAltText(secondary);
    $('lb-comparison-caption').textContent = comparisonCaption(secondary);
  }

  button.addEventListener('click', onToggle);
  select.addEventListener('change', () => onChoose(Number(select.value)));

  return {
    /** False when there is no second photo to compare with. */
    isAvailable: () => !button.disabled,

    /** `comparison` comes from resolveComparison(). */
    render(comparison) {
      renderPicker(comparison.others, comparison.secondary);
      renderToggle(comparison.comparing, Boolean(comparison.secondary));
      renderLayout(comparison.comparing);
      renderPhotos(comparison);
    },
  };
}
