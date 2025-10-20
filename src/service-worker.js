const CACHE_NAME = 'termita81-blog-v2'
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

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function(cache) {
				return cache.addAll(urlsToCache).catch(function(error) {
					console.error('Failed to cache resources during install:', error)
					throw error
				})
			})
	)
	self.skipWaiting()
})

self.addEventListener('fetch', function(event) {
	if (event.request.method !== 'GET') {
		return
	}

	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
				if (response) {
					return response
				}
				return fetch(event.request).then(
					function(response) {
						if(!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
							return response
						}
						const responseToCache = response.clone()
						caches.open(CACHE_NAME)
							.then(function(cache) {
								cache.put(event.request, responseToCache)
							})
							.catch(function(error) {
								console.error('Failed to cache response:', error)
							})
						return response
					}
				).catch(function(error) {
					console.error('Fetch failed:', error)
					return caches.match('/index.html')
				})
			})
	)
})

self.addEventListener('activate', function(event) {
	const cacheWhitelist = [CACHE_NAME]
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName) {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName)
					}
				})
			)
		})
	)
	self.clients.claim()
})
