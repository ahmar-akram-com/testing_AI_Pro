@echo off
REM Double-click to run the QA test scenarios (positive + negative).
REM Requires that setup-local.ps1 has already been run.

setlocal
cd /d "%~dp0"

if not exist node_modules\ (
  echo node_modules not found. Run RUN-ME.bat first.
  pause
  exit /b 1
)

echo.
echo === Live network test (requires internet access to Figma + targets) ===
call npm run test:qa
set LIVE_EXIT=%ERRORLEVEL%

echo.
echo === Offline fixture test (always runs) ===
call npm run test:qa:offline
set OFFLINE_EXIT=%ERRORLEVEL%

echo.
echo Live test exit code   : %LIVE_EXIT%
echo Offline test exit code: %OFFLINE_EXIT%
echo Reports written to .\reports\
echo.
pause
