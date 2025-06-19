/**
 * ADR Reporter District Chart Module
 * Displays reporter district distribution with data quality indicators
 */

window.ADRCharts = window.ADRCharts || {};

ADRCharts.reporterDistrict = {
    _availabilityChartInstance: null,
    _districtChartInstance: null,
    _districtData: [],
    _dataQualityStats: {},
    _showPercentage: false,
    
    // Clean district data by removing carriage return characters and other formatting issues
    _cleanDistrictName: function(district) {
        if (!district || district === null || district === undefined) return null;
        
        // Convert to string and trim
        let cleaned = String(district).trim();
        
        // Remove carriage return characters
        cleaned = cleaned.replace(/_x000D_/g, '').replace(/\r/g, '').replace(/\n/g, ' ');
        
        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // Filter out empty or invalid values
        if (cleaned === '' || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'undefined') {
            return null;
        }
        
        return cleaned;
    },
    
    processData: function(data) {
        // Reset data
        this._districtData = [];
        const totalCases = data.length;
        
        // Count districts
        const districtCounts = {};
        let casesWithDistrict = 0;
        let casesWithoutDistrict = 0;
        
        data.forEach(row => {
            const rawDistrict = row['Reporter district'];
            const cleanedDistrict = this._cleanDistrictName(rawDistrict);
            
            if (cleanedDistrict) {
                casesWithDistrict++;
                districtCounts[cleanedDistrict] = (districtCounts[cleanedDistrict] || 0) + 1;
            } else {
                casesWithoutDistrict++;
            }
        });
        
        // Convert to array and sort
        this._districtData = Object.entries(districtCounts)
            .map(([district, count]) => ({
                district: district,
                count: count,
                percentageOfTotal: (count / totalCases) * 100,
                percentageOfAvailable: (count / casesWithDistrict) * 100
            }))
            .sort((a, b) => b.count - a.count);
        
        // Calculate statistics
        this._dataQualityStats = {
            total: totalCases,
            withDistrict: casesWithDistrict,
            withoutDistrict: casesWithoutDistrict,
            missingPercentage: (casesWithoutDistrict / totalCases) * 100,
            uniqueDistricts: this._districtData.length
        };
        
        return {
            districts: this._districtData,
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
        
        if (containerIds.district) {
            this._createDistrictChart(containerIds.district, options);
        }
        
        // Create summary stats if container exists
        if (options.showSummary !== false) {
            this.createSummaryStats();
        }
        
        // Create data table if table container exists
        const tableContainer = document.getElementById('districtTableContainer');
        if (tableContainer && options.showTable !== false) {
            this.createDataTable(tableContainer);
        }
        
        // Show data quality warning if container exists
        const warningContainer = document.getElementById('districtDataWarning');
        if (warningContainer) {
            this._showDataQualityWarning(warningContainer);
        }
        
        // Show data note if container exists
        const noteContainer = document.getElementById('districtDataNote');
        if (noteContainer) {
            this._showDataNote(noteContainer);
        }
        
        return {
            availability: this._availabilityChartInstance,
            district: this._districtChartInstance
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
            labels: ['With District Data', 'Without District Data'],
            datasets: [{
                data: [this._dataQualityStats.withDistrict, this._dataQualityStats.withoutDistrict],
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
    
    _createDistrictChart: function(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('District chart container not found:', containerId);
            return;
        }
        
        // Clear container and add canvas
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this._districtChartInstance) {
            this._districtChartInstance.destroy();
        }
        
        // Limit to top districts for better visibility
        const maxDistricts = options.maxDistricts || 20;
        const chartData = this._districtData.slice(0, maxDistricts);
        
        if (chartData.length === 0) {
            // No data available
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.fillText('No district data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const data = {
            labels: chartData.map(d => d.district),
            datasets: [{
                label: this._showPercentage ? 'Percentage of Available Data' : 'Number of Cases',
                data: chartData.map(d => this._showPercentage ? d.percentageOfAvailable : d.count),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        };
        
        this._districtChartInstance = new Chart(ctx, {
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
                        text: options.title || `Top ${maxDistricts} Districts (Available Data Only)`,
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
                <span>Warning: ${this._dataQualityStats.missingPercentage.toFixed(1)}% of records (${this._dataQualityStats.withoutDistrict.toLocaleString()} out of ${this._dataQualityStats.total.toLocaleString()}) do not have district data. 
                The analysis is based on the ${this._dataQualityStats.withDistrict.toLocaleString()} records with available district information.</span>
            </div>
        `;
    },
    
    _showDataNote: function(container) {
        container.innerHTML = `
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 10px 15px; margin: 15px 0; font-size: 14px; color: #1565C0;">
                <i class="fas fa-info-circle"></i> 
                <strong>Note:</strong> District data may contain formatting issues (e.g., "_x000D_" characters) which have been cleaned for display. 
                Empty or invalid entries have been excluded from the analysis.
            </div>
        `;
    },
    
    createSummaryStats: function() {
        const summaryContainer = document.getElementById('districtSummary');
        if (!summaryContainer) return;
        
        const topDistrict = this._districtData[0];
        
        summaryContainer.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.total.toLocaleString()}</div>
                    <div class="card-label">Total Cases</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.withDistrict.toLocaleString()}</div>
                    <div class="card-label">With District Data</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this._dataQualityStats.uniqueDistricts.toLocaleString()}</div>
                    <div class="card-label">Unique Districts</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${topDistrict ? topDistrict.district : '-'}</div>
                    <div class="card-label">Top District</div>
                </div>
            </div>
        `;
    },
    
    createDataTable: function(container) {
        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>District</th>
                        <th>Count</th>
                        <th>% of Total</th>
                        <th>% of Available</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._districtData.map(item => `
                        <tr>
                            <td>${item.district}</td>
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
        
        if (this._districtChartInstance) {
            const maxDistricts = 20;
            const chartData = this._districtData.slice(0, maxDistricts);
            
            const newData = chartData.map(d => this._showPercentage ? d.percentageOfAvailable : d.count);
            
            this._districtChartInstance.data.datasets[0].data = newData;
            this._districtChartInstance.data.datasets[0].label = this._showPercentage ? 'Percentage of Available Data' : 'Number of Cases';
            
            this._districtChartInstance.options.scales.x.title.text = this._showPercentage ? 'Percentage of Available Data (%)' : 'Number of Cases';
            this._districtChartInstance.options.scales.x.ticks.precision = this._showPercentage ? 1 : 0;
            
            this._districtChartInstance.update();
        }
    },
    
    getData: function() {
        return {
            districts: this._districtData,
            dataQuality: this._dataQualityStats
        };
    },
    
    getTopDistricts: function(limit = 10) {
        return this._districtData.slice(0, limit).map(d => ({
            name: d.district,
            count: d.count,
            percentageOfTotal: d.percentageOfTotal,
            percentageOfAvailable: d.percentageOfAvailable
        }));
    },
    
    exportData: function(filename = 'adr_reporter_districts.csv') {
        let csv = 'District,Count,Percentage of Total,Percentage of Available\n';
        
        this._districtData.forEach(item => {
            csv += `"${item.district}",${item.count},${item.percentageOfTotal.toFixed(1)}%,${item.percentageOfAvailable.toFixed(1)}%\n`;
        });
        
        // Add summary
        csv += '\n\nSummary Statistics\n';
        csv += `Total Cases,${this._dataQualityStats.total}\n`;
        csv += `Cases with District,${this._dataQualityStats.withDistrict}\n`;
        csv += `Cases without District,${this._dataQualityStats.withoutDistrict}\n`;
        csv += `Data Completeness,${(100 - this._dataQualityStats.missingPercentage).toFixed(1)}%\n`;
        csv += `Unique Districts,${this._dataQualityStats.uniqueDistricts}\n`;
        
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
        if (this._districtChartInstance) {
            this._districtChartInstance.destroy();
            this._districtChartInstance = null;
        }
        this._districtData = [];
        this._dataQualityStats = {};
        this._showPercentage = false;
    }
};