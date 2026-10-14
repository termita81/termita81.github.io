import { $ } from './dom.js';
export function setupKeyboard({ fire, stepShot, toggleComparison }) {
  const lightbox = $('lightbox');
  document.addEventListener('keydown', (e) => {
    if ($('welcome').open) return;
    if (lightbox.open) {
      if (e.key.toLowerCase() === 'c' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey &&
          !e.target.closest('input, textarea, select, [contenteditable]') && !$('lb-compare').disabled) {
        e.preventDefault();
        toggleComparison();
      }
      if (e.key === 'ArrowLeft') stepShot(-1);
      if (e.key === 'ArrowRight') stepShot(1);
      return;
    }
    if (e.code === 'Space' && !e.repeat && !e.target.closest('button, a')) {
      e.preventDefault();
      fire();
    }
  });

}
