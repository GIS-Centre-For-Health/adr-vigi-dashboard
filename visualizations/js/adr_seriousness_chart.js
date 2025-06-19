// ADR Seriousness Chart Module
window.ADRCharts = window.ADRCharts || {};

ADRCharts.seriousness = {
    _chartInstance: null,
    
    // Define colors for seriousness categories
    seriousnessColors: {
        'Yes': {
            background: 'rgba(231, 76, 60, 0.8)',  // Red - Important to highlight serious cases
            border: 'rgba(231, 76, 60, 1)'
        },
        'No': {
            background: 'rgba(46, 204, 113, 0.8)',  // Green - Non-serious cases
            border: 'rgba(46, 204, 113, 1)'
        },
        'Unknown': {
            background: 'rgba(149, 165, 166, 0.8)',  // Gray
            border: 'rgba(149, 165, 166, 1)'
        }
    },
    
    // Clean serious value from Excel formatting issues
    cleanSeriousValue: function(value) {
        if (!value || value === null || value === undefined) {
            return 'Unknown';
        }
        
        // Convert to string and remove carriage returns and newlines
        let cleaned = value.toString()
            .replace(/_x000D_/g, '')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .trim();
        
        // Check if it's just whitespace or empty after cleaning
        if (cleaned === '' || cleaned === '_' || cleaned.length === 0) {
            return 'Unknown';
        }
        
        // Extract Yes or No from repeated values (e.g., "NoNoNo" -> "No", "YesYes" -> "Yes")
        if (cleaned.toLowerCase().includes('yes')) {
            return 'Yes';
        } else if (cleaned.toLowerCase().includes('no')) {
            return 'No';
        }
        
        return 'Unknown';
    },
    
    // Process data for seriousness
    processData: function(data) {
        // Count seriousness categories
        const seriousnessCounts = {};
        
        data.forEach(row => {
            const seriousness = this.cleanSeriousValue(row['Seriousness (IME)']);
            seriousnessCounts[seriousness] = (seriousnessCounts[seriousness] || 0) + 1;
        });
        
        // Calculate total
        const total = Object.values(seriousnessCounts).reduce((a, b) => a + b, 0);
        
        // Sort by count descending
        const sortedSeriousness = Object.entries(seriousnessCounts)
            .sort((a, b) => b[1] - a[1]);
        
        // Calculate individual counts and percentages
        const seriousCount = seriousnessCounts['Yes'] || 0;
        const nonSeriousCount = seriousnessCounts['No'] || 0;
        const unknownCount = seriousnessCounts['Unknown'] || 0;
        
        const seriousPercentage = total > 0 ? ((seriousCount / total) * 100).toFixed(1) : '0.0';
        const nonSeriousPercentage = total > 0 ? ((nonSeriousCount / total) * 100).toFixed(1) : '0.0';
        const unknownPercentage = total > 0 ? ((unknownCount / total) * 100).toFixed(1) : '0.0';
        
        return {
            seriousnessCounts,
            total,
            sortedSeriousness,
            seriousCount,
            nonSeriousCount,
            unknownCount,
            seriousPercentage,
            nonSeriousPercentage,
            unknownPercentage,
            totalRecords: data.length
        };
    },
    
    // Create the chart
    createChart: function(containerId, data, options = {}) {
        const processed = this.processData(data);
        
        // Prepare data for chart
        const labels = Object.keys(processed.seriousnessCounts);
        const chartData = Object.values(processed.seriousnessCounts);
        
        // Prepare colors
        const backgroundColors = labels.map(label => 
            this.seriousnessColors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        );
        const borderColors = labels.map(label => 
            this.seriousnessColors[label]?.border || 'rgba(189, 195, 199, 1)'
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
                        text: `Total ADR Cases: ${processed.total.toLocaleString()}`,
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
            <div class="stat-card">
                <div class="stat-value">${processed.seriousCount.toLocaleString()}</div>
                <div class="stat-label">Serious Cases (${processed.seriousPercentage}%)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.nonSeriousCount.toLocaleString()}</div>
                <div class="stat-label">Non-Serious Cases (${processed.nonSeriousPercentage}%)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.unknownCount.toLocaleString()}</div>
                <div class="stat-label">Unknown Status (${processed.unknownPercentage}%)</div>
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
                        <th>Seriousness</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add sorted seriousness categories
        processed.sortedSeriousness.forEach(([seriousness, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>${seriousness}</td>
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
    exportData: function(data, filename = 'adr_seriousness_distribution.csv') {
        const processed = this.processData(data);
        
        // Create CSV content
        let csvContent = 'Seriousness,Count,Percentage\n';
        
        processed.sortedSeriousness.forEach(([seriousness, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            csvContent += `"${seriousness}",${count},${percentage}%\n`;
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