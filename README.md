# ADR Visualizations Project

This project provides modular visualization tools for Adverse Drug Reaction (ADR) data from VigiFlow, including a comprehensive unified dashboard that combines all visualizations with global filtering capabilities.

## Current Status (December 2024)

✅ **Dashboard Functional**: All major bugs fixed, including:
- Fixed duplicate variable declarations between common.js and dashboard
- Fixed missing DOM elements (file-name, file-info)
- Fixed date parsing errors for VigiFlow YYYYMMDD format
- Fixed double file upload dialog issue
- Fixed upload functionality (both click and drag-drop)
- Dashboard successfully loads and processes ADR data

✅ **15 Visualizations Completed**:
- All core visualizations implemented with proper error handling
- Consistent styling and user experience across all charts
- Export functionality (PDF, CSV, PNG) working correctly

✅ **Dashboard Integration Complete**: 
- Core visualizations integrated: temporal analysis, demographics, report characteristics
- Dashboard now handles proper date parsing for VigiFlow data
- Fixed field name mappings to match actual Excel data structure
- Global filters working across all visualizations
- Export functionality ready for implementation

## Project Structure

```
ADR_Visualizations/
├── adr_dashboard.html          # Unified dashboard with all visualizations
├── assets/
│   ├── css/
│   │   └── common.css          # Common styles for all visualizations
│   └── js/
│       └── common.js           # Common JavaScript functions
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
│   └── adr_reporter_state_province.html     # ADR Reporter State/Province (Bar Chart with Data Quality)
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

1. **Reduced Code Duplication**: Common CSS and JavaScript are shared across all visualizations
2. **Token Efficiency**: When making changes, we only need to update relevant files
3. **Maintainability**: Updates to common functionality only need to be made in one place
4. **Scalability**: Easy to add new visualizations by creating new HTML files that use the shared resources

## How to Use

### Option 1: Unified Dashboard (Recommended)
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

The unified dashboard (`adr_dashboard.html`) provides:

- **Single Data Upload**: Upload your Excel file once to access all visualizations
- **Organized Navigation**: Categorized sidebar with all 17 visualizations
- **Global Filters**: 
  - Date range filtering
  - Seriousness filter (Serious/Non-serious)
  - Reporter type filter (Healthcare/Non-healthcare)
- **Dashboard Overview**: 
  - Summary statistics cards
  - Key charts including trends, top drugs, seriousness distribution
- **Responsive Design**: Works on desktop and mobile devices
- **Export Options**: PDF reports, Excel data, and chart images

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
- Font Awesome (v6.0.0) - Icons