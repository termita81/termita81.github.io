// Theme switcher with light, dark, and system options
(function () {
	const THEME_KEY = 'site-theme'
	const themeToggle = document.getElementById('theme-toggle')

	function getSavedThemeMode() {
		const savedTheme = localStorage.getItem(THEME_KEY)
		if (savedTheme === null) {
			return 'system'
		}
		return savedTheme
	}

	function updateIcon(mode) {
		const icon = document.querySelector('.theme-icon')
		if (icon) {
			if (mode === 'light') {
				icon.textContent = '☀️'
			} else if (mode === 'dark') {
				icon.textContent = '🌙'
			} else {
				icon.textContent = '⚙️'// 💻🖥️🤖📱
			}
		}
	}

	function applyTheme(mode) {
		document.documentElement.classList.remove('light-theme', 'dark-theme')

		if (mode === 'light') {
			document.documentElement.classList.add('light-theme')
		} else if (mode === 'dark') {
			document.documentElement.classList.add('dark-theme')
		} else {
			// System mode - force check what browser actually reports
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.classList.add('dark-theme')
			} else {
				document.documentElement.classList.add('light-theme')
			}
		}

		updateIcon(mode)
	}

	function toggleTheme() {
		const currentMode = getSavedThemeMode()
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

	applyTheme(getSavedThemeMode())

	// Listen for OS theme changes (only applies when in system mode)
	if (window.matchMedia) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
			if (getSavedThemeMode() === 'system') {
				// Re-apply system theme to trigger any visual updates
				applyTheme('system')
			}
		})
	}

	if (themeToggle) {
		themeToggle.addEventListener('click', toggleTheme)
	}
})()
