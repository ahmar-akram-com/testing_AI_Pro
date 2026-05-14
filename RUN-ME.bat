@echo off
REM Double-click this file to install dependencies and launch DesignQA-AI.
REM It calls scripts\setup-local.ps1 -Start, which:
REM   1. Verifies Node.js >= 22
REM   2. Creates .env.local (Figma token pre-populated)
REM   3. Runs npm install
REM   4. Installs Playwright Chromium
REM   5. Type-checks + builds the app
REM   6. Starts the dev server and opens it in your browser

setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo PowerShell is required but was not found on PATH.
  pause
  exit /b 1
)

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-local.ps1" -Start
set EXITCODE=%ERRORLEVEL%

echo.
if "%EXITCODE%"=="0" (
  echo Done. If a browser tab did not open, visit http://localhost:3000
) else (
  echo Setup failed with exit code %EXITCODE%. See the messages above.
)
echo.
pause
exit /b %EXITCODE%
