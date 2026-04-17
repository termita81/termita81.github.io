# Fuel App Specification

## Overview

A web app hosted at `src/apps/fuel/` that tracks fuel consumption and costs for a vehicle.

## Core Features

### 1. Fill-Up Logging

**Fields**:

- **Date** (date picker)
- **Mileage** (number input - validates against previous entry)
- **Fuel amount** (number input - gallons or liters)
- **Price per unit** (number input)
- **Total amount** (number input - manually entered for discounts)
- **Station name** (text input)
- **Location** (optional text input)
- **Fill type** (select: "Fill-up" or "Less")

**Calculated fields** (display only):

- **Calculated cost** (fuel amount × price per unit, for comparison with manual total)
- **Savings** (calculated cost − total amount, positive = discount earned)

### 2. Fuel Efficiency Calculations

- Calculate MPG or km/l for each entry: `(mileage - previousMileage) / fuelAmount`
- Show L/100km equivalent
- Unit system toggle (imperial/metric)
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
- Fill type distribution (pie chart)

**Summary Cards**:

- Total fuel purchased (gallons/liters)
- Total spend
- Total miles/km traveled
- Average efficiency
- Average cost per mile/km
- Discount savings (total)

### 4. Export

- **Formats**: CSV and JSON
- **Options**: All data or filtered date range
- **Trigger**: Manual export buttons

## Data Structure

```javascript
{
  id: string,                      // unique identifier
  date: ISO8601 string,            // fill-up date
  mileage: number,                 // vehicle odometer reading
  fuelAmount: number,              // gallons or liters purchased
  pricePerUnit: number,            // price per gallon/liter
  totalAmount: number,             // what was actually paid (discount friendly)
  stationName: string,             // gas station name
  location: string | null,         // optional location description
  fillType: 'fill-up' | 'less',   // full tank or partial
  unit: 'gallons' | 'liters',     // preferred unit system
  createdAt: ISO8601 string,
  updatedAt: ISO8601 string
}
```

**Computed Properties** (render-time only):

```javascript
{
  calculatedCost: fuelAmount × pricePerUnit,
  savings: calculatedCost - totalAmount,
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
├── fuel.css            # responsive styles
└── vendor/
    └── chart.js        # optional chart library (CDN loaded)
```

### Storage

- **IndexedDB** for persistent local storage
- Database: `fuelAppDB`
- Store: `fillups`
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

### Charts

- Canvas-based charts (Chart.js or lightweight alternative)
- Responsive chart containers
- Lazy loading for performance
- Date range filters apply to all visualizations

### Export

- Client-side CSV/JSON generation
- No server round-trip
- Browser download triggers
- Filename: `fuel-log-[date].[csv|json]`

## User Flows

### Add New Fill-Up

1. User fills out form with all fields
2. Mileage validated against last entry (must be higher)
3. Calculate convenience metrics displayed
4. Save to IndexedDB
5. Show success feedback
6. Auto-redirect to stats view

### View Statistics

1. Load all fill-ups from IndexedDB
2. Compute all derived fields
3. Render table, charts, and summary cards
4. Filterable by date range
5. Editable table rows

### Export Data

1. Select date range (optional)
2. Choose format (CSV or JSON)
3. Generate file in browser
4. Auto-download

## Validation Rules

- **Mileage**: Must be > previous entry's mileage
- **Fuel amount**: Must be positive (> 0)
- **Price**: Must be positive
- **Total amount**: Must be positive and reasonable (< 1000)
- **Date**: Cannot be in the future

## Edge Cases

- Initial fill-up (no previous mileage): efficiency = N/A
- Negative savings: user overpaid compared to base price
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
