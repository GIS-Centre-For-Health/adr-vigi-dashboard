# ADR Visualizations Project

This project provides modular visualization tools for Adverse Drug Reaction (ADR) data from VigiFlow, including a comprehensive unified dashboard that combines all visualizations with global filtering capabilities.

## Current Status - PROJECT COMPLETED (December 2024)

✅ **ALL 17 Visualizations Completed**: All required visualizations from WHO's 35 core ADR variables are implemented

✅ **Dashboard Refactoring Completed**: 
- **Main dashboard (`adr_dashboard.html`) - Modular architecture, PRODUCTION READY**
- All 17 visualizations extracted to modular format
- Global filters extracted to `adr_filters.js` module
- UI/UX issues resolved (card layouts, date parsing, responsive design)

✅ **Modular Architecture Implemented**:
- Zero code duplication between dashboard and individual visualizations
- Proper memory management with chart cleanup on view switches
- No build tools required - vanilla JS with namespace pattern
- Each visualization in its own JS module with consistent API

## Project Structure

```
ADR_Visualizations/
├── adr_dashboard.html                # Main dashboard with modular architecture
├── assets/
│   ├── css/
│   │   └── common.css               # Common styles for all visualizations
│   └── js/
│       └── common.js                # Common JavaScript functions
├── visualizations/
│   ├── adr_received_date.html               # ADR Reports by Initial Received Date
│   ├── adr_onset_date.html                  # ADR Reports by Reaction Onset Date
│   ├── adr_report_types.html                # ADR Cases by Report Type (Pie Chart)
│   ├── adr_age_group_upon_initial_reaction.html  # ADR Age Group Analysis (Pie Chart)
│   ├── adr_sex.html                         # ADR Cases by Sex (Pie Chart)
│   ├── adr_pregnancy.html                   # ADR Cases by Pregnancy Status (Pie Chart)
│   ├── adr_lactation.html                   # ADR Cases by Lactation Status (Pie Chart)
│   ├── adr_seriousness.html                 # ADR Cases by Seriousness (Pie Chart)
│   ├── adr_seriousness_outcomes.html        # ADR Serious Outcomes Analysis (Bar Chart)
│   ├── adr_outcome.html                     # ADR Cases by Outcome (Pie/Bar Chart)
│   ├── adr_drug_analysis.html               # ADR Drug Analysis (Multi-view Dashboard)
│   ├── adr_drug_reported.html               # ADR Drug Analysis - Reporter Names (Multi-view Dashboard)
│   ├── adr_reporter_qualification.html      # ADR Reporter Qualification (Donut Chart)
│   ├── adr_reporter_organization.html       # ADR Reporter Organization (Bar Chart with Data Quality)
│   ├── adr_action_taken.html                # ADR Action Taken (Bar Chart with Severity Colors)
│   ├── adr_reporter_district.html           # ADR Reporter District (Bar Chart with Data Quality)
│   ├── adr_reporter_state_province.html     # ADR Reporter State/Province (Bar Chart with Data Quality)
│   └── js/                                   # Extracted modular JavaScript components
│       ├── common_utils.js                   # Additional shared utilities
│       ├── adr_filters.js                    # Global filters module
│       ├── adr_sex_chart.js                  # Sex distribution module
│       ├── adr_age_group_chart.js            # Age group module
│       ├── adr_report_types_chart.js         # Report types module
│       ├── adr_pregnancy_chart.js            # Pregnancy module
│       ├── adr_lactation_chart.js            # Lactation module
│       ├── adr_seriousness_chart.js          # Seriousness module
│       ├── adr_outcome_chart.js              # Outcome module
│       ├── adr_received_date_chart.js        # Received date module
│       ├── adr_onset_date_chart.js           # Onset date module
│       ├── adr_drug_analysis_chart.js        # Drug analysis module
│       ├── adr_drug_reported_chart.js        # Drug reported module
│       ├── adr_reporter_qualification_chart.js # Reporter qualification module
│       ├── adr_reporter_organization_chart.js  # Reporter organization module
│       ├── adr_action_taken_chart.js         # Action taken module
│       ├── adr_reporter_district_chart.js    # Reporter district module
│       ├── adr_reporter_state_province_chart.js # Reporter state/province module
│       └── adr_seriousness_outcomes_chart.js # Seriousness outcomes module
└── README.md
```

## Available Visualizations

### Temporal Analysis
- **ADR Reports by Initial Received Date** (`adr_received_date.html`) - Bar chart showing monthly distribution of when reports were received
- **ADR Reports by Reaction Onset Date** (`adr_onset_date.html`) - Bar chart showing monthly distribution of when reactions occurred

### Demographic Analysis
- **ADR Age Group Analysis** (`adr_age_group_upon_initial_reaction.html`) - Pie chart showing distribution across age groups
- **ADR Cases by Sex** (`adr_sex.html`) - Pie chart showing male/female distribution with percentage calculations

### Report Characteristics
- **ADR Cases by Report Type** (`adr_report_types.html`) - Pie chart showing distribution of report types (e.g., spontaneous reports)
- **ADR Cases by Seriousness** (`adr_seriousness.html`) - Pie chart showing serious vs non-serious cases
- **ADR Serious Outcomes Analysis** (`adr_seriousness_outcomes.html`) - Bar chart showing specific serious outcomes (death, life-threatening, etc.)

### Case Outcomes
- **ADR Cases by Outcome** (`adr_outcome.html`) - Pie/Bar chart showing patient outcomes (Recovered, Recovering, Died, etc.)

### Drug Analysis
- **ADR Drug Analysis** (`adr_drug_analysis.html`) - Comprehensive drug analysis with multiple views:
  - Overview with pie chart (top drugs) and bar chart (top 20)
  - Complete drug list with searchable table
  - Drug combinations analysis for polypharmacy patterns
  - Toggle between "Cases" and "Mentions" analysis modes
- **ADR Drug Analysis (Reporter Names)** (`adr_drug_reported.html`) - Analysis of drug names as reported by initial reporter:
  - Same comprehensive features as above but for non-standardized reporter drug names
  - Useful for identifying spelling variations, brand names, and data quality issues
  - Includes note highlighting the difference from WHO standardized names

### Special Populations
- **ADR Cases by Pregnancy Status** (`adr_pregnancy.html`) - Pie chart showing cases involving pregnant patients
- **ADR Cases by Lactation Status** (`adr_lactation.html`) - Pie chart showing cases involving lactating patients

### Reporter Information
- **ADR Reporter Qualification** (`adr_reporter_qualification.html`) - Donut chart analyzing reporter qualifications (physician, pharmacist, patient, etc.) with healthcare vs non-healthcare categorization
- **ADR Reporter Organization** (`adr_reporter_organization.html`) - Bar chart showing reporting organizations with prominent data quality indicators for missing organization data
- **ADR Action Taken** (`adr_action_taken.html`) - Bar chart showing medical actions taken in response to ADRs, color-coded by severity (drug withdrawn, dose reduced, etc.)

### Geographic Analysis
- **ADR Reporter District** (`adr_reporter_district.html`) - Bar chart showing district distribution with dual visualization approach: data availability donut chart and district frequency bar chart. Handles data quality issues including 89.7% missing data and formatting problems
- **ADR Reporter State/Province** (`adr_reporter_state_province.html`) - Bar chart showing state/province distribution with data quality handling for 81% missing data. Filters out placeholder text and provides cleaned geographic hierarchy analysis

## Benefits of Modular Structure

1. **Zero Code Duplication**: Dashboard reuses exact visualization logic from individual files
2. **Token Efficiency**: When making changes, we only need to update relevant files
3. **Memory Management**: Proper chart cleanup prevents memory leaks when switching views
4. **Maintainability**: Updates to common functionality only need to be made in one place
5. **Scalability**: Easy to add new visualizations by creating new HTML files that use the shared resources
6. **No Build Tools**: Simple vanilla JS approach with namespace pattern - works everywhere

## Refactoring Architecture

The refactored dashboard uses a simple namespace pattern:

```javascript
window.ADRCharts = window.ADRCharts || {};
ADRCharts.sex = {
    _chartInstance: null,
    processData: function(data) { /* ... */ },
    createChart: function(containerId, data, options) { /* ... */ },
    destroy: function() { /* ... */ }
};
```

Each visualization module follows this pattern:
- `processData()` - Handles data transformation
- `createChart()` - Creates the visualization
- `destroy()` - Cleans up chart instance to prevent memory leaks
- `_chartInstance` - Private property storing the Chart.js instance

## How to Use

### Option 1: Unified Dashboard (RECOMMENDED)
1. Open `adr_dashboard.html` in a web browser
2. Upload your VigiFlow Excel data file once
3. Navigate through all visualizations using the sidebar
4. Apply global filters that affect all visualizations
5. Export data or charts as needed

### Option 2: Individual Visualizations
1. Open any specific visualization HTML file in the `visualizations/` folder
2. Upload your VigiFlow Excel data file
3. View and interact with that specific visualization

## Dashboard Features

The unified dashboard provides:

- **Single Data Upload**: Upload your Excel file once to access all visualizations
- **Organized Navigation**: Categorized sidebar with all 17 visualizations
- **Global Filters**: 
  - Date range filtering
  - Location filter (District/State)
  - Drug name filter
  - Patient outcome filter
- **Dashboard Overview**: 
  - Summary statistics cards (total cases, unique drugs, etc.)
  - Key charts including trends, top drugs, seriousness distribution, age groups
- **Responsive Design**: Works on desktop and mobile devices
- **Export Options**: PDF reports, CSV data, and chart images
- **Memory Efficient**: Proper cleanup when switching between visualizations

## Adding New Visualizations

To add a new visualization:

1. Create a new HTML file in the `visualizations/` directory
2. Include the common CSS and JS files:
   ```html
   <link rel="stylesheet" href="../assets/css/common.css">
   <script src="../assets/js/common.js"></script>
   ```
3. Implement only the visualization-specific logic in your HTML file

## Common Functions Available

### CSS Classes
- `.header`, `.container`, `.upload-section`, `.filter-section`
- `.visualization-section`, `.chart-container`, `.stats-grid`
- `.btn`, `.btn-primary`, `.btn-secondary`
- `.loading`, `.spinner`, `.message`
- `.data-table` - Styled table for displaying data

### JavaScript Functions
- `setupFileUpload()` - Handles file upload functionality
- `parseInitialReceivedDate()` - Parses initial received dates
- `parseOnsetDate()` - Parses onset dates
- `populateYearFilter()` - Populates year filter dropdown
- `applyDateFilters()` - Applies date range filters
- `getMonthlyData()` - Aggregates data by month
- `createBarChartConfig()` - Creates Chart.js configuration
- `showSections()` - Shows UI sections after data load
- `addStatCard()` - Adds a statistics card
- `downloadChart()` - Downloads chart as image
- `createMaximizeModal()` - Creates fullscreen chart view
- UI helpers: `showLoading()`, `hideLoading()`, `showSuccess()`, `showError()`

## External Dependencies

All visualizations use these CDN-hosted libraries:
- XLSX.js (v0.17.0) - Excel file parsing
- Chart.js (v3.9.1) - Charts and visualizations
- jsPDF (v2.5.1) - PDF generation
- html2canvas (v1.4.1) - Chart to image conversion
- Font Awesome (v6.0.0) - Icons

## Project Completion Summary

### Completed (December 2024)
- ✅ All 17 visualizations implemented
- ✅ Original dashboard functional with all features
- ✅ Refactoring architecture designed and tested
- ✅ **ALL 17 visualizations extracted to modular format** ✨
- ✅ Global filters extracted to separate module
- ✅ All modular visualizations integrated into refactored dashboard
- ✅ UI/UX issues resolved (card layouts, date parsing, responsive design)
- ✅ Production-ready refactored dashboard available

### Ready for Production
The project is now complete and ready for:
- User testing with real ADR data
- Deployment in production environments
- Further customization as needed