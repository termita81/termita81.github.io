import { $ } from './dom.js';

/** Native fullscreen where supported, with a viewport-sized viewfinder as the fallback. */
export function createViewfinderFullscreen() {
  const frame = $('viewfinder');
  const button = $('viewfinder-fullscreen');
  const inertElements = new Map();
  let native = false;
  let request = null;

  function setExpanded(expanded) {
    frame.classList.toggle('is-fullscreen', expanded);
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', expanded ? 'Exit full screen' : 'Expand viewfinder');
    button.title = expanded ? 'Exit full screen' : 'Expand viewfinder';
    if (expanded) {
      for (const element of document.querySelectorAll('.phone-screen > *')) {
        if (element.contains(frame)) continue;
        inertElements.set(element, element.inert);
        element.inert = true;
      }
    } else {
      for (const [element, inert] of inertElements) element.inert = inert;
      inertElements.clear();
    }
  }

  async function exit() {
    // An exit may arrive before the browser has finished entering fullscreen.
    if (request) await request.catch(() => undefined);
    if (document.fullscreenElement === frame) await document.exitFullscreen();
    setExpanded(false);
    native = false;
  }

  async function toggle() {
    if (frame.classList.contains('is-fullscreen')) {
      await exit();
      button.focus({ preventScroll: true });
      return;
    }
    setExpanded(true);
    button.focus({ preventScroll: true });
    if (!document.fullscreenEnabled || !frame.requestFullscreen) return;
    try {
      request = frame.requestFullscreen();
      await request;
      native = true;
    } catch {
      // The viewport fallback remains usable if native fullscreen is denied.
      native = false;
    } finally {
      request = null;
    }
  }

  button.addEventListener('click', toggle);
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === frame) native = true;
    else if (native) {
      setExpanded(false);
      native = false;
      button.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && frame.classList.contains('is-fullscreen')) void exit();
  });
  return { toggle, exit };
}
