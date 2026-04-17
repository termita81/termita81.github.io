# Fuel App Implementation Plan

## Overview

Build the fuel consumption tracker at `src/apps/fuel/` with phased rollout over 4 days.

---

## Phase 1: Setup & Structure (Day 1)

### Goals

- Create app skeleton
- Set up IndexedDB
- Build navigation tabs
- Establish styling foundation

### Tasks

- [ ] Create `src/apps/fuel/` directory with `index.html`, `fuel.js`, `fuel.css`
- [ ] Build HTML shell with tab navigation (Add Fill-Up, History, Export)
- [ ] Add IndexedDB initialization with `fuelAppDB` database
- [ ] Store `fillups` object store with proper schema
- [ ] Create responsive CSS with mobile-first approach
- [ ] Add tab switching logic and active states

### Files to Create

- `index.html` - App shell, tab containers, templates
- `fuel.css` - Base styles, layout, mobile responsive
- `fuel.js` - IndexedDB setup, tab navigation, basic app state

### Dependencies

- None (or Chart.js CDN option for Phase 3)

### Acceptance Criteria

- Three tabs visible and functional
- IndexedDB created and ready to receive data
- Responsive layout works on mobile and desktop

---

## Phase 2: Core Features (Days 1-2)

### 2.1 Add Fill-Up Form (Day 1)

#### Goals

- Complete form with all fields
- Input validation
- Save to IndexedDB
- Show feedback

#### Tasks

- [ ] Form with 8 fields: date, mileage, fuel amount, price/unit, total amount, station name, location, fill type
- [ ] Real-time validation (mileage > previous, positive values)
- [ ] Auto-calculate and display: calculated cost, savings
- [ ] Save handler: write to IndexedDB, update timestamps
- [ ] Success/error notifications
- [ ] Redirect to stats tab on successful save

#### Form HTML Structure

```html
<!-- Form container with grid layout -->
<!-- Field groups: Basic Info, Fuel Details, Station Info -->
<!-- Action button: Save Fill-Up -->
```

#### Validation Rules

```javascript
const validateFillUp = formData => {
	const errors = []
	if (new Date(formData.date) > new Date())
		errors.add('Date cannot be in future')
	if (formData.mileage <= prevMileage) errors.add('Mileage must increase')
	if (formData.fuelAmount <= 0) errors.add('Fuel amount must be positive')
	if (formData.pricePerUnit <= 0) errors.add('Price must be positive')
	return errors
}
```

### 2.2 History & Stats View (Day 2)

#### Goals

- Display all fill-ups chronologically
- Show computed metrics
- Enable edit/delete

#### Tasks

- [ ] Load all entries from IndexedDB via IndexedCursor
- [ ] Build history table with all fields
- [ ] Compute derived fields: efficiency, savings, l/100km
- [ ] Add edit mode to rows (inline editing or modal)
- [ ] Add delete function with confirmation
- [ ] Show empty state when no data exists

#### Table Columns

```
Date | Station | Mileage | Fuel | Price | Total | Savings | Fill Type | Efficiency
Edit | Delete buttons
```

### 2.3 Charts & Summary (Day 2)

#### Goals

- Visual representation of data
- Summary metrics at top
- Date range filtering

#### Tasks

- [ ] Import Chart.js via CDN (line, bar, pie)
- [ ] Efficiency trend chart (line, last 10 entries)
- [ ] Spending trend chart (bar, by month)
- [ ] Price per unit chart (line)
- [ ] Pie chart for fill type distribution
- [ ] Summary cards: total fuel, total spend, total miles, avg efficiency, avg cost/mile, total savings
- [ ] Date range filter dropdown (all time, last 30 days, last 90 days, custom range)

#### Summary Card Structure

```html
<div class="summary-grid">
	<div class="card">Total Fuel (gal/L)</div>
	<div class="card">Total Spend</div>
	<div class="card">Total Miles/Km</div>
	<div class="card">Avg Efficiency</div>
	<div class="card">Avg Cost/mile</div>
	<div class="card">Total Savings</div>
</div>
```

---

## Phase 3: Polish & Export (Day 3-4)

### Goals

- Add export functionality
- Refine mobile experience
- Handle edge cases
- Final code review

### Tasks

- [ ] **Export Feature**
  - CSV export with headers: Date, Station, Mileage, Fuel, Price, Total, Savings
  - JSON export with full object structure
  - Date range filter for export
  - Auto-download with filename: `fuel-log-[YYYY-MM-DD].[csv|json]`
  - Client-side generation (no server)

- [ ] **Mobile Optimizations**
  - Touch-friendly button sizes (min 44px)
  - Table scroll behavior (horizontal scroll)
  - Modal for edit forms on mobile
  - Bottom action bar for common actions

- [ ] **Error Handling**
  - Form field validation (inline error messages)
  - Database transaction errors with user feedback
  - Empty state messaging
  - Network state (if using external APIs later)

- [ ] **Edge Cases**
  - Initial entry (no previous mileage = N/A efficiency)
  - Same mileage twice (efficiency = 0)
  - Negative savings (overpaid)
  - Large date gaps (warning indicator)

- [ ] **Code Review**
  - Code organization cleanup
  - Remove console.log statements
  - Add JSDoc comments
  - Test all user flows

---

## Code Organization

### File Structure

```
src/apps/fuel/
├── index.html            # App shell, tab templates, container divs
├── fuel.js               # Main application logic (all-in-one for single build)
├── fuel.css              # Responsive styles
└── utils.js              # Helper functions (formatters, validators) - optional
```

### Function Modules (fuel.js)

```javascript
// --- IndexedDB ---
const db = { init(), addFillUp(), getFillUps(), updateFillUp(), deleteFillUp() };

// --- Form Handling ---
const form = { validate(), populateForm(), reset() };

// --- Rendering ---
const render = { historyTable(), charts(), summaryCards() };

// --- Calculations ---
const calc = { efficiency(), savings(), averages(), totals() };

// --- Export ---
const export = { toCSV(), toJSON(), download() };

// --- Event Handlers ---
const handlers = { tabSwitch(), submitHandler(), editHandler(), deleteHandler() };
```

---

## Dependencies

### Required

- None (vanilla JS + IndexedDB)

### Optional

- Chart.js 3.x (CDN: `https://cdn.jsdelivr.net/npm/chart.js`)
- Chart.js Plugin (for pie charts): `chartjs-plugin-datalabels`

---

## Testing Checklist

### Form Testing

- [ ] All 8 fields accept valid input
- [ ] Validation catches all edge cases
- [ ] Mileage constraint works correctly
- [ ] Savings calculated accurately

### Storage Testing

- [ ] Add fill-up persists through refresh
- [ ] Update fill-up modifies correct entry
- [ ] Delete fill-up removes permanently

### Calculation Testing

- [ ] Efficiency calculation correct (with/without previous)
- [ ] Savings positive and negative handled
- [ ] Summary totals accurate
- [ ] L/100km conversion correct

### UI Testing

- [ ] Tabs switch correctly
- [ ] Charts render with proper data
- [ ] Summary cards show correct values
- [ ] Edit mode works (form populate, save)

### Export Testing

- [ ] CSV exports correctly formatted
- [ ] JSON exports with all fields
- [ ] Date range filtering works
- [ ] Auto-download functions

### Mobile Testing

- [ ] Touch targets large enough
- [ ] Horizontal scroll on table
- [ ] Forms resize correctly
- [ ] No overflow issues

---

## Timeline Estimate

| Phase     | Activities                     | Time            |
| --------- | ------------------------------ | --------------- |
| Phase 1   | Setup, IndexedDB, Nav, CSS     | 2-3 hours       |
| Phase 2.1 | Add Fill-Up form + validation  | 2-3 hours       |
| Phase 2.2 | History table + edit/delete    | 3-4 hours       |
| Phase 2.3 | Charts + summary + filters     | 3-4 hours       |
| Phase 3   | Export, polish, mobile, review | 3-4 hours       |
| **Total** |                                | **12-18 hours** |

---

## Success Criteria

- [ ] All core features implemented and working
- [ ] Add/Edit/Delete/Delete flow functions correctly
- [ ] Charts display accurate data with filters
- [ ] Export produces valid files
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Code is clean and organized

---

## Notes

- Single-file JS approach (`fuel.js`) for simplicity (no separate build process)
- Use `crypto.randomUUID()` for unique IDs
- Timestamps auto-populated on add/update
- All calculations happen at render time (derived state)
- Mobile-first CSS with media queries for tablets/desktop
