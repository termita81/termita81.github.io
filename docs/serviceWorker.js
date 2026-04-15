const APPS_CACHE_NAME = 'apps-cache-v1'

const APP_METADATA_STORE = 'appMetadata'
const APP_INDEX_STORE = 'appIndex'

function openMetadataDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('apps', 1)

		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)

		request.onupgradeneeded = event => {
			const db = event.target.result
			if (!db.objectStoreNames.contains(APP_METADATA_STORE)) {
				db.createObjectStore(APP_METADATA_STORE, { keyPath: 'appName' })
			}
			if (!db.objectStoreNames.contains(APP_INDEX_STORE)) {
				db.createObjectStore(APP_INDEX_STORE, {
					keyPath: 'appName',
					autoIncrement: false
				})
			}
		}
	})
}

async function getInstalledApps() {
	try {
		const db = await openMetadataDB()
		const tx = db.transaction(APP_METADATA_STORE, 'readonly')
		const store = tx.objectStore(APP_METADATA_STORE)
		const all = await new Promise((resolve, reject) => {
			const req = store.getAll()
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})
		await db.close()
		return all.reduce((acc, app) => {
			if (app && app.version) {
				acc[app.appName] = app.version
			}
			return acc
		}, {})
	} catch (error) {
		console.error('Failed to get installed apps:', error)
		return {}
	}
}

async function clearInstalledVersion(appName) {
	try {
		const db = await openMetadataDB()
		const tx = db.transaction(APP_METADATA_STORE, 'readwrite')
		const store = tx.objectStore(APP_METADATA_STORE)
		await new Promise((resolve, reject) => {
			const req = store.delete(appName)
			req.onsuccess = () => resolve()
			req.onerror = () => reject(req.error)
		})
		await db.close()
		return true
	} catch (error) {
		console.error(`Failed to clear ${appName}:`, error)
		return false
	}
}

self.addEventListener('message', async function (event) {
	if (event.data && event.data.type === 'CHECK_VERSIONS') {
		fetch('/apps/versions.json')
			.then(response => response.json())
			.then(async versions => {
				const installedApps = await getInstalledApps()
				const updates = {}
				Object.keys(versions).forEach(appName => {
					if (appName === 'site') {
						return
					}
					const installedVersion = installedApps[appName]
					if (
						installedVersion &&
						versions[appName].version > installedVersion
					) {
						updates[appName] = versions[appName].version
					}
				})

				const clients = await self.clients.matchAll({ type: 'window' })
				clients.forEach(client => {
					client.postMessage({ type: 'APPS_UPDATED', updates: updates })
				})
			})
			.catch(error => {
				console.error('Failed to fetch versions:', error)
			})
	}

	if (event.data && event.data.type === 'GET_INSTALLED_APPS') {
		const installedApps = await getInstalledApps()
		event.ports[0].postMessage({ type: 'INSTALLED_APPS', apps: installedApps })
		return
	}

	if (!event.data || !event.ports[0]) {
		return
	}

	if (event.data.type === 'INSTALL_APP') {
		const appName = event.data.appName
		const version = event.data.version
		event.waitUntil(
			installAndStore(appName, version)
				.then(success => {
					if (success) {
						event.ports[0].postMessage({
							success: true,
							type: 'INSTALL_COMPLETE',
							appName: appName
						})
					} else {
						event.ports[0].postMessage({
							success: false,
							type: 'INSTALL_ERROR',
							appName: appName
						})
					}
				})
				.catch(error => {
					console.error('Install failed:', error)
					event.ports[0].postMessage({
						success: false,
						type: 'INSTALL_ERROR',
						appName: appName,
						error: error.message
					})
				})
		)
	}

	if (event.data.type === 'UNINSTALL_APP') {
		const appName = event.data.appName
		event.waitUntil(
			uninstallApp(appName)
				.then(() => {
					event.ports[0].postMessage({
						success: true,
						type: 'UNINSTALL_COMPLETE',
						appName: appName
					})
				})
				.catch(error => {
					console.error('Uninstall failed:', error)
					event.ports[0].postMessage({
						success: false,
						type: 'UNINSTALL_ERROR',
						appName: appName,
						error: error.message
					})
				})
		)
	}

	if (event.data && event.data.type === 'UPDATE_APP') {
		const appName = event.data.appName
		const newVersion = event.data.newVersion
		const oldVersion = event.data.oldVersion
		event.waitUntil(
			updateApp(appName, newVersion, oldVersion)
				.then(success => {
					if (success) {
						event.ports[0].postMessage({
							success: true,
							type: 'UPDATE_COMPLETE',
							appName: appName
						})
					} else {
						event.ports[0].postMessage({
							success: false,
							type: 'UPDATE_ERROR',
							appName: appName
						})
					}
				})
				.catch(error => {
					console.error('Update failed:', error)
					event.ports[0].postMessage({
						success: false,
						type: 'UPDATE_ERROR',
						appName: appName,
						error: error.message
					})
				})
		)
	}
})

async function installAndStore(appName, version) {
	try {
		const db = await openMetadataDB()
		const tx = db.transaction(APP_METADATA_STORE, 'readwrite')
		const store = tx.objectStore(APP_METADATA_STORE)

		await new Promise((resolve, reject) => {
			const req = store.put({
				appName,
				version,
				installedAt: new Date().toISOString()
			})
			req.onsuccess = () => resolve()
			req.onerror = () => reject(req.error)
		})

		const cache = await caches.open(APPS_CACHE_NAME)
		const appUrl = `/apps/${appName}/index.html`
		const response = await fetch(appUrl)

		if (!response || response.status !== 200) {
			await store.delete(appName)
			return false
		}

		await cache.put(appUrl, response.clone())
		await db.close()
		console.log(`Installed ${appName} ${version}`)
		return true
	} catch (error) {
		console.error(`Failed to install ${appName}:`, error)
		return false
	}
}

async function updateApp(appName, newVersion, oldVersion) {
	try {
		const cache = await caches.open(APPS_CACHE_NAME)
		const appUrl = `/apps/${appName}/index.html`

		const keys = await cache.keys()
		keys
			.filter(key => key.url.includes(appName))
			.forEach(key => cache.delete(key))

		const response = await fetch(appUrl)
		if (!response || response.status !== 200) {
			return false
		}

		await cache.put(appUrl, response.clone())

		const db = await openMetadataDB()
		const tx = db.transaction(APP_METADATA_STORE, 'readwrite')
		const store = tx.objectStore(APP_METADATA_STORE)

		await new Promise((resolve, reject) => {
			const req = store.put({
				appName,
				version: newVersion,
				installedAt: new Date().toISOString()
			})
			req.onsuccess = () => resolve()
			req.onerror = () => reject(req.error)
		})

		await db.close()
		console.log(`Updated ${appName} from ${oldVersion} to ${newVersion}`)
		return true
	} catch (error) {
		console.error(`Failed to update ${appName}:`, error)
		return false
	}
}

async function uninstallApp(appName) {
	try {
		const cache = await caches.open(APPS_CACHE_NAME)
		const keys = await cache.keys()
		await Promise.all(
			keys
				.filter(key => key.url.includes(appName))
				.map(key => cache.delete(key))
		)

		await clearInstalledVersion(appName)
		console.log(`Uninstalled ${appName}`)
		return true
	} catch (error) {
		console.error(`Failed to uninstall ${appName}:`, error)
		return false
	}
}

self.addEventListener('activate', function (event) {
	const cacheWhitelist = [APPS_CACHE_NAME]
	event.waitUntil(
		caches.keys().then(function (cacheNames) {
			return Promise.all(
				cacheNames.map(function (cacheName) {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName)
					}
				})
			)
		})
	)
	self.clients.claim()
})
