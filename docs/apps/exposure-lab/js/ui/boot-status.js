import { $ } from './dom.js';

/** Replace the loading message with the reason the app cannot start. */
export function showBootFailure(message) {
  const boot = $('boot');
  boot.dataset.failed = '1'; // tells boot.js to leave this message in place
  boot.textContent = message;
}

export function hideBootStatus() {
  $('boot').hidden = true;
}
