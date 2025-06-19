// ADR Age Group Chart Module
window.ADRCharts = window.ADRCharts || {};

ADRCharts.ageGroup = {
    _chartInstance: null,
    
    // Define age groups with colors
    ageGroups: {
        'Neonate (≤ 28 days)': {
            min: 0,
            max: 28,
            unit: 'days',
            color: {
                background: 'rgba(255, 99, 132, 0.8)',
                border: 'rgba(255, 99, 132, 1)'
            }
        },
        'Infant (29 days - 1 year)': {
            min: 29,
            max: 365,
            unit: 'days',
            color: {
                background: 'rgba(255, 159, 64, 0.8)',
                border: 'rgba(255, 159, 64, 1)'
            }
        },
        'Child (1-12 years)': {
            min: 1,
            max: 12,
            unit: 'years',
            color: {
                background: 'rgba(255, 205, 86, 0.8)',
                border: 'rgba(255, 205, 86, 1)'
            }
        },
        'Adolescent (13-17 years)': {
            min: 13,
            max: 17,
            unit: 'years',
            color: {
                background: 'rgba(75, 192, 192, 0.8)',
                border: 'rgba(75, 192, 192, 1)'
            }
        },
        'Adult (18-60 years)': {
            min: 18,
            max: 60,
            unit: 'years',
            color: {
                background: 'rgba(54, 162, 235, 0.8)',
                border: 'rgba(54, 162, 235, 1)'
            }
        },
        'Elderly (> 60 years)': {
            min: 60,
            max: 999,
            unit: 'years',
            color: {
                background: 'rgba(153, 102, 255, 0.8)',
                border: 'rgba(153, 102, 255, 1)'
            }
        }
    },
    
    // Calculate age in years from days
    ageInYears: function(ageInDays) {
        return ageInDays / 365.25;
    },
    
    // Determine age group based on age
    getAgeGroup: function(ageInDays) {
        const ageYears = this.ageInYears(ageInDays);
        
        if (ageInDays <= 28) return 'Neonate (≤ 28 days)';
        if (ageInDays <= 365) return 'Infant (29 days - 1 year)';
        if (ageYears <= 12) return 'Child (1-12 years)';
        if (ageYears <= 17) return 'Adolescent (13-17 years)';
        if (ageYears <= 60) return 'Adult (18-60 years)';
        return 'Elderly (> 60 years)';
    },
    
    // Parse age from "Age at onset of reaction" field
    parseAgeAtOnset: function(ageString) {
        if (!ageString) return null;
        
        // Match patterns like "44 Year", "6 Month", "10 Day", etc.
        const match = ageString.match(/(\d+\.?\d*)\s*(Year|Month|Week|Day|Hour)/i);
        if (!match) return null;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        // Convert to days
        let ageInDays;
        switch(unit) {
            case 'year':
                ageInDays = value * 365.25;
                break;
            case 'month':
                ageInDays = value * 30.44; // Average month length
                break;
            case 'week':
                ageInDays = value * 7;
                break;
            case 'day':
                ageInDays = value;
                break;
            case 'hour':
                ageInDays = value / 24;
                break;
            default:
                return null;
        }
        
        return ageInDays;
    },
    
    // Calculate age from birth date and initial received date
    calculateAge: function(birthDate, receivedDate) {
        if (!birthDate || !receivedDate) return null;
        
        const diffTime = receivedDate - birthDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        return diffDays > 0 ? diffDays : null;
    },
    
    // Process data for age groups
    processData: function(data) {
        // Add age calculations to each row if not already present
        data.forEach(row => {
            if (!row.hasOwnProperty('_calculatedAgeInDays')) {
                // Parse Date of birth
                let birthDate = null;
                if (row['Date of birth']) {
                    const dobValue = row['Date of birth'];
                    
                    // Handle YYYYMMDD format as number
                    if (typeof dobValue === 'number' || /^\d{8}$/.test(dobValue.toString())) {
                        const dateStr = dobValue.toString();
                        const year = parseInt(dateStr.substring(0, 4));
                        const month = parseInt(dateStr.substring(4, 6));
                        const day = parseInt(dateStr.substring(6, 8));
                        
                        if (year >= 1900 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            birthDate = new Date(year, month - 1, day);
                        }
                    }
                }
                
                // Calculate age based on birth date and initial received date
                let ageInDays = null;
                if (birthDate && row._parsedDate) {
                    ageInDays = this.calculateAge(birthDate, row._parsedDate);
                }
                
                // If no age calculated from dates, try "Age at onset of reaction"
                if (!ageInDays && row['Age at onset of reaction']) {
                    ageInDays = this.parseAgeAtOnset(row['Age at onset of reaction']);
                }
                
                // Store calculated age and group
                row._calculatedAgeInDays = ageInDays;
                row._ageGroup = ageInDays ? this.getAgeGroup(ageInDays) : 'Unknown';
            }
        });
        
        // Count age groups
        const ageGroupCounts = {};
        
        // Initialize all age groups with 0
        Object.keys(this.ageGroups).forEach(group => {
            ageGroupCounts[group] = 0;
        });
        ageGroupCounts['Unknown'] = 0;
        
        // Count cases in each age group
        data.forEach(row => {
            const group = row._ageGroup || 'Unknown';
            ageGroupCounts[group] = (ageGroupCounts[group] || 0) + 1;
        });
        
        // Calculate total
        const total = Object.values(ageGroupCounts).reduce((a, b) => a + b, 0);
        
        // Calculate data quality metrics
        const casesWithAge = data.filter(row => row._calculatedAgeInDays !== null).length;
        const completeness = data.length > 0 ? ((casesWithAge / data.length) * 100).toFixed(1) : 0;
        
        // Calculate average age
        const agesInYears = data
            .filter(row => row._calculatedAgeInDays !== null)
            .map(row => this.ageInYears(row._calculatedAgeInDays));
        
        const avgAge = agesInYears.length > 0 
            ? (agesInYears.reduce((a, b) => a + b, 0) / agesInYears.length).toFixed(1)
            : null;
        
        return {
            ageGroupCounts,
            total,
            casesWithAge,
            completeness,
            avgAge,
            totalRecords: data.length
        };
    },
    
    // Create the chart
    createChart: function(containerId, data, options = {}) {
        const processed = this.processData(data);
        
        // Prepare data for chart
        const labels = [];
        const chartData = [];
        const backgroundColors = [];
        const borderColors = [];
        
        // Add age groups in order
        Object.keys(this.ageGroups).forEach(group => {
            if (processed.ageGroupCounts[group] > 0) {
                labels.push(group);
                chartData.push(processed.ageGroupCounts[group]);
                backgroundColors.push(this.ageGroups[group].color.background);
                borderColors.push(this.ageGroups[group].color.border);
            }
        });
        
        // Add Unknown if present
        if (processed.ageGroupCounts['Unknown'] > 0) {
            labels.push('Unknown');
            chartData.push(processed.ageGroupCounts['Unknown']);
            backgroundColors.push('rgba(189, 195, 199, 0.8)');
            borderColors.push('rgba(189, 195, 199, 1)');
        }
        
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
            <div class="stat-card">
                <div class="stat-value">${processed.casesWithAge.toLocaleString()}</div>
                <div class="stat-label">Cases with Age Data</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${processed.completeness}%</div>
                <div class="stat-label">Age Data Completeness</div>
            </div>
            ${processed.avgAge ? `
            <div class="stat-card">
                <div class="stat-value">${processed.avgAge} years</div>
                <div class="stat-label">Average Age</div>
            </div>
            ` : ''}
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
                        <th>Age Group</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add age groups in order
        Object.keys(this.ageGroups).forEach(group => {
            if (processed.ageGroupCounts[group] > 0) {
                const percentage = ((processed.ageGroupCounts[group] / processed.total) * 100).toFixed(1);
                tableHTML += `
                    <tr>
                        <td>${group}</td>
                        <td style="text-align: right;">${processed.ageGroupCounts[group].toLocaleString()}</td>
                        <td style="text-align: right;">${percentage}%</td>
                    </tr>
                `;
            }
        });
        
        // Add Unknown if present
        if (processed.ageGroupCounts['Unknown'] > 0) {
            const percentage = ((processed.ageGroupCounts['Unknown'] / processed.total) * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>Unknown</td>
                    <td style="text-align: right;">${processed.ageGroupCounts['Unknown'].toLocaleString()}</td>
                    <td style="text-align: right;">${percentage}%</td>
                </tr>
            `;
        }
        
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
    
    // Destroy the chart instance
    destroy: function() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
    }
};