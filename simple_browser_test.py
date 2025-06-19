#!/usr/bin/env python3
"""
Simple browser-based test runner for ADR Visualizations
Opens the test page in your default browser
"""

import os
import webbrowser
import subprocess
import platform
import time

def main():
    print("ADR Visualizations - Simple Browser Test Runner")
    print("=" * 50)
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(script_dir, "test_all_visualizations.html")
    
    if not os.path.exists(test_file):
        print(f"Error: Test file not found at {test_file}")
        return 1
    
    # Convert to file URL
    file_url = f"file://{os.path.abspath(test_file)}"
    
    print(f"Opening test suite: {test_file}")
    print()
    
    # Try to open in Chrome/Chromium specifically
    system = platform.system()
    chrome_opened = False
    
    try:
        if system == "Darwin":  # macOS
            subprocess.Popen(["open", "-a", "Google Chrome", file_url])
            chrome_opened = True
        elif system == "Linux":
            # Try different Chrome/Chromium commands
            for browser in ["google-chrome", "chromium-browser", "chromium"]:
                try:
                    subprocess.Popen([browser, file_url])
                    chrome_opened = True
                    print(f"Opened with {browser}")
                    break
                except FileNotFoundError:
                    continue
        elif system == "Windows":
            # Try to find Chrome on Windows
            chrome_paths = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
            ]
            for path in chrome_paths:
                if os.path.exists(path):
                    subprocess.Popen([path, file_url])
                    chrome_opened = True
                    break
    except Exception as e:
        print(f"Could not open Chrome specifically: {e}")
    
    # Fallback to default browser
    if not chrome_opened:
        print("Opening with default browser...")
        webbrowser.open(file_url)
    
    print("\nBrowser opened! Please follow these steps:")
    print("1. Click the 'Run All Tests' button to start automated testing")
    print("2. Wait for all tests to complete (progress bar will reach 100%)")
    print("3. Review the test results:")
    print("   - ✅ Green = Passed (no JavaScript errors)")
    print("   - ⚠️ Orange = Warning (non-critical issues)")
    print("   - ❌ Red = Failed (JavaScript errors found)")
    print("4. Check the Console Output section for detailed error messages")
    print("\nThe test will check all 18 visualizations for:")
    print("- JavaScript syntax errors")
    print("- Runtime errors")
    print("- Missing dependencies")
    print("- Console errors and warnings")
    
    print("\nPress Enter to exit after reviewing the results...")
    input()
    
    return 0

if __name__ == "__main__":
    exit(main())