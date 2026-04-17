# Fuel App Implementation Guide (Step-by-Step)

**Guiding Principles:**

- Each step = 1 discrete, completable task
- Every step ends with app working (even if minimal)
- No step depends on more than 3 previous steps
- Test after each step before moving to next

---

## Session 1: Foundation (10 steps)

**Step 1: Create directory structure**

```
src/apps/fuel/
├── index.html
├── fuel.js
└── fuel.css
```

**Step 2: Build basic HTML shell**

- Add `<!DOCTYPE html>`, `html`, `head`, `body` tags
- Add `<title>Fuel Tracker</title>`
- Add `<div id="tabs">` with 3 tabs (Add Fill-Up, History, Export)
- Add 3 empty divs for tab content (`#fill-up-tab`, `#history-tab`, `#export-tab`)
- Add navigation buttons with IDs
- **Test**: Page shows with 3 tabs, no errors in console

**Step 3: Add basic CSS for tabs**

- Add `<link rel="stylesheet">` to `fuel.css`
- Style tabs container (flexbox, spacing)
- Style tab buttons (padding, hover state)
- Style active tab class
- **Test**: Tabs visually distinct, active tab shows

**Step 4: Add tab switching HTML structure**

```html
<div id="fill-up-tab" class="tab-content active">
	<form id="fill-up-form">
		<!-- Add 8 input groups here -->
	</form>
</div>
<div id="history-tab" class="tab-content"></div>
<div id="export-tab" class="tab-content">
	<!-- Export button -->
</div>
```

**Step 5: Style mobile-responsive layout**

- Add `@media` query for mobile (<768px)
- Make tabs full width on mobile
- Style form inputs for touch
- **Test**: Resize browser, tabs and form work on mobile width

**Step 6: Add form field groups**

```html
<!-- Basic Info -->
<input type="date" id="date" />
<input type="number" id="mileage" />

<!-- Fuel Details -->
<input type="number" id="fuelAmount" step="0.1" />
<input type="number" id="pricePerUnit" step="0.01" />
<input type="number" id="totalAmount" step="0.01" />

<!-- Station Info -->
<input type="text" id="stationName" placeholder="Gas station name" />
<input type="text" id="location" placeholder="Location (optional)" />

<!-- Fill Type -->
<select id="fillType">
	<option value="fill-up">Fill-up</option>
	<option value="less">Less</option>
</select>
```

**Step 7: Style form layout**

- Grid layout for form (2 columns on desktop)
- Proper spacing between fields
- Label elements for accessibility
- Action button: "Save Fill-Up"
- **Test**: Form renders properly, no layout issues

**Step 8: Add script tag to HTML**

```html
<script src="fuel.js" defer></script>
```

**Step 9: Initialize IndexedDB in `fuel.js`**

```javascript
const DB_NAME = 'fuelAppDB'
const STORE_NAME = 'fillups'

let db

function initDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => {
			db = request.result
			resolve(db)
		}
		request.onupgradeneeded = event => {
			const db = event.target.result
			const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
			store.createIndex('date', 'date', { unique: false })
		}
	})
}
```

**Step 10: Call `initDB()` on page load**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
	try {
		await initDB()
		console.log('Database initialized')
	} catch (error) {
		console.error('DB init failed:', error)
	}
})
```

**Session 1 Result:** App shell exists with tabs, form, and IndexedDB ready to use. No data yet, but all structures in place.

---

## Session 2: Tab Navigation (5 steps)

**Step 11: Add tab switching logic**

```javascript
function switchTab(tabId) {
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.classList.remove('active')
	})
	document.getElementById(tabId).classList.add('active')
}

document.getElementById('add-fillup-tab-btn').addEventListener('click', () => {
	switchTab('fill-up-tab')
})
document.getElementById('history-tab-btn').addEventListener('click', () => {
	switchTab('history-tab')
})
document.getElementById('export-tab-btn').addEventListener('click', () => {
	switchTab('export-tab')
})
```

**Step 12: Add default tab on page load**

```javascript
switchTab('fill-up-tab') // Start on Add Fill-Up tab
```

**Step 13: Add "Add Fill-Up" button click handler**

```javascript
document
	.getElementById('save-fillup-btn')
	.addEventListener('click', handleSaveFillUp)
```

**Step 14: Create placeholder `handleSaveFillUp` function**

```javascript
async function handleSaveFillUp() {
	// TODO: Add form handling
	alert('Feature not yet implemented')
}
```

**Step 15: Test tab switching**

- Click all 3 tabs multiple times
- Ensure active class toggles correctly
- Ensure empty states render
- **Result**: App navigates between tabs without errors

---

## Session 3: Form Handling (8 steps)

**Step 16: Create form validation function**

```javascript
function validateForm(formData) {
	const errors = []

	const today = new Date().toISOString().split('T')[0]
	if (formData.date > today) errors.push('Date cannot be in the future')
	if (formData.fuelAmount <= 0) errors.push('Fuel amount must be positive')
	if (formData.pricePerUnit <= 0) errors.push('Price must be positive')
	if (formData.totalAmount <= 0) errors.push('Total amount must be positive')

	return errors
}
```

**Step 17: Read previous mileage from IndexedDB**

```javascript
async function getPreviousMileage() {
	const tx = db.transaction([STORE_NAME], 'readonly')
	const store = tx.objectStore(STORE_NAME)
	const cursorReq = store.openCursor(null, 'prev')

	return new Promise(resolve => {
		cursorReq.onsuccess = () => {
			if (cursorReq.result) {
				resolve(cursorReq.result.value.mileage)
			} else {
				resolve(null)
			}
		}
	})
}
```

**Step 18: Add mileage validation**

```javascript
async function validateForm(formData) {
	const errors = validateForm(formData)
	const prevMileage = await getPreviousMileage()

	if (prevMileage && formData.mileage <= prevMileage) {
		errors.push('Mileage must be higher than previous entry')
	}

	return errors
}
```

**Step 19: Build form data object**

```javascript
function buildFormData() {
	return {
		date: document.getElementById('date').value,
		mileage: parseFloat(document.getElementById('mileage').value),
		fuelAmount: parseFloat(document.getElementById('fuelAmount').value),
		pricePerUnit: parseFloat(document.getElementById('pricePerUnit').value),
		totalAmount: parseFloat(document.getElementById('totalAmount').value),
		stationName: document.getElementById('stationName').value.trim(),
		location: document.getElementById('location').value.trim() || null,
		fillType: document.getElementById('fillType').value,
		unit: localStorage.getItem('unitSystem') || 'gallons',
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
}
```

**Step 20: Handle calculated display values**

```javascript
function showCalculations(formData) {
	const calculatedCost = formData.fuelAmount * formData.pricePerUnit
	const savings = calculatedCost - formData.totalAmount

	document.getElementById('calc-cost').textContent =
		`$${calculatedCost.toFixed(2)}`
	document.getElementById('savings').textContent = `$${savings.toFixed(2)}`
}
```

**Step 21: Update `handleSaveFillUp` with validation**

```javascript
async function handleSaveFillUp() {
	const formData = buildFormData()
	const errors = await validateForm(formData)

	if (errors.length > 0) {
		showNotification(errors.join('\n'), 'error')
		return
	}

	// Show calculations before save
	showCalculations(formData)

	// TODO: Save to IndexedDB
	showNotification('Would save: ' + formData.id, 'success')
}
```

**Step 22: Add success/error feedback UI**

```javascript
function showNotification(message, type) {
	const div = document.createElement('div')
	div.className = `notification ${type}`
	div.textContent = message
	document.body.appendChild(div)
	setTimeout(() => div.remove(), 3000)
}
```

**Step 23: Complete `handleSaveFillUp` with save logic**

```javascript
async function handleSaveFillUp() {
	const formData = buildFormData()
	const errors = await validateForm(formData)

	if (errors.length > 0) {
		showNotification(errors.join('\n'), 'error')
		return
	}

	showCalculations(formData)

	try {
		const tx = db.transaction([STORE_NAME], 'readwrite')
		const store = tx.objectStore(STORE_NAME)
		const req = store.put(formData)

		req.onsuccess = async () => {
			showNotification('Fill-up saved successfully!', 'success')
			switchTab('history-tab')
			await renderHistory()
		}
		req.onerror = () => showNotification('Save failed', 'error')
	} catch (error) {
		showNotification(error.message, 'error')
	}
}
```

**Session 3 Result:** User can fill out form, validate it, and see save confirmation. App is functional with data persistence.

---

## Session 4: History & Stats (10 steps)

**Step 24: Add empty state to History tab**

```javascript
function showEmptyHistory() {
	document.getElementById('history-tab').innerHTML = `
     <div class="empty-state">
       <p>No fill-ups recorded yet.</p>
       <button onclick="switchTab('fill-up-tab')">Add your first fill-up</button>
     </div>
   `
}
```

**Step 25: Create table structure**

```javascript
function buildTableHTML(entries) {
	return `
     <table id="history-table">
       <thead>
         <tr>
           <th>Date</th>
           <th>Station</th>
           <th>Mileage</th>
           <th>Fuel</th>
           <th>Price</th>
           <th>Total</th>
           <th>Savings</th>
           <th>Type</th>
           <th>Efficiency</th>
           <th>Actions</th>
         </tr>
       </thead>
       <tbody id="table-body"></tbody>
     </table>
   `
}
```

**Step 26: Render table rows**

```javascript
function renderTableRows(entries) {
	const tbody = document.getElementById('table-body')
	tbody.innerHTML = ''

	entries.forEach(entry => {
		const prevMileage = getPreviousEntryMileage(entries, entry)
		const efficiency = prevMileage
			? ((entry.mileage - prevMileage) / entry.fuelAmount).toFixed(2)
			: 'N/A'

		const savings = (
			entry.fuelAmount * entry.pricePerUnit -
			entry.totalAmount
		).toFixed(2)

		const row = document.createElement('tr')
		row.innerHTML = `
       <td>${entry.date}</td>
       <td>${entry.stationName || '-'}</td>
       <td>${entry.mileage}</td>
       <td>${entry.fuelAmount} ${entry.unit}</td>
       <td>$${entry.pricePerUnit.toFixed(2)}</td>
       <td>$${entry.totalAmount.toFixed(2)}</td>
       <td>$${savings}</td>
       <td>${entry.fillType}</td>
       <td>${efficiency}</td>
       <td>
         <button onclick="editFillUp('${entry.id}')">Edit</button>
         <button onclick="deleteFillUp('${entry.id}')">Delete</button>
       </td>
     `
		tbody.appendChild(row)
	})
}
```

**Step 27: Create `renderHistory()` function**

```javascript
async function renderHistory() {
	if (!db) {
		showEmptyHistory()
		return
	}

	const tx = db.transaction([STORE_NAME], 'readonly')
	const store = tx.objectStore(STORE_NAME)
	const cursorReq = store.openCursor(null, 'prev')

	return new Promise(resolve => {
		const entries = []
		cursorReq.onsuccess = () => {
			if (cursorReq.result) {
				entries.push(cursorReq.result.value)
				cursorReq.result.continue()
			} else {
				if (entries.length === 0) {
					showEmptyHistory()
					resolve()
					return
				}

				document.getElementById('history-tab').innerHTML =
					buildTableHTML(entries)
				renderTableRows(entries)
				renderSummary(entries)
				buildCharts(entries)
				resolve()
			}
		}
		cursorReq.onerror = () => {
			showEmptyHistory()
			resolve()
		}
	})
}
```

**Step 28: Create `editFillUp()` function**

```javascript
async function editFillUp(id) {
	const tx = db.transaction([STORE_NAME], 'readonly')
	const store = tx.objectStore(STORE_NAME)
	const req = store.get(id)

	return new Promise(resolve => {
		req.onsuccess = () => {
			const entry = req.result
			// Populate form with existing data
			document.getElementById('date').value = entry.date
			document.getElementById('mileage').value = entry.mileage
			document.getElementById('fuelAmount').value = entry.fuelAmount
			document.getElementById('pricePerUnit').value = entry.pricePerUnit
			document.getElementById('totalAmount').value = entry.totalAmount
			document.getElementById('stationName').value = entry.stationName
			document.getElementById('location').value = entry.location || ''
			document.getElementById('fillType').value = entry.fillType
			switchTab('fill-up-tab')
			resolve()
		}
	})
}
```

**Step 29: Create `deleteFillUp()` function**

```javascript
async function deleteFillUp(id) {
	if (!confirm('Are you sure you want to delete this entry?')) {
		return
	}

	try {
		const tx = db.transaction([STORE_NAME], 'readwrite')
		const store = tx.objectStore(STORE_NAME)
		const req = store.delete(id)

		req.onsuccess = async () => {
			showNotification('Entry deleted', 'success')
			await renderHistory()
		}
		req.onerror = () => showNotification('Delete failed', 'error')
	} catch (error) {
		showNotification(error.message, 'error')
	}
}
```

**Step 30: Create `renderSummary()` function**

```javascript
function renderSummary(entries) {
	const summary = calculateSummary(entries)

	const container = document.createElement('div')
	container.className = 'summary-grid'
	container.innerHTML = `
     <div class="card">
       <h3>Total Fuel</h3>
       <p>${summary.totalFuel.toFixed(1)} ${summary.unit}</p>
     </div>
     <div class="card">
       <h3>Total Spend</h3>
       <p>$${summary.totalSpend.toFixed(2)}</p>
     </div>
     <div class="card">
       <h3>Total Miles</h3>
       <p>${summary.totalMiles.toFixed(0)}</p>
     </div>
     <div class="card">
       <h3>Avg Efficiency</h3>
       <p>${summary.avgEfficiency.toFixed(2)} MPG</p>
     </div>
     <div class="card">
       <h3>Avg Cost/mile</h3>
       <p>$${summary.avgCostMile.toFixed(2)}</p>
     </div>
     <div class="card">
       <h3>Total Savings</h3>
       <p>$${summary.totalSavings.toFixed(2)}</p>
     </div>
   `

	document
		.getElementById('history-tab')
		.insertBefore(container, container.firstChild)
}
```

**Step 31: Create `calculateSummary()` function**

```javascript
function calculateSummary(entries) {
	if (entries.length === 0)
		return {
			totalFuel: 0,
			totalSpend: 0,
			totalMiles: 0,
			avgEfficiency: 0,
			avgCostMile: 0,
			totalSavings: 0,
			unit: 'gal'
		}

	let totalFuel = 0,
		totalSpend = 0,
		totalMiles = 0,
		totalSavings = 0
	let efficiencySum = 0,
		efficiencyCount = 0

	entries.forEach((entry, index) => {
		totalFuel += entry.fuelAmount
		totalSpend += entry.totalAmount

		if (index > 0) {
			const miles = entry.mileage - entries[index - 1].mileage
			totalMiles += miles
			efficiencySum += miles / entry.fuelAmount
			efficiencyCount++
		}

		totalSavings += entry.fuelAmount * entry.pricePerUnit - entry.totalAmount
	})

	return {
		totalFuel,
		totalSpend,
		totalMiles,
		avgEfficiency: efficiencyCount > 0 ? efficiencySum / efficiencyCount : 0,
		avgCostMile: totalMiles > 0 ? totalSpend / totalMiles : 0,
		totalSavings,
		unit: entries[0]?.unit || 'gal'
	}
}
```

**Step 32: Update `handleSaveFillUp` to call `renderHistory()`**

```javascript
req.onsuccess = async () => {
	showNotification('Fill-up saved successfully!', 'success')
	switchTab('history-tab')
	await renderHistory()
}
```

**Step 33: Call `renderHistory()` when switching to History tab**

```javascript
document
	.getElementById('history-tab-btn')
	.addEventListener('click', async () => {
		switchTab('history-tab')
		await renderHistory()
	})
```

**Session 4 Result:** App shows fill-up data in table, calculates summaries, enables edit/delete flow. All core functionality working.

---

## Session 5: Charts & Polish (5 steps)

**Step 34: Add Chart.js CDN to HTML**

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
```

**Step 35: Create `buildCharts()` function**

```javascript
function buildCharts(entries) {
	const container = document.createElement('div')
	container.className = 'charts-container'
	container.innerHTML = `
     <div class="chart-wrapper">
       <h3>Efficiency Trend</h3>
       <canvas id="efficiency-chart"></canvas>
     </div>
     <div class="chart-wrapper">
       <h3>Spending Trend</h3>
       <canvas id="spending-chart"></canvas>
     </div>
   `
	document.getElementById('history-tab').appendChild(container)

	renderEfficiencyChart(entries)
	renderSpendingChart(entries)
}
```

**Step 36: Implement `renderEfficiencyChart()`**

```javascript
function renderEfficiencyChart(entries) {
	const chartData = entries
		.slice(0, 10)
		.map((entry, index) => {
			if (index === 0) return null
			const prevMileage = entries[index - 1].mileage
			const efficiency =
				prevMileage - entry.mileage === 0
					? 0
					: (entry.mileage - prevMileage) / entry.fuelAmount
			return { date: entry.date, efficiency }
		})
		.filter(d => d !== null && !isNaN(d.efficiency))

	if (chartData.length === 0) {
		document.getElementById('efficiency-chart').parentElement.innerHTML =
			'<p class="empty-chart">Not enough data</p>'
		return
	}

	new Chart(document.getElementById('efficiency-chart'), {
		type: 'line',
		data: {
			labels: chartData.map(d => d.date),
			datasets: [
				{
					label: 'Efficiency (MPG)',
					data: chartData.map(d => d.efficiency),
					borderColor: '#4CAF50',
					backgroundColor: 'rgba(76, 175, 80, 0.1)',
					fill: true,
					tension: 0.3
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					title: { display: true, text: 'Miles Per Gallon' }
				}
			}
		}
	})
}
```

**Step 37: Implement `renderSpendingChart()`**

```javascript
function renderSpendingChart(entries) {
	const monthlyTotals = {}

	entries.forEach(e => {
		const month = e.date.slice(0, 7) // YYYY-MM
		monthlyTotals[month] = (monthlyTotals[month] || 0) + e.totalAmount
	})

	const labels = Object.keys(monthlyTotals).reverse()
	const data = Object.values(monthlyTotals).reverse()

	if (data.length === 0) {
		document.getElementById('spending-chart').parentElement.innerHTML =
			'<p class="empty-chart">Not enough data</p>'
		return
	}

	new Chart(document.getElementById('spending-chart'), {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Monthly Spending ($)',
					data: data,
					backgroundColor: 'rgba(33, 150, 243, 0.7)',
					borderColor: '#2196F3',
					borderWidth: 1
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					title: { display: true, text: 'Cost ($)' }
				}
			}
		}
	})
}
```

**Step 38: Add Export functionality**

```javascript
function exportToCSV(entries) {
	const headers = [
		'Date',
		'Station',
		'Mileage',
		'Fuel',
		'Price',
		'Total',
		'Savings',
		'Type',
		'Efficiency'
	]
	const rows = entries.map((entry, index) => {
		const prevMileage = index === 0 ? 0 : entries[index - 1].mileage
		const efficiency =
			entry.mileage - prevMileage === 0
				? 0
				: (entry.mileage - prevMileage) / entry.fuelAmount
		const savings = (
			entry.fuelAmount * entry.pricePerUnit -
			entry.totalAmount
		).toFixed(2)
		return [
			entry.date,
			entry.stationName || '-',
			entry.mileage,
			`${entry.fuelAmount} ${entry.unit}`,
			entry.pricePerUnit.toFixed(2),
			entry.totalAmount.toFixed(2),
			savings,
			entry.fillType,
			efficiency.toFixed(2)
		].join(',')
	})

	const csv = [headers.join(','), ...rows].join('\n')
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `fuel-log-${new Date().toISOString().slice(0, 10)}.csv`
	a.click()
	URL.revokeObjectURL(url)
}

function exportToJSON(entries) {
	const json = JSON.stringify(entries, null, 2)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `fuel-log-${new Date().toISOString().slice(0, 10)}.json`
	a.click()
	URL.revokeObjectURL(url)
}
```

**Step 39: Wire up export buttons**

```javascript
function initExport() {
	const exportContainer = document.getElementById('export-tab')
	exportContainer.innerHTML = `
     <div class="export-controls">
       <h3>Export Data</h3>
       <div class="buttons">
         <button id="export-csv">Export as CSV</button>
         <button id="export-json">Export as JSON</button>
       </div>
     </div>
   `

	document.getElementById('export-csv').addEventListener('click', () => {
		if (!db) return
		exportToCSV(entries)
	})

	document.getElementById('export-json').addEventListener('click', () => {
		if (!db) return
		exportToJSON(entries)
	})
}
```

**Step 40: Call `initExport()` when switching to Export tab**

```javascript
document
	.getElementById('export-tab-btn')
	.addEventListener('click', async () => {
		switchTab('export-tab')
		if (db) {
			const tx = db.transaction([STORE_NAME], 'readonly')
			const store = tx.objectStore(STORE_NAME)
			const cursorReq = store.openCursor(null, 'next')

			return new Promise(resolve => {
				const entries = []
				cursorReq.onsuccess = () => {
					if (cursorReq.result) {
						entries.push(cursorReq.result.value)
						cursorReq.result.continue()
					} else {
						initExport()
						resolve()
					}
				}
				cursorReq.onerror = () => {
					initExport()
					resolve()
				}
			})
		} else {
			initExport()
		}
	})
```

---

## Final Checklist

After completing all 40 steps, verify:

- [ ] Page loads without errors
- [ ] 3 tabs function correctly
- [ ] Form accepts valid input, rejects invalid
- [ ] Mileage validation works (must increase)
- [ ] Save to IndexedDB works
- [ ] History table shows data in correct order (most recent first)
- [ ] Edit fills form with existing data
- [ ] Delete removes entry permanently
- [ ] Charts render with correct data
- [ ] Summary cards show accurate numbers
- [ ] Export creates downloadable CSV/JSON files
- [ ] Mobile responsive (resize browser, test)
- [ ] No console errors or warnings
- [ ] Notifications appear and disappear
- [ ] All calculations are correct

---

## Notes

- **Total:** 40 discrete steps, each leaving app functional
- Complete in any order that makes sense, but test each before proceeding
- **Build order recommended:** Steps 1-10 → 11-15 → 16-23 → 24-33 → 34-40
- Each step should take 15-45 minutes depending on complexity
- Use browser dev tools to test IndexedDB (Application tab)
- Export button should only work when on Export tab

---

## Quick Start

**After completing all 40 steps, the app will:**

1. Let users add fuel entries with validation
2. Calculate efficiency, savings, and totals automatically
3. Show all entries in a sortable table
4. Display charts for efficiency and spending trends
5. Allow editing and deleting entries
6. Export data to CSV and JSON formats
7. Work offline (IndexedDB)
8. Be responsive on mobile devices
