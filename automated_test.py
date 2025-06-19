#!/usr/bin/env python3
"""
Automated test script for ADR Visualizations
Tests all visualization pages for JavaScript errors and functionality
"""

import os
import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_results.log'),
        logging.StreamHandler()
    ]
)

class ADRVisualizationTester:
    def __init__(self, base_path):
        self.base_path = base_path
        self.results = {}
        self.driver = None
        
        # List of all visualizations to test
        self.visualizations = [
            {
                'name': 'ADR Dashboard',
                'file': 'adr_dashboard.html',
                'category': 'Dashboard',
                'has_upload': True
            },
            {
                'name': 'ADR by Initial Received Date',
                'file': 'visualizations/adr_received_date.html',
                'category': 'Temporal Analysis',
                'has_upload': True
            },
            {
                'name': 'ADR by Reaction Onset Date',
                'file': 'visualizations/adr_onset_date.html',
                'category': 'Temporal Analysis',
                'has_upload': True
            },
            {
                'name': 'ADR Age Group Analysis',
                'file': 'visualizations/adr_age_group_upon_initial_reaction.html',
                'category': 'Demographics',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Sex',
                'file': 'visualizations/adr_sex.html',
                'category': 'Demographics',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Report Type',
                'file': 'visualizations/adr_report_types.html',
                'category': 'Report Characteristics',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Seriousness',
                'file': 'visualizations/adr_seriousness.html',
                'category': 'Report Characteristics',
                'has_upload': True
            },
            {
                'name': 'ADR Serious Outcomes',
                'file': 'visualizations/adr_seriousness_outcomes.html',
                'category': 'Report Characteristics',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Outcome',
                'file': 'visualizations/adr_outcome.html',
                'category': 'Case Outcomes',
                'has_upload': True
            },
            {
                'name': 'ADR Drug Analysis',
                'file': 'visualizations/adr_drug_analysis.html',
                'category': 'Drug Analysis',
                'has_upload': True
            },
            {
                'name': 'ADR Drug Reported',
                'file': 'visualizations/adr_drug_reported.html',
                'category': 'Drug Analysis',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Pregnancy',
                'file': 'visualizations/adr_pregnancy.html',
                'category': 'Special Populations',
                'has_upload': True
            },
            {
                'name': 'ADR Cases by Lactation',
                'file': 'visualizations/adr_lactation.html',
                'category': 'Special Populations',
                'has_upload': True
            },
            {
                'name': 'ADR Reporter Qualification',
                'file': 'visualizations/adr_reporter_qualification.html',
                'category': 'Reporter Information',
                'has_upload': True
            },
            {
                'name': 'ADR Reporter Organization',
                'file': 'visualizations/adr_reporter_organization.html',
                'category': 'Reporter Information',
                'has_upload': True
            },
            {
                'name': 'ADR Action Taken',
                'file': 'visualizations/adr_action_taken.html',
                'category': 'Reporter Information',
                'has_upload': True
            },
            {
                'name': 'ADR Reporter District',
                'file': 'visualizations/adr_reporter_district.html',
                'category': 'Geographic Analysis',
                'has_upload': True
            },
            {
                'name': 'ADR Reporter State/Province',
                'file': 'visualizations/adr_reporter_state_province.html',
                'category': 'Geographic Analysis',
                'has_upload': True
            }
        ]
    
    def setup_driver(self):
        """Set up Chrome driver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Enable logging to capture console errors
        chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            logging.info("Chrome driver initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize Chrome driver: {e}")
            raise
    
    def get_console_errors(self):
        """Get JavaScript console errors from the browser"""
        errors = []
        try:
            logs = self.driver.get_log('browser')
            for log in logs:
                if log['level'] in ['SEVERE', 'ERROR']:
                    errors.append({
                        'level': log['level'],
                        'message': log['message'],
                        'timestamp': log['timestamp']
                    })
        except Exception as e:
            logging.warning(f"Could not retrieve console logs: {e}")
        return errors
    
    def check_page_elements(self, viz):
        """Check if expected page elements are present"""
        checks = {}
        
        try:
            # Check for upload section
            if viz.get('has_upload'):
                upload_element = self.driver.find_element(By.ID, 'upload-area')
                checks['upload_area'] = upload_element is not None
            
            # Check for common elements
            checks['loading_spinner'] = len(self.driver.find_elements(By.ID, 'loading')) > 0
            checks['success_message'] = len(self.driver.find_elements(By.ID, 'success-message')) > 0
            checks['error_message'] = len(self.driver.find_elements(By.ID, 'error-message')) > 0
            
            # Check if Chart.js is loaded
            charts_loaded = self.driver.execute_script("return typeof Chart !== 'undefined'")
            checks['chartjs_loaded'] = charts_loaded
            
            # Check if XLSX is loaded
            xlsx_loaded = self.driver.execute_script("return typeof XLSX !== 'undefined'")
            checks['xlsx_loaded'] = xlsx_loaded
            
        except Exception as e:
            logging.error(f"Error checking page elements: {e}")
            
        return checks
    
    def test_visualization(self, viz):
        """Test a single visualization"""
        logging.info(f"Testing: {viz['name']}")
        
        result = {
            'name': viz['name'],
            'category': viz['category'],
            'file': viz['file'],
            'status': 'pending',
            'errors': [],
            'warnings': [],
            'page_load_time': 0,
            'element_checks': {}
        }
        
        try:
            # Construct full URL
            file_path = os.path.join(self.base_path, viz['file'])
            url = f"file://{file_path}"
            
            # Measure page load time
            start_time = time.time()
            self.driver.get(url)
            
            # Wait for page to fully load
            WebDriverWait(self.driver, 10).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            result['page_load_time'] = time.time() - start_time
            
            # Give JavaScript time to execute
            time.sleep(2)
            
            # Check for console errors
            console_errors = self.get_console_errors()
            for error in console_errors:
                result['errors'].append(error['message'])
            
            # Check page elements
            result['element_checks'] = self.check_page_elements(viz)
            
            # Check for JavaScript errors using execute_script
            js_errors = self.driver.execute_script("""
                var errors = [];
                window.addEventListener('error', function(e) {
                    errors.push(e.message + ' at ' + e.filename + ':' + e.lineno);
                });
                return errors;
            """)
            
            if js_errors:
                result['errors'].extend(js_errors)
            
            # Determine status
            if len(result['errors']) == 0:
                result['status'] = 'passed'
                logging.info(f"✅ {viz['name']} - PASSED")
            else:
                result['status'] = 'failed'
                logging.error(f"❌ {viz['name']} - FAILED with {len(result['errors'])} errors")
                for error in result['errors']:
                    logging.error(f"  Error: {error}")
            
        except TimeoutException:
            result['status'] = 'failed'
            result['errors'].append('Page load timeout')
            logging.error(f"❌ {viz['name']} - TIMEOUT")
        except Exception as e:
            result['status'] = 'failed'
            result['errors'].append(str(e))
            logging.error(f"❌ {viz['name']} - ERROR: {e}")
        
        self.results[viz['name']] = result
        return result
    
    def run_all_tests(self):
        """Run tests on all visualizations"""
        logging.info("Starting automated tests for all ADR visualizations")
        logging.info(f"Total visualizations to test: {len(self.visualizations)}")
        
        self.setup_driver()
        
        try:
            for i, viz in enumerate(self.visualizations):
                logging.info(f"\nTest {i+1}/{len(self.visualizations)}")
                self.test_visualization(viz)
                
        finally:
            if self.driver:
                self.driver.quit()
                logging.info("Chrome driver closed")
    
    def generate_report(self):
        """Generate test report"""
        passed = sum(1 for r in self.results.values() if r['status'] == 'passed')
        failed = sum(1 for r in self.results.values() if r['status'] == 'failed')
        
        report = {
            'test_date': datetime.now().isoformat(),
            'summary': {
                'total': len(self.visualizations),
                'passed': passed,
                'failed': failed,
                'pass_rate': f"{(passed/len(self.visualizations)*100):.1f}%"
            },
            'results': self.results
        }
        
        # Save JSON report
        with open('test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Generate HTML report
        self.generate_html_report(report)
        
        # Print summary
        logging.info("\n" + "="*50)
        logging.info("TEST SUMMARY")
        logging.info("="*50)
        logging.info(f"Total Tests: {len(self.visualizations)}")
        logging.info(f"Passed: {passed}")
        logging.info(f"Failed: {failed}")
        logging.info(f"Pass Rate: {report['summary']['pass_rate']}")
        
        if failed > 0:
            logging.info("\nFAILED TESTS:")
            for name, result in self.results.items():
                if result['status'] == 'failed':
                    logging.info(f"- {name}")
                    for error in result['errors']:
                        logging.info(f"  Error: {error}")
    
    def generate_html_report(self, report):
        """Generate HTML test report"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>ADR Visualization Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .error-list {{ background: #ffebee; padding: 10px; margin: 5px 0; border-radius: 3px; }}
    </style>
</head>
<body>
    <h1>ADR Visualization Test Report</h1>
    <p>Generated: {report['test_date']}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: {report['summary']['total']}</p>
        <p class="passed">Passed: {report['summary']['passed']}</p>
        <p class="failed">Failed: {report['summary']['failed']}</p>
        <p>Pass Rate: {report['summary']['pass_rate']}</p>
    </div>
    
    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Visualization</th>
            <th>Category</th>
            <th>Status</th>
            <th>Load Time</th>
            <th>Errors</th>
        </tr>
"""
        
        for name, result in report['results'].items():
            status_class = 'passed' if result['status'] == 'passed' else 'failed'
            errors_html = ''
            if result['errors']:
                errors_html = '<div class="error-list">' + '<br>'.join(result['errors']) + '</div>'
            
            html += f"""
        <tr>
            <td>{result['name']}</td>
            <td>{result['category']}</td>
            <td class="{status_class}">{result['status'].upper()}</td>
            <td>{result['page_load_time']:.2f}s</td>
            <td>{errors_html}</td>
        </tr>
"""
        
        html += """
    </table>
</body>
</html>
"""
        
        with open('test_report.html', 'w') as f:
            f.write(html)
        
        logging.info("\nTest reports generated:")
        logging.info("- test_report.json")
        logging.info("- test_report.html")
        logging.info("- test_results.log")


def main():
    # Get the base path for visualizations
    base_path = os.path.abspath(os.path.dirname(__file__))
    
    # Create tester instance and run tests
    tester = ADRVisualizationTester(base_path)
    
    try:
        tester.run_all_tests()
        tester.generate_report()
    except Exception as e:
        logging.error(f"Test execution failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())