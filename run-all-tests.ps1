# Run all test files one by one, continue on failure
# Usage: .\run-all-tests.ps1

$testFiles = @(
    "demo-login.spec.js",
    "content-moderation.spec.js",
    "User-Moderation.spec.js",
    "activity.spec.js",
    "app-user.spec.js",
    "admin-user-management.spec.js",
    "faq.spec.js",
    "word-moderation.spec.js",
    "sign-out.spec.js",
    "E2E_Module_Flow.spec.js"
)

$passed = 0
$failed = 0
$skipped = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Running All Tests One by One" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($test in $testFiles) {
    Write-Host "`n>>> Running: $test" -ForegroundColor Yellow

    npx playwright test $test --reporter=list

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PASSED: $test" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAILED: $test (continuing...)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "  Total:  $($passed + $failed)" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
