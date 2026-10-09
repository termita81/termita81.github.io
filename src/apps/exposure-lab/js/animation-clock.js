import { $ } from "./dom.js";

const lightbox = $("lightbox");
let elapsed = 0,
  previous = performance.now(),
  paused = lightbox.open;

function syncClock() {
  const now = performance.now();
  if (!paused) elapsed += now - previous;
  previous = now;
  paused = lightbox.open;
}

// Track dialog opening and closing, including Escape and native dialog controls.
const observer = new MutationObserver(syncClock);
observer.observe(lightbox, { attributes: true, attributeFilter: ["open"] });

export function animationTime() {
  syncClock();
  return elapsed / 1000;
}
