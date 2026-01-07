# Publish Playwright HTML report to GitHub Pages

This repository contains a Playwright HTML report at `playwright-report/`. To host it on GitHub Pages so it is viewable like https://purushottamqa.github.io/Automation/ use one of the options below.

Prerequisites:
- `git` installed and configured (name/email)
- A GitHub repository and a remote pointing to it (for example `origin`)

Option A — Publish via `docs/` on your default branch (recommended):

1. Ensure you have a remote `origin` pointing to your GitHub repo:

```powershell
git remote add origin https://github.com/USERNAME/REPO.git
git fetch origin
```

2. Run the helper script from the repo root (PowerShell):

```powershell
.\publish-report.ps1 -Remote origin -Branch main
```

3. On GitHub: open repository Settings → Pages and select branch `main` (or your branch) and folder `/docs`.

Option B — Publish to `gh-pages` branch with subtree (alternative):

```powershell
# push the folder as gh-pages (requires git)
git add playwright-report
git commit -m "Add Playwright report"
git push origin main
# then push subtree
git subtree push --prefix playwright-report origin gh-pages
```

Notes:
- If `git` is not installed, install Git for Windows: https://git-scm.com/download/win
- If you want CI automation, I can add a GitHub Actions workflow to publish the report after tests run.

Allure report
--------------

To generate and publish an Allure report (HTML) for Playwright tests, this repo includes a workflow `.github/workflows/publish-allure-report.yml` that:

- runs Playwright tests with the `allure-playwright` reporter
- generates the HTML using `allure` and places it in `allure-report`
- publishes `allure-report` to the `gh-pages` branch so the report is publicly available

How to use locally:

1. Install dev dependencies:

```powershell
npm ci
```

2. Run tests to produce Allure results and generate the report:

```powershell
npm run test:allure
npm run allure:generate
npm run allure:open    # optional: view locally
```

After pushing to GitHub (branch `main`) the workflow will build and publish the report to `gh-pages`. The public URL will be:

https://RichaWadekar.github.io/RDP/
