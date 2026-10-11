(() => {
  const dialog = document.getElementById('welcome');
  const help = document.getElementById('welcome-open');
  const storageKey = 'exposure-lab-welcome-dismissed';
  const dismiss = () => dialog.close();
  const open = () => {
    dialog.showModal();
    dialog.scrollTop = 0;
  };

  help.addEventListener('click', open);
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let startedOutside = false;
  dialog.addEventListener('pointerdown', event => {
    startedOutside = event.target === dialog && outside(event);
  });
  dialog.addEventListener('pointercancel', () => {
    startedOutside = false;
  });
  dialog.addEventListener('click', event => {
    if (startedOutside && event.target === dialog && outside(event)) dismiss();
    startedOutside = false;
  });
  document.getElementById('welcome-close').addEventListener('click', dismiss);
  document.getElementById('welcome-start').addEventListener('click', dismiss);
  dialog.addEventListener('close', () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // The guide still works when browser storage is unavailable.
    }
    help.focus();
  });

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(storageKey) === '1';
  } catch {
    // Show the guide on first load when preferences cannot be read.
  }
  if (!dismissed) open();
})();
