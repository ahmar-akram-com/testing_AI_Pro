@echo off
REM Deploy DesignQA-AI to Vercel from this Windows folder.
REM
REM What it does:
REM   1. Installs the Vercel CLI globally (if missing).
REM   2. Runs `vercel link` so this folder is linked to a Vercel project.
REM   3. Adds FIGMA_ACCESS_TOKEN to production / preview / development env.
REM   4. Runs `vercel --prod` and prints the live URL.

setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install LTS from https://nodejs.org/ and retry.
  pause
  exit /b 1
)

where vercel >nul 2>nul
if errorlevel 1 (
  echo Installing Vercel CLI globally...
  call npm install -g vercel || (echo "npm install -g vercel failed" & pause & exit /b 1)
)

echo.
echo === Linking this folder to a Vercel project ===
echo If prompted, log in via the browser, then accept the defaults.
call vercel link
if errorlevel 1 (
  echo Vercel link failed.
  pause
  exit /b 1
)

echo.
echo === Adding FIGMA_ACCESS_TOKEN to all environments ===
echo Paste your Figma personal access token when prompted (it does NOT echo).
for %%E in (production preview development) do (
  call vercel env add FIGMA_ACCESS_TOKEN %%E
)

echo.
echo === Deploying to production ===
call vercel --prod
set EXITCODE=%ERRORLEVEL%

echo.
if "%EXITCODE%"=="0" (
  echo Deploy finished. The production URL is printed above.
) else (
  echo Deploy failed with exit code %EXITCODE%. Review the messages above.
)
echo.
pause
exit /b %EXITCODE%
