/**
 * ADR Seriousness Outcomes Chart Module
 * Displays analysis of specific seriousness outcomes with dual views:
 * - Outcomes by type (horizontal bar chart)
 * - Combination patterns (showing how outcomes occur together)
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.seriousnessOutcomes = {
    _chartInstance: null,
    _outcomesData: {},
    _combinationsData: [],
    _currentView: 'outcomes',
    _filteredData: [],
    
    // Define seriousness outcome categories with colors and order
    _outcomeCategories: {
        'Results in death': { color: '#e74c3c', order: 1 },
        'Life threatening': { color: '#e67e22', order: 2 },
        'Caused / prolonged hospitalisation': { color: '#f39c12', order: 3 },
        'Disabling / incapacitating': { color: '#9b59b6', order: 4 },
        'Congenital anomaly / birth defect': { color: '#3498db', order: 5 },
        'Other medically important condition': { color: '#16a085', order: 6 },
        'Unknown / Not Serious': { color: '#95a5a6', order: 7 }
    },
    
    // Clean seriousness value from Excel formatting issues
    _cleanSeriousnessValue: function(value) {
        if (!value || value === null || value === undefined) {
            return null;
        }
        
        // Convert to string and clean
        let cleaned = value.toString()
            .replace(/_x000D_/g, '')
            .replace(/\r/g, '')
            .replace(/\n+/g, ' ')
            .trim();
        
        // Check if it's just whitespace or empty
        if (cleaned === '' || cleaned === '_' || cleaned.length === 0) {
            return null;
        }
        
        // Remove duplicate phrases (e.g., "Results in deathResults in death")
        cleaned = cleaned.replace(/Results in death\s*Results in death/gi, 'Results in death');
        
        return cleaned;
    },
    
    // Parse seriousness outcomes from a cell value
    _parseSeriousnessOutcomes: function(value) {
        const cleanedValue = this._cleanSeriousnessValue(value);
        if (!cleanedValue) return [];
        
        const outcomes = [];
        
        // Check for each known outcome category
        for (const category in this._outcomeCategories) {
            if (category !== 'Unknown / Not Serious' && 
                cleanedValue.toLowerCase().includes(category.toLowerCase())) {
                outcomes.push(category);
            }
        }
        
        return outcomes;
    },
    
    processData: function(data) {
        this._filteredData = data;
        
        // Reset data
        this._outcomesData = {};
        this._combinationsData = [];
        const combinationsMap = {};
        
        // Initialize outcome counts
        for (const category in this._outcomeCategories) {
            this._outcomesData[category] = 0;
        }
        
        // Process each record
        data.forEach(row => {
            const outcomes = this._parseSeriousnessOutcomes(row['Seriousness']);
            
            if (outcomes.length > 0) {
                // Count individual outcomes
                outcomes.forEach(outcome => {
                    this._outcomesData[outcome]++;
                });
                
                // Track combinations
                const combinationKey = outcomes.sort().join(' + ');
                if (combinationsMap[combinationKey]) {
                    combinationsMap[combinationKey]++;
                } else {
                    combinationsMap[combinationKey] = 1;
                }
            } else {
                // Count cases with no seriousness outcomes as Unknown
                this._outcomesData['Unknown / Not Serious']++;
                
                // Track in combinations as well
                if (combinationsMap['Unknown / Not Serious']) {
                    combinationsMap['Unknown / Not Serious']++;
                } else {
                    combinationsMap['Unknown / Not Serious'] = 1;
                }
            }
        });
        
        // Convert combinations map to array and sort by count
        this._combinationsData = Object.entries(combinationsMap)
            .map(([combination, count]) => ({ combination, count }))
            .sort((a, b) => b.count - a.count);
        
        return {
            outcomes: this._outcomesData,
            combinations: this._combinationsData,
            total: data.length,
            withSpecificOutcomes: data.filter(row => 
                this._parseSeriousnessOutcomes(row['Seriousness']).length > 0
            ).length
        };
    },
    
    createChart: function(containerId, data, options = {}) {
        // Process data if provided
        if (data) {
            this.processData(data);
        }
        
        // Set view type
        this._currentView = options.view || 'outcomes';
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Chart container not found:', containerId);
            return;
        }
        
        if (this._currentView === 'outcomes') {
            this._createOutcomesChart(containerId);
        } else {
            this._createCombinationsView(containerId);
        }
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats();
        }
        
        return this._chartInstance;
    },
    
    _createOutcomesChart: function(containerId) {
        const container = document.getElementById(containerId);
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this._chartInstance) {
            this._chartInstance.destroy();
        }
        
        // Prepare data for chart
        const sortedOutcomes = Object.entries(this._outcomesData)
            .filter(([outcome, count]) => count > 0)
            .sort((a, b) => this._outcomeCategories[a[0]].order - this._outcomeCategories[b[0]].order);
        
        const labels = sortedOutcomes.map(([outcome, ]) => outcome);
        const data = sortedOutcomes.map(([, count]) => count);
        const colors = sortedOutcomes.map(([outcome, ]) => this._outcomeCategories[outcome].color);
        
        const totalCases = this._filteredData.length;
        
        // Chart configuration
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Total ADR Cases: ${totalCases.toLocaleString()}`,
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
                            label: (context) => {
                                const value = context.raw;
                                const percentage = ((value / totalCases) * 100).toFixed(1);
                                return [
                                    `Cases: ${value.toLocaleString()}`,
                                    `${percentage}% of all cases`
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
                            autoSkip: false,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        };
        
        this._chartInstance = new Chart(ctx, config);
    },
    
    _createCombinationsView: function(containerId) {
        const container = document.getElementById(containerId);
        
        // Clear any existing chart
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
        
        container.innerHTML = '';
        
        // Add summary
        const summary = document.createElement('div');
        summary.className = 'info-section';
        summary.style.cssText = 'margin-bottom: 2rem; padding: 1rem; background: #f0f4f8; border-radius: 8px;';
        summary.innerHTML = `
            <h4>Combination Patterns</h4>
            <p>This shows how seriousness outcomes occur together. ${this._combinationsData.length} unique combinations found.</p>
        `;
        container.appendChild(summary);
        
        // Create combinations list
        const combinationsDiv = document.createElement('div');
        combinationsDiv.style.cssText = 'max-height: 400px; overflow-y: auto; margin-top: 1rem;';
        
        this._combinationsData.forEach(({ combination, count }) => {
            const row = document.createElement('div');
            row.style.cssText = 'background: #f8f9fa; padding: 0.5rem; margin: 0.25rem 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;';
            row.innerHTML = `
                <div style="flex: 1; font-size: 0.9rem;">${combination}</div>
                <div style="font-weight: bold; color: #2a5298; margin-left: 1rem;">${count} case${count > 1 ? 's' : ''}</div>
            `;
            combinationsDiv.appendChild(row);
        });
        
        container.appendChild(combinationsDiv);
    },
    
    createSummaryStats: function() {
        const summaryContainer = document.getElementById('seriousnessOutcomesSummary');
        if (!summaryContainer) return;
        
        const totalCases = this._filteredData.length;
        const withSpecificOutcomes = this._filteredData.filter(row => 
            this._parseSeriousnessOutcomes(row['Seriousness']).length > 0
        ).length;
        const withSpecificPercentage = totalCases > 0 ? 
            ((withSpecificOutcomes / totalCases) * 100).toFixed(1) : '0.0';
        
        // Most common outcome
        const mostCommon = Object.entries(this._outcomesData)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])[0];
        
        // Cases with multiple outcomes
        const multipleOutcomes = this._combinationsData
            .filter(({ combination }) => combination.includes('+'))
            .reduce((sum, { count }) => sum + count, 0);
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${totalCases.toLocaleString()}</div>
                    <div class="card-label">Total ADR Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${withSpecificOutcomes.toLocaleString()}</div>
                    <div class="card-label">With Specific Outcomes (${withSpecificPercentage}%)</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${mostCommon ? mostCommon[0] : 'N/A'}</div>
                    <div class="card-label">Most Common Outcome</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${multipleOutcomes.toLocaleString()}</div>
                    <div class="card-label">Cases with Multiple Outcomes</div>
                </div>
            </div>
        `;
    },
    
    switchView: function(view) {
        this._currentView = view;
        
        // Find the chart container
        const container = document.querySelector('[id$="Chart"]:not([style*="display: none"])');
        if (container && container.id) {
            this.createChart(container.id, null, { view: view });
        }
    },
    
    getData: function() {
        return {
            outcomes: this._outcomesData,
            combinations: this._combinationsData,
            total: this._filteredData.length,
            withSpecificOutcomes: this._filteredData.filter(row => 
                this._parseSeriousnessOutcomes(row['Seriousness']).length > 0
            ).length
        };
    },
    
    exportData: function(filename = 'adr_seriousness_outcomes.csv') {
        let csv = '';
        
        if (this._currentView === 'outcomes') {
            // Export outcomes data
            csv = 'Seriousness Outcome,Count,Percentage of All Cases\n';
            
            const totalCases = this._filteredData.length;
            
            Object.entries(this._outcomesData)
                .filter(([, count]) => count > 0)
                .sort((a, b) => this._outcomeCategories[a[0]].order - this._outcomeCategories[b[0]].order)
                .forEach(([outcome, count]) => {
                    const percentage = totalCases > 0 ? 
                        ((count / totalCases) * 100).toFixed(1) : '0.0';
                    csv += `"${outcome}",${count},${percentage}%\n`;
                });
                
            csv += `\nTotal ADR Cases,${totalCases},\n`;
        } else {
            // Export combinations data
            csv = 'Outcome Combination,Count\n';
            
            this._combinationsData.forEach(({ combination, count }) => {
                csv += `"${combination}",${count}\n`;
            });
        }
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    destroy: function() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
        this._outcomesData = {};
        this._combinationsData = [];
        this._currentView = 'outcomes';
        this._filteredData = [];
    }
};