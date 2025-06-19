/**
 * ADR Filters Module
 * Handles all filtering logic for ADR data including date parsing, drug name parsing,
 * outcome cleaning, and global filter application
 */

// Ensure namespace exists
window.ADRFilters = window.ADRFilters || {};

// ADR Filters module
ADRFilters = {
    /**
     * Parse initial received date with various formats
     * @param {string} dateValue - Date string from Excel
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseInitialReceivedDate: function(dateValue) {
        if (!dateValue || dateValue === null || dateValue === undefined) {
            return null;
        }
        
        // Try parsing as-is first
        let parsedDate = new Date(dateValue);
        
        // If invalid, try common date formats
        if (isNaN(parsedDate.getTime())) {
            // Try DD/MM/YYYY format
            const ddmmyyyy = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (ddmmyyyy) {
                parsedDate = new Date(ddmmyyyy[3], ddmmyyyy[2] - 1, ddmmyyyy[1]);
            }
            
            // Try MM/DD/YYYY format
            if (isNaN(parsedDate.getTime())) {
                const mmddyyyy = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (mmddyyyy) {
                    parsedDate = new Date(mmddyyyy[3], mmddyyyy[1] - 1, mmddyyyy[2]);
                }
            }
            
            // Try YYYY-MM-DD format
            if (isNaN(parsedDate.getTime())) {
                const yyyymmdd = dateValue.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (yyyymmdd) {
                    parsedDate = new Date(yyyymmdd[1], yyyymmdd[2] - 1, yyyymmdd[3]);
                }
            }
        }
        
        return !isNaN(parsedDate.getTime()) ? parsedDate : null;
    },
    
    /**
     * Parse drug names from Excel data (handles newline separators and Excel formatting)
     * @param {string} drugValue - Drug names string from Excel
     * @returns {Array} Array of cleaned drug names
     */
    parseDrugNames: function(drugValue) {
        if (!drugValue || drugValue === null || drugValue === undefined) {
            return [];
        }
        
        // Convert to string and clean Excel formatting
        let cleaned = drugValue.toString()
            .replace(/_x000D_/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        
        // Split by newlines and filter out empty values
        const drugs = cleaned.split('\n')
            .map(d => d.trim())
            .filter(d => d && d.length > 0);
        
        return drugs;
    },
    
    /**
     * Clean and standardize outcome values (handles variations and misspellings)
     * @param {string} value - Raw outcome value
     * @returns {string} Standardized outcome
     */
    cleanOutcomeValue: function(value) {
        if (!value || value === null || value === undefined) {
            return 'Unknown';
        }
        
        // Convert to string and clean
        let cleaned = value.toString()
            .replace(/_x000D_/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ')
            .trim();
        
        // Check if it's just whitespace or empty
        if (cleaned === '' || cleaned === '_' || cleaned.length === 0) {
            return 'Unknown';
        }
        
        // Normalize to lowercase for matching
        const normalizedValue = cleaned.toLowerCase();
        
        // Handle repeated values (e.g., "Unknown Unknown Unknown")
        const words = normalizedValue.split(/\s+/);
        const uniqueWords = [...new Set(words)];
        
        // If all words are the same, use just one
        if (uniqueWords.length === 1 && words.length > 1) {
            const singleWord = uniqueWords[0];
            
            // Map common single words to standard outcomes
            if (singleWord === 'unknown' || singleWord === 'unkown') {
                return 'Unknown';
            } else if (singleWord === 'fatal' || singleWord === 'died' || singleWord === 'death') {
                return 'Died';
            } else if (singleWord === 'recovered' || singleWord === 'resolved') {
                return 'Recovered';
            } else if (singleWord === 'recovering' || singleWord === 'resolving') {
                return 'Recovering';
            }
        }
        
        // Handle variations with slashes (e.g., "Recovering / Resolving")
        if (normalizedValue.includes('/')) {
            if (normalizedValue.includes('recovering') || normalizedValue.includes('resolving')) {
                return 'Recovering';
            } else if (normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) {
                if (normalizedValue.includes('sequelae')) {
                    return 'Recovered with sequelae';
                }
                return 'Recovered';
            }
        }
        
        // Handle specific outcome patterns
        if (normalizedValue.includes('unknown') || normalizedValue.includes('unkown')) {
            return 'Unknown';
        } else if (normalizedValue.includes('fatal') || normalizedValue.includes('died') || normalizedValue.includes('death')) {
            return 'Died';
        } else if ((normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) && normalizedValue.includes('sequelae')) {
            return 'Recovered with sequelae';
        } else if (normalizedValue.includes('recovered') || normalizedValue.includes('resolved')) {
            return 'Recovered';
        } else if (normalizedValue.includes('recovering') || normalizedValue.includes('resolving')) {
            return 'Recovering';
        } else if (normalizedValue.includes('not recovered') || normalizedValue.includes('not resolved')) {
            return 'Not recovered';
        }
        
        // Common misspellings
        if (normalizedValue === 'unkown' || normalizedValue === 'unknow' || normalizedValue === 'unknwon') {
            return 'Unknown';
        }
        
        // If no match found, return Unknown
        console.warn(`Unrecognized outcome value: "${cleaned}"`);
        return 'Unknown';
    },
    
    /**
     * Apply global filters to dataset
     * @param {Array} data - Original data array
     * @param {Object} filters - Filter criteria object
     * @returns {Array} Filtered data
     */
    applyGlobalFilters: function(data, filters) {
        if (!data || !Array.isArray(data)) return [];
        
        return data.filter(row => {
            // Date range filter
            if (filters.startDate || filters.endDate) {
                const dateValue = row['Initial received date'];
                if (!dateValue) return false;
                
                const date = this.parseInitialReceivedDate(dateValue);
                if (!date || isNaN(date.getTime())) return false;
                
                if (filters.startDate && date < new Date(filters.startDate)) return false;
                if (filters.endDate && date > new Date(filters.endDate)) return false;
            }
            
            // Location filter (District or State/Province)
            if (filters.location) {
                const district = row['Reporter district'] || '';
                const state = row['Reporter state or province'] || '';
                if (!district.toLowerCase().includes(filters.location.toLowerCase()) && 
                    !state.toLowerCase().includes(filters.location.toLowerCase())) {
                    return false;
                }
            }
            
            // Drug filter (WHO standardized or Reported names)
            if (filters.drug) {
                let found = false;
                
                // Check WHO standardized drugs (primary)
                const whoDrugs = row['Drug name (WHODrug)'];
                if (whoDrugs) {
                    const drugs = this.parseDrugNames(whoDrugs);
                    if (drugs.some(d => d.toLowerCase().includes(filters.drug.toLowerCase()))) {
                        found = true;
                    }
                }
                
                // Check reported drugs (secondary)
                if (!found) {
                    const reportedDrugs = row['Drug name as reported by initial reporter'];
                    if (reportedDrugs) {
                        const drugs = this.parseDrugNames(reportedDrugs);
                        if (drugs.some(d => d.toLowerCase().includes(filters.drug.toLowerCase()))) {
                            found = true;
                        }
                    }
                }
                
                if (!found) return false;
            }
            
            // Outcome filter - use cleaned value for comparison
            if (filters.outcome) {
                const rawOutcome = row['Outcome'];
                const cleanedOutcome = this.cleanOutcomeValue(rawOutcome);
                if (cleanedOutcome !== filters.outcome) return false;
            }
            
            return true;
        });
    },
    
    /**
     * Calculate counts for filter dropdowns
     * @param {Array} data - Data to analyze
     * @returns {Object} Counts for each filter type
     */
    calculateFilterCounts: function(data) {
        const counts = {
            locations: {},
            drugs: {},
            outcomes: {},
            dateRange: { min: null, max: null }
        };
        
        if (!data || !Array.isArray(data)) return counts;
        
        // Standard outcome order
        const outcomeOrder = ['Recovered', 'Recovering', 'Recovered with sequelae', 'Not recovered', 'Died', 'Unknown'];
        
        // Initialize outcome counts
        outcomeOrder.forEach(outcome => {
            counts.outcomes[outcome] = 0;
        });
        
        // Process each row
        data.forEach(row => {
            // Location counts
            const district = row['Reporter district'];
            const state = row['Reporter state or province'];
            
            if (district && district.trim()) {
                counts.locations[district.trim()] = (counts.locations[district.trim()] || 0) + 1;
            }
            if (state && state.trim()) {
                counts.locations[state.trim()] = (counts.locations[state.trim()] || 0) + 1;
            }
            
            // Drug counts (both WHO and reported)
            const whoDrugs = row['Drug name (WHODrug)'];
            if (whoDrugs) {
                const drugs = this.parseDrugNames(whoDrugs);
                drugs.forEach(drug => {
                    counts.drugs[drug] = (counts.drugs[drug] || 0) + 1;
                });
            }
            
            const reportedDrugs = row['Drug name as reported by initial reporter'];
            if (reportedDrugs) {
                const drugs = this.parseDrugNames(reportedDrugs);
                drugs.forEach(drug => {
                    // Only add if not already in WHO drugs
                    if (!counts.drugs[drug]) {
                        counts.drugs[drug] = 1;
                    } else if (!whoDrugs || !this.parseDrugNames(whoDrugs).includes(drug)) {
                        // Increment if not in WHO drugs for this row
                        counts.drugs[drug]++;
                    }
                });
            }
            
            // Outcome counts
            const rawOutcome = row['Outcome'];
            const cleanedOutcome = this.cleanOutcomeValue(rawOutcome);
            counts.outcomes[cleanedOutcome]++;
            
            // Date range
            const dateValue = row['Initial received date'];
            if (dateValue) {
                const date = this.parseInitialReceivedDate(dateValue);
                if (date && !isNaN(date.getTime())) {
                    if (!counts.dateRange.min || date < counts.dateRange.min) {
                        counts.dateRange.min = date;
                    }
                    if (!counts.dateRange.max || date > counts.dateRange.max) {
                        counts.dateRange.max = date;
                    }
                }
            }
        });
        
        // Sort and limit results
        counts.sortedLocations = Object.entries(counts.locations)
            .sort((a, b) => b[1] - a[1])
            .map(([location, count]) => ({ location, count }));
            
        counts.sortedDrugs = Object.entries(counts.drugs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50) // Top 50 drugs
            .map(([drug, count]) => ({ drug, count }));
            
        counts.sortedOutcomes = outcomeOrder
            .filter(outcome => counts.outcomes[outcome] > 0)
            .map(outcome => ({ outcome, count: counts.outcomes[outcome] }));
        
        return counts;
    },
    
    /**
     * Populate filter dropdowns with counts
     * @param {Object} counts - Counts object from calculateFilterCounts
     * @param {Object} elements - DOM elements for dropdowns
     */
    populateFilterDropdowns: function(counts, elements) {
        // Populate location dropdown
        if (elements.location) {
            elements.location.innerHTML = '<option value="">All Locations</option>';
            counts.sortedLocations.forEach(({ location, count }) => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = `${location} (${count})`;
                elements.location.appendChild(option);
            });
        }
        
        // Populate drug dropdown
        if (elements.drug) {
            elements.drug.innerHTML = '<option value="">All Drugs</option>';
            counts.sortedDrugs.forEach(({ drug, count }) => {
                const option = document.createElement('option');
                option.value = drug;
                option.textContent = `${drug} (${count})`;
                elements.drug.appendChild(option);
            });
        }
        
        // Populate outcome dropdown
        if (elements.outcome) {
            elements.outcome.innerHTML = '<option value="">All Outcomes</option>';
            counts.sortedOutcomes.forEach(({ outcome, count }) => {
                const option = document.createElement('option');
                option.value = outcome;
                option.textContent = `${outcome} (${count})`;
                elements.outcome.appendChild(option);
            });
        }
        
        // Set date range limits
        if (elements.startDate && counts.dateRange.min) {
            elements.startDate.min = counts.dateRange.min.toISOString().split('T')[0];
        }
        if (elements.endDate && counts.dateRange.max) {
            elements.endDate.max = counts.dateRange.max.toISOString().split('T')[0];
        }
    }
};