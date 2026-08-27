// Contact form on the About page, submitted via Web3Forms without a page reload
;(function () {
	const form = document.getElementById('contact-form')
	if (!form) return

	const status = document.getElementById('contact-form-status')
	const submitButton = form.querySelector('button[type="submit"]')

	form.addEventListener('submit', async function (event) {
		event.preventDefault()

		submitButton.disabled = true
		status.className = 'contact-form-status'
		status.textContent = 'Sending...'

		try {
			const response = await fetch(form.action, {
				method: 'POST',
				headers: { Accept: 'application/json' },
				body: new FormData(form),
			})
			const result = await response.json()

			if (response.ok && result.success) {
				status.classList.add('success')
				status.textContent = "Thanks — your message was sent!"
				form.reset()
			} else {
				status.classList.add('error')
				status.textContent =
					result.message || 'Something went wrong. Please try again.'
			}
		} catch (err) {
			status.classList.add('error')
			status.textContent = 'Network error. Please try again later.'
		} finally {
			submitButton.disabled = false
		}
	})
})()
