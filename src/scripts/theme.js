// Theme switcher with OS preference support
(function() {
  const THEME_KEY = 'site-theme';
  const themeToggle = document.getElementById('theme-toggle');

  // Detect OS color scheme preference
  function getOSThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Get saved theme or default to OS preference
  function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    // If no saved preference, use OS preference
    if (savedTheme === null) {
      return getOSThemePreference();
    }
    return savedTheme;
  }

  // Update icon based on current theme
  function updateIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      // Show sun icon in dark mode (click to go light), moon in light mode (click to go dark)
      icon.textContent = theme === 'dark' ? '☀' : '🌙';
    }
  }

  // Apply theme to document
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    updateIcon(theme);
  }

  // Get current theme (from data attribute or OS preference)
  function getCurrentTheme() {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme) {
      return dataTheme;
    }
    return getOSThemePreference();
  }

  // Toggle between light and dark
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }

  // Initialize theme on page load
  applyTheme(getSavedTheme());

  // Listen for OS theme changes (if user changes system preference)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem(THEME_KEY) === null) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Add click handler to toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
})();
