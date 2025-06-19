// ADR Outcome Chart Module
window.ADRCharts = window.ADRCharts || {};

ADRCharts.outcome = {
    _chartInstance: null,
    _chartType: 'pie', // Can be 'pie' or 'bar'
    
    // Define colors for outcome categories
    outcomeColors: {
        'Recovered': {
            background: 'rgba(39, 174, 96, 0.8)',  // Green - best outcome
            border: 'rgba(39, 174, 96, 1)'
        },
        'Recovering': {
            background: 'rgba(82, 196, 26, 0.8)',  // Light green - positive trajectory
            border: 'rgba(82, 196, 26, 1)'
        },
        'Recovered with sequelae': {
            background: 'rgba(243, 156, 18, 0.8)',  // Orange - partial recovery
            border: 'rgba(243, 156, 18, 1)'
        },
        'Not recovered': {
            background: 'rgba(231, 76, 60, 0.8)',  // Red - poor outcome
            border: 'rgba(231, 76, 60, 1)'
        },
        'Died': {
            background: 'rgba(44, 62, 80, 0.8)',  // Dark gray/black - worst outcome
            border: 'rgba(44, 62, 80, 1)'
        },
        'Unknown': {
            background: 'rgba(149, 165, 166, 0.8)',  // Light gray - no data
            border: 'rgba(149, 165, 166, 1)'
        }
    },
    
    // Order for display
    outcomeOrder: ['Recovered', 'Recovering', 'Recovered with sequelae', 'Not recovered', 'Died', 'Unknown'],
    
    // Clean outcome value
    cleanOutcomeValue: function(value) {
        if (!value || value === null || value === undefined) {
            return 'Unknown';
        }
        
        // Convert to string and clean
        let cleaned = value.toString()
            .replace(/_x000D_/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ')
            .trim();
        
        // Check if it's just whitespace or empty
        if (cleaned === '' || cleaned === '_' || cleaned.length === 0) {
            return 'Unknown';
        }
        
        // Normalize to lowercase for matching
        const normalizedValue = cleaned.toLowerCase();
        
        // Handle repeated values (e.g., "Unknown Unknown Unknown")
        // First, check for duplicated words
        const words = normalizedValue.split(/\s+/);
        const uniqueWords = [...new Set(words)];
        
        // If all words are the same (e.g., "unknown unknown unknown"), use just one
        if (uniqueWords.length === 1 && words.length > 1) {
            const singleWord = uniqueWords[0];
            
            // Map common single words to standard outcomes
            if (singleWord === 'unknown' || singleWord === 'unkown') {
                return 'Unknown';
            } else if (singleWord === 'fatal' || singleWord === 'died' || singleWord === 'death') {
                return 'Died';
            } else if (singleWord === 'recovered' || singleWord === 'resolved') {
                return 'Recovered';
            } else if (singleWord === 'recovering' || singleWord === 'resolving') {
                return 'Recovering';
            }
        }
        
        // Handle variations with slashes (e.g., "Recovering / Resolving")
        if (normalizedValue.includes('/')) {
            // Check for common patterns
            if (normalizedValue.includes('recovering') || normalizedValue.includes('resolving')) {
                return 'Recovering';
            } else if (normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) {
                // Check if it includes sequelae
                if (normalizedValue.includes('sequelae')) {
                    return 'Recovered with sequelae';
                }
                return 'Recovered';
            }
        }
        
        // Handle specific outcome patterns
        if (normalizedValue.includes('unknown') || normalizedValue.includes('unkown')) {
            return 'Unknown';
        } else if (normalizedValue.includes('fatal') || normalizedValue.includes('died') || normalizedValue.includes('death')) {
            return 'Died';
        } else if ((normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) && normalizedValue.includes('sequelae')) {
            return 'Recovered with sequelae';
        } else if (normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) {
            return 'Recovered';
        } else if (normalizedValue.includes('recovering') || normalizedValue.includes('resolving')) {
            return 'Recovering';
        } else if (normalizedValue.includes('not recovered') || normalizedValue.includes('not resolved')) {
            return 'Not recovered';
        }
        
        // If no match found, check if it's a misspelling or variation
        // Common misspellings
        if (normalizedValue === 'unkown' || normalizedValue === 'unknow' || normalizedValue === 'unknwon') {
            return 'Unknown';
        }
        
        // If still no match, return Unknown for unrecognized values
        console.warn(`Unrecognized outcome value: "${cleaned}"`);
        return 'Unknown';
    },
    
    // Process data for outcomes
    processData: function(data) {
        // Count outcome categories
        const outcomeCounts = {};
        
        // Initialize all categories
        this.outcomeOrder.forEach(outcome => {
            outcomeCounts[outcome] = 0;
        });
        
        data.forEach(row => {
            const outcome = this.cleanOutcomeValue(row['Outcome']);
            if (outcomeCounts.hasOwnProperty(outcome)) {
                outcomeCounts[outcome]++;
            } else {
                // If we encounter an unexpected outcome, add it
                outcomeCounts[outcome] = 1;
            }
        });
        
        // Calculate total
        const total = Object.values(outcomeCounts).reduce((a, b) => a + b, 0);
        
        // Calculate grouped statistics
        const positiveOutcomes = (outcomeCounts['Recovered'] || 0) + (outcomeCounts['Recovering'] || 0);
        const positivePercentage = total > 0 ? ((positiveOutcomes / total) * 100).toFixed(1) : '0.0';
        
        const partialRecovery = outcomeCounts['Recovered with sequelae'] || 0;
        const partialPercentage = total > 0 ? ((partialRecovery / total) * 100).toFixed(1) : '0.0';
        
        const negativeOutcomes = (outcomeCounts['Not recovered'] || 0) + (outcomeCounts['Died'] || 0);
        const negativePercentage = total > 0 ? ((negativeOutcomes / total) * 100).toFixed(1) : '0.0';
        
        // Recovery rate (excluding unknown)
        const knownOutcomes = total - (outcomeCounts['Unknown'] || 0);
        const recoveryRate = knownOutcomes > 0 ? 
            (((outcomeCounts['Recovered'] || 0) / knownOutcomes) * 100).toFixed(1) : '0.0';
        
        // Mortality rate
        const mortalityRate = total > 0 ? 
            (((outcomeCounts['Died'] || 0) / total) * 100).toFixed(1) : '0.0';
        
        return {
            outcomeCounts,
            total,
            positiveOutcomes,
            positivePercentage,
            partialRecovery,
            partialPercentage,
            negativeOutcomes,
            negativePercentage,
            recoveryRate,
            mortalityRate,
            totalRecords: data.length
        };
    },
    
    // Create the chart
    createChart: function(containerId, data, options = {}) {
        const processed = this.processData(data);
        const chartType = options.chartType || this._chartType;
        
        let config;
        if (chartType === 'bar') {
            config = this._createBarConfig(processed);
        } else {
            config = this._createPieConfig(processed);
        }
        
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
        this._chartType = chartType;
        
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
    
    // Create pie chart configuration
    _createPieConfig: function(processed) {
        // Prepare data - filter out zero counts for pie chart
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        
        this.outcomeOrder.forEach(outcome => {
            if (processed.outcomeCounts[outcome] > 0) {
                labels.push(outcome);
                data.push(processed.outcomeCounts[outcome]);
                backgroundColors.push(this.outcomeColors[outcome]?.background || 'rgba(189, 195, 199, 0.8)');
                borderColors.push(this.outcomeColors[outcome]?.border || 'rgba(189, 195, 199, 1)');
            }
        });
        
        // Add any unexpected outcomes
        Object.keys(processed.outcomeCounts).forEach(outcome => {
            if (!this.outcomeOrder.includes(outcome) && processed.outcomeCounts[outcome] > 0) {
                labels.push(outcome);
                data.push(processed.outcomeCounts[outcome]);
                backgroundColors.push('rgba(189, 195, 199, 0.8)');
                borderColors.push('rgba(189, 195, 199, 1)');
            }
        });
        
        return {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
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
                        padding: 12
                    }
                }
            }
        };
    },
    
    // Create bar chart configuration
    _createBarConfig: function(processed) {
        // Prepare data - include all outcomes for bar chart
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        
        this.outcomeOrder.forEach(outcome => {
            labels.push(outcome);
            data.push(processed.outcomeCounts[outcome]);
            backgroundColors.push(this.outcomeColors[outcome]?.background || 'rgba(189, 195, 199, 0.8)');
            borderColors.push(this.outcomeColors[outcome]?.border || 'rgba(189, 195, 199, 1)');
        });
        
        // Add any unexpected outcomes
        Object.keys(processed.outcomeCounts).forEach(outcome => {
            if (!this.outcomeOrder.includes(outcome)) {
                labels.push(outcome);
                data.push(processed.outcomeCounts[outcome]);
                backgroundColors.push('rgba(189, 195, 199, 0.8)');
                borderColors.push('rgba(189, 195, 199, 1)');
            }
        });
        
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
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
                        display: false
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
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Cases'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    y: {
                        ticks: {
                            autoSkip: false
                        }
                    }
                }
            }
        };
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
                <div class="stat-value">${processed.positiveOutcomes.toLocaleString()}</div>
                <div class="stat-label">Positive Outcomes (${processed.positivePercentage}%)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.negativeOutcomes.toLocaleString()}</div>
                <div class="stat-label">Negative Outcomes (${processed.negativePercentage}%)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.recoveryRate}%</div>
                <div class="stat-label">Recovery Rate (Known)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.mortalityRate}%</div>
                <div class="stat-label">Mortality Rate</div>
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
                        <th>Outcome</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Display in order
        this.outcomeOrder.forEach(outcome => {
            if (processed.outcomeCounts[outcome] !== undefined) {
                const count = processed.outcomeCounts[outcome];
                const percentage = processed.total > 0 ? ((count / processed.total) * 100).toFixed(1) : '0.0';
                tableHTML += `
                    <tr>
                        <td>${outcome}</td>
                        <td style="text-align: right;">${count.toLocaleString()}</td>
                        <td style="text-align: right;">${percentage}%</td>
                    </tr>
                `;
            }
        });
        
        // Add any unexpected outcomes
        Object.keys(processed.outcomeCounts).forEach(outcome => {
            if (!this.outcomeOrder.includes(outcome)) {
                const count = processed.outcomeCounts[outcome];
                const percentage = processed.total > 0 ? ((count / processed.total) * 100).toFixed(1) : '0.0';
                tableHTML += `
                    <tr>
                        <td>${outcome}</td>
                        <td style="text-align: right;">${count.toLocaleString()}</td>
                        <td style="text-align: right;">${percentage}%</td>
                    </tr>
                `;
            }
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
    exportData: function(data, filename = 'adr_outcome_distribution.csv') {
        const processed = this.processData(data);
        
        // Create CSV content
        let csvContent = 'Outcome,Count,Percentage\n';
        
        // Add outcomes in order
        this.outcomeOrder.forEach(outcome => {
            if (processed.outcomeCounts[outcome] !== undefined) {
                const count = processed.outcomeCounts[outcome];
                const percentage = processed.total > 0 ? ((count / processed.total) * 100).toFixed(1) : '0.0';
                csvContent += `"${outcome}",${count},${percentage}%\n`;
            }
        });
        
        // Add any unexpected outcomes
        Object.keys(processed.outcomeCounts).forEach(outcome => {
            if (!this.outcomeOrder.includes(outcome)) {
                const count = processed.outcomeCounts[outcome];
                const percentage = processed.total > 0 ? ((count / processed.total) * 100).toFixed(1) : '0.0';
                csvContent += `"${outcome}",${count},${percentage}%\n`;
            }
        });
        
        // Add total
        csvContent += `\nTotal,${processed.total},100.0%\n`;
        
        // Add summary statistics
        csvContent += `\nSummary Statistics\n`;
        csvContent += `Positive Outcomes,${processed.positiveOutcomes},${processed.positivePercentage}%\n`;
        csvContent += `Negative Outcomes,${processed.negativeOutcomes},${processed.negativePercentage}%\n`;
        csvContent += `Recovery Rate (Known),${processed.recoveryRate}%\n`;
        csvContent += `Mortality Rate,${processed.mortalityRate}%\n`;
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Switch chart type
    switchChartType: function(type) {
        if (type === 'bar' || type === 'pie') {
            this._chartType = type;
        }
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