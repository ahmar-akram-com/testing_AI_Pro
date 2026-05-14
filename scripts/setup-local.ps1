param(
  [switch]$Start,
  [switch]$SkipLint,
  [switch]$SkipBuild,
  [switch]$SkipPlaywrightTest
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $Root "logs"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok($Message) {
  Write-Host "    [OK] $Message" -ForegroundColor Green
}

function Write-Warn2($Message) {
  Write-Host "    [WARN] $Message" -ForegroundColor Yellow
}

function Assert-Command($Name, [string]$Install) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "[FATAL] '$Name' is not installed or not on PATH." -ForegroundColor Red
    if ($Install) { Write-Host "        Install with: $Install" -ForegroundColor Yellow }
    exit 1
  }
}

function Invoke-Checked($File, [string[]]$Arguments) {
  Write-Host "    > $File $($Arguments -join ' ')" -ForegroundColor DarkGray
  & $File @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$File $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

Push-Location $Root
try {
  Write-Host ""
  Write-Host "================================================================" -ForegroundColor Magenta
  Write-Host " DesignQA-AI :: local setup" -ForegroundColor Magenta
  Write-Host "================================================================" -ForegroundColor Magenta
  Write-Host " Working folder: $Root"

  Write-Step "1/7  Checking runtime"
  Assert-Command "node" "https://nodejs.org/en/download (LTS >= 22)"
  Assert-Command "npm"  "ships with Node.js"

  $nodeVersion = (& node -p "process.versions.node").Trim()
  $nodeMajor = [int]($nodeVersion.Split(".")[0])
  if ($nodeMajor -lt 22) {
    Write-Host "[FATAL] Node.js >= 22 is required. Found $nodeVersion." -ForegroundColor Red
    Write-Host "        Install the latest LTS from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
  }
  Write-Ok "Node.js $nodeVersion"

  Write-Step "2/7  Ensuring .env.local"
  if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
      Copy-Item ".env.example" ".env.local"
    } else {
      "" | Out-File -FilePath ".env.local" -Encoding utf8
    }
    Set-Content ".env.local" @"
FIGMA_ACCESS_TOKEN=PASTE_YOUR_FIGMA_TOKEN_HERE
GEMINI_API_KEY=
PORT=3000
QA_TIMEOUT_MS=240000
MAX_VISUAL_MATCHES=10
LOGO_IMAGE_MATCH_THRESHOLD=72
TARGET_HTML_TIMEOUT_MS=15000
"@
    Write-Ok ".env.local created (Figma token pre-populated)."
  } else {
    Write-Ok ".env.local already present."
  }

  $envText = Get-Content ".env.local" -Raw
  if ($envText -notmatch "(?m)^FIGMA_ACCESS_TOKEN=\S+") {
    Write-Warn2 "FIGMA_ACCESS_TOKEN is empty in .env.local - add it before running QA."
  }
  if ($envText -notmatch "(?m)^GEMINI_API_KEY=\S+") {
    Write-Warn2 "GEMINI_API_KEY is empty in .env.local (only needed for placeholder generation)."
  }

  Write-Step "3/7  Cleaning previous failed installs"
  if (Test-Path "node_modules/.package-lock.json") {
    Write-Ok "node_modules looks usable - skipping clean."
  } else {
    if (Test-Path "node_modules") {
      Write-Warn2 "Removing partial node_modules - this can take a moment."
      Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
  }

  Write-Step "4/7  Installing npm dependencies"
  Invoke-Checked "npm.cmd" @("install", "--no-audit", "--no-fund", "--loglevel=error")

  Write-Step "5/7  Installing Playwright Chromium"
  $playwrightChromium = ""
  try { $playwrightChromium = (& node -e "process.stdout.write(require('playwright').chromium.executablePath())") } catch {}
  if ($playwrightChromium -and (Test-Path $playwrightChromium)) {
    Write-Ok "Playwright Chromium already installed at $playwrightChromium"
  } else {
    Invoke-Checked "npx.cmd" @("--yes", "playwright", "install", "chromium")
  }

  if (-not $SkipLint) {
    Write-Step "6/7  TypeScript check (lint)"
    try { Invoke-Checked "npm.cmd" @("run", "lint") } catch { Write-Warn2 "Lint reported issues - continuing." }
  } else {
    Write-Step "6/7  TypeScript check (skipped)"
  }

  if (-not $SkipBuild) {
    Write-Step "7/7  Production build (sanity)"
    try { Invoke-Checked "npm.cmd" @("run", "build") } catch { Write-Warn2 "Build reported issues - continuing." }
  } else {
    Write-Step "7/7  Production build (skipped)"
  }

  if (-not $SkipPlaywrightTest) {
    Write-Step "Verifying Playwright launch"
    try {
      Invoke-Checked "node" @("-e", "const { chromium } = require('playwright'); (async()=>{ const browser = await chromium.launch({ headless: true }); const page = await browser.newPage(); await page.goto('data:text/html,<title>ok</title>'); console.log('    Chromium loaded:', await page.title()); await browser.close(); })().catch(err=>{ console.error(err); process.exit(1); })")
      Write-Ok "Chromium launches cleanly."
    } catch {
      Write-Warn2 "Playwright launch test failed. The app will still start, but live DOM capture may not work."
    }
  }

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor Green
  Write-Host " SETUP COMPLETE" -ForegroundColor Green
  Write-Host "================================================================" -ForegroundColor Green
  Write-Host ""
  Write-Host " Start the app : npm run dev"
  Write-Host " Open in browser: http://localhost:3000"
  Write-Host ""
  Write-Host " Run QA tests  : npm run test:qa            (live network)"
  Write-Host "                 npm run test:qa:offline    (fixtures, no network)"
  Write-Host ""

  if ($Start) {
    Write-Step "Launching dev server"
    & "$PSScriptRoot\start-local.ps1"
  }
} catch {
  Write-Host ""
  Write-Host "[ABORTED] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  Pop-Location
}
