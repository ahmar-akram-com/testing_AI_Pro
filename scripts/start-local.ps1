param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 45,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$HealthUrl = "http://127.0.0.1:$Port/api/health"
$AppUrl = "http://localhost:$Port/"

function Test-Health {
  try {
    $health = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 2 -ErrorAction Stop
    return $null -ne $health -and $health.status -eq "ok"
  } catch {
    return $false
  }
}

Push-Location $Root
try {
  if (Test-Health) {
    Write-Host "DesignQA-AI is already running at $AppUrl" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process $AppUrl }
    exit 0
  }

  if (-not (Test-Path ".env.local")) {
    Write-Host "[FATAL] .env.local is missing. Run scripts/setup-local.ps1 first." -ForegroundColor Red
    exit 1
  }
  if (-not (Test-Path "node_modules")) {
    Write-Host "[FATAL] node_modules is missing. Run scripts/setup-local.ps1 first." -ForegroundColor Red
    exit 1
  }

  $logDir = Join-Path $Root "logs"
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  $stamp = (Get-Date -Format "yyyyMMdd-HHmmss")
  $out = Join-Path $logDir "dev-$stamp.out.log"
  $err = Join-Path $logDir "dev-$stamp.err.log"

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor Cyan
  Write-Host " Starting DesignQA-AI at $AppUrl" -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor Cyan
  Write-Host " stdout: $out"
  Write-Host " stderr: $err"
  Write-Host ""

  $env:PORT = "$Port"
  $process = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err -PassThru

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 1000
    if (Test-Health) { $ready = $true; break }
    if ($process.HasExited) {
      Write-Host "[FATAL] npm run dev exited prematurely (code $($process.ExitCode))." -ForegroundColor Red
      break
    }
  }

  if ($ready) {
    Write-Host "DesignQA-AI is READY at $AppUrl" -ForegroundColor Green
    if (-not $NoBrowser) {
      Start-Process $AppUrl
    }
    exit 0
  }

  Write-Host "Server did not become healthy within $TimeoutSeconds seconds." -ForegroundColor Red
  Write-Host ""
  Write-Host "----- last stdout -----"
  if (Test-Path $out) { Get-Content $out -Tail 60 } else { Write-Host "<empty>" }
  Write-Host ""
  Write-Host "----- last stderr -----"
  if (Test-Path $err) { Get-Content $err -Tail 60 } else { Write-Host "<empty>" }
  exit 1
} finally {
  Pop-Location
}
