<#
Runs Playwright tests with Allure reporter, generates the Allure HTML report,
and writes logs to `allure-generate.log` and `playwright-test.log`.

Usage: .\run-allure.ps1
#>

Set-StrictMode -Version Latest

function Ensure-Command([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        return $false
    }
    return $true
}

Write-Output "== Run Allure helper =="

if (-not (Ensure-Command node)) {
    Write-Error "Node.js is not installed or not in PATH. Install Node 18+ from https://nodejs.org/"
    exit 1
}

Write-Output "Installing dependencies (npm ci)..."
npm ci 2>&1 | Tee-Object npm-ci.log

if (-not (Test-Path node_modules)) {
    Write-Error "Dependencies not installed. Check npm-ci.log"
    exit 1
}

if (-not (Ensure-Command java)) {
    Write-Warning "Java not found. Allure CLI may require Java. Install Temurin/OpenJDK and ensure 'java' is on PATH."
}

Write-Output "Running Playwright tests with Allure reporter..."
npx playwright test --reporter=list,allure-playwright 2>&1 | Tee-Object playwright-test.log
$last = $LASTEXITCODE

if ($last -ne 0) {
    Write-Warning "Playwright tests exited with code $last. Check playwright-test.log for failures."
}

if (-not (Test-Path allure-results)) {
    Write-Error "No 'allure-results' directory found. Tests must run with 'allure-playwright' reporter to produce results. See playwright-test.log"
    exit 1
}

Write-Output "Generating Allure HTML report from 'allure-results'..."
npx allure generate allure-results -o allure-report --clean 2>&1 | Tee-Object allure-generate.log
$gen = $LASTEXITCODE

if ($gen -ne 0) {
    Write-Error "Allure generation failed (exit code $gen). See allure-generate.log"
    exit $gen
}

Write-Output "Allure report generated at ./allure-report"
Write-Output "You can open it locally with: npx allure open allure-report"

exit 0
