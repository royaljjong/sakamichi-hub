@echo off
setlocal
set "REPO_DIR=D:\drive\programming\window\Sakamichi Box"

if not exist "%REPO_DIR%\package.json" (
  echo ERROR: Repository not found at "%REPO_DIR%".
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo ERROR: pnpm is not available in PATH.
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: git is not available in PATH.
  pause
  exit /b 1
)

cd /d "%REPO_DIR%"

if /i "%~1"=="--check" (
  echo OK: Repository, pnpm, and git are available.
  echo OK: Refresh command is ready at "%~f0".
  exit /b 0
)

echo === Sakamichi Box Refresh ===
echo.
echo [1/7] Auditing and enriching current official member profiles...
call pnpm data:profiles:write
if errorlevel 1 goto :fetch_failed

echo.
echo [2/7] Rebuilding multilingual search index...
call pnpm search:build
if errorlevel 1 goto :fetch_failed

echo.
echo [3/7] Fetching latest official blogs...
call pnpm exec tsx scripts/fetch/updates.ts
if errorlevel 1 goto :fetch_failed

echo.
echo [4/7] Fetching latest videos...
call pnpm exec tsx scripts/fetch/videos.ts
if errorlevel 1 goto :fetch_failed

echo.
echo [5/7] Fetching supported official events...
call pnpm exec tsx scripts/fetch/events.ts
if errorlevel 1 goto :fetch_failed

echo.
echo [6/7] Validating data, discovery, and coverage...
call pnpm data:validate
if errorlevel 1 (
  echo   Validation FAILED. Aborting commit.
  pause
  exit /b 1
)
call pnpm search:verify
if errorlevel 1 goto :validation_failed
call pnpm data:coverage
if errorlevel 1 goto :validation_failed

echo.
echo [7/7] Committing changes if any...
git add data/members.json data/profile-audit-report.json data/coverage-report.json public/search-index.json data/latest-updates.json data/latest-videos.json data/portal.json 2>nul
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "chore(desktop-refresh): manual data sync %date% %time%"
  if errorlevel 1 (
    echo   Commit failed.
    pause
    exit /b 1
  )
  git push
  if errorlevel 1 (
    echo   Push failed. You may need to pull first.
    pause
    exit /b 1
  )
  echo.
  echo === Data refreshed and pushed successfully ===
) else (
  echo   No new data to commit.
)

echo.
pause
exit /b 0

:fetch_failed
echo.
echo ERROR: A fetch step failed. Validation, commit, and push were skipped.
echo Review the messages above and run this file again later.
pause
exit /b 1

:validation_failed
echo.
echo ERROR: A validation step failed. Commit and push were skipped.
pause
exit /b 1
