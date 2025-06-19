/**
 * ADR Drug Reported Chart Module (Reporter Names)
 * Analysis of drug names as originally reported by initial reporter
 */

// Ensure namespace exists
window.ADRCharts = window.ADRCharts || {};

// Drug reported chart module
ADRCharts.drugReported = {
    // Private properties
    _pieChartInstance: null,
    _barChartInstance: null,
    _detailedBarChartInstance: null,
    
    // Chart colors - using different palette to distinguish from WHO analysis
    _colors: {
        pie: [
            'rgba(155, 89, 182, 0.8)',   // Purple
            'rgba(52, 152, 219, 0.8)',   // Blue
            'rgba(46, 204, 113, 0.8)',   // Green
            'rgba(230, 126, 34, 0.8)',   // Orange
            'rgba(231, 76, 60, 0.8)',    // Red
            'rgba(241, 196, 15, 0.8)',   // Yellow
            'rgba(26, 188, 156, 0.8)',   // Turquoise
            'rgba(149, 165, 166, 0.8)'   // Gray for Others
        ],
        bar: 'rgba(155, 89, 182, 0.8)'  // Purple theme for reporter names
    },
    
    /**
     * Process data for drug analysis (reporter names)
     * @param {Array} data - Raw ADR data
     * @param {string} analysisMode - 'cases' or 'mentions'
     * @returns {Object} Processed drug data
     */
    processData: function(data, analysisMode = 'cases') {
        const drugCasesData = {};
        const drugMentionsData = {};
        const drugCombinations = [];
        const combinationMap = {};
        let casesWithMultipleDrugs = 0;
        let casesWithSingleDrug = 0;
        let totalCasesWithDrugs = 0;
        let unmatchedDrugs = new Set();
        
        data.forEach((row) => {
            // Use reporter drug names field
            const drugs = ADRCharts.utils.parseDrugNames(row['Drug name as reported by initial reporter']);
            
            if (drugs.length === 0) {
                return;
            }
            
            totalCasesWithDrugs++;
            
            // Count cases
            if (drugs.length === 1) {
                casesWithSingleDrug++;
            } else if (drugs.length > 1) {
                casesWithMultipleDrugs++;
            }
            
            // For cases count - count unique drugs per case
            const uniqueDrugsInCase = [...new Set(drugs)];
            uniqueDrugsInCase.forEach(drug => {
                drugCasesData[drug] = (drugCasesData[drug] || 0) + 1;
                
                // Track drugs that might not have WHO mapping
                const whoDrug = row['Drug name (WHODrug)'];
                if (!whoDrug || whoDrug.trim() === '') {
                    unmatchedDrugs.add(drug);
                }
            });
            
            // For mentions count - count all occurrences
            drugs.forEach(drug => {
                drugMentionsData[drug] = (drugMentionsData[drug] || 0) + 1;
            });
            
            // Track combinations
            if (uniqueDrugsInCase.length > 1) {
                const combinationKey = uniqueDrugsInCase.sort().join(' + ');
                combinationMap[combinationKey] = (combinationMap[combinationKey] || 0) + 1;
            }
        });
        
        // Convert combinations to array and sort
        const sortedCombinations = Object.entries(combinationMap)
            .map(([combination, count]) => ({ combination, count }))
            .sort((a, b) => b.count - a.count);
        
        return {
            drugCasesData,
            drugMentionsData,
            drugCombinations: sortedCombinations,
            casesWithMultipleDrugs,
            casesWithSingleDrug,
            totalCasesWithDrugs,
            unmatchedDrugsCount: unmatchedDrugs.size,
            currentData: analysisMode === 'cases' ? drugCasesData : drugMentionsData,
            analysisMode
        };
    },
    
    /**
     * Create drug analysis charts
     * @param {Object} containerIds - Object with pie, bar, and optionally detailedBar container IDs
     * @param {Array} data - Raw ADR data
     * @param {Object} options - Additional options
     * @returns {Object} Chart instances
     */
    createCharts: function(containerIds, data, options) {
        const analysisMode = options?.analysisMode || 'cases';
        const viewType = options?.viewType || 'overview';
        
        // Process data
        const processed = this.processData(data, analysisMode);
        
        // Store processed data for later use
        this._processedData = processed;
        
        // Create appropriate charts based on view type
        if (viewType === 'overview' && containerIds.pie && containerIds.bar) {
            this._createPieChart(containerIds.pie, processed);
            this._createBarChart(containerIds.bar, processed);
        } else if (viewType === 'detailed' && containerIds.detailedBar) {
            this._createDetailedBarChart(containerIds.detailedBar, processed);
        }
        
        return {
            pieChart: this._pieChartInstance,
            barChart: this._barChartInstance,
            detailedBarChart: this._detailedBarChartInstance,
            processedData: processed
        };
    },
    
    /**
     * Create pie chart for top drugs
     * @private
     */
    _createPieChart: function(containerId, processed) {
        // Destroy existing chart if any
        if (this._pieChartInstance) {
            this._pieChartInstance.destroy();
        }
        
        const drugData = processed.currentData;
        
        // Sort drugs by frequency
        const sortedDrugs = Object.entries(drugData)
            .sort((a, b) => b[1] - a[1]);
        
        // Take top 7 drugs and group others
        const topDrugs = sortedDrugs.slice(0, 7);
        const otherCount = sortedDrugs.slice(7).reduce((sum, [, count]) => sum + count, 0);
        
        if (otherCount > 0) {
            topDrugs.push(['Others', otherCount]);
        }
        
        const labels = topDrugs.map(([drug, ]) => drug);
        const data = topDrugs.map(([, count]) => count);
        const total = data.reduce((a, b) => a + b, 0);
        
        const ctx = document.getElementById(containerId).getContext('2d');
        
        const config = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this._colors.pie.slice(0, labels.length),
                    borderColor: this._colors.pie.slice(0, labels.length).map(c => c.replace('0.8', '1')),
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
                        text: `Top Reported Drugs by ${processed.analysisMode === 'cases' ? 'Cases' : 'Mentions'}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: {
                                size: 11
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return {
                                            text: `${label} (${percentage}%)`,
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
                                const label = context.label;
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return [
                                    `${label}`,
                                    `${processed.analysisMode === 'cases' ? 'Cases' : 'Mentions'}: ${value.toLocaleString()}`,
                                    `Percentage: ${percentage}%`
                                ];
                            }
                        }
                    }
                }
            }
        };
        
        this._pieChartInstance = new Chart(ctx, config);
    },
    
    /**
     * Create horizontal bar chart for top 20 drugs
     * @private
     */
    _createBarChart: function(containerId, processed) {
        // Destroy existing chart if any
        if (this._barChartInstance) {
            this._barChartInstance.destroy();
        }
        
        const drugData = processed.currentData;
        
        // Sort and take top 20
        const sortedDrugs = Object.entries(drugData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        const labels = sortedDrugs.map(([drug, ]) => drug);
        const data = sortedDrugs.map(([, count]) => count);
        
        // Generate gradient colors
        const backgroundColors = data.map((_, index) => {
            const intensity = 1 - (index / 20) * 0.6;
            return `rgba(155, 89, 182, ${intensity})`;
        });
        
        const ctx = document.getElementById(containerId).getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace(/[\d.]+\)$/, '1)')),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Top 20 Reported Drugs by ${processed.analysisMode === 'cases' ? 'Cases' : 'Mentions'}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = Object.values(drugData).reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return [
                                    `${processed.analysisMode === 'cases' ? 'Cases' : 'Mentions'}: ${value.toLocaleString()}`,
                                    `Percentage: ${percentage}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: processed.analysisMode === 'cases' ? 'Number of Cases' : 'Number of Mentions'
                        }
                    }
                }
            }
        };
        
        this._barChartInstance = new Chart(ctx, config);
    },
    
    /**
     * Create detailed bar chart for all drugs
     * @private
     */
    _createDetailedBarChart: function(containerId, processed) {
        // Destroy existing chart if any
        if (this._detailedBarChartInstance) {
            this._detailedBarChartInstance.destroy();
        }
        
        const drugData = processed.currentData;
        
        // Sort all drugs
        const sortedDrugs = Object.entries(drugData)
            .sort((a, b) => b[1] - a[1]);
        
        const labels = sortedDrugs.map(([drug, ]) => drug);
        const data = sortedDrugs.map(([, count]) => count);
        
        const ctx = document.getElementById(containerId).getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this._colors.bar,
                    borderColor: this._colors.bar.replace('0.8', '1'),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `All Reported Drugs - ${processed.analysisMode === 'cases' ? 'Cases' : 'Mentions'} Analysis`,
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: processed.analysisMode === 'cases' ? 'Number of Cases' : 'Number of Mentions'
                        }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        };
        
        this._detailedBarChartInstance = new Chart(ctx, config);
    },
    
    /**
     * Update charts with new data or mode
     * @param {Array} newData - New data to display
     * @param {Object} options - Update options
     */
    update: function(newData, options) {
        const analysisMode = options?.analysisMode || this._processedData?.analysisMode || 'cases';
        const viewType = options?.viewType || 'overview';
        
        // Reprocess data
        const processed = this.processData(newData, analysisMode);
        this._processedData = processed;
        
        // Update appropriate charts
        if (viewType === 'overview') {
            if (this._pieChartInstance) {
                // Update pie chart data
                const drugData = processed.currentData;
                const sortedDrugs = Object.entries(drugData).sort((a, b) => b[1] - a[1]);
                const topDrugs = sortedDrugs.slice(0, 7);
                const otherCount = sortedDrugs.slice(7).reduce((sum, [, count]) => sum + count, 0);
                
                if (otherCount > 0) {
                    topDrugs.push(['Others', otherCount]);
                }
                
                this._pieChartInstance.data.labels = topDrugs.map(([drug, ]) => drug);
                this._pieChartInstance.data.datasets[0].data = topDrugs.map(([, count]) => count);
                this._pieChartInstance.options.plugins.title.text = `Top Reported Drugs by ${analysisMode === 'cases' ? 'Cases' : 'Mentions'}`;
                this._pieChartInstance.update();
            }
            
            if (this._barChartInstance) {
                // Update bar chart data
                const drugData = processed.currentData;
                const sortedDrugs = Object.entries(drugData).sort((a, b) => b[1] - a[1]).slice(0, 20);
                
                this._barChartInstance.data.labels = sortedDrugs.map(([drug, ]) => drug);
                this._barChartInstance.data.datasets[0].data = sortedDrugs.map(([, count]) => count);
                this._barChartInstance.options.plugins.title.text = `Top 20 Reported Drugs by ${analysisMode === 'cases' ? 'Cases' : 'Mentions'}`;
                this._barChartInstance.options.scales.x.title.text = analysisMode === 'cases' ? 'Number of Cases' : 'Number of Mentions';
                this._barChartInstance.update();
            }
        } else if (viewType === 'detailed' && this._detailedBarChartInstance) {
            // Update detailed chart
            const drugData = processed.currentData;
            const sortedDrugs = Object.entries(drugData).sort((a, b) => b[1] - a[1]);
            
            this._detailedBarChartInstance.data.labels = sortedDrugs.map(([drug, ]) => drug);
            this._detailedBarChartInstance.data.datasets[0].data = sortedDrugs.map(([, count]) => count);
            this._detailedBarChartInstance.options.plugins.title.text = `All Reported Drugs - ${analysisMode === 'cases' ? 'Cases' : 'Mentions'} Analysis`;
            this._detailedBarChartInstance.options.scales.x.title.text = analysisMode === 'cases' ? 'Number of Cases' : 'Number of Mentions';
            this._detailedBarChartInstance.update();
        }
    },
    
    /**
     * Destroy all chart instances and clean up
     */
    destroy: function() {
        if (this._pieChartInstance) {
            this._pieChartInstance.destroy();
            this._pieChartInstance = null;
        }
        if (this._barChartInstance) {
            this._barChartInstance.destroy();
            this._barChartInstance = null;
        }
        if (this._detailedBarChartInstance) {
            this._detailedBarChartInstance.destroy();
            this._detailedBarChartInstance = null;
        }
        this._processedData = null;
    },
    
    /**
     * Get current chart instances
     * @returns {Object} Current chart instances
     */
    getChartInstances: function() {
        return {
            pieChart: this._pieChartInstance,
            barChart: this._barChartInstance,
            detailedBarChart: this._detailedBarChartInstance
        };
    },
    
    /**
     * Get processed data
     * @returns {Object} Processed data
     */
    getProcessedData: function() {
        return this._processedData;
    },
    
    /**
     * Export drug data as CSV
     * @param {Array} data - Raw data to export
     * @param {string} filename - Filename for export
     * @param {string} analysisMode - 'cases' or 'mentions'
     */
    exportData: function(data, filename, analysisMode = 'cases') {
        const processed = this.processData(data, analysisMode);
        const drugData = processed.currentData;
        
        // Sort drugs by frequency
        const sortedDrugs = Object.entries(drugData)
            .sort((a, b) => b[1] - a[1]);
        
        const csvData = sortedDrugs.map(([drug, count]) => ({
            'Drug Name (Reporter)': drug,
            [analysisMode === 'cases' ? 'Number of Cases' : 'Number of Mentions']: count,
            'Percentage': ((count / Object.values(drugData).reduce((a, b) => a + b, 0)) * 100).toFixed(2) + '%'
        }));
        
        // Add summary
        csvData.push({});
        csvData.push({ 'Drug Name (Reporter)': 'SUMMARY', 'Number of Cases': '' });
        csvData.push({ 'Drug Name (Reporter)': 'Total Unique Drugs', 'Number of Cases': Object.keys(drugData).length });
        csvData.push({ 'Drug Name (Reporter)': 'Total Cases with Drugs', 'Number of Cases': processed.totalCasesWithDrugs });
        csvData.push({ 'Drug Name (Reporter)': 'Cases with Single Drug', 'Number of Cases': processed.casesWithSingleDrug });
        csvData.push({ 'Drug Name (Reporter)': 'Cases with Multiple Drugs', 'Number of Cases': processed.casesWithMultipleDrugs });
        csvData.push({ 'Drug Name (Reporter)': 'Drugs without WHO mapping', 'Number of Cases': processed.unmatchedDrugsCount });
        
        ADRCharts.utils.exportToCSV(csvData, filename || 'adr_drug_reported_analysis.csv');
    },
    
    /**
     * Get summary statistics
     * @param {Array} data - Raw data
     * @param {string} analysisMode - 'cases' or 'mentions'
     * @returns {Object} Summary statistics
     */
    getSummaryStats: function(data, analysisMode = 'cases') {
        const processed = this.processData(data, analysisMode);
        const drugData = processed.currentData;
        
        // Get top 3 drugs
        const topDrugs = Object.entries(drugData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        return {
            totalUniqueDrugs: Object.keys(drugData).length,
            totalCasesWithDrugs: processed.totalCasesWithDrugs,
            casesWithSingleDrug: processed.casesWithSingleDrug,
            casesWithMultipleDrugs: processed.casesWithMultipleDrugs,
            unmatchedDrugsCount: processed.unmatchedDrugsCount,
            topDrug: topDrugs[0] ? `${topDrugs[0][0]} (${topDrugs[0][1]} ${analysisMode})` : 'N/A',
            topThreeDrugs: topDrugs.map(([drug, count]) => ({
                name: drug,
                count: count,
                percentage: ((count / Object.values(drugData).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
            })),
            topCombinations: processed.drugCombinations.slice(0, 5)
        };
    }
};