/**
 * ADR Reporter State/Province Chart Module
 * Displays reporter state/province distribution with data quality indicators
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.reporterStateProvince = {
    _availabilityChartInstance: null,
    _stateChartInstance: null,
    _stateData: [],
    _dataQualityStats: {},
    _showPercentage: false,
    _placeholderCount: 0,
    
    // Clean state/province data by removing carriage return characters and filtering placeholders
    _cleanStateName: function(state) {
        if (!state || state === null || state === undefined) return null;
        
        // Convert to string and trim
        let cleaned = String(state).trim();
        
        // Remove carriage return characters
        cleaned = cleaned.replace(/_x000D_/g, '').replace(/\r/g, '').replace(/\n/g, ' ');
        
        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // Filter out empty or invalid values
        if (cleaned === '' || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'undefined') {
            return null;
        }
        
        // Check for placeholder text
        if (cleaned.toLowerCase() === "reporter's state or province" || 
            cleaned.toLowerCase() === "state or province") {
            return 'PLACEHOLDER';
        }
        
        return cleaned;
    },
    
    processData: function(data) {
        // Reset data
        this._stateData = [];
        this._placeholderCount = 0;
        const totalCases = data.length;
        
        // Count states/provinces
        const stateCounts = {};
        let casesWithState = 0;
        let casesWithoutState = 0;
        
        data.forEach(row => {
            const rawState = row['Reporter state or province'];
            const cleanedState = this._cleanStateName(rawState);
            
            if (cleanedState === 'PLACEHOLDER') {
                this._placeholderCount++;
                casesWithoutState++;
            } else if (cleanedState) {
                casesWithState++;
                stateCounts[cleanedState] = (stateCounts[cleanedState] || 0) + 1;
            } else {
                casesWithoutState++;
            }
        });
        
        // Convert to array and sort
        this._stateData = Object.entries(stateCounts)
            .map(([state, count]) => ({
                state: state,
                count: count,
                percentageOfTotal: (count / totalCases) * 100,
                percentageOfAvailable: (count / casesWithState) * 100
            }))
            .sort((a, b) => b.count - a.count);
        
        // Calculate statistics
        this._dataQualityStats = {
            total: totalCases,
            withState: casesWithState,
            withoutState: casesWithoutState,
            missingPercentage: (casesWithoutState / totalCases) * 100,
            uniqueStates: this._stateData.length,
            placeholderCount: this._placeholderCount
        };
        
        return {
            states: this._stateData,
            dataQuality: this._dataQualityStats
        };
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
        
        if (containerIds.state) {
            this._createStateChart(containerIds.state, options);
        }
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats();
        }
        
        // Create data table if table container exists
        const tableContainer = document.getElementById('stateTableContainer');
        if (tableContainer && options.showTable !== false) {
            this.createDataTable(tableContainer);
        }
        
        // Show data quality warning if container exists
        const warningContainer = document.getElementById('stateDataWarning');
        if (warningContainer) {
            this._showDataQualityWarning(warningContainer);
        }
        
        // Show placeholder warning if container exists
        const placeholderContainer = document.getElementById('statePlaceholderWarning');
        if (placeholderContainer && this._placeholderCount > 0) {
            this._showPlaceholderWarning(placeholderContainer);
        }
        
        // Show data note if container exists
        const noteContainer = document.getElementById('stateDataNote');
        if (noteContainer) {
            this._showDataNote(noteContainer);
        }
        
        return {
            availability: this._availabilityChartInstance,
            state: this._stateChartInstance
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
        
        const data = {
            labels: ['With State/Province Data', 'Without State/Province Data'],
            datasets: [{
                data: [this._dataQualityStats.withState, this._dataQualityStats.withoutState],
                backgroundColor: ['#27ae60', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
        
        this._availabilityChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
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
    
    _createStateChart: function(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('State chart container not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this._stateChartInstance) {
            this._stateChartInstance.destroy();
        }
        
        // Limit to top states/provinces for better visibility
        const maxStates = options.maxStates || 20;
        const chartData = this._stateData.slice(0, maxStates);
        
        if (chartData.length === 0) {
            // No data available
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.fillText('No state/province data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const data = {
            labels: chartData.map(d => d.state),
            datasets: [{
                label: this._showPercentage ? 'Percentage of Available Data' : 'Number of Cases',
                data: chartData.map(d => this._showPercentage ? d.percentageOfAvailable : d.count),
                backgroundColor: '#9b59b6',
                borderColor: '#8e44ad',
                borderWidth: 1
            }]
        };
        
        this._stateChartInstance = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const item = chartData[context.dataIndex];
                                if (this._showPercentage) {
                                    return `${item.percentageOfAvailable.toFixed(1)}% of available data (${item.count.toLocaleString()} cases)`;
                                }
                                return `${item.count.toLocaleString()} cases (${item.percentageOfAvailable.toFixed(1)}% of available)`;
                            }
                        }
                    },
                    title: {
                        display: options.showTitle !== false,
                        text: options.title || `Top ${maxStates} States/Provinces (Available Data Only)`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: this._showPercentage ? 'Percentage of Available Data (%)' : 'Number of Cases'
                        },
                        ticks: {
                            precision: this._showPercentage ? 1 : 0
                        }
                    },
                    y: {
                        ticks: {
                            autoSkip: false
                        }
                    }
                }
            }
        });
    },
    
    _showDataQualityWarning: function(container) {
        container.innerHTML = `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; font-weight: 500;">
                <i class="fas fa-exclamation-triangle" style="font-size: 20px; color: #f39c12;"></i>
                <span>Warning: ${this._dataQualityStats.missingPercentage.toFixed(1)}% of records (${this._dataQualityStats.withoutState.toLocaleString()} out of ${this._dataQualityStats.total.toLocaleString()}) do not have valid state/province data. 
                The analysis is based on the ${this._dataQualityStats.withState.toLocaleString()} records with available state/province information.</span>
            </div>
        `;
    },
    
    _showPlaceholderWarning: function(container) {
        container.innerHTML = `
            <div style="background-color: #fce4ec; border-left: 4px solid #e91e63; padding: 10px 15px; margin: 10px 0; font-size: 14px; color: #880e4f;">
                <i class="fas fa-info-circle"></i> 
                Note: ${this._placeholderCount.toLocaleString()} records contained placeholder text "Reporter's State or Province" which has been excluded from the analysis as invalid data.
            </div>
        `;
    },
    
    _showDataNote: function(container) {
        container.innerHTML = `
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 10px 15px; margin: 15px 0; font-size: 14px; color: #1565C0;">
                <i class="fas fa-info-circle"></i> 
                <strong>Note:</strong> State/Province data may contain formatting issues (e.g., "_x000D_" characters) which have been cleaned for display. 
                Placeholder text like "Reporter's State or Province" and empty entries have been excluded from the analysis.
            </div>
        `;
    },
    
    createSummaryStats: function() {
        const summaryContainer = document.getElementById('stateSummary');
        if (!summaryContainer) return;
        
        const topState = this._stateData[0];
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.total.toLocaleString()}</div>
                    <div class="card-label">Total Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.withState.toLocaleString()}</div>
                    <div class="card-label">With State/Province</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.uniqueStates.toLocaleString()}</div>
                    <div class="card-label">Unique Locations</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${topState ? topState.state : '-'}</div>
                    <div class="card-label">Top State/Province</div>
                </div>
            </div>
        `;
    },
    
    createDataTable: function(container) {
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>State/Province</th>
                        <th>Count</th>
                        <th>% of Total</th>
                        <th>% of Available</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._stateData.map(item => `
                        <tr>
                            <td>${item.state}</td>
                            <td>${item.count.toLocaleString()}</td>
                            <td>${item.percentageOfTotal.toFixed(1)}%</td>
                            <td>${item.percentageOfAvailable.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHtml;
    },
    
    updateDisplay: function(showPercentage) {
        this._showPercentage = showPercentage;
        
        if (this._stateChartInstance) {
            const maxStates = 20;
            const chartData = this._stateData.slice(0, maxStates);
            
            const newData = chartData.map(d => this._showPercentage ? d.percentageOfAvailable : d.count);
            
            this._stateChartInstance.data.datasets[0].data = newData;
            this._stateChartInstance.data.datasets[0].label = this._showPercentage ? 'Percentage of Available Data' : 'Number of Cases';
            
            this._stateChartInstance.options.scales.x.title.text = this._showPercentage ? 'Percentage of Available Data (%)' : 'Number of Cases';
            this._stateChartInstance.options.scales.x.ticks.precision = this._showPercentage ? 1 : 0;
            
            this._stateChartInstance.update();
        }
    },
    
    getData: function() {
        return {
            states: this._stateData,
            dataQuality: this._dataQualityStats
        };
    },
    
    getTopStates: function(limit = 10) {
        return this._stateData.slice(0, limit).map(d => ({
            name: d.state,
            count: d.count,
            percentageOfTotal: d.percentageOfTotal,
            percentageOfAvailable: d.percentageOfAvailable
        }));
    },
    
    exportData: function(filename = 'adr_reporter_states_provinces.csv') {
        let csv = 'State/Province,Count,Percentage of Total,Percentage of Available\n';
        
        this._stateData.forEach(item => {
            csv += `"${item.state}",${item.count},${item.percentageOfTotal.toFixed(1)}%,${item.percentageOfAvailable.toFixed(1)}%\n`;
        });
        
        // Add summary
        csv += '\n\nSummary Statistics\n';
        csv += `Total Cases,${this._dataQualityStats.total}\n`;
        csv += `Cases with State/Province,${this._dataQualityStats.withState}\n`;
        csv += `Cases without State/Province,${this._dataQualityStats.withoutState}\n`;
        csv += `Placeholder Records,${this._dataQualityStats.placeholderCount}\n`;
        csv += `Data Completeness,${(100 - this._dataQualityStats.missingPercentage).toFixed(1)}%\n`;
        csv += `Unique States/Provinces,${this._dataQualityStats.uniqueStates}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    destroy: function() {
        if (this._availabilityChartInstance) {
            this._availabilityChartInstance.destroy();
            this._availabilityChartInstance = null;
        }
        if (this._stateChartInstance) {
            this._stateChartInstance.destroy();
            this._stateChartInstance = null;
        }
        this._stateData = [];
        this._dataQualityStats = {};
        this._showPercentage = false;
        this._placeholderCount = 0;
    }
};