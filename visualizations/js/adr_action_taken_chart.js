/**
 * ADR Action Taken Chart Module
 * Displays action taken distribution with severity-based color coding
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.actionTaken = {
    _actionChartInstance: null,
    _availabilityChartInstance: null,
    _actionData: {},
    _dataStats: {},
    _showPercentage: false,
    _caseActionMap: {},
    
    // Action categories with medical severity-based colors
    actionColors: {
        'Drug stopped': '#dc3545',           // Red - severe action
        'Drug withdrawn': '#dc3545',         // Red - severe action (synonym)
        'Dose reduced': '#fd7e14',           // Orange - moderate action
        'Dose increased': '#ffc107',         // Yellow - adjustment
        'Drug not changed': '#28a745',       // Green - no change
        'Monitoring increased': '#17a2b8',   // Cyan - caution
        'Drug reintroduced': '#6f42c1',      // Purple - restart
        'Unknown': '#6c757d',                // Gray - uncertain
        'Not applicable': '#adb5bd',         // Light gray
        'Other': '#343a40'                   // Dark gray
    },
    
    processData: function(data) {
        const actions = {};
        let nullCount = 0;
        let casesWithActions = 0;
        let casesWithMultipleActions = 0;
        let totalActions = 0;
        this._caseActionMap = {};
        
        data.forEach((row, index) => {
            const actionValue = row['Action taken'];
            
            if (!actionValue || actionValue === '' || actionValue === null || actionValue === 'null') {
                nullCount++;
            } else {
                casesWithActions++;
                const caseActions = [];
                
                // Split multiple actions
                const actionList = actionValue.toString().split(/\r?\n|_x000D_/)
                    .map(a => a.trim())
                    .filter(a => a && a !== '_x000D_');
                
                if (actionList.length > 1) {
                    casesWithMultipleActions++;
                }
                
                actionList.forEach(action => {
                    const normalizedAction = this._normalizeAction(action);
                    if (normalizedAction) {
                        if (!actions[normalizedAction]) {
                            actions[normalizedAction] = {
                                count: 0,
                                color: this.actionColors[normalizedAction] || '#343a40',
                                cases: new Set()
                            };
                        }
                        actions[normalizedAction].count++;
                        actions[normalizedAction].cases.add(index);
                        totalActions++;
                        caseActions.push(normalizedAction);
                    }
                });
                
                if (caseActions.length > 0) {
                    this._caseActionMap[index] = caseActions;
                }
            }
        });
        
        // Calculate percentages
        Object.keys(actions).forEach(key => {
            actions[key].percentage = totalActions > 0 ? 
                ((actions[key].count / totalActions) * 100).toFixed(1) : 0;
            actions[key].caseCount = actions[key].cases.size;
        });
        
        this._actionData = actions;
        this._dataStats = {
            total: data.length,
            nullCount: nullCount,
            casesWithActions: casesWithActions,
            casesWithMultipleActions: casesWithMultipleActions,
            totalActions: totalActions,
            nullPercentage: ((nullCount / data.length) * 100).toFixed(1)
        };
        
        return {
            actions: actions,
            stats: this._dataStats
        };
    },
    
    _normalizeAction: function(action) {
        const lowerAction = action.toLowerCase().trim();
        
        // Map variations to standard categories
        if (lowerAction.includes('stopped') || lowerAction.includes('withdrawn')) {
            return 'Drug stopped';
        } else if (lowerAction.includes('dose') && lowerAction.includes('reduced')) {
            return 'Dose reduced';
        } else if (lowerAction.includes('dose') && lowerAction.includes('increased')) {
            return 'Dose increased';
        } else if (lowerAction.includes('not changed') || lowerAction.includes('no change')) {
            return 'Drug not changed';
        } else if (lowerAction.includes('monitoring')) {
            return 'Monitoring increased';
        } else if (lowerAction.includes('reintroduced')) {
            return 'Drug reintroduced';
        } else if (lowerAction.includes('unknown')) {
            return 'Unknown';
        } else if (lowerAction.includes('not applicable')) {
            return 'Not applicable';
        } else if (action.trim()) {
            return 'Other';
        }
        
        return null;
    },
    
    createCharts: function(containerIds, data, options = {}) {
        // Process data if provided
        if (data) {
            this.processData(data);
        }
        
        // Create action chart
        if (containerIds.action) {
            this._createActionChart(containerIds.action, options);
        }
        
        // Create availability chart if container provided
        if (containerIds.availability) {
            this._createAvailabilityChart(containerIds.availability);
        }
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats();
        }
        
        // Create data table if table container exists
        const tableContainer = document.getElementById('actionTableContainer');
        if (tableContainer && options.showTable !== false) {
            this.createDataTable(tableContainer);
        }
        
        // Show data info if container exists
        const infoContainer = document.getElementById('actionDataInfo');
        if (infoContainer && this._dataStats.casesWithMultipleActions > 0) {
            this._showDataInfo(infoContainer);
        }
        
        // Create legend if container exists
        const legendContainer = document.getElementById('actionLegend');
        if (legendContainer) {
            this._createLegend(legendContainer);
        }
        
        return {
            action: this._actionChartInstance,
            availability: this._availabilityChartInstance
        };
    },
    
    _createActionChart: function(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Action chart container not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Sort actions by count for horizontal bar chart
        const sortedActions = Object.entries(this._actionData)
            .sort((a, b) => b[1].count - a[1].count);
        
        const labels = sortedActions.map(([action, _]) => action);
        const data = this._showPercentage ? 
            sortedActions.map(([_, actionData]) => parseFloat(actionData.percentage)) :
            sortedActions.map(([_, actionData]) => actionData.count);
        const colors = sortedActions.map(([_, actionData]) => actionData.color);
        
        // Destroy existing chart
        if (this._actionChartInstance) {
            this._actionChartInstance.destroy();
        }
        
        this._actionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: this._showPercentage ? 'Percentage of Actions' : 'Number of Actions',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bar chart
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const action = context.label;
                                const actionInfo = this._actionData[action];
                                if (this._showPercentage) {
                                    return `${actionInfo.percentage}% of all actions`;
                                } else {
                                    return [
                                        `Count: ${actionInfo.count}`,
                                        `Percentage: ${actionInfo.percentage}%`,
                                        `Cases affected: ${actionInfo.caseCount}`
                                    ];
                                }
                            }
                        }
                    },
                    title: {
                        display: options.showTitle !== false,
                        text: options.title || 'ADR Cases by Action Taken',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: this._showPercentage ? 5 : 1,
                            precision: this._showPercentage ? 1 : 0
                        },
                        title: {
                            display: true,
                            text: this._showPercentage ? 'Percentage (%)' : 'Number of Actions'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Action Type'
                        }
                    }
                }
            }
        });
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
                labels: ['Cases with Actions', 'No Action Data'],
                datasets: [{
                    data: [this._dataStats.casesWithActions, this._dataStats.nullCount],
                    backgroundColor: ['#28a745', '#dc3545'],
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
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = ((value / this._dataStats.total) * 100).toFixed(1);
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
    
    _showDataInfo: function(container) {
        container.innerHTML = `
            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; color: #1565c0; padding: 1rem; border-radius: 5px;">
                <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                <strong>Data Note:</strong> ${this._dataStats.casesWithMultipleActions} cases have multiple actions recorded. 
                Each action is counted separately in the visualization.
            </div>
        `;
    },
    
    _createLegend: function(container) {
        const legendHtml = `
            <div style="background: #f8f9fa; border-radius: 5px; padding: 1rem;">
                <h4 style="margin-bottom: 0.5rem; color: #333;">Action Categories by Severity</h4>
                <div style="display: flex; flex-wrap: wrap;">
                    ${Object.entries(this.actionColors).map(([action, color]) => `
                        <div style="display: inline-flex; align-items: center; margin-right: 1.5rem; margin-bottom: 0.5rem;">
                            <div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 3px; margin-right: 0.5rem;"></div>
                            <span style="font-size: 0.9rem;">${action}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = legendHtml;
    },
    
    createSummaryStats: function() {
        const summaryContainer = document.getElementById('actionSummary');
        if (!summaryContainer) return;
        
        const mostCommon = Object.entries(this._actionData)
            .sort((a, b) => b[1].count - a[1].count)[0];
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${this._dataStats.total.toLocaleString()}</div>
                    <div class="card-label">Total Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataStats.totalActions.toLocaleString()}</div>
                    <div class="card-label">Total Actions</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataStats.casesWithActions.toLocaleString()}</div>
                    <div class="card-label">Cases with Actions</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${mostCommon ? mostCommon[0] : '-'}</div>
                    <div class="card-label">Most Common Action</div>
                </div>
            </div>
        `;
    },
    
    createDataTable: function(container) {
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Count</th>
                        <th>% of Actions</th>
                        <th>Cases Affected</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="font-style: italic; color: #666;">
                        <td>No Action Data</td>
                        <td>${this._dataStats.nullCount}</td>
                        <td>N/A</td>
                        <td>${this._dataStats.nullCount}</td>
                    </tr>
                    ${Object.entries(this._actionData)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([action, data]) => `
                            <tr>
                                <td>
                                    <span style="display: inline-block; width: 12px; height: 12px; background-color: ${data.color}; border-radius: 2px; margin-right: 0.5rem;"></span>
                                    ${action}
                                </td>
                                <td>${data.count}</td>
                                <td>${data.percentage}%</td>
                                <td>${data.caseCount}</td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHtml;
    },
    
    updateDisplay: function(showPercentage) {
        this._showPercentage = showPercentage;
        
        if (this._actionChartInstance) {
            const sortedActions = Object.entries(this._actionData)
                .sort((a, b) => b[1].count - a[1].count);
            
            const data = showPercentage ? 
                sortedActions.map(([_, actionData]) => parseFloat(actionData.percentage)) :
                sortedActions.map(([_, actionData]) => actionData.count);
            
            this._actionChartInstance.data.datasets[0].data = data;
            this._actionChartInstance.data.datasets[0].label = showPercentage ? 'Percentage of Actions' : 'Number of Actions';
            
            this._actionChartInstance.options.scales.x.title.text = showPercentage ? 'Percentage (%)' : 'Number of Actions';
            this._actionChartInstance.options.scales.x.ticks.stepSize = showPercentage ? 5 : 1;
            this._actionChartInstance.options.scales.x.ticks.precision = showPercentage ? 1 : 0;
            
            this._actionChartInstance.options.plugins.tooltip.callbacks.label = (context) => {
                const action = context.label;
                const actionInfo = this._actionData[action];
                if (showPercentage) {
                    return `${actionInfo.percentage}% of all actions`;
                } else {
                    return [
                        `Count: ${actionInfo.count}`,
                        `Percentage: ${actionInfo.percentage}%`,
                        `Cases affected: ${actionInfo.caseCount}`
                    ];
                }
            };
            
            this._actionChartInstance.update();
        }
    },
    
    getData: function() {
        return {
            actions: this._actionData,
            stats: this._dataStats
        };
    },
    
    getMostSevereActions: function() {
        const severeActions = ['Drug stopped', 'Drug withdrawn', 'Dose reduced'];
        return Object.entries(this._actionData)
            .filter(([action, _]) => severeActions.includes(action))
            .reduce((acc, [action, data]) => {
                acc[action] = data;
                return acc;
            }, {});
    },
    
    exportData: function(data, filename = 'adr_action_taken.csv') {
        const headers = ['Action', 'Count', 'Percentage of Actions', 'Cases Affected'];
        const rows = [
            ['No Action Data', this._dataStats.nullCount, 'N/A', this._dataStats.nullCount]
        ];
        
        Object.entries(this._actionData)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([action, actionData]) => {
                rows.push([action, actionData.count, actionData.percentage + '%', actionData.caseCount]);
            });
        
        // Add summary
        rows.push([]);
        rows.push(['Summary Statistics']);
        rows.push(['Total Cases', this._dataStats.total]);
        rows.push(['Cases with Actions', this._dataStats.casesWithActions]);
        rows.push(['Total Actions Recorded', this._dataStats.totalActions]);
        rows.push(['Cases with Multiple Actions', this._dataStats.casesWithMultipleActions]);
        rows.push(['Data Completeness', (100 - parseFloat(this._dataStats.nullPercentage)).toFixed(1) + '%']);
        
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
        if (this._actionChartInstance) {
            this._actionChartInstance.destroy();
            this._actionChartInstance = null;
        }
        if (this._availabilityChartInstance) {
            this._availabilityChartInstance.destroy();
            this._availabilityChartInstance = null;
        }
        this._actionData = {};
        this._dataStats = {};
        this._showPercentage = false;
        this._caseActionMap = {};
    }
};