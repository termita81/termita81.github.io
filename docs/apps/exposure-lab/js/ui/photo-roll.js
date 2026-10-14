import { formatSigned } from '../camera/format.js';
import { apertureAndShutter, isoAndFocal, photoAltText } from '../photos/photo-text.js';
import { $, cloneTemplate } from './dom.js';

function createItem(photo, onOpen) {
  const item = cloneTemplate('photo-template');
  const image = item.querySelector('img');
  const badge = item.querySelector('.shot-badge');
  item.dataset.photoId = photo.id;
  image.src = photo.url;
  image.alt = photoAltText(photo);
  badge.hidden = photo.delta === 0;
  badge.textContent = `${formatSigned(photo.delta)} EV`;
  item.querySelector('b').textContent = apertureAndShutter(photo);
  item.querySelector('[data-field="settings"]').textContent = isoAndFocal(photo);
  item.querySelector('button').addEventListener('click', () => onOpen(photo.id));
  return item;
}

function removeStaleItems(list, photos) {
  const ids = new Set(photos.map((photo) => String(photo.id)));
  for (const item of [...list.children]) {
    if (!ids.has(item.dataset.photoId)) item.remove();
  }
}

/** Add an item for every photo that has none yet. Returns whether anything was added. */
function insertNewItems(list, photos, onOpen) {
  let inserted = false;
  photos.forEach((photo, index) => {
    const existing = list.children[index];
    if (existing?.dataset.photoId === String(photo.id)) return;
    list.insertBefore(createItem(photo, onOpen), existing ?? null);
    inserted = true;
  });
  return inserted;
}

function renderSummary(count) {
  $('roll-count').textContent = count ? `(${count})` : '';
  $('roll-list').hidden = count === 0;
  $('roll-empty').hidden = count > 0;
  $('roll-clear').hidden = count === 0;
}

function renderPhoneSummary(photos) {
  const button = $('phone-photos');
  const image = $('phone-last-photo');
  button.disabled = photos.length === 0;
  button.setAttribute(
    'aria-label',
    photos.length ? `View ${photos.length} photos, starting with the latest` : 'No photos yet',
  );
  $('phone-photo-count').textContent = `(${photos.length})`;
  image.hidden = photos.length === 0;
  if (photos.length) image.src = photos[0].url;
  else image.removeAttribute('src');
}

/**
 * The strip of taken photos. Options: `library`, `onOpen(photoId)`, `onCleared()` and, for
 * tests, `confirmDelete(message)`.
 */
export function createPhotoRoll(options) {
  const { library, onOpen, onCleared } = options;
  const confirmDelete = options.confirmDelete ?? ((message) => window.confirm(message));
  const list = $('roll-list');

  function deleteAll() {
    const photos = library.ready();
    const question =
      photos.length === 1 ? 'Delete this photo?' : `Delete all ${photos.length} photos?`;
    if (!confirmDelete(question)) return;
    for (const photo of photos) library.remove(photo.id);
    onCleared();
  }

  /** `photos` are listed newest first. */
  function render(photos) {
    removeStaleItems(list, photos);
    const inserted = insertNewItems(list, photos, onOpen);
    renderSummary(photos.length);
    renderPhoneSummary(photos);
    // Bring the newest photo into view.
    if (inserted) list.scrollLeft = 0;
  }

  $('roll-clear').addEventListener('click', deleteAll);
  $('phone-photos').addEventListener('click', () => {
    const latest = library.ready()[0];
    if (latest) onOpen(latest.id);
  });
  return { render };
}
