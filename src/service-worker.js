const CACHE_NAME = 'termita81-blog-v2'
const APPS_CACHE_NAME = 'apps-cache-v1'
const urlsToCache = [
	'/',
	'/index.html',
	'/about.html',
	'/styles/main.css',
	'/scripts/theme.js',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
]

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function (cache) {
				return cache.addAll(urlsToCache).catch(function (error) {
					console.error('Failed to cache resources during install:', error)
					throw error
					})
				})
	)
	self.skipWaiting()
})

self.addEventListener('message', function (event) {
	if (event.data && event.data.type === 'CHECK_VERSIONS') {
		fetch('/apps/versions.json')
			.then(response => response.json())
			.then(versions => {
				return clients.matchAll({ type: 'window' })
					.then(clients => {
						const updates = {}
						clients.forEach(client => {
							client.postMessage({ type: 'APPS_UPDATED', updates: updates })
							})
						})
				})
			.catch(error => {
				console.error('Failed to fetch versions:', error)
				})
	}
})

self.addEventListener('fetch', function (event) {
	if (event.request.method !== 'GET') {
		return
	}

	event.respondWith(
		caches.match(event.request)
			.then(function (response) {
				if (response) {
					return response
					}
				
				if (event.request.url.startsWith('/apps/')) {
					return handleAppRequest(event.request)
					}
				
				return fetch(event.request).then(
						function (response) {
							if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
								return response
								}
							const responseToCache = response.clone()
							caches.open(APPS_CACHE_NAME)
								.then(function (cache) {
									cache.put(event.request, responseToCache)
									})
								.catch(function (error) {
									console.error('Failed to cache response:', error)
									})
							return response
							}
						).catch(function (error) {
							console.error('Fetch failed:', error)
							return caches.match('/index.html')
							})
				})
	)
})

async function handleAppRequest(request) {
	const response = await fetch(request)
	
	if (!response || response.status !== 200) {
		return response
	}
	
	const cache = await caches.open(APPS_CACHE_NAME)
	await cache.put(request, response.clone())
	return response
}

async function installApp(appName, version) {
	const cache = await caches.open(APPS_CACHE_NAME)
	
	const appUrl = `/apps/${appName}/index.html`
	const response = await fetch(appUrl)
	
	if (!response || response.status !== 200) {
		console.error(`Failed to fetch ${appName}`)
		return false
	}
	
	await cache.put(appUrl, response.clone())
	
	const cacheKey = `apps:${appName}:${version}`
	cache.add(appUrl).then(() => {
		console.log(`Installed ${appName} ${version}`)
		})
	
	return true
}

async function uninstallApp(appName) {
	const cache = await caches.open(APPS_CACHE_NAME)
	const keys = await cache.keys()
	
	await Promise.all(keys.filter(key => key.url.includes(appName)).map(key => cache.delete(key)))
	return true
}

self.addEventListener('activate', function (event) {
	const cacheWhitelist = [CACHE_NAME, APPS_CACHE_NAME]
	event.waitUntil(
		caches.keys().then(function (cacheNames) {
			return Promise.all(
				cacheNames.map(function (cacheName) {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName)
						}
					})
				)
			)
		)
	)
	self.clients.claim()
})

self.addEventListener('message', function (event) {
	if (!event.data || !event.ports[0]) return
	
	if (event.data.type === 'INSTALL_APP') {
		event.waitUntil(
			installApp(event.data.appName, event.data.version)
				.then(success => {
					if (success) {
						event.ports[0].postMessage({ success: true, type: 'INSTALL_COMPLETE' })
						} else {
						event.ports[0].postMessage({ success: false, type: 'INSTALL_ERROR' })
						}
					})
				.catch(error => {
					console.error('Install failed:', error)
					event.ports[0].postMessage({ success: false, type: 'INSTALL_ERROR', error: error.message })
					})
			)
	}
	
	if (event.data.type === 'UNINSTALL_APP') {
		event.waitUntil(
			uninstallApp(event.data.appName)
				.then(() => {
					event.ports[0].postMessage({ success: true, type: 'UNINSTALL_COMPLETE' })
					})
				.catch(error => {
					console.error('Uninstall failed:', error)
					event.ports[0].postMessage({ success: false, type: 'UNINSTALL_ERROR', error: error.message })
					})
			)
	}
})
