/**
 * ADR Onset Date Chart Module
 * Handles temporal analysis of ADR reports by reaction onset date
 */

// Ensure namespace exists
window.ADRCharts = window.ADRCharts || {};

// Onset date chart module
ADRCharts.onsetDate = {
    // Private property to hold chart instance
    _chartInstance: null,
    
    // Chart colors - using red/pink for onset date
    _colors: {
        background: 'rgba(255, 99, 132, 0.7)',
        border: 'rgba(255, 99, 132, 1)',
        hoverBackground: 'rgba(255, 99, 132, 0.9)',
        hoverBorder: 'rgba(255, 99, 132, 1)'
    },
    
    /**
     * Process data for onset date temporal analysis
     * @param {Array} data - Raw ADR data
     * @returns {Object} Processed data with monthly/yearly groupings
     */
    processData: function(data) {
        // Add parsed date to each row
        data.forEach(row => {
            // Try to parse from Onset date / Time column
            if (row['Onset date / Time'] && !row._parsedOnsetDate) {
                row._parsedOnsetDate = ADRCharts.utils.parseOnsetDate(row['Onset date / Time']);
            }
            
            // Fallback to Initial received date if no onset date
            if (!row._parsedOnsetDate && row['Initial received date']) {
                row._parsedOnsetDate = ADRCharts.utils.parseInitialReceivedDate(row['Initial received date']);
                row._isOnsetFallback = true; // Mark as fallback
            }
        });
        
        // Get monthly data
        const monthlyData = this.getMonthlyData(data);
        const yearlyData = this.getYearlyData(data);
        
        // Calculate statistics
        const validOnsetDates = data.filter(row => row._parsedOnsetDate && !isNaN(row._parsedOnsetDate) && !row._isOnsetFallback).length;
        const fallbackDates = data.filter(row => row._parsedOnsetDate && !isNaN(row._parsedOnsetDate) && row._isOnsetFallback).length;
        const totalValidDates = validOnsetDates + fallbackDates;
        const dateRange = this.getDateRange(data);
        
        return {
            monthlyData: monthlyData,
            yearlyData: yearlyData,
            total: data.length,
            validOnsetDates: validOnsetDates,
            fallbackDates: fallbackDates,
            totalValidDates: totalValidDates,
            dateRange: dateRange,
            onsetCompleteness: ((validOnsetDates / data.length) * 100).toFixed(1),
            totalCompleteness: ((totalValidDates / data.length) * 100).toFixed(1)
        };
    },
    
    /**
     * Get monthly aggregated data
     * @param {Array} data - Data with parsed dates
     * @returns {Object} Monthly counts
     */
    getMonthlyData: function(data) {
        const monthlyData = {};
        
        // Initialize all months with 0
        ADRCharts.utils.monthNames.forEach(month => {
            monthlyData[month] = 0;
        });
        
        // Count cases by month
        data.forEach(row => {
            if (row._parsedOnsetDate && !isNaN(row._parsedOnsetDate)) {
                const monthIndex = row._parsedOnsetDate.getMonth();
                monthlyData[ADRCharts.utils.monthNames[monthIndex]]++;
            }
        });
        
        return monthlyData;
    },
    
    /**
     * Get yearly aggregated data
     * @param {Array} data - Data with parsed dates
     * @returns {Array} Yearly counts sorted by year
     */
    getYearlyData: function(data) {
        const yearlyData = {};
        
        data.forEach(row => {
            if (row._parsedOnsetDate && !isNaN(row._parsedOnsetDate)) {
                const year = row._parsedOnsetDate.getFullYear();
                yearlyData[year] = (yearlyData[year] || 0) + 1;
            }
        });
        
        // Convert to array and sort
        return Object.entries(yearlyData)
            .map(([year, count]) => ({ year: parseInt(year), count: count }))
            .sort((a, b) => a.year - b.year);
    },
    
    /**
     * Get date range from data
     * @param {Array} data - Data with parsed dates
     * @returns {Object} Date range with min and max dates
     */
    getDateRange: function(data) {
        const dates = data
            .filter(row => row._parsedOnsetDate && !isNaN(row._parsedOnsetDate))
            .map(row => row._parsedOnsetDate);
        
        if (dates.length === 0) {
            return { min: null, max: null };
        }
        
        return {
            min: new Date(Math.min(...dates)),
            max: new Date(Math.max(...dates))
        };
    },
    
    /**
     * Create onset date temporal chart
     * @param {string} containerId - ID of canvas element
     * @param {Array} data - Raw ADR data
     * @param {Object} options - Additional chart options
     * @returns {Chart} Chart.js instance
     */
    createChart: function(containerId, data, options) {
        // Destroy existing chart if any
        if (this._chartInstance) {
            this.destroy();
        }
        
        // Process data
        const processed = this.processData(data);
        
        // Default to monthly view
        const viewType = options?.viewType || 'monthly';
        let chartData, labels;
        
        if (viewType === 'yearly') {
            labels = processed.yearlyData.map(item => item.year.toString());
            chartData = processed.yearlyData.map(item => item.count);
        } else {
            labels = ADRCharts.utils.monthNames;
            chartData = labels.map(month => processed.monthlyData[month]);
        }
        
        // Get canvas context
        const ctx = document.getElementById(containerId).getContext('2d');
        
        // Chart configuration
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of ADR Reports by Onset Date',
                    data: chartData,
                    backgroundColor: this._colors.background,
                    borderColor: this._colors.border,
                    borderWidth: 2,
                    hoverBackgroundColor: this._colors.hoverBackground,
                    hoverBorderColor: this._colors.hoverBorder,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Total: ${processed.total.toLocaleString()} | Onset Dates: ${processed.validOnsetDates.toLocaleString()} (${processed.onsetCompleteness}%) | Using Received Date: ${processed.fallbackDates.toLocaleString()}`,
                        font: {
                            size: 14,
                            weight: 'normal'
                        },
                        padding: 20
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
                                    `Total Cases: ${value.toLocaleString()}`,
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
                            text: viewType === 'yearly' ? 'Year' : 'Month',
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
        
        // Merge with custom options
        if (options?.chartOptions) {
            Object.assign(config.options, options.chartOptions);
        }
        
        // Create chart
        this._chartInstance = new Chart(ctx, config);
        
        return this._chartInstance;
    },
    
    /**
     * Update chart with new data
     * @param {Array} newData - New data to display
     * @param {Object} options - Update options
     */
    update: function(newData, options) {
        if (!this._chartInstance) {
            console.warn('No chart instance to update');
            return;
        }
        
        const processed = this.processData(newData);
        const viewType = options?.viewType || 'monthly';
        
        let labels, chartData;
        if (viewType === 'yearly') {
            labels = processed.yearlyData.map(item => item.year.toString());
            chartData = processed.yearlyData.map(item => item.count);
        } else {
            labels = ADRCharts.utils.monthNames;
            chartData = labels.map(month => processed.monthlyData[month]);
        }
        
        // Update chart data
        this._chartInstance.data.labels = labels;
        this._chartInstance.data.datasets[0].data = chartData;
        
        // Update title
        this._chartInstance.options.plugins.title.text = 
            `Total: ${processed.total.toLocaleString()} | Onset Dates: ${processed.validOnsetDates.toLocaleString()} (${processed.onsetCompleteness}%) | Using Received Date: ${processed.fallbackDates.toLocaleString()}`;
        
        // Update x-axis title
        this._chartInstance.options.scales.x.title.text = viewType === 'yearly' ? 'Year' : 'Month';
        
        // Update chart
        this._chartInstance.update();
    },
    
    /**
     * Destroy chart instance and clean up
     */
    destroy: function() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
    },
    
    /**
     * Get current chart instance
     * @returns {Chart|null} Current chart instance
     */
    getChartInstance: function() {
        return this._chartInstance;
    },
    
    /**
     * Export chart data as CSV
     * @param {Array} data - Raw data to export
     * @param {string} filename - Filename for export
     * @param {string} viewType - 'monthly' or 'yearly'
     */
    exportData: function(data, filename, viewType) {
        const processed = this.processData(data);
        const csvData = [];
        
        if (viewType === 'yearly') {
            processed.yearlyData.forEach(item => {
                csvData.push({
                    'Year': item.year,
                    'Number of Cases': item.count
                });
            });
        } else {
            ADRCharts.utils.monthNames.forEach(month => {
                csvData.push({
                    'Month': month,
                    'Number of Cases': processed.monthlyData[month]
                });
            });
        }
        
        // Add summary
        csvData.push({});
        csvData.push({ 'Month': 'SUMMARY', 'Number of Cases': '' });
        csvData.push({ 'Month': 'Total Cases', 'Number of Cases': processed.total });
        csvData.push({ 'Month': 'Cases with Valid Onset Dates', 'Number of Cases': processed.validOnsetDates });
        csvData.push({ 'Month': 'Cases Using Received Date (Fallback)', 'Number of Cases': processed.fallbackDates });
        csvData.push({ 'Month': 'Onset Date Completeness', 'Number of Cases': processed.onsetCompleteness + '%' });
        csvData.push({ 'Month': 'Total Data Completeness', 'Number of Cases': processed.totalCompleteness + '%' });
        
        if (processed.dateRange.min && processed.dateRange.max) {
            csvData.push({ 
                'Month': 'Date Range', 
                'Number of Cases': `${processed.dateRange.min.toLocaleDateString()} - ${processed.dateRange.max.toLocaleDateString()}`
            });
        }
        
        ADRCharts.utils.exportToCSV(csvData, filename || 'adr_onset_date_analysis.csv');
    },
    
    /**
     * Generate summary statistics
     * @param {Array} data - Raw data
     * @returns {Object} Summary statistics
     */
    getSummaryStats: function(data) {
        const processed = this.processData(data);
        const monthlyData = processed.monthlyData;
        
        // Find most active month
        const maxMonth = Object.entries(monthlyData)
            .sort((a, b) => b[1] - a[1])[0];
        
        return {
            totalCases: processed.total,
            validOnsetDates: processed.validOnsetDates,
            fallbackDates: processed.fallbackDates,
            onsetCompleteness: processed.onsetCompleteness + '%',
            totalCompleteness: processed.totalCompleteness + '%',
            mostActiveMonth: maxMonth ? `${maxMonth[0]} (${maxMonth[1]} cases)` : 'N/A',
            dateRange: processed.dateRange.min && processed.dateRange.max ? 
                `${processed.dateRange.min.toLocaleDateString()} - ${processed.dateRange.max.toLocaleDateString()}` : 
                'N/A'
        };
    }
};