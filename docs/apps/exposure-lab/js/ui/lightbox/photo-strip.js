import { exposureSettings, photoAltText, photoTitle } from '../../photos/photo-text.js';
import { $, cloneTemplate } from '../dom.js';
import { stripRole } from './selection.js';

function createItem(photo, onPick) {
  const item = cloneTemplate('comparison-shot-template');
  const image = item.querySelector('img');
  item.dataset.photoId = photo.id;
  image.src = photo.url;
  image.alt = photoAltText(photo);
  item.querySelector('b').textContent = photoTitle(photo);
  item.querySelector('.shot-cap > span').textContent = exposureSettings(photo);
  item.querySelector('button').addEventListener('click', () => onPick(photo.id));
  return item;
}

function renderRole(item, selection) {
  const role = stripRole(Number(item.dataset.photoId), selection);
  const button = item.querySelector('button');
  button.disabled = role.isMain;
  button.setAttribute('aria-pressed', String(role.isSelected));
  item.querySelector('.comparison-role').textContent = role.label;
}

/** The thumbnails along the bottom of the lightbox. `onPick(photoId)` reports a click. */
export function createPhotoStrip(onPick) {
  const strip = $('lb-comparison-roll');
  const list = $('lb-comparison-list');
  let shownIds = null;

  /** Rebuild the thumbnails only when the set of photos changed. */
  function renderItems(photos) {
    const ids = photos.map((photo) => photo.id).join(',');
    if (ids === shownIds) return;
    list.replaceChildren(...photos.map((photo) => createItem(photo, onPick)));
    shownIds = ids;
  }

  function renderHeading(comparing) {
    strip.setAttribute('aria-label', comparing ? 'Photos for comparison' : 'Taken photos');
    strip.querySelector('p').textContent = comparing
      ? 'Choose a photo to compare with the main image.'
      : 'Choose a photo to view.';
  }

  return {
    render(photos, selection) {
      renderItems(photos);
      for (const item of list.children) renderRole(item, selection);
      strip.hidden = photos.length === 0;
      renderHeading(selection.comparing);
    },
  };
}
