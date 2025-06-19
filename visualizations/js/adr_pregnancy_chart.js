// ADR Pregnancy Chart Module
window.ADRCharts = window.ADRCharts || {};

ADRCharts.pregnancy = {
    _chartInstance: null,
    
    // Define colors for pregnancy status
    pregnancyColors: {
        'Yes': {
            background: 'rgba(231, 76, 60, 0.8)',  // Red - Important to highlight
            border: 'rgba(231, 76, 60, 1)'
        },
        'No': {
            background: 'rgba(52, 152, 219, 0.8)',  // Blue
            border: 'rgba(52, 152, 219, 1)'
        },
        'Unknown': {
            background: 'rgba(149, 165, 166, 0.8)',  // Gray
            border: 'rgba(149, 165, 166, 1)'
        }
    },
    
    // Clean pregnancy value
    cleanPregnancyValue: function(value) {
        if (!value || value === null || value === undefined || value.trim() === '') {
            return 'Unknown';
        }
        
        const cleaned = value.toString().trim();
        
        // Handle various unknown values
        if (cleaned.toLowerCase() === 'unknown' || 
            cleaned.toLowerCase() === 'not available' ||
            cleaned === '') {
            return 'Unknown';
        }
        
        // Standardize Yes/No
        if (cleaned.toLowerCase() === 'yes') {
            return 'Yes';
        } else if (cleaned.toLowerCase() === 'no') {
            return 'No';
        }
        
        // Try to match by first character
        const firstChar = cleaned.charAt(0).toUpperCase();
        if (firstChar === 'Y') {
            return 'Yes';
        } else if (firstChar === 'N') {
            return 'No';
        }
        
        return 'Unknown';
    },
    
    // Process data for pregnancy status - ONLY for females
    processData: function(data) {
        const pregnancyCounts = {};
        let femaleCount = 0;
        let totalFemalesAnalyzed = 0;
        
        data.forEach(row => {
            const sex = row['Sex'];
            
            // Only analyze pregnancy status for females
            if (sex && sex.toLowerCase() === 'female') {
                femaleCount++;
                totalFemalesAnalyzed++;
                
                const pregnancyStatus = this.cleanPregnancyValue(row['Pregnant']);
                pregnancyCounts[pregnancyStatus] = (pregnancyCounts[pregnancyStatus] || 0) + 1;
            }
        });
        
        // Calculate total
        const total = Object.values(pregnancyCounts).reduce((a, b) => a + b, 0);
        
        // Sort by count descending
        const sortedStatus = Object.entries(pregnancyCounts)
            .sort((a, b) => b[1] - a[1]);
        
        // Calculate individual counts and percentages
        const pregnantCount = pregnancyCounts['Yes'] || 0;
        const notPregnantCount = pregnancyCounts['No'] || 0;
        const unknownCount = pregnancyCounts['Unknown'] || 0;
        
        // Percentages are of women, not all cases
        const pregnantPercentage = femaleCount > 0 ? ((pregnantCount / femaleCount) * 100).toFixed(1) : '0.0';
        const notPregnantPercentage = femaleCount > 0 ? ((notPregnantCount / femaleCount) * 100).toFixed(1) : '0.0';
        const unknownPercentage = femaleCount > 0 ? ((unknownCount / femaleCount) * 100).toFixed(1) : '0.0';
        
        // Known status
        const knownStatus = pregnantCount + notPregnantCount;
        const knownPercentage = femaleCount > 0 ? ((knownStatus / femaleCount) * 100).toFixed(1) : '0.0';
        
        // Female percentage of total dataset
        const femalePercentage = data.length > 0 ? ((femaleCount / data.length) * 100).toFixed(1) : '0.0';
        
        return {
            pregnancyCounts,
            total,
            sortedStatus,
            femaleCount,
            totalFemalesAnalyzed,
            pregnantCount,
            notPregnantCount,
            unknownCount,
            pregnantPercentage,
            notPregnantPercentage,
            unknownPercentage,
            knownStatus,
            knownPercentage,
            femalePercentage,
            totalRecords: data.length
        };
    },
    
    // Create the chart
    createChart: function(containerId, data, options = {}) {
        const processed = this.processData(data);
        
        // Check if there are females in the dataset
        if (processed.femaleCount === 0) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i><br>No female cases found in the dataset.<br>Pregnancy analysis requires female cases.</div>';
            }
            return null;
        }
        
        // Prepare data for chart
        const labels = Object.keys(processed.pregnancyCounts);
        const chartData = Object.values(processed.pregnancyCounts);
        
        // Prepare colors
        const backgroundColors = labels.map(label => 
            this.pregnancyColors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        );
        const borderColors = labels.map(label => 
            this.pregnancyColors[label]?.border || 'rgba(189, 195, 199, 1)'
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
                        text: `Total Women Analyzed: ${processed.total.toLocaleString()}`,
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
        
        // Update note if provided
        if (options.noteContainerId) {
            this.updateNote(options.noteContainerId, processed);
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
                <div class="stat-value">${processed.femaleCount.toLocaleString()}</div>
                <div class="stat-label">Total Women (${processed.femalePercentage}% of all cases)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.pregnantCount.toLocaleString()}</div>
                <div class="stat-label">Pregnant Women (${processed.pregnantPercentage}% of women)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.knownStatus.toLocaleString()}</div>
                <div class="stat-label">Known Pregnancy Status (${processed.knownPercentage}% of women)</div>
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
                        <th>Pregnancy Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add sorted pregnancy status
        processed.sortedStatus.forEach(([status, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>${status}</td>
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
    
    // Update note about pregnancy data
    updateNote: function(containerId, processed) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let noteHTML = '';
        
        if (processed.femaleCount === 0) {
            noteHTML = '<p style="color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> No female cases found in the dataset. Pregnancy analysis requires female cases.</p>';
        } else {
            noteHTML = `
                <h4>Note on Pregnancy Data</h4>
                <p>Analysis based on ${processed.femaleCount.toLocaleString()} women out of ${processed.totalRecords.toLocaleString()} total cases.</p>
            `;
        }
        
        container.innerHTML = noteHTML;
    },
    
    // Export data as CSV
    exportData: function(data, filename = 'adr_pregnancy_status.csv') {
        const processed = this.processData(data);
        
        // Create CSV content
        let csvContent = 'Pregnancy Status,Count,Percentage\n';
        
        processed.sortedStatus.forEach(([status, count]) => {
            const percentage = ((count / processed.total) * 100).toFixed(1);
            csvContent += `"${status}",${count},${percentage}%\n`;
        });
        
        // Add total
        csvContent += `\nTotal,${processed.total},100.0%\n`;
        csvContent += `\nTotal Women in Dataset,${processed.femaleCount},\n`;
        csvContent += `Total ADR Cases,${processed.totalRecords},\n`;
        
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