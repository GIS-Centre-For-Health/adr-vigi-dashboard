// Common JavaScript functions for ADR Visualization Tools

// Global variables
let originalData = [];
let filteredData = [];

// Month names for display
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

// Common initialization
document.addEventListener('DOMContentLoaded', function() {
    // Only setup file upload if not already set up by the page
    if (!window.fileUploadInitialized) {
        setupFileUpload();
    }
});

// File upload setup
function setupFileUpload(processDataCallback) {
    console.log('[Common] Setting up file upload...');
    
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea || !fileInput) {
        console.error('[Common] Upload area or file input not found');
        return;
    }
    
    // Prevent duplicate initialization
    if (window.fileUploadInitialized) {
        console.log('[Common] File upload already initialized, skipping...');
        if (processDataCallback) {
            window.processData = processDataCallback;
        }
        return;
    }
    window.fileUploadInitialized = true;
    
    // Store the callback if provided
    if (processDataCallback) {
        window.processData = processDataCallback;
    }
    
    // Simple click handler without delays or complex logic
    uploadArea.addEventListener('click', (e) => {
        // Prevent bubbling but allow the click to work
        e.stopPropagation();
        
        // Don't trigger if clicking on the file input itself
        if (e.target === fileInput) return;
        
        console.log('[Common] Upload area clicked');
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            console.log('[Common] File dropped:', e.dataTransfer.files[0].name);
            handleFile(e.dataTransfer.files[0]);
        } else {
            console.error('[Common] No files found in drop event');
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
            // Clear the input value to allow re-uploading the same file
            e.target.value = '';
        }
    });
}

// Handle file upload
function handleFile(file) {
    console.log('[Common] Handling file:', file?.name);
    if (!file) {
        console.error('[Common] No file provided');
        return;
    }
    
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    
    if (fileName && fileInfo) {
        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
    }
    
    showLoading();
    hideMessages();
    
    console.log('[Common] Reading file...');
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log('[Common] File loaded, parsing Excel...');
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            console.log('[Common] Available sheets:', workbook.SheetNames);
            
            const sheetName = workbook.SheetNames[0];
            console.log('[Common] Using sheet:', sheetName);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });
            console.log('[Common] Parsed', jsonData.length, 'rows');
            
            // Call the specific processData function defined in the HTML file
            if (typeof processData === 'function') {
                console.log('[Common] Calling processData function...');
                processData(jsonData);
            } else if (typeof window.processData === 'function') {
                console.log('[Common] Calling window.processData function...');
                window.processData(jsonData);
            } else {
                console.error('[Common] processData function not defined');
                hideLoading();
                showError('Processing function not defined');
            }
        } catch (error) {
            console.error('[Common] Error processing file:', error);
            hideLoading();
            showError('Error reading file. Please ensure it\'s a valid Excel file.');
        }
    };
    
    reader.onerror = function(error) {
        console.error('[Common] FileReader error:', error);
        hideLoading();
        showError('Error reading file');
    };
    
    reader.readAsArrayBuffer(file);
}

// Date parsing functions
function parseInitialReceivedDate(dateValue) {
    // Handle YYYYMMDD format as integer
    if (typeof dateValue === 'number' || /^\d{8}$/.test(dateValue.toString())) {
        const dateStr = dateValue.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(year, month - 1, day);
    } 
    // Handle standard date formats
    else if (dateValue instanceof Date) {
        return dateValue;
    } 
    else if (typeof dateValue === 'string') {
        return new Date(dateValue);
    }
    return null;
}

function parseOnsetDate(dateValue) {
    // Clean the value and extract dates
    if (typeof dateValue === 'string') {
        // Remove carriage return characters and trim
        const cleanedValue = dateValue.replace(/_x000D_/g, ' ').trim();
        
        // Extract YYYYMMDD patterns (with optional time)
        const dateMatches = cleanedValue.match(/\d{8}(?:\s+\d{2}:\d{2}:\d{2})?/g);
        
        if (dateMatches && dateMatches.length > 0) {
            // Use the first date found
            const firstDate = dateMatches[0];
            const dateOnly = firstDate.split(' ')[0];
            
            if (dateOnly.length === 8) {
                const year = parseInt(dateOnly.substring(0, 4));
                const month = parseInt(dateOnly.substring(4, 6));
                const day = parseInt(dateOnly.substring(6, 8));
                
                // Validate date components
                if (year >= 1900 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    return new Date(year, month - 1, day);
                }
            }
        }
    }
    // Handle YYYYMMDD format as number
    else if (typeof dateValue === 'number' || /^\d{8}$/.test(dateValue.toString())) {
        const dateStr = dateValue.toString();
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        
        if (year >= 1900 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return new Date(year, month - 1, day);
        }
    }
    return null;
}

// Common filter functions
function populateYearFilter(data, dateField) {
    const yearFilter = document.getElementById('year-filter');
    const years = new Set();
    
    data.forEach(row => {
        if (row[dateField] && !isNaN(row[dateField])) {
            years.add(row[dateField].getFullYear());
        }
    });
    
    // Clear existing options except "All Years"
    yearFilter.innerHTML = '<option value="">All Years</option>';
    
    // Add year options
    Array.from(years).sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function applyDateFilters(data, dateField) {
    const yearFilter = document.getElementById('year-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    return data.filter(row => {
        if (!row[dateField] || isNaN(row[dateField])) return false;
        
        // Year filter
        if (yearFilter && row[dateField].getFullYear() != yearFilter) {
            return false;
        }
        
        // Date range filter
        if (dateFrom && row[dateField] < new Date(dateFrom)) {
            return false;
        }
        
        if (dateTo && row[dateField] > new Date(dateTo)) {
            return false;
        }
        
        return true;
    });
}

// Common chart functions
function getMonthlyData(data, dateField) {
    const monthlyData = {};
    
    // Initialize all months with 0
    monthNames.forEach(month => {
        monthlyData[month] = 0;
    });
    
    // Count cases by month
    data.forEach(row => {
        if (row[dateField] && !isNaN(row[dateField])) {
            const monthIndex = row[dateField].getMonth();
            monthlyData[monthNames[monthIndex]]++;
        }
    });
    
    return monthlyData;
}

function createBarChartConfig(monthlyData, label, color) {
    return {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [{
                label: label,
                data: monthNames.map(month => monthlyData[month]),
                backgroundColor: color.background,
                borderColor: color.border,
                borderWidth: 2,
                hoverBackgroundColor: color.hoverBackground,
                hoverBorderColor: color.hoverBorder,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return [
                                `Total Cases: ${value}`,
                                `Percentage: ${percentage}%`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cases',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    };
}

// Common UI functions
function showSections() {
    // Check and show each section if it exists
    const filterSection = document.getElementById('filter-section');
    if (filterSection) {
        filterSection.style.display = 'block';
    }
    
    const summarySection = document.getElementById('summary-section');
    if (summarySection) {
        summarySection.style.display = 'block';
    }
    
    const visualizationSection = document.getElementById('visualization-section');
    if (visualizationSection) {
        visualizationSection.style.display = 'block';
    }
    
    const exportSection = document.getElementById('export-section');
    if (exportSection) {
        exportSection.style.display = 'block';
    }
    
    const tabsContainer = document.getElementById('tabs-container');
    if (tabsContainer) {
        tabsContainer.style.display = 'block';
    }
}

function addStatCard(container, title, value) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'stat-title';
    titleEl.textContent = title;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = value;
    
    card.appendChild(titleEl);
    card.appendChild(valueEl);
    container.appendChild(card);
}

// Export functions
function downloadChart(chart, filename) {
    if (!chart) return;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image();
    link.click();
    showSuccess('Chart downloaded successfully!');
}

function exportMonthlyDataToCSV(monthlyData, filename) {
    // Create CSV content
    let csvContent = 'Month,Number of Cases\n';
    monthNames.forEach(month => {
        csvContent += `${month},${monthlyData[month]}\n`;
    });
    
    // Add summary
    csvContent += '\nSummary\n';
    csvContent += `Total Cases,${filteredData.length}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    window.URL.revokeObjectURL(url);
    showSuccess('CSV exported successfully!');
}

// Modal functions
function createMaximizeModal(chart, title) {
    if (!chart) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 20px;
        width: 90%;
        max-width: 1200px;
        height: 80%;
        display: flex;
        flex-direction: column;
    `;
    
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    `;
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalHeader.appendChild(modalTitle);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 30px;
        cursor: pointer;
        color: #666;
    `;
    closeBtn.onclick = () => document.body.removeChild(modal);
    modalHeader.appendChild(closeBtn);
    
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
        flex: 1;
        position: relative;
    `;
    
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(chartContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Create enlarged chart
    const enlargedChart = new Chart(canvas, {
        type: chart.config.type,
        data: JSON.parse(JSON.stringify(chart.config.data)),
        options: {
            ...JSON.parse(JSON.stringify(chart.config.options)),
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// UI Helper functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.style.display = 'block';
    setTimeout(() => {
        successEl.style.display = 'none';
    }, 5000);
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

function hideMessages() {
    const successEl = document.getElementById('success-message');
    const errorEl = document.getElementById('error-message');
    if (successEl) successEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
}

// Additional utility functions for Excel reading
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// CSV download function
function downloadCSV(headers, rows, filename) {
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}