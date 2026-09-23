# Fuel App Specification

## Overview

A web app hosted at `src/apps/fuel/` that tracks fuel consumption and costs for a vehicle.

## Core Features

### 1. Fill-Up Logging

**Fields**:

- **Date** (date picker)
- **Odometer** (number input - validates against previous entry)
|- **Fuel amount** (number input - liters)
- **Total Paid** (number input - total transaction amount)
- **Station name** (text input)
- **Location** (optional text input)
- **Fill type** (select: "Fill-up" or "Less")
- **Highway/City driving ratio** (optinoal, number + slider)

### 2. Fuel Efficiency Calculations

- Calculate MPG or km/l for each entry: `(odometer - previousOdometer) / fuelAmount`
- Show L/100km equivalent
*- **Unit system toggle**  (removed – unit is always liters)
- Period averages with date range filter

### 3. Statistics & History

**Table View**:

- Chronological fill-up list (most recent first)
- Editable/deletable entries
- Station info, location, fill type, efficiency, cost metrics

**Charts**:

- Efficiency trend (line chart) over time
- Spending trend (bar chart)
- Price per unit trend

**Summary Cards**:

|- **Total fuel purchased (liters)**
- Total spend
- Total miles/km traveled
- Average efficiency
- Average cost per mile/km

### 4. Export

- **Format**: JSON
- **Trigger**: Manual export buttons

## Data Structure

```javascript
{
  id: string,                      // format YYYYMMDD-NN (e.g., 20260828-01)
  date: ISO8601 string,            // fill-up date
  odometer: number,                 // vehicle odometer reading
  fuelAmount: number,              // liters purchased
  totalAmount: number,             // what was actually paid
  stationName: string,             // gas station name
  location: string | null,         // optional location description
  fillType: 'fill-up' | 'less',   // full tank or partial
  // unit: 'liters',  // removed – unit is always liters
  createdAt: ISO8601 string,
  updatedAt: ISO8601 string
}
```

**Computed Properties** (render-time only):

```javascript
{
  pricePerUnit: totalAmount / fuelAmount,
  previousMileage: findPrevEntry().mileage,
  efficiency: (mileage - previousMileage) / fuelAmount,
  lPer100km: 100 / efficiency  // metric conversion
}
```

## Technical Implementation

### Location & Structure

```
src/apps/fuel/
├── index.html          # entry point, PWA-ready shell
├── fuel.js             # main application logic
└── fuel.css            # responsive styles
```

### Storage

- **LocalStorage** for persistent local storage
- Store: `fuelTracker`
- Automatic ID creation with `crypto.randomUUID()`
- Auto-populate `createdAt`/`updatedAt` timestamps

### UI Architecture

- **Mobile-first responsive design**
- Single-page application
- Tab-based navigation:
  1. Add Fill-Up
  2. History & Stats
  3. Export
- Form validation and error states
- Edit mode for existing entries

### Export

- Client-side JSON generation
- No server round-trip
- Browser download triggers
- Filename: `fuel-log-[date].json`

### Charts (Future Work)

- Canvas-based charts (Chart.js or lightweight alternative)
- Responsive chart containers
- Lazy loading for performance
- Date range filters apply to all visualizations

## User Flows

### Add New Fill-Up

1. User fills out form with all fields
2. Mileage validated against last entry (must be higher)
3. Calculate convenience metrics displayed
4. Save to LocalStorage
5. Show success feedback
6. Auto-redirect to stats view

### View Statistics

1. Load all fill-ups from LocalStorage
2. Compute all derived fields
3. Render table, charts, and summary cards
4. Filterable by date range
5. Editable table rows

### Export Data

1. Select date range (optional)
2. Generate file in browser
3. Auto-download

## Validation Rules

- **Mileage**: Must be > previous entry's mileage
- **Fuel amount**: Must be positive (> 0)
- **Price**: Must be positive
- **Total amount**: Must be positive and reasonable (< 1000)
- **Date**: Cannot be in the future

## Edge Cases

- Initial fill-up (no previous mileage): efficiency = N/A
- Same mileage twice: efficiency = 0 (no distance traveled)
- Large date gaps: show warning for missing data

## Accessibility

- Semantic HTML
- ARIA labels on form controls
- Keyboard navigation support
- Sufficient color contrast
- Touch-friendly tap targets (mobile)

## Future Considerations

- Multi-vehicle support (database schema change needed)
- Maintenance tracking linked to mileage
- Fuel price API integration (optional)
- Backup/restore feature
- Cloud sync capability
- Recurring fill-up patterns
- Budget alerts and goal tracking
