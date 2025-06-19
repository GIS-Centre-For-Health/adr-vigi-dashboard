/**
 * Common Utilities for ADR Visualizations
 * Shared functions used across all visualization modules
 */

// Initialize namespace
window.ADRCharts = window.ADRCharts || {};
window.ADRCharts.utils = window.ADRCharts.utils || {};

// Month names for display
ADRCharts.utils.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];

// Date parsing utilities
ADRCharts.utils.parseDate = function(dateStr) {
    if (!dateStr) return null;
    
    // Handle YYYYMMDD format from VigiFlow
    if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(year, month - 1, day);
    }
    
    // Try standard date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

// Parse Initial received date
ADRCharts.utils.parseInitialReceivedDate = function(dateValue) {
    if (!dateValue || dateValue === 'null' || dateValue === 'undefined') return null;
    
    // Handle Excel serial date (number)
    if (typeof dateValue === 'number') {
        // Excel serial date: days since 1900-01-01 (with leap year bug)
        const excelEpoch = new Date(1899, 11, 30); // Excel's epoch (adjusted for leap year bug)
        return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    }
    // Handle DD-MMM-YY format (e.g., "15-Jan-22")
    else if (typeof dateValue === 'string' && /^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(dateValue)) {
        const parts = dateValue.split('-');
        const day = parseInt(parts[0]);
        const monthStr = parts[1];
        const year = parseInt('20' + parts[2]); // Assuming 20xx for 2-digit years
        
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const month = months[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day);
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
};

// Parse Onset date
ADRCharts.utils.parseOnsetDate = function(dateValue) {
    if (!dateValue || dateValue === 'null' || dateValue === 'undefined' || dateValue.trim() === '') return null;
    
    // Handle various date formats in the onset date field
    
    // Handle Excel serial date (number)
    if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
        const trimmed = dateValue.trim();
        
        // Handle DD-MMM-YY format
        if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(trimmed)) {
            const parts = trimmed.split('-');
            const day = parseInt(parts[0]);
            const monthStr = parts[1];
            const year = parseInt('20' + parts[2]);
            
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const month = months[monthStr];
            if (month !== undefined) {
                return new Date(year, month, day);
            }
        }
        
        // Handle YYYY-MM-DD or YYYY/MM/DD format
        if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(trimmed)) {
            const date = new Date(trimmed);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Handle DD/MM/YYYY or DD-MM-YYYY format
        if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(trimmed)) {
            const parts = trimmed.split(/[-\/]/);
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            
            if (year >= 1900 && year <= 2030 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                return new Date(year, month, day);
            }
        }
        
        // Try standard date parsing as last resort
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    return null;
};

// Drug name parsing
ADRCharts.utils.parseDrugNames = function(drugString) {
    if (!drugString || drugString === 'null' || drugString === 'undefined') {
        return [];
    }
    
    // Handle Excel's newline encoding
    const cleanedString = drugString.replace(/_x000D_/g, '\n');
    
    // Split by newlines and clean up
    return cleanedString.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
};

// Age calculation
ADRCharts.utils.calculateAge = function(birthDate, referenceDate) {
    if (!birthDate || !referenceDate) return null;
    
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    
    if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return null;
    
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};

// Age group categorization
ADRCharts.utils.getAgeGroup = function(age) {
    if (age === null || age === undefined || isNaN(age)) return 'Unknown';
    
    // Convert age to days for neonate/infant classification
    const ageInDays = age * 365;
    
    if (age < 0) return 'Unknown';
    if (ageInDays <= 28) return 'Neonate (≤28 days)';
    if (age < 1) return 'Infant (29 days-1 year)';
    if (age <= 12) return 'Child (1-12 years)';
    if (age <= 17) return 'Adolescent (13-17 years)';
    if (age <= 60) return 'Adult (18-60 years)';
    return 'Elderly (>60 years)';
};

// Data aggregation by month
ADRCharts.utils.aggregateByMonth = function(data, dateField) {
    const monthlyData = {};
    
    data.forEach(row => {
        const dateStr = row[dateField];
        const date = ADRCharts.utils.parseDate(dateStr);
        
        if (date) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
        labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        }),
        values: sortedMonths.map(month => monthlyData[month])
    };
};

// Common chart configuration
ADRCharts.utils.getDefaultChartConfig = function(type, data, options) {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: options.legendPosition || 'top',
                display: options.showLegend !== false
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: type === 'bar' || type === 'line' ? {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        } : undefined
    };
    
    return {
        type: type,
        data: data,
        options: Object.assign({}, defaultOptions, options)
    };
};

// Color palette for charts
ADRCharts.utils.colors = {
    primary: '#3498db',
    secondary: '#2ecc71',
    tertiary: '#f39c12',
    quaternary: '#e74c3c',
    quinary: '#9b59b6',
    senary: '#1abc9c',
    palette: [
        '#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6',
        '#1abc9c', '#34495e', '#f1c40f', '#e67e22', '#95a5a6'
    ]
};

// Export data to CSV
ADRCharts.utils.exportToCSV = function(data, filename) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(value || '').replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        )
    ].join('\n');
    
    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Download chart as image
ADRCharts.utils.downloadChartAsImage = function(chartInstance, filename) {
    if (!chartInstance) {
        console.warn('No chart instance provided');
        return;
    }
    
    const link = document.createElement('a');
    link.download = filename || 'chart.png';
    link.href = chartInstance.toBase64Image();
    link.click();
};

// Clean text data
ADRCharts.utils.cleanText = function(text) {
    if (!text || text === 'null' || text === 'undefined' || text === 'N/A') {
        return 'Unknown';
    }
    return String(text).trim();
};

// Sort and limit data for display
ADRCharts.utils.getTopN = function(dataObject, n = 10, includeOthers = true) {
    const entries = Object.entries(dataObject);
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    
    if (sorted.length <= n || !includeOthers) {
        return dataObject;
    }
    
    const top = sorted.slice(0, n);
    const others = sorted.slice(n).reduce((sum, [_, value]) => sum + value, 0);
    
    const result = Object.fromEntries(top);
    if (others > 0) {
        result['Others'] = others;
    }
    
    return result;
};