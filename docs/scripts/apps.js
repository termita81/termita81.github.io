;(function () {
	let installedApps = {}
	let latestVersions = {}
	let appStates = {}

	function renderApp(name, info) {
		const container = document.getElementById('apps-container')
		const existing = container.querySelector(`[data-app="${name}"]`)

		let installedVersion = null
		if (installedApps[name]) {
			installedVersion = installedApps[name]
		}

		const hasUpdate = installedVersion && info.version > installedVersion

		const isInstalled = !!installedVersion
		const state = isInstalled
			? hasUpdate
				? 'update-available'
				: 'installed'
			: 'not-installed'

		appStates[name] = state

		const appEl = document.createElement('div')
		appEl.className = `app-item ${state}`
		appEl.setAttribute('data-app', name)

		const newId = `app-${name}`
		appEl.id = newId

		appEl.innerHTML = `
				<div class="app-info">
					<h2><a href="/apps/${name}/index.html">${name.charAt(0).toUpperCase() + name.slice(1)}</a></h2>
					<p class="version">${installedVersion ? 'v' + installedVersion : 'Not installed'}</p>
					<p class="size">${info.size} bytes</p>
				</div>
				<div class="app-actions">
					<button class="app-btn" data-action="${!isInstalled ? 'install' : hasUpdate ? 'update' : 'uninstall'}" data-app="${name}">
						${!isInstalled ? 'Install' : hasUpdate ? 'Update to ' + info.version : 'Uninstall'}
					</button>
					${
	hasUpdate
		? `
					<button class="app-btn update-btn" data-action="update" data-app="${name}" data-version="${info.version}">
					Update to ${info.version}
					</button>
					`
		: ''
	}
				</div>
			`

		const btn = appEl.querySelector('.app-btn')
		btn.addEventListener('click', function () {
			const app = this.dataset.app
			const action = this.dataset.action
			handleAction(action, app)
		})

		if (existing && existing.parentNode) {
			existing.parentNode.insertBefore(appEl, existing)
			existing.remove()
		} else {
			container.appendChild(appEl)
		}
	}

	function showAppUpdates(updates) {
		const banner = document.getElementById('update-banner')
		if (!Object.keys(updates).length) {
			banner.style.display = 'none'
			return
		}

		banner.innerHTML = `<p>Updates available for: ${Object.keys(updates).join(', ')}!</p>`
		banner.style.display = 'block'
	}

	function handleAction(action, app) {
		if (!latestVersions[app]) {
			return
		}

		const btn = document.querySelector(`[data-app="${app}"] .app-btn`)

		if (action === 'install') {
			btn.disabled = true
			btn.textContent = 'Installing...'

			const port = navigator.serviceWorker.controller
			if (!port) {
				btn.disabled = false
				btn.textContent = 'Install'
				return
			}

			const messageChannel = new MessageChannel()
			messageChannel.port1.onmessage = event => {
				if (event.data) {
					if (event.data.type === 'INSTALL_COMPLETE') {
						handleInstallComplete(event.data.appName)
					} else if (event.data.type === 'INSTALL_ERROR') {
						btn.disabled = false
						btn.textContent = 'Install'
						console.error(
							`Failed to install ${event.data.appName}:`,
							event.data.error
						)
					}
				}
			}

			port.postMessage(
				{
					type: 'INSTALL_APP',
					appName: app,
					version: latestVersions[app].version
				},
				[messageChannel.port2]
			)

			appStates[app] = 'installing'
		} else if (action === 'uninstall') {
			btn.disabled = true
			btn.textContent = 'Uninstalling...'

			const port = navigator.serviceWorker.controller
			if (!port) {
				btn.disabled = false
				btn.textContent = 'Uninstall'
				return
			}

			const messageChannel = new MessageChannel()
			messageChannel.port1.onmessage = event => {
				if (event.data) {
					if (event.data.type === 'UNINSTALL_COMPLETE') {
						handleUninstallComplete(event.data.appName)
					} else if (event.data.type === 'UNINSTALL_ERROR') {
						btn.disabled = false
						btn.textContent = 'Uninstall'
						console.error(
							`Failed to uninstall ${event.data.appName}:`,
							event.data.error
						)
					}
				}
			}

			port.postMessage(
				{
					type: 'UNINSTALL_APP',
					appName: app
				},
				[messageChannel.port2]
			)

			appStates[app] = 'uninstalling'
		} else if (action === 'update') {
			const newVersion = latestVersions[app].version
			const oldVersion = installedApps[app]

			btn.disabled = true
			btn.textContent = 'Updating...'

			const port = navigator.serviceWorker.controller
			if (!port) {
				btn.disabled = false
				btn.textContent = 'Update'
				return
			}

			const messageChannel = new MessageChannel()
			messageChannel.port1.onmessage = event => {
				if (event.data) {
					if (event.data.type === 'UPDATE_COMPLETE') {
						handleUpdateComplete(event.data.appName)
					} else if (event.data.type === 'UPDATE_ERROR') {
						btn.disabled = false
						btn.textContent = 'Update'
						console.error(
							`Failed to update ${event.data.appName}:`,
							event.data.error
						)
					}
				}
			}

			port.postMessage(
				{
					type: 'UPDATE_APP',
					appName: app,
					newVersion: newVersion,
					oldVersion: oldVersion
				},
				[messageChannel.port2]
			)

			appStates[app] = 'updating'
		}
	}

	function handleInstallComplete(appName) {
		const installedVersion = latestVersions[appName].version

		installedApps[appName] = installedVersion
		appStates[appName] = 'installed'

		renderApp(appName, latestVersions[appName])

		const btn = document.querySelector(`[data-app="${appName}"] .app-btn`)
		if (btn) {
			btn.disabled = false
			btn.textContent = 'Uninstall'
			btn.dataset.action = 'uninstall'
		}
	}

	function handleUpdateComplete(appName) {
		const newVersion = latestVersions[appName].version

		installedApps[appName] = newVersion
		appStates[appName] = 'installed'

		renderApp(appName, latestVersions[appName])

		const btn = document.querySelector(`[data-app="${appName}"] .app-btn`)
		if (btn) {
			btn.disabled = false
			btn.textContent = 'Uninstall'
			btn.dataset.action = 'uninstall'
		}
	}

	function handleUninstallComplete(appName) {
		delete installedApps[appName]
		appStates[appName] = 'not-installed'

		renderApp(appName, latestVersions[appName])

		const btn = document.querySelector(`[data-app="${appName}"] .app-btn`)
		if (btn) {
			btn.disabled = false
			btn.textContent = 'Install'
			btn.dataset.action = 'install'
		}
	}

	// _refreshAppList - placeholder for future use
	function _refreshAppList() {
		renderApps()
	}

	const updateBtn = document.getElementById('reload-btn')
	if (updateBtn) {
		updateBtn.addEventListener('click', () => {
			window.location.reload()
		})
	}

	function renderApps() {
		const container = document.getElementById('apps-container')
		container.innerHTML = ''

		Object.entries(latestVersions).forEach(([name, info]) => {
			renderApp(name, info)
		})
	}

	// _showAppState - placeholder for future use
	function _showAppState() {
		/* intentional */
	}

	async function loadInstalledApps() {
		if (!navigator.serviceWorker) {
			return
		}

		try {
			const registration = await navigator.serviceWorker.ready
			const response = await new Promise((resolve, reject) => {
				const channel = new MessageChannel()
				channel.port1.onmessage = e => resolve(e.data)
				channel.port1.onerror = e => reject(e)
				registration.active.postMessage({ type: 'GET_INSTALLED_APPS' }, [
					channel.port2
				])
			})

			if (response && response.type === 'INSTALLED_APPS') {
				installedApps = response.apps || {}
			}
		} catch (error) {
			console.error('Failed to get installed apps:', error)
			installedApps = {}
		}
	}

	fetch('/apps/versions.json')
		.then(response => response.json())
		.then(versions => {
			const { site: _, ...appVersions } = versions
			latestVersions = appVersions
			return loadInstalledApps()
		})
		.then(() => {
			appStates = {}
			renderApps()
		})
		.catch(error => {
			console.error('Failed to load versions:', error)
		})

	if (navigator.serviceWorker) {
		navigator.serviceWorker.addEventListener('message', function (event) {
			if (event.data && event.data.type === 'APPS_UPDATED') {
				showAppUpdates(event.data.updates)
			}
			if (event.data && event.data.type === 'INSTALL_COMPLETE') {
				handleInstallComplete(event.data.appName)
			}
			if (event.data && event.data.type === 'UNINSTALL_COMPLETE') {
				handleUninstallComplete(event.data.appName)
			}
			if (event.data && event.data.type === 'UPDATE_COMPLETE') {
				handleUpdateComplete(event.data.appName)
			}
		})

		const _checkInterval = setInterval(() => {
			if (!navigator.serviceWorker) {
				return
			}
			navigator.serviceWorker.ready.then(registration => {
				registration.active.postMessage({ type: 'CHECK_VERSIONS' })
			})
		}, 60000)
	}
})()
