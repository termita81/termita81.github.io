if ((!'serviceWorker') in navigator) {
	console.error('No service worker!')
}

navigator.serviceWorker
	.register('/service-worker.js')
	.then(function (registration) {
		console.log('Service Worker registered with scope:', registration.scope)
	})
	.catch(function (error) {
		console.log('Service Worker registration failed:', error)
	})
