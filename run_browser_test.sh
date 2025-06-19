#!/bin/bash

# Simple browser-based test runner for ADR Visualizations
# This script opens the test page in Chrome/Chromium

echo "ADR Visualizations Browser Test Runner"
echo "====================================="

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the test file
TEST_FILE="$DIR/test_all_visualizations.html"

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    echo "Error: Test file not found at $TEST_FILE"
    exit 1
fi

echo "Opening test suite in browser..."
echo "Test file: $TEST_FILE"

# Try different browsers in order of preference
if command -v google-chrome &> /dev/null; then
    echo "Opening with Google Chrome..."
    google-chrome "$TEST_FILE" &
elif command -v chromium-browser &> /dev/null; then
    echo "Opening with Chromium..."
    chromium-browser "$TEST_FILE" &
elif command -v chromium &> /dev/null; then
    echo "Opening with Chromium..."
    chromium "$TEST_FILE" &
elif command -v firefox &> /dev/null; then
    echo "Opening with Firefox..."
    firefox "$TEST_FILE" &
else
    echo "Error: No supported browser found (Chrome, Chromium, or Firefox)"
    echo "Please install one of these browsers to run the tests"
    exit 1
fi

echo ""
echo "Browser opened. Please follow these steps:"
echo "1. Click 'Run All Tests' button to start automated testing"
echo "2. Wait for all tests to complete (progress bar will reach 100%)"
echo "3. Check the test results summary and console output"
echo "4. Failed tests will show error details"
echo ""
echo "The test results will be displayed in the browser."

# Keep the script running
echo "Press Ctrl+C to exit when done..."
wait