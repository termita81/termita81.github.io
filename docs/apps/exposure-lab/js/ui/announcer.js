import { $ } from './dom.js';

/** Tell screen-reader users about something that happened. */
export function announce(message) {
  $('announce').textContent = message;
}
