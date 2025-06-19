/**
 * ADR Received Date Chart Module
 * Handles temporal analysis of ADR reports by initial received date
 */

// Ensure namespace exists
window.ADRCharts = window.ADRCharts || {};

// Received date chart module
ADRCharts.receivedDate = {
    // Private property to hold chart instance
    _chartInstance: null,
    
    // Chart colors
    _colors: {
        background: 'rgba(54, 162, 235, 0.7)',
        border: 'rgba(54, 162, 235, 1)',
        hoverBackground: 'rgba(54, 162, 235, 0.9)',
        hoverBorder: 'rgba(54, 162, 235, 1)'
    },
    
    /**
     * Process data for received date temporal analysis
     * @param {Array} data - Raw ADR data
     * @returns {Object} Processed data with monthly/yearly groupings
     */
    processData: function(data) {
        // Add parsed date to each row
        data.forEach(row => {
            if (row['Initial received date'] && !row._parsedReceivedDate) {
                row._parsedReceivedDate = ADRCharts.utils.parseInitialReceivedDate(row['Initial received date']);
            }
        });
        
        // Get monthly data
        const monthlyData = this.getMonthlyData(data);
        const yearlyData = this.getYearlyData(data);
        
        // Calculate statistics
        const validDates = data.filter(row => row._parsedReceivedDate && !isNaN(row._parsedReceivedDate)).length;
        const dateRange = this.getDateRange(data);
        
        return {
            monthlyData: monthlyData,
            yearlyData: yearlyData,
            total: data.length,
            validDates: validDates,
            dateRange: dateRange,
            dataQuality: ((validDates / data.length) * 100).toFixed(1)
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
            if (row._parsedReceivedDate && !isNaN(row._parsedReceivedDate)) {
                const monthIndex = row._parsedReceivedDate.getMonth();
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
            if (row._parsedReceivedDate && !isNaN(row._parsedReceivedDate)) {
                const year = row._parsedReceivedDate.getFullYear();
                yearlyData[year] = (yearlyData[year] || 0) + 1;
            }
        });
        
        // Convert to array and sort
        return Object.entries(yearlyData)
            .map(([year, count]) => ({ year: parseInt(year), count: count }))
            .sort((a, b) => a.year - b.year);
    },
    
    /**
     * Get chronological monthly data for trends
     * @param {Array} data - Raw ADR data
     * @returns {Array} Array of {label, count} objects sorted chronologically
     */
    getChronologicalMonthlyData: function(data) {
        // Parse dates if not already done
        data.forEach(row => {
            if (row['Initial received date'] && !row._parsedReceivedDate) {
                row._parsedReceivedDate = ADRCharts.utils.parseInitialReceivedDate(row['Initial received date']);
            }
        });
        
        // Aggregate by month-year
        const monthlyData = {};
        data.forEach(row => {
            if (row._parsedReceivedDate && !isNaN(row._parsedReceivedDate)) {
                const date = row._parsedReceivedDate;
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });
        
        // Convert to array and sort chronologically
        const sortedData = Object.entries(monthlyData)
            .map(([key, count]) => {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return {
                    label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                    count: count,
                    sortKey: key
                };
            })
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        
        return sortedData;
    },
    
    /**
     * Get date range from data
     * @param {Array} data - Data with parsed dates
     * @returns {Object} Date range with min and max dates
     */
    getDateRange: function(data) {
        const dates = data
            .filter(row => row._parsedReceivedDate && !isNaN(row._parsedReceivedDate))
            .map(row => row._parsedReceivedDate);
        
        if (dates.length === 0) {
            return { min: null, max: null };
        }
        
        return {
            min: new Date(Math.min(...dates)),
            max: new Date(Math.max(...dates))
        };
    },
    
    /**
     * Create received date temporal chart
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
                    label: 'Number of ADR Reports',
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
                        text: `Total Cases: ${processed.total.toLocaleString()} | Valid Dates: ${processed.validDates.toLocaleString()} (${processed.dataQuality}%)`,
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
            `Total Cases: ${processed.total.toLocaleString()} | Valid Dates: ${processed.validDates.toLocaleString()} (${processed.dataQuality}%)`;
        
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
        csvData.push({ 'Month': 'Cases with Valid Dates', 'Number of Cases': processed.validDates });
        csvData.push({ 'Month': 'Data Completeness', 'Number of Cases': processed.dataQuality + '%' });
        
        if (processed.dateRange.min && processed.dateRange.max) {
            csvData.push({ 
                'Month': 'Date Range', 
                'Number of Cases': `${processed.dateRange.min.toLocaleDateString()} - ${processed.dateRange.max.toLocaleDateString()}`
            });
        }
        
        ADRCharts.utils.exportToCSV(csvData, filename || 'adr_received_date_analysis.csv');
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
            validDates: processed.validDates,
            dataCompleteness: processed.dataQuality + '%',
            mostActiveMonth: maxMonth ? `${maxMonth[0]} (${maxMonth[1]} cases)` : 'N/A',
            dateRange: processed.dateRange.min && processed.dateRange.max ? 
                `${processed.dateRange.min.toLocaleDateString()} - ${processed.dateRange.max.toLocaleDateString()}` : 
                'N/A'
        };
    }
};