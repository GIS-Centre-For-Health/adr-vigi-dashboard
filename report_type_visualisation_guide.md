         1 +  // ADR Report Types Chart Module
         2 +  window.ADRCharts = window.ADRCharts || {};
         3 +
         4 +  ADRCharts.reportTypes = {
         5 +      _chartInstance: null,
         6 +
         7 +      // Define colors for report types
         8 +      reportTypeColors: {
         9 +          'Spontaneous report': {
        10 +              background: 'rgba(52, 152, 219, 0.8)',  // Blue
        11 +              border: 'rgba(52, 152, 219, 1)'
        12 +          },
        13 +          'Report from study': {
        14 +              background: 'rgba(46, 204, 113, 0.8)',  // Green
        15 +              border: 'rgba(46, 204, 113, 1)'
        16 +          },
        17 +          'Other': {
        18 +              background: 'rgba(243, 156, 18, 0.8)',  // Orange
        19 +              border: 'rgba(243, 156, 18, 1)'
        20 +          },
        21 +          'Not available to sender or unknown': {
        22 +              background: 'rgba(149, 165, 166, 0.8)',  // Gray
        23 +              border: 'rgba(149, 165, 166, 1)'
        24 +          }
        25 +      },
        26 +
        27 +      // Process data for report types
        28 +      processData: function(data) {
        29 +          // Count report types
        30 +          const reportTypeCounts = {};
        31 +
        32 +          data.forEach(row => {
        33 +              let reportType = row['Report type'];
        34 +
        35 +              // Handle empty or null values
        36 +              if (!reportType || reportType.trim() === '') {
        37 +                  reportType = 'Not available to sender or unknown';
        38 +              }
        39 +
        40 +              reportTypeCounts[reportType] = (reportTypeCounts[reportType] || 0) + 1;
        41 +          });
        42 +
        43 +          // Calculate total
        44 +          const total = Object.values(reportTypeCounts).reduce((a, b) => a + b, 0);
        45 +
        46 +          // Sort by count descending
        47 +          const sortedTypes = Object.entries(reportTypeCounts)
        48 +              .sort((a, b) => b[1] - a[1]);
        49 +
        50 +          // Find most common type
        51 +          const mostCommon = sortedTypes.length > 0 ? {
        52 +              type: sortedTypes[0][0],
        53 +              count: sortedTypes[0][1],
        54 +              percentage: ((sortedTypes[0][1] / total) * 100).toFixed(1)
        55 +          } : null;
        56 +
        57 +          // Calculate cases with valid dates
        58 +          const validDates = data.filter(row => row._parsedDate && !isNaN(row._parsedDate)).length;
        59 +
        60 +          return {
        61 +              reportTypeCounts,
        62 +              total,
        63 +              sortedTypes,
        64 +              mostCommon,
        65 +              categories: Object.keys(reportTypeCounts).length,
        66 +              validDates,
        67 +              totalRecords: data.length
        68 +          };
        69 +      },
        70 +
        71 +      // Create the chart
        72 +      createChart: function(containerId, data, options = {}) {
        73 +          const processed = this.processData(data);
        74 +
        75 +          // Prepare data for chart
        76 +          const labels = Object.keys(processed.reportTypeCounts);
        77 +          const chartData = Object.values(processed.reportTypeCounts);
        78 +
        79 +          // Prepare colors
        80 +          const backgroundColors = labels.map(label =>
        81 +              this.reportTypeColors[label]?.background || 'rgba(189, 195, 199, 0.8)'
        82 +          );
        83 +          const borderColors = labels.map(label =>
        84 +              this.reportTypeColors[label]?.border || 'rgba(189, 195, 199, 1)'
        85 +          );
        86 +
        87 +          // Chart configuration
        88 +          const config = {
        89 +              type: 'pie',
        90 +              data: {
        91 +                  labels: labels,
        92 +                  datasets: [{
        93 +                      data: chartData,
        94 +                      backgroundColor: backgroundColors,
        95 +                      borderColor: borderColors,
        96 +                      borderWidth: 2,
        97 +                      hoverOffset: 10
        98 +                  }]
        99 +              },
       100 +              options: {
       101 +                  responsive: true,
       102 +                  maintainAspectRatio: false,
       103 +                  plugins: {
       104 +                      title: {
       105 +                          display: true,
       106 +                          text: `Total Cases: ${processed.total.toLocaleString()}`,
       107 +                          font: {
       108 +                              size: 16,
       109 +                              weight: 'normal'
       110 +                          },
       111 +                          padding: 20
       112 +                      },
       113 +                      legend: {
       114 +                          position: 'bottom',
       115 +                          labels: {
       116 +                              padding: 15,
       117 +                              font: {
       118 +                                  size: 12
       119 +                              },
       120 +                              generateLabels: function(chart) {
       121 +                                  const data = chart.data;
       122 +                                  if (data.labels.length && data.datasets.length) {
       123 +                                      return data.labels.map((label, i) => {
       124 +                                          const dataset = data.datasets[0];
       125 +                                          const value = dataset.data[i];
       126 +                                          const percentage = ((value / processed.total) * 100).toFixed(1);
       127 +                                          return {
       128 +                                              text: `${label} (${value})`,
       129 +                                              fillStyle: dataset.backgroundColor[i],
       130 +                                              strokeStyle: dataset.borderColor[i],
       131 +                                              lineWidth: dataset.borderWidth,
       132 +                                              hidden: false,
       133 +                                              index: i
       134 +                                          };
       135 +                                      });
       136 +                                  }
       137 +                                  return [];
       138 +                              }
       139 +                          }
       140 +                      },
       141 +                      tooltip: {
       142 +                          callbacks: {
       143 +                              label: function(context) {
       144 +                                  const label = context.label || '';
       145 +                                  const value = context.raw;
       146 +                                  const percentage = ((value / processed.total) * 100).toFixed(1);
       147 +                                  return [
       148 +                                      `${label}: ${value.toLocaleString()}`,
       149 +                                      `Percentage: ${percentage}%`
       150 +                                  ];
       151 +                              }
       152 +                          },
       153 +                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
       154 +                          padding: 12,
       155 +                          titleFont: {
       156 +                              size: 14,
       157 +                              weight: 'bold'
       158 +                          },
       159 +                          bodyFont: {
       160 +                              size: 13
       161 +                          }
       162 +                      }
       163 +                  }
       164 +              }
       165 +          };
       166 +
       167 +          // Apply any custom options
       168 +          if (options.title) {
       169 +              config.options.plugins.title.text = options.title;
       170 +          }
       171 +
       172 +          // Destroy existing chart if any
       173 +          this.destroy();
       174 +
       175 +          // Create new chart
       176 +          const container = document.getElementById(containerId);
       177 +          if (!container) {
       178 +              console.error('Container not found:', containerId);
       179 +              return null;
       180 +          }
       181 +
       182 +          const canvas = container.querySelector('canvas') || document.createElement('canvas');
       183 +          if (!canvas.parentNode) {
       184 +              container.appendChild(canvas);
       185 +          }
       186 +
       187 +          const ctx = canvas.getContext('2d');
       188 +          this._chartInstance = new Chart(ctx, config);
       189 +
       190 +          // Update summary if provided
       191 +          if (options.summaryContainerId) {
       192 +              this.updateSummary(options.summaryContainerId, processed);
       193 +          }
       194 +
       195 +          // Update table if provided
       196 +          if (options.tableContainerId) {
       197 +              this.updateTable(options.tableContainerId, processed);
       198 +          }
       199 +
       200 +          return this._chartInstance;
       201 +      },
       202 +
       203 +      // Update summary statistics
       204 +      updateSummary: function(containerId, processed) {
       205 +          const container = document.getElementById(containerId);
       206 +          if (!container) return;
       207 +
       208 +          const summaryHTML = `
       209 +              <div class="stat-card">
       210 +                  <div class="stat-value">${processed.totalRecords.toLocaleString()}</div>
       211 +                  <div class="stat-label">Total ADR Cases</div>
       212 +              </div>
       213 +              ${processed.mostCommon ? `
       214 +              <div class="stat-card">
       215 +                  <div class="stat-value">${processed.mostCommon.type}</div>
       216 +                  <div class="stat-label">Most Common Type (${processed.mostCommon.percentage}%)</div>
       217 +              </div>
       218 +              ` : ''}
       219 +              <div class="stat-card">
       220 +                  <div class="stat-value">${processed.categories}</div>
       221 +                  <div class="stat-label">Report Type Categories</div>
       222 +              </div>
       223 +              <div class="stat-card">
       224 +                  <div class="stat-value">${processed.validDates.toLocaleString()}</div>
       225 +                  <div class="stat-label">Cases with Valid Dates</div>
       226 +              </div>
       227 +          `;
       228 +
       229 +          container.innerHTML = summaryHTML;
       230 +      },
       231 +
       232 +      // Update data table
       233 +      updateTable: function(containerId, processed) {
       234 +          const container = document.getElementById(containerId);
       235 +          if (!container) return;
       236 +
       237 +          let tableHTML = `
       238 +              <table class="data-table">
       239 +                  <thead>
       240 +                      <tr>
       241 +                          <th>Report Type</th>
       242 +                          <th>Count</th>
       243 +                          <th>Percentage</th>
       244 +                      </tr>
       245 +                  </thead>
       246 +                  <tbody>
       247 +          `;
       248 +
       249 +          // Add sorted types
       250 +          processed.sortedTypes.forEach(([type, count]) => {
       251 +              const percentage = ((count / processed.total) * 100).toFixed(1);
       252 +              tableHTML += `
       253 +                  <tr>
       254 +                      <td>${type}</td>
       255 +                      <td style="text-align: right;">${count.toLocaleString()}</td>
       256 +                      <td style="text-align: right;">${percentage}%</td>
       257 +                  </tr>
       258 +              `;
       259 +          });
       260 +
       261 +          // Add total row
       262 +          tableHTML += `
       263 +                  </tbody>
       264 +                  <tfoot>
       265 +                      <tr style="font-weight: bold; border-top: 2px solid #ddd;">
       266 +                          <td>Total</td>
       267 +                          <td style="text-align: right;">${processed.total.toLocaleString()}</td>
       268 +                          <td style="text-align: right;">100.0%</td>
       269 +                      </tr>
       270 +                  </tfoot>
       271 +              </table>
       272 +          `;
       273 +
       274 +          container.innerHTML = tableHTML;
       275 +      },
       276 +
       277 +      // Export data as CSV
       278 +      exportData: function(data, filename = 'adr_report_types.csv') {
       279 +          const processed = this.processData(data);
       280 +
       281 +          // Create CSV content
       282 +          let csvContent = 'Report Type,Count,Percentage\n';
       283 +
       284 +          processed.sortedTypes.forEach(([type, count]) => {
       285 +              const percentage = ((count / processed.total) * 100).toFixed(1);
       286 +              csvContent += `"${type}",${count},${percentage}%\n`;
       287 +          });
       288 +
       289 +          // Add total
       290 +          csvContent += `\nTotal,${processed.total},100.0%\n`;
       291 +
       292 +          // Download
       293 +          const blob = new Blob([csvContent], { type: 'text/csv' });
       294 +          const url = URL.createObjectURL(blob);
       295 +          const a = document.createElement('a');
       296 +          a.href = url;
       297 +          a.download = filename;
       298 +          a.click();
       299 +          URL.revokeObjectURL(url);
       300 +      },
       301 +
       302 +      // Destroy the chart instance
       303 +      destroy: function() {
       304 +          if (this._chartInstance) {
       305 +              this._chartInstance.destroy();
       306 +              this._chartInstance = null;
       307 +          }
       308 +      },
       309 +
       310 +      // Get chart instance (for external access)
       311 +      getChartInstance: function() {
       312 +          return this._chartInstance;
       313 +      }
       314 +  };