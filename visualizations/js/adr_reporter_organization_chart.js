/**
 * ADR Reporter Organization Chart Module
 * Displays reporter organization distribution with data quality indicators
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.reporterOrganization = {
    _availabilityChartInstance: null,
    _organizationChartInstance: null,
    _organizationData: {},
    _dataQualityStats: {},
    
    processData: function(data) {
        const organizations = {};
        let missingCount = 0;
        let totalCount = data.length;
        
        data.forEach(row => {
            const org = row['Organisation (reporter)'];
            
            if (!org || org === '' || org === null || org === 'null') {
                missingCount++;
            } else {
                // Clean the organization name
                const cleanOrg = org.toString().trim().replace(/_x000D_/g, '');
                
                if (cleanOrg) {
                    if (!organizations[cleanOrg]) {
                        organizations[cleanOrg] = { count: 0, color: this._getColorForOrg(cleanOrg) };
                    }
                    organizations[cleanOrg].count++;
                } else {
                    missingCount++;
                }
            }
        });
        
        // Calculate percentages
        const availableCount = totalCount - missingCount;
        Object.keys(organizations).forEach(key => {
            organizations[key].percentageOfTotal = totalCount > 0 ? 
                ((organizations[key].count / totalCount) * 100).toFixed(1) : 0;
            organizations[key].percentageOfAvailable = availableCount > 0 ? 
                ((organizations[key].count / availableCount) * 100).toFixed(1) : 0;
        });
        
        this._organizationData = organizations;
        this._dataQualityStats = {
            total: totalCount,
            missing: missingCount,
            available: availableCount,
            missingPercentage: ((missingCount / totalCount) * 100).toFixed(1)
        };
        
        return {
            organizations: organizations,
            dataQuality: this._dataQualityStats
        };
    },
    
    _getColorForOrg: function(orgName) {
        // Assign colors based on organization type if identifiable
        const lowerOrg = orgName.toLowerCase();
        if (lowerOrg.includes('hospital') || lowerOrg.includes('clinic')) {
            return '#2196F3'; // Blue for healthcare facilities
        } else if (lowerOrg.includes('pharma')) {
            return '#4CAF50'; // Green for pharmaceutical
        } else if (lowerOrg.includes('umc')) {
            return '#FF9800'; // Orange for monitoring centers
        } else {
            return '#9C27B0'; // Purple for others
        }
    },
    
    createCharts: function(containerIds, data, options = {}) {
        // Process data if provided
        if (data) {
            this.processData(data);
        }
        
        // Create both charts
        if (containerIds.availability) {
            this._createAvailabilityChart(containerIds.availability);
        }
        
        if (containerIds.organization) {
            this._createOrganizationChart(containerIds.organization, options);
        }
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats(data);
        }
        
        // Create data table if table container exists
        const tableContainer = document.getElementById('organizationTableContainer');
        if (tableContainer && options.showTable !== false) {
            this.createDataTable(tableContainer);
        }
        
        // Show data quality warning if container exists
        const warningContainer = document.getElementById('organizationDataWarning');
        if (warningContainer) {
            this._showDataQualityWarning(warningContainer);
        }
        
        return {
            availability: this._availabilityChartInstance,
            organization: this._organizationChartInstance
        };
    },
    
    _createAvailabilityChart: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Availability chart container not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this._availabilityChartInstance) {
            this._availabilityChartInstance.destroy();
        }
        
        this._availabilityChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Data Available', 'No Organization Data'],
                datasets: [{
                    data: [this._dataQualityStats.available, this._dataQualityStats.missing],
                    backgroundColor: ['#4CAF50', '#f44336'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = ((value / this._dataQualityStats.total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Data Availability',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    },
    
    _createOrganizationChart: function(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Organization chart container not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        const labels = Object.keys(this._organizationData);
        const data = labels.map(label => this._organizationData[label].count);
        const colors = labels.map(label => this._organizationData[label].color);
        
        // Destroy existing chart
        if (this._organizationChartInstance) {
            this._organizationChartInstance.destroy();
        }
        
        if (labels.length === 0) {
            // No data available
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.fillText('No organization data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Sort and limit to top organizations if specified
        let sortedData = labels.map((label, index) => ({
            label: label,
            count: data[index],
            color: colors[index],
            percentageOfTotal: this._organizationData[label].percentageOfTotal,
            percentageOfAvailable: this._organizationData[label].percentageOfAvailable
        })).sort((a, b) => b.count - a.count);
        
        if (options.maxItems) {
            sortedData = sortedData.slice(0, options.maxItems);
        }
        
        this._organizationChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(d => d.label),
                datasets: [{
                    label: 'Number of Reports',
                    data: sortedData.map(d => d.count),
                    backgroundColor: sortedData.map(d => d.color),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed.y;
                                const org = this._organizationData[label];
                                return [
                                    `Count: ${value}`,
                                    `% of Total: ${org.percentageOfTotal}%`,
                                    `% of Available: ${org.percentageOfAvailable}%`
                                ];
                            }
                        }
                    },
                    title: {
                        display: options.showTitle !== false,
                        text: options.title || 'Organization Distribution (Available Data Only)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Number of Reports'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Organization'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },
    
    _showDataQualityWarning: function(container) {
        container.innerHTML = `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 1rem; border-radius: 5px; display: flex; align-items: center; gap: 1rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
                <div>
                    <strong>Data Quality Notice:</strong> ${this._dataQualityStats.missingPercentage}% of records do not have organization information. 
                    The visualizations show only the available data.
                </div>
            </div>
        `;
    },
    
    createSummaryStats: function(data) {
        const summaryContainer = document.getElementById('organizationSummary');
        if (!summaryContainer) return;
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.total.toLocaleString()}</div>
                    <div class="card-label">Total Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.available.toLocaleString()}</div>
                    <div class="card-label">With Organization Data</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.missing.toLocaleString()}</div>
                    <div class="card-label">Missing Organization</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${Object.keys(this._organizationData).length}</div>
                    <div class="card-label">Unique Organizations</div>
                </div>
            </div>
        `;
    },
    
    createDataTable: function(container) {
        // Sort organizations by count
        const sortedOrgs = Object.entries(this._organizationData)
            .sort((a, b) => b[1].count - a[1].count);
        
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Organization</th>
                        <th>Count</th>
                        <th>% of Total</th>
                        <th>% of Available</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="font-style: italic; color: #666;">
                        <td>No Organization Data</td>
                        <td>${this._dataQualityStats.missing}</td>
                        <td>${this._dataQualityStats.missingPercentage}%</td>
                        <td>N/A</td>
                    </tr>
                    ${sortedOrgs.map(([org, data]) => `
                        <tr>
                            <td>${org}</td>
                            <td>${data.count}</td>
                            <td>${data.percentageOfTotal}%</td>
                            <td>${data.percentageOfAvailable}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHtml;
    },
    
    getData: function() {
        return {
            organizations: this._organizationData,
            dataQuality: this._dataQualityStats
        };
    },
    
    getTopOrganizations: function(limit = 10) {
        return Object.entries(this._organizationData)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([name, data]) => ({
                name: name,
                count: data.count,
                percentageOfTotal: data.percentageOfTotal,
                percentageOfAvailable: data.percentageOfAvailable
            }));
    },
    
    exportData: function(data, filename = 'adr_reporter_organization.csv') {
        const headers = ['Organization', 'Count', 'Percentage of Total', 'Percentage of Available'];
        const rows = [
            ['No Organization Data', this._dataQualityStats.missing, this._dataQualityStats.missingPercentage + '%', 'N/A']
        ];
        
        Object.entries(this._organizationData)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([org, orgData]) => {
                rows.push([org, orgData.count, orgData.percentageOfTotal + '%', orgData.percentageOfAvailable + '%']);
            });
        
        // Add summary
        rows.push([]);
        rows.push(['Summary Statistics']);
        rows.push(['Total Cases', this._dataQualityStats.total]);
        rows.push(['Cases with Organization', this._dataQualityStats.available]);
        rows.push(['Missing Organization', this._dataQualityStats.missing]);
        rows.push(['Data Completeness', (100 - parseFloat(this._dataQualityStats.missingPercentage)).toFixed(1) + '%']);
        
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    destroy: function() {
        if (this._availabilityChartInstance) {
            this._availabilityChartInstance.destroy();
            this._availabilityChartInstance = null;
        }
        if (this._organizationChartInstance) {
            this._organizationChartInstance.destroy();
            this._organizationChartInstance = null;
        }
        this._organizationData = {};
        this._dataQualityStats = {};
    }
};