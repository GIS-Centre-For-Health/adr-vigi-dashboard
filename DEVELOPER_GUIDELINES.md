# ADR Visualizations Developer Guidelines

## Overview
This document provides comprehensive guidelines for developing and maintaining visualizations in the ADR (Adverse Drug Reactions) system. Our architecture prioritizes modularity, reusability, and maintainability using vanilla JavaScript with ES modules.

## Table of Contents
1. [Current Architecture](#current-architecture)
2. [Creating New Visualizations](#creating-new-visualizations)
3. [Using Common Files](#using-common-files)
4. [Refactoring Guidelines](#refactoring-guidelines)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Testing Guidelines](#testing-guidelines)

## Current Architecture

### Directory Structure
```
ADR_Visualizations/
├── assets/
│   ├── css/
│   │   └── common.css         # Shared styles (502 lines)
│   └── js/
│       └── common.js          # Shared functions (601 lines)
├── visualizations/            # Individual visualization HTML files
├── adr_dashboard.html         # Unified dashboard
└── DEVELOPER_GUIDELINES.md    # This file
```

### Future Module Structure (Refactoring Goal)
```
ADR_Visualizations/
├── assets/
│   ├── css/
│   │   └── common.css
│   └── js/
│       ├── utils/
│       │   ├── dateParsers.js      # Date parsing utilities
│       │   ├── fileUpload.js       # File handling utilities
│       │   ├── chartHelpers.js     # Chart configuration helpers
│       │   ├── dataExporter.js     # Export functionalities
│       │   └── uiHelpers.js        # UI utility functions
│       └── modules/                 # Visualization modules
│           ├── baseVisualization.js # Base class for all visualizations
│           └── [specific charts].js # Individual chart modules
```

## Creating New Visualizations

### Step 1: Create HTML Structure
Create a new HTML file in `visualizations/` folder following this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADR - [Your Visualization Name]</title>
    
    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Common Styles -->
    <link rel="stylesheet" href="../assets/css/common.css">
</head>
<body>
    <div class="header">
        <h1>ADR - [Your Visualization Name]</h1>
        <p>Analyze adverse drug reactions by [specific metric]</p>
    </div>

    <div class="container">
        <!-- File Upload Section (handled by common.js) -->
        <div class="upload-section" id="upload-section">
            <div class="upload-area" id="upload-area">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag and drop an Excel file here or click to browse</p>
                <input type="file" id="file-input" accept=".xlsx,.xls" style="display: none;">
            </div>
        </div>

        <!-- Filter Section (if needed) -->
        <div class="filter-section" id="filter-section" style="display: none;">
            <h2>Filter Data</h2>
            <div class="filter-controls">
                <!-- Add your specific filters here -->
                <div class="filter-group">
                    <label for="date-filter-start">Start Date:</label>
                    <input type="date" id="date-filter-start">
                </div>
                <div class="filter-group">
                    <label for="date-filter-end">End Date:</label>
                    <input type="date" id="date-filter-end">
                </div>
                <button onclick="applyFilters()" class="btn btn-primary">Apply Filters</button>
            </div>
        </div>

        <!-- Summary Section (if needed) -->
        <div class="summary-section" id="summary-section" style="display: none;">
            <h2>Summary Statistics</h2>
            <div class="summary-cards" id="summary-cards">
                <!-- Summary cards will be added dynamically -->
            </div>
        </div>

        <!-- Visualization Section -->
        <div class="visualization-section" id="visualization-section" style="display: none;">
            <h2>[Your Chart Title]</h2>
            <div class="chart-container">
                <canvas id="myChart"></canvas>
            </div>
            <div class="chart-actions">
                <button onclick="downloadChart()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Download Chart
                </button>
                <button onclick="exportData()" class="btn btn-secondary">
                    <i class="fas fa-file-csv"></i> Export Data
                </button>
            </div>
        </div>
    </div>

    <!-- Loading Indicator -->
    <div class="loading" id="loading" style="display: none;">
        <div class="spinner"></div>
        <p>Processing data...</p>
    </div>

    <!-- Common JavaScript -->
    <script src="../assets/js/common.js"></script>
    
    <!-- Page-specific JavaScript -->
    <script>
        // Define your processData function
        function processData(data) {
            // Show UI sections
            showSections(['filter-section', 'summary-section', 'visualization-section']);
            
            // Store data globally for filtering
            window.originalData = data;
            window.filteredData = data;
            
            // Your data processing logic here
            const processedData = {
                labels: [], // Your labels
                values: []  // Your values
            };
            
            // Example: Process data by category
            const categoryCount = {};
            data.forEach(row => {
                const category = row['Your Column Name'] || 'Unknown';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            // Convert to chart data
            Object.entries(categoryCount).forEach(([category, count]) => {
                processedData.labels.push(category);
                processedData.values.push(count);
            });
            
            // Add summary statistics
            addStatCard('Total Records', data.length);
            addStatCard('Categories', processedData.labels.length);
            
            // Create the chart
            createChart(processedData);
        }
        
        // Create your specific chart
        function createChart(data) {
            const ctx = document.getElementById('myChart').getContext('2d');
            
            // Destroy existing chart if any
            if (window.myChart instanceof Chart) {
                window.myChart.destroy();
            }
            
            // Create new chart using common configuration
            const config = createBarChartConfig(data.labels, [{
                label: 'Count',
                data: data.values,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }], '[Your Chart Title]');
            
            window.myChart = new Chart(ctx, config);
        }
        
        // Apply filters (if using filters)
        function applyFilters() {
            const startDate = document.getElementById('date-filter-start').value;
            const endDate = document.getElementById('date-filter-end').value;
            
            // Use common filtering function or implement custom logic
            window.filteredData = window.originalData.filter(row => {
                // Your filter logic here
                return true; // Return true to include, false to exclude
            });
            
            // Reprocess with filtered data
            processData(window.filteredData);
        }
        
        // Export data function
        function exportData() {
            // Prepare data for export
            const exportData = window.filteredData.map(row => ({
                'Column1': row['Column1'],
                'Column2': row['Column2'],
                // Add relevant columns
            }));
            
            // Use common export function
            downloadCSV(exportData, 'adr_[your_metric]_export.csv');
        }
    </script>
</body>
</html>
```

### Step 2: Define processData Function
The `processData` function is the core of your visualization. It should:

1. **Parse and clean data**
   ```javascript
   // Example: Clean and standardize values
   const cleanValue = (value) => {
     if (!value || value === 'null' || value === 'N/A') return 'Unknown';
     return value.toString().trim();
   };
   ```

2. **Aggregate data for visualization**
   ```javascript
   // Example: Count by category
   const counts = {};
   data.forEach(row => {
     const category = cleanValue(row['Category Field']);
     counts[category] = (counts[category] || 0) + 1;
   });
   ```

3. **Create summary statistics**
   ```javascript
   // Use addStatCard from common.js
   addStatCard('Total Records', data.length);
   addStatCard('Unique Categories', Object.keys(counts).length);
   ```

4. **Prepare chart data**
   ```javascript
   const chartData = {
     labels: Object.keys(counts).sort(),
     values: Object.keys(counts).sort().map(key => counts[key])
   };
   ```

## Using Common Files

### Common.js Functions

#### File Upload
- `setupFileUpload()` - Automatically called, sets up drag-drop and click handlers
- `handleFile(file)` - Processes Excel file and calls your `processData()`

#### Date Parsing
```javascript
// Parse VigiFlow date format (YYYYMMDD)
const date = parseInitialReceivedDate(row['Initial received date']);

// Parse onset date with various formats
const onsetDate = parseOnsetDate(row['Date of onset of reaction']);
```

#### UI Helpers
```javascript
// Show/hide sections
showSections(['filter-section', 'visualization-section']);

// Add summary statistics
addStatCard('Metric Name', value, 'optional-icon-class');

// Show loading state
showLoading();
hideLoading();

// Show messages
showSuccess('Data processed successfully!');
showError('Error processing data');
```

#### Chart Helpers
```javascript
// Create standard bar chart configuration
const config = createBarChartConfig(labels, datasets, title);

// Get monthly aggregated data
const monthlyData = getMonthlyData(filteredData, 'Initial received date');
```

#### Export Functions
```javascript
// Download chart as PNG
downloadChart(); // Downloads the chart with id="myChart"

// Export data to CSV
downloadCSV(dataArray, 'filename.csv');

// Export monthly data
exportMonthlyDataToCSV(monthlyData, 'monthly_export.csv');
```

### Common.css Classes

#### Layout Classes
- `.container` - Main content wrapper (max-width: 1400px)
- `.header` - Page header with gradient background
- `.upload-section` - File upload area
- `.filter-section` - Filter controls container
- `.summary-section` - Summary statistics area
- `.visualization-section` - Chart display area

#### Component Classes
- `.btn`, `.btn-primary`, `.btn-secondary` - Button styles
- `.stat-card` - Summary statistic cards
- `.chart-container` - Responsive chart wrapper
- `.data-table` - Styled table with hover effects
- `.tabs`, `.tab-button`, `.tab-content` - Tab navigation

#### State Classes
- `.loading` - Loading indicator with spinner
- `.message.success` - Success message
- `.message.error` - Error message
- `.drag-over` - Drag-over state for upload area

## Refactoring Guidelines

### When Refactoring Existing Visualizations

1. **Identify Reusable Logic**
   - Look for data processing that could benefit other visualizations
   - Extract common patterns (e.g., drug name parsing, age group calculations)

2. **Move to Common.js**
   ```javascript
   // Before (in visualization file)
   function parseDrugNames(drugString) {
     if (!drugString) return [];
     return drugString.split(/[\n_x000D_]+/)
       .map(name => name.trim())
       .filter(name => name.length > 0);
   }
   
   // After (in common.js)
   // Export the function and import where needed
   ```

3. **Standardize Patterns**
   - Use consistent naming conventions
   - Follow the same data flow: upload → process → filter → visualize → export

### Future Module-Based Approach (Planned)

```javascript
// modules/baseVisualization.js
export class BaseVisualization {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.chart = null;
  }
  
  processData(rawData) {
    throw new Error('processData must be implemented by subclass');
  }
  
  render(processedData) {
    throw new Error('render must be implemented by subclass');
  }
  
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// modules/ageGroupChart.js
import { BaseVisualization } from './baseVisualization.js';
import { calculateAgeGroups } from '../utils/ageCalculator.js';

export class AgeGroupChart extends BaseVisualization {
  processData(rawData) {
    return calculateAgeGroups(rawData);
  }
  
  render(processedData) {
    // Chart.js rendering logic
  }
}
```

## Best Practices

### 1. Data Handling
- **Always validate data**: Check for null, undefined, or malformed values
- **Use consistent field names**: Reference CLAUDE.md for correct column names
- **Handle missing data gracefully**: Provide "Unknown" or "Not specified" categories

### 2. Performance
- **Limit DOM operations**: Batch updates when possible
- **Use efficient data structures**: Objects for lookups, arrays for ordered data
- **Debounce filter operations**: Prevent excessive recalculation

### 3. User Experience
- **Show loading states**: Use `showLoading()` during processing
- **Provide feedback**: Use `showSuccess()` and `showError()` appropriately
- **Enable data export**: Always provide CSV export for processed data

### 4. Code Organization
- **One visualization per file**: Keep visualizations focused
- **Comment complex logic**: Especially data transformations
- **Use meaningful variable names**: `drugCounts` not `counts`

## Common Pitfalls

### 1. ❌ Incorrect Field Names
```javascript
// Wrong - field name doesn't exist
const drugName = row['Drug Name'];

// Correct - use exact field name from Excel
const drugName = row['Drug name (WHODrug)'];
```

### 2. ❌ Not Handling Missing Data
```javascript
// Wrong - will crash if field is missing
const age = parseInt(row['Age at onset of reaction']);

// Correct - handle missing/invalid values
const ageStr = row['Age at onset of reaction'];
const age = ageStr ? parseInt(ageStr) : null;
```

### 3. ❌ Duplicating Common Functions
```javascript
// Wrong - reimplementing date parsing
function parseDate(dateStr) {
  // Custom parsing logic
}

// Correct - use common function
const date = parseInitialReceivedDate(dateStr);
```

### 4. ❌ Global Variable Pollution
```javascript
// Wrong - creating unnecessary globals
var myData = [];
var myChart;

// Correct - use window object sparingly
window.originalData = data; // Only for shared state
let myChart; // Local to script
```

### 5. ❌ Not Cleaning Up Charts
```javascript
// Wrong - creates multiple chart instances
function createChart(data) {
  new Chart(ctx, config);
}

// Correct - destroy previous instance
function createChart(data) {
  if (window.myChart instanceof Chart) {
    window.myChart.destroy();
  }
  window.myChart = new Chart(ctx, config);
}
```

## Testing Guidelines

### Manual Testing Checklist
- [ ] Upload various Excel file sizes (small, medium, large)
- [ ] Test with missing/malformed data
- [ ] Verify all filters work correctly
- [ ] Check chart responsiveness on different screen sizes
- [ ] Test all export functions (PNG, CSV)
- [ ] Verify error messages appear for invalid files

### Data Edge Cases to Test
1. **Empty columns**: Entire column is null/empty
2. **Mixed formats**: Dates in different formats
3. **Special characters**: Unicode, newlines in text fields
4. **Large datasets**: 10,000+ rows
5. **Missing required fields**: Key columns not present

### Browser Compatibility
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Testing
```javascript
// Add timing to processData
function processData(data) {
  console.time('processData');
  
  // Your processing logic
  
  console.timeEnd('processData');
  console.log('Processed rows:', data.length);
}
```

## Dashboard Integration

When adding your visualization to the dashboard:

1. **Add navigation item**:
   ```javascript
   // In dashboard sidebar
   <li><a href="#" onclick="showVisualization('your-viz')">Your Visualization</a></li>
   ```

2. **Implement visualization function**:
   ```javascript
   function showYourVisualization() {
     const container = document.getElementById('content');
     // Implement visualization logic
     // Can reuse logic from standalone file
   }
   ```

3. **Apply global filters**:
   ```javascript
   // Use dashboard's filtered data
   const filteredData = applyGlobalFilters(window.uploadedData);
   ```

## Questions or Issues?

1. Check existing visualizations for examples
2. Review common.js for available utilities
3. Consult CLAUDE.md for project context
4. Test with sample data files in the project

Remember: The goal is to create maintainable, consistent visualizations that provide value to healthcare professionals analyzing ADR data.