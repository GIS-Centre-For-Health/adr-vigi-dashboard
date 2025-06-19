/**
 * Common Utilities for ADR Visualizations
 * Shared functions used across all visualization modules
 */

// Initialize namespace
window.ADRCharts = window.ADRCharts || {};
window.ADRCharts.utils = window.ADRCharts.utils || {};

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