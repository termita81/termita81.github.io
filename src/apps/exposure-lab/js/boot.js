  // If the module below cannot start (CDN unreachable, no WebGL), say so instead of staying blank.
  window.addEventListener('error', function () {
    const text = 'Could not start the renderer. ' +
    'This page needs WebGL 2 and an internet connection to load three.js from its CDN.';
    const boot = document.getElementById('boot');
    if (boot && !boot.hidden && !boot.dataset.failed) {
      boot.textContent = text;
    }
  }, true);
