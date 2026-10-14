import { exposureState, exposureVerdict } from '../../camera/format.js';
import {
  downloadName,
  exposureExplanation,
  photoAltText,
  photoDetails,
} from '../../photos/photo-text.js';
import { $, cloneTemplateContent } from '../dom.js';

function renderImage(photo) {
  const image = $('lb-primary-image');
  image.src = photo.url;
  image.alt = photoAltText(photo);
}

function renderVerdict(photo) {
  const result = $('lb-result');
  result.textContent = exposureVerdict(photo.delta);
  result.dataset.state = exposureState(photo.delta);
  $('lb-why').textContent = exposureExplanation(photo);
}

function renderDetails(photo) {
  const rows = photoDetails(photo).map(([term, value]) => {
    const row = cloneTemplateContent('photo-detail-template');
    row.querySelector('dt').textContent = term;
    row.querySelector('dd').textContent = value;
    return row;
  });
  $('lb-meta').replaceChildren(...rows);
}

function renderDownload(photo) {
  const link = $('lb-download');
  link.href = photo.url;
  link.download = downloadName(photo);
}

/** Show the main photo and everything about it. `index` is its place among `total` photos. */
export function renderPhotoInfo(photo, index, total) {
  renderImage(photo);
  $('lb-count').textContent = `Photo ${index + 1} of ${total}`;
  $('lb-title').textContent = photo.scene;
  $('lb-previous').disabled = total < 2;
  $('lb-next').disabled = total < 2;
  renderVerdict(photo);
  renderDetails(photo);
  renderDownload(photo);
}
