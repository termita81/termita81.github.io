/**
 * The welcome guide. It is its own entry point, independent of the renderer, so the guide still
 * works when WebGL or the three.js CDN is unavailable.
 */
import { $ } from './ui/dom.js';

const STORAGE_KEY = 'exposure-lab-welcome-dismissed';

const dialog = $('welcome');
const helpButton = $('welcome-open');

function wasDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Show the guide on first load when preferences cannot be read.
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // The guide still works when browser storage is unavailable.
  }
}

function open() {
  dialog.showModal();
  dialog.scrollTop = 0;
}

function isOutsideDialog(event) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/** Close when a click both starts and ends on the backdrop. */
function closeOnBackdropClick() {
  let startedOutside = false;
  const isOnBackdrop = (event) => event.target === dialog && isOutsideDialog(event);

  dialog.addEventListener('pointerdown', (event) => {
    startedOutside = isOnBackdrop(event);
  });
  dialog.addEventListener('pointercancel', () => {
    startedOutside = false;
  });
  dialog.addEventListener('click', (event) => {
    if (startedOutside && isOnBackdrop(event)) dialog.close();
    startedOutside = false;
  });
}

helpButton.addEventListener('click', open);
$('welcome-close').addEventListener('click', () => dialog.close());
$('welcome-start').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  rememberDismissal();
  helpButton.focus();
});
closeOnBackdropClick();

if (!wasDismissed()) open();
