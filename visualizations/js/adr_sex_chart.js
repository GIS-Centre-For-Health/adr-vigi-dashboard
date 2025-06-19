/**
 * ADR Sex Distribution Chart Module
 * Handles sex-based analysis of adverse drug reactions
 */

// Ensure namespace exists
window.ADRCharts = window.ADRCharts || {};

// Sex chart module
ADRCharts.sex = {
    // Private property to hold chart instance
    _chartInstance: null,
    
    // Define colors for sex categories
    _colors: {
        'Male': {
            background: 'rgba(52, 152, 219, 0.8)',  // Blue
            border: 'rgba(52, 152, 219, 1)'
        },
        'Female': {
            background: 'rgba(231, 76, 60, 0.8)',  // Pink/Red
            border: 'rgba(231, 76, 60, 1)'
        },
        'Unknown': {
            background: 'rgba(149, 165, 166, 0.8)',  // Gray
            border: 'rgba(149, 165, 166, 1)'
        },
        'Other': {
            background: 'rgba(155, 89, 182, 0.8)',  // Purple
            border: 'rgba(155, 89, 182, 1)'
        }
    },
    
    /**
     * Process data for sex distribution analysis
     * @param {Array} data - Raw ADR data
     * @returns {Object} Processed data with counts and percentages
     */
    processData: function(data) {
        const sexCounts = {};
        let total = 0;
        
        // Count sex categories
        data.forEach(row => {
            let sex = row['Sex'];
            
            // Handle empty, null, or NaN values
            if (!sex || sex.trim() === '' || sex === 'NaN' || sex === 'null') {
                sex = 'Unknown';
            } else {
                // Standardize the format (capitalize first letter)
                sex = sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase();
            }
            
            sexCounts[sex] = (sexCounts[sex] || 0) + 1;
            total++;
        });
        
        // Calculate percentages
        const processedData = Object.entries(sexCounts).map(([sex, count]) => ({
            sex: sex,
            count: count,
            percentage: ((count / total) * 100).toFixed(1)
        }));
        
        // Sort by count descending
        processedData.sort((a, b) => b.count - a.count);
        
        return {
            data: processedData,
            total: total,
            sexCounts: sexCounts
        };
    },
    
    /**
     * Create sex distribution chart
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
        const labels = Object.keys(processed.sexCounts);
        const values = Object.values(processed.sexCounts);
        
        // Prepare colors
        const backgroundColors = labels.map(label => 
            this._colors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        );
        const borderColors = labels.map(label => 
            this._colors[label]?.border || 'rgba(189, 195, 199, 1)'
        );
        
        // Get canvas context
        const ctx = document.getElementById(containerId).getContext('2d');
        
        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Total Cases: ${processed.total.toLocaleString()}`,
                    font: {
                        size: 16,
                        weight: 'normal'
                    },
                    padding: 20
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const value = dataset.data[i];
                                    const percentage = ((value / processed.total) * 100).toFixed(1);
                                    return {
                                        text: `${label} (${value.toLocaleString()}) - ${percentage}%`,
                                        fillStyle: dataset.backgroundColor[i],
                                        strokeStyle: dataset.borderColor[i],
                                        lineWidth: dataset.borderWidth,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const percentage = ((value / processed.total) * 100).toFixed(1);
                            return [
                                `${label}: ${value.toLocaleString()}`,
                                `Percentage: ${percentage}%`
                            ];
                        }
                    }
                }
            }
        };
        
        // Merge with custom options
        const chartOptions = Object.assign({}, defaultOptions, options);
        
        // Create chart
        this._chartInstance = new Chart(ctx, {
            type: options?.chartType || 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: chartOptions
        });
        
        return this._chartInstance;
    },
    
    /**
     * Update chart with new data
     * @param {Array} newData - New data to display
     */
    update: function(newData) {
        if (!this._chartInstance) {
            console.warn('No chart instance to update');
            return;
        }
        
        const processed = this.processData(newData);
        const labels = Object.keys(processed.sexCounts);
        const values = Object.values(processed.sexCounts);
        
        // Update chart data
        this._chartInstance.data.labels = labels;
        this._chartInstance.data.datasets[0].data = values;
        
        // Update colors
        const backgroundColors = labels.map(label => 
            this._colors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        );
        const borderColors = labels.map(label => 
            this._colors[label]?.border || 'rgba(189, 195, 199, 1)'
        );
        
        this._chartInstance.data.datasets[0].backgroundColor = backgroundColors;
        this._chartInstance.data.datasets[0].borderColor = borderColors;
        
        // Update title
        this._chartInstance.options.plugins.title.text = `Total Cases: ${processed.total.toLocaleString()}`;
        
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
     */
    exportData: function(data, filename) {
        const processed = this.processData(data);
        const csvData = processed.data.map(item => ({
            'Sex': item.sex,
            'Count': item.count,
            'Percentage': item.percentage + '%'
        }));
        
        // Add total row
        csvData.push({
            'Sex': 'TOTAL',
            'Count': processed.total,
            'Percentage': '100.0%'
        });
        
        ADRCharts.utils.exportToCSV(csvData, filename || 'adr_sex_distribution.csv');
    }
};