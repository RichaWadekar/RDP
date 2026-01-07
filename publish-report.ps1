param(
    [string]$Remote = 'origin',
    [string]$Branch = ''
)

# Publish Playwright HTML report to GitHub Pages using `docs/` on the default branch.
# Usage: .\publish-report.ps1 -Remote origin -Branch main

function Ensure-Git {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) {
        Write-Error "Git is not installed or not in PATH. Install Git for Windows and reopen the terminal."
        exit 1
    }
}

Ensure-Git

if (-not (Test-Path playwright-report)) {
    Write-Error "playwright-report folder not found in the current directory. Run Playwright tests to generate the report first."
    exit 1
}

if (-not $Branch) {
    $Branch = git rev-parse --abbrev-ref HEAD 2>$null
    if (-not $Branch) { $Branch = 'main' }
}

Write-Output "Using remote: $Remote and branch: $Branch"

# Copy report to docs/
if (Test-Path docs) {
    Write-Output "Removing existing docs/"
    Remove-Item -Recurse -Force docs
}

Write-Output "Copying playwright-report -> docs/"
robocopy playwright-report docs /E /NJH /NJS /NDL /NFL | Out-Null

# Stage and commit
git add docs
$status = git status --porcelain
if (-not $status) {
    Write-Output "No changes detected (report identical)."
} else {
    git commit -m "Publish Playwright report to docs for GitHub Pages" || Write-Output "No commit created (maybe nothing to commit)."
}

Write-Output "Pushing to $Remote/$Branch"
git push $Remote $Branch

Write-Output "Done. On GitHub: enable Pages from branch '$Branch' and folder '/docs' in repository settings."
