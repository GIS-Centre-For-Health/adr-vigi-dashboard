// ADR Report Types Chart Module
window.ADRCharts = window.ADRCharts || {};

ADRCharts.reportTypes = {
    _chartInstance: null,
    
    // Define colors for report types
    reportTypeColors: {
        'Spontaneous report': {
            background: 'rgba(52, 152, 219, 0.8)',  // Blue
            border: 'rgba(52, 152, 219, 1)'
        },
        'Report from study': {
            background: 'rgba(46, 204, 113, 0.8)',  // Green
            border: 'rgba(46, 204, 113, 1)'
        },
        'Other': {
            background: 'rgba(243, 156, 18, 0.8)',  // Orange
            border: 'rgba(243, 156, 18, 1)'
        },
        'Not available to sender or unknown': {
            background: 'rgba(149, 165, 166, 0.8)',  // Gray
            border: 'rgba(149, 165, 166, 1)'
        }
    },
    
    // Process data for report types
    processData: function(data) {
        // Count report types
        const reportTypeCounts = {};
        
        data.forEach(row => {
            let reportType = row['Report type'];
            
            // Handle empty or null values
            if (!reportType || reportType.trim() === '') {
                reportType = 'Not available to sender or unknown';
            }
            
            reportTypeCounts[reportType] = (reportTypeCounts[reportType] || 0) + 1;
        });
        
        // Calculate total
        const total = Object.values(reportTypeCounts).reduce((a, b) => a + b, 0);
        
        // Sort by count descending
        const sortedTypes = Object.entries(reportTypeCounts)
            .sort((a, b) => b[1] - a[1]);
        
        // Find most common type
        const mostCommon = sortedTypes.length > 0 ? {
            type: sortedTypes[0][0],
            count: sortedTypes[0][1],
            percentage: ((sortedTypes[0][1] / total) * 100).toFixed(1)
        } : null;
        
        // Calculate cases with valid dates
        const validDates = data.filter(row => row._parsedDate && !isNaN(row._parsedDate)).length;
        
        return {
            reportTypeCounts,
            total,
            sortedTypes,
            mostCommon,
            categories: Object.keys(reportTypeCounts).length,
            validDates,
            totalRecords: data.length
        };
    },
    
    // Create the chart
    createChart: function(containerId, data, options = {}) {
        const processed = this.processData(data);
        
        // Prepare data for chart
        const labels = Object.keys(processed.reportTypeCounts);
        const chartData = Object.values(processed.reportTypeCounts);
        
        // Prepare colors
        const backgroundColors = labels.map(label => 
            this.reportTypeColors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        );
        const borderColors = labels.map(label => 
            this.reportTypeColors[label]?.border || 'rgba(189, 195, 199, 1)'
        );
        
        // Chart configuration
        const config = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: chartData,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
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
                                            text: `${label} (${value})`,
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
                }
            }
        };
        
        // Apply any custom options
        if (options.title) {
            config.options.plugins.title.text = options.title;
        }
        
        // Destroy existing chart if any
        this.destroy();
        
        // Create new chart
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return null;
        }
        
        const canvas = container.querySelector('canvas') || document.createElement('canvas');
        if (!canvas.parentNode) {
            container.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        this._chartInstance = new Chart(ctx, config);
        
        // Update summary if provided
        if (options.summaryContainerId) {
            this.updateSummary(options.summaryContainerId, processed);
        }
        
        // Update table if provided
        if (options.tableContainerId) {
            this.updateTable(options.tableContainerId, processed);
        }
        
        return this._chartInstance;
    },
    
    // Update summary statistics
    updateSummary: function(containerId, processed) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const summaryHTML = `
            <div class="stat-card">
                <div class="stat-value">${processed.totalRecords.toLocaleString()}</div>
                <div class="stat-label">Total ADR Cases</div>
            </div>
            ${processed.mostCommon ? `
            <div class="stat-card">
                <div class="stat-value">${processed.mostCommon.type}</div>
                <div class="stat-label">Most Common Type (${processed.mostCommon.percentage}%)</div>
            </div>
            ` : ''}
            <div class="stat-card">
                <div class="stat-value">${processed.categories}</div>
                <div class="stat-label">Report Type Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.validDates.toLocaleString()}</div>
                <div class="stat-label">Cases with Valid Dates</div>
            </div>
        `;
        
        container.innerHTML = summaryHTML;
    },
    
    // Update data table
    updateTable: function(containerId, processed) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Report Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add sorted types
        processed.sortedTypes.forEach(([type, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>${type}</td>
                    <td style="text-align: right;">${count.toLocaleString()}</td>
                    <td style="text-align: right;">${percentage}%</td>
                </tr>
            `;
        });
        
        // Add total row
        tableHTML += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; border-top: 2px solid #ddd;">
                        <td>Total</td>
                        <td style="text-align: right;">${processed.total.toLocaleString()}</td>
                        <td style="text-align: right;">100.0%</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    // Export data as CSV
    exportData: function(data, filename = 'adr_report_types.csv') {
        const processed = this.processData(data);
        
        // Create CSV content
        let csvContent = 'Report Type,Count,Percentage\n';
        
        processed.sortedTypes.forEach(([type, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            csvContent += `"${type}",${count},${percentage}%\n`;
        });
        
        // Add total
        csvContent += `\nTotal,${processed.total},100.0%\n`;
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Destroy the chart instance
    destroy: function() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
    },
    
    // Get chart instance (for external access)
    getChartInstance: function() {
        return this._chartInstance;
    }
};