/**
 * ADR Reporter Qualification Chart Module
 * Displays reporter qualification distribution as a donut chart
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.reporterQualification = {
    _chartInstance: null,
    _reporterData: {},
    _showPercentage: false,
    
    processData: function(data) {
        const reporterCategories = {
            'Physician': { count: 0, color: '#2196F3', category: 'healthcare' },
            'Pharmacist': { count: 0, color: '#03A9F4', category: 'healthcare' },
            'Other Health Professional': { count: 0, color: '#00BCD4', category: 'healthcare' },
            'Lawyer': { count: 0, color: '#FF9800', category: 'non-healthcare' },
            'Patient/Consumer': { count: 0, color: '#FF5722', category: 'non-healthcare' },
            'Other non-health professional': { count: 0, color: '#F44336', category: 'non-healthcare' }
        };

        data.forEach(row => {
            const qualification = row['Reporter qualification'];
            if (!qualification) return;

            // Clean and normalize the qualification
            const cleanQual = qualification.toString().trim();
            
            // Handle multiple qualifications separated by line breaks
            const qualifications = cleanQual.split(/\r?\n|_x000D_/);
            
            qualifications.forEach(qual => {
                const normalizedQual = this._normalizeQualification(qual.trim());
                if (normalizedQual && reporterCategories[normalizedQual]) {
                    reporterCategories[normalizedQual].count++;
                }
            });
        });

        // Calculate totals and percentages
        const total = Object.values(reporterCategories).reduce((sum, cat) => sum + cat.count, 0);
        Object.keys(reporterCategories).forEach(key => {
            reporterCategories[key].percentage = total > 0 ? 
                ((reporterCategories[key].count / total) * 100).toFixed(1) : 0;
        });

        this._reporterData = reporterCategories;
        return reporterCategories;
    },
    
    _normalizeQualification: function(qual) {
        const lowerQual = qual.toLowerCase();
        
        if (lowerQual.includes('physician') || lowerQual.includes('doctor')) {
            return 'Physician';
        } else if (lowerQual.includes('pharmacist')) {
            return 'Pharmacist';
        } else if (lowerQual.includes('other health professional')) {
            return 'Other Health Professional';
        } else if (lowerQual.includes('lawyer')) {
            return 'Lawyer';
        } else if (lowerQual.includes('patient') || lowerQual.includes('consumer')) {
            return 'Patient/Consumer';
        } else if (lowerQual.includes('non health professional') || 
                  lowerQual.includes('non-health professional')) {
            return 'Other non-health professional';
        }
        
        return null;
    },
    
    createChart: function(containerId, data, options = {}) {
        // Process data if provided
        if (data) {
            this.processData(data);
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container element not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this._chartInstance) {
            this._chartInstance.destroy();
        }
        
        const labels = Object.keys(this._reporterData);
        const chartData = labels.map(label => this._reporterData[label].count);
        const colors = labels.map(label => this._reporterData[label].color);
        
        this._chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: chartData,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
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
                                const percentage = this._reporterData[label].percentage;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: options.showTitle !== false,
                        text: options.title || 'ADR Cases by Reporter Qualification',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    }
                }
            }
        });
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats(data);
        }
        
        // Create data table if table container exists
        const tableContainer = document.getElementById('reporterQualificationTable');
        if (tableContainer && options.showTable !== false) {
            this.createDataTable(tableContainer);
        }
        
        return this._chartInstance;
    },
    
    createSummaryStats: function(data) {
        const summaryContainer = document.getElementById('reporterQualificationSummary');
        if (!summaryContainer) return;
        
        const total = Object.values(this._reporterData).reduce((sum, cat) => sum + cat.count, 0);
        const topReporter = Object.entries(this._reporterData)
            .sort((a, b) => b[1].count - a[1].count)[0];
        
        const healthcareCount = Object.entries(this._reporterData)
            .filter(([_, reporterData]) => reporterData.category === 'healthcare')
            .reduce((sum, [_, reporterData]) => sum + reporterData.count, 0);
        
        const nonHealthcareCount = total - healthcareCount;
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${data ? data.length : 0}</div>
                    <div class="card-label">Total Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${total}</div>
                    <div class="card-label">Total Qualifications</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${topReporter ? topReporter[0] : '-'}</div>
                    <div class="card-label">Top Reporter Type</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${total > 0 ? ((healthcareCount / total) * 100).toFixed(1) : 0}%</div>
                    <div class="card-label">Healthcare Professionals</div>
                </div>
            </div>
        `;
    },
    
    createDataTable: function(container) {
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Reporter Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(this._reporterData)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([reporter, data]) => `
                            <tr>
                                <td>${reporter}</td>
                                <td>${data.count}</td>
                                <td>${data.percentage}%</td>
                                <td><span class="badge ${data.category === 'healthcare' ? 'badge-success' : 'badge-warning'}">${data.category}</span></td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHtml;
    },
    
    updateDisplay: function(showPercentage) {
        this._showPercentage = showPercentage;
        
        if (this._chartInstance) {
            const labels = Object.keys(this._reporterData);
            const data = showPercentage ? 
                labels.map(label => parseFloat(this._reporterData[label].percentage)) :
                labels.map(label => this._reporterData[label].count);
            
            this._chartInstance.data.datasets[0].data = data;
            
            this._chartInstance.options.plugins.tooltip.callbacks.label = (context) => {
                const label = context.label || '';
                const value = context.parsed;
                if (showPercentage) {
                    return `${label}: ${value}%`;
                } else {
                    const percentage = this._reporterData[label].percentage;
                    return `${label}: ${value} (${percentage}%)`;
                }
            };
            
            this._chartInstance.update();
        }
    },
    
    getData: function() {
        return this._reporterData;
    },
    
    getHealthcareStats: function() {
        const total = Object.values(this._reporterData).reduce((sum, cat) => sum + cat.count, 0);
        const healthcareCount = Object.entries(this._reporterData)
            .filter(([_, data]) => data.category === 'healthcare')
            .reduce((sum, [_, data]) => sum + data.count, 0);
        
        return {
            healthcare: healthcareCount,
            nonHealthcare: total - healthcareCount,
            healthcarePercentage: total > 0 ? ((healthcareCount / total) * 100).toFixed(1) : 0,
            nonHealthcarePercentage: total > 0 ? (((total - healthcareCount) / total) * 100).toFixed(1) : 0
        };
    },
    
    destroy: function() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
        this._reporterData = {};
        this._showPercentage = false;
    }
};