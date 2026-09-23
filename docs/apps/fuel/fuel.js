/**
 * Fuel Tracker App
 * Simple vanilla JS implementation
 */

(function () {
  // Tab navigation
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.section');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab active state
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding section
      sections.forEach((section) => {
        if (section.id === targetTab + '-section') {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });

  // Initial load - show Log tab by default
	const section = document.getElementById('log-section');
	section.classList.add('active');

})();
