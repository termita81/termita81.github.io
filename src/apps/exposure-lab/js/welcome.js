(() => {
  const dialog = document.getElementById('welcome');
  const help = document.getElementById('welcome-open');
  const storageKey = 'exposure-lab-welcome-dismissed';
  const dismiss = () => dialog.close();

  help.addEventListener('click', () => dialog.showModal());
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
  if (!dismissed) dialog.showModal();
})();
