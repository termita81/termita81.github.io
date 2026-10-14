/** Page-wide keyboard shortcuts. */

const EDITABLE = 'input, textarea, select, [contenteditable]';

const hasModifier = (event) => event.ctrlKey || event.metaKey || event.altKey;

const isCompareShortcut = (event) =>
  event.key.toLowerCase() === 'c' &&
  !event.repeat &&
  !hasModifier(event) &&
  !event.target.closest(EDITABLE);

const isShutterShortcut = (event) =>
  event.code === 'Space' && !event.repeat && !event.target.closest('button, a');

function handleLightboxKey(event, lightbox) {
  if (isCompareShortcut(event) && lightbox.canCompare()) {
    event.preventDefault();
    lightbox.toggleComparison();
  }
  if (event.key === 'ArrowLeft') lightbox.step(-1);
  if (event.key === 'ArrowRight') lightbox.step(1);
}

/** Space takes a photo; in the lightbox, arrows browse and C toggles comparison. */
export function setupKeyboard({ lightbox, isWelcomeOpen, takePhoto }) {
  document.addEventListener('keydown', (event) => {
    if (isWelcomeOpen()) return;
    if (lightbox.isOpen()) {
      handleLightboxKey(event, lightbox);
      return;
    }
    if (isShutterShortcut(event)) {
      event.preventDefault();
      takePhoto();
    }
  });
}
