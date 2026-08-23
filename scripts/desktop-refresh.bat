@echo off
setlocal enabledelayedexpansion
cd /d "D:\drive\programming\window\Sakamichi Box"

echo === Sakamichi Box Refresh ===
echo.
echo [1/5] Fetching latest official blogs...
call pnpm exec tsx scripts/fetch/updates.ts
if errorlevel 1 echo   (blog fetch had issues, continuing)

echo.
echo [2/5] Fetching latest videos...
call pnpm exec tsx scripts/fetch/videos.ts
if errorlevel 1 echo   (video fetch had issues, continuing)

echo.
echo [3/5] Fetching events (Nogizaka46 + Sakurazaka46 + Hinatazaka46)...
call pnpm exec tsx scripts/fetch/events.ts
if errorlevel 1 echo   (events fetch had issues, continuing)

echo.
echo [4/5] Validating data...
call pnpm data:validate
if errorlevel 1 (
  echo   Validation FAILED. Aborting commit.
  pause
  exit /b 1
)

echo.
echo [5/5] Committing changes if any...
git add data/latest-updates.json data/latest-videos.json data/portal.json 2>nul
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
