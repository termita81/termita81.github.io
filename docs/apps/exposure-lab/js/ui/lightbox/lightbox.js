import { $ } from '../dom.js';
import { createComparisonView } from './comparison-view.js';
import { renderPhotoInfo } from './photo-info.js';
import { createPhotoStrip } from './photo-strip.js';
import { indexAfterRemoval, neighbour, resolveComparison } from './selection.js';
import { trackSwipe } from './swipe.js';

/**
 * The full-screen photo viewer. It owns the selection (which photo is shown, and which one it is
 * compared with) and keeps its views in step with the photo library.
 *
 * Options: `library` and, for tests, `confirmDelete(message)`.
 */
export function createLightbox(options) {
  const { library } = options;
  const confirmDelete = options.confirmDelete ?? ((message) => window.confirm(message));
  const dialog = $('lightbox');
  const selection = { currentId: null, comparisonId: null, comparing: false };
  const strip = createPhotoStrip(pick);
  const comparison = createComparisonView({ onToggle: toggleComparison, onChoose: compareWith });
  const swipe = trackSwipe($('lb-stage'), {
    canStart: () => library.ready().length > 1,
    onSwipe: step,
  });

  /** Bring the comparison and the strip up to date with the library and the selection. */
  function sync() {
    const photos = library.ready();
    const resolved = resolveComparison(photos, selection);
    selection.comparisonId = resolved.secondary?.id ?? null;
    selection.comparing = resolved.comparing;
    comparison.render(resolved);
    strip.render(photos, selection);
  }

  /** Show a photo, opening the lightbox if necessary. */
  function show(id) {
    swipe.cancel();
    const photos = library.ready();
    const index = photos.findIndex((photo) => photo.id === id);
    if (index < 0) {
      if (dialog.open) dialog.close();
      return;
    }
    selection.currentId = id;
    renderPhotoInfo(photos[index], index, photos.length);
    sync();
    if (!dialog.open) dialog.showModal();
  }

  /** Move to the next (+1) or previous (−1) photo. */
  function step(direction) {
    const next = neighbour(library.ready(), selection.currentId, direction);
    if (next) show(next.id);
  }

  /** A thumbnail was clicked: view that photo or, while comparing, compare with it. */
  function pick(id) {
    if (id === selection.currentId) return;
    if (selection.comparing) compareWith(id);
    else show(id);
  }

  function compareWith(id) {
    selection.comparisonId = id;
    sync();
  }

  function toggleComparison() {
    selection.comparing = !selection.comparing;
    sync();
  }

  function deleteCurrent() {
    if (!confirmDelete('Delete this photo?')) return;
    const index = library.ready().findIndex((photo) => photo.id === selection.currentId);
    library.remove(selection.currentId);
    const rest = library.ready();
    if (rest.length) show(rest[indexAfterRemoval(index, rest.length)].id);
    else dialog.close();
  }

  function reset() {
    swipe.cancel();
    selection.comparing = false;
    selection.comparisonId = null;
    sync();
  }

  /** `listener` runs whenever the lightbox opens or closes, however that happens. */
  function onOpenChange(listener) {
    const observer = new MutationObserver(listener);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }

  dialog.addEventListener('close', reset);
  $('lb-previous').addEventListener('click', () => step(-1));
  $('lb-next').addEventListener('click', () => step(1));
  $('lb-close').addEventListener('click', () => dialog.close());
  $('lb-delete').addEventListener('click', deleteCurrent);

  return {
    show,
    step,
    sync,
    toggleComparison,
    onOpenChange,
    isOpen: () => dialog.open,
    canCompare: () => comparison.isAvailable(),
  };
}
