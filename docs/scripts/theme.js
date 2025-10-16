// Theme switcher with light, dark, and system options
(function() {
  const THEME_KEY = 'site-theme'
  const themeToggle = document.getElementById('theme-toggle')

  // Detect OS color scheme preference
  function getOSThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  // Get saved theme mode or default to 'system'
  function getSavedThemeMode() {
    const savedTheme = localStorage.getItem(THEME_KEY)
    // If no saved preference, default to system
    if (savedTheme === null) {
      return 'system'
    }
    return savedTheme
  }

  // Update icon based on current theme mode
  function updateIcon(mode) {
    const icon = document.querySelector('.theme-icon')
    if (icon) {
      // Different icons for each mode: light (sun), dark (moon), system (auto/circle)
      if (mode === 'light') {
        icon.textContent = '☀️'
      } else if (mode === 'dark') {
        icon.textContent = '🌙'
      } else {
        icon.textContent = '◐' // system/auto
      }
    }
  }

  // Apply theme to document based on mode
  function applyTheme(mode) {
    // Remove all theme classes first
    document.documentElement.classList.remove('light-theme', 'dark-theme')

    if (mode === 'light') {
      document.documentElement.classList.add('light-theme')
    } else if (mode === 'dark') {
      document.documentElement.classList.add('dark-theme')
    }
    // If mode is 'system', no class is added - CSS will use media query

    updateIcon(mode)
  }

  // Get current theme mode (from localStorage)
  function getCurrentThemeMode() {
    return getSavedThemeMode()
  }

  // Cycle through themes: light → dark → system → light
  function toggleTheme() {
    const currentMode = getCurrentThemeMode()
    let newMode

    if (currentMode === 'light') {
      newMode = 'dark'
    } else if (currentMode === 'dark') {
      newMode = 'system'
    } else {
      newMode = 'light'
    }

    applyTheme(newMode)
    localStorage.setItem(THEME_KEY, newMode)
  }

  // Initialize theme on page load
  applyTheme(getSavedThemeMode())

  // Listen for OS theme changes (only applies when in system mode)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // Only update if user is in system mode
      if (getSavedThemeMode() === 'system') {
        // Re-apply system theme to trigger any visual updates
        applyTheme('system')
      }
    })
  }

  // Add click handler to toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme)
  }
})()
