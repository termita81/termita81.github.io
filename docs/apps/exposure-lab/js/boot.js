// A classic (non-module) script on purpose: it has to be listening before the module graph
// loads, so that a failed start (CDN unreachable, no WebGL) is reported instead of leaving the
// page blank.
(() => {
  const MESSAGE =
    'Could not start the renderer. ' +
    'This page needs WebGL 2 and an internet connection to load three.js from its CDN.';

  function reportFailure() {
    const boot = document.getElementById('boot');
    // A finished start (hidden) or a more specific message (data-failed) takes precedence.
    if (boot && !boot.hidden && !boot.dataset.failed) boot.textContent = MESSAGE;
  }

  window.addEventListener('error', reportFailure, true);
})();
