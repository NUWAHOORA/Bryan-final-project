@echo off
echo ==========================================
echo   Pushing changes to GitHub / Vercel
echo ==========================================
echo.

REM Navigate to the script's directory to ensure it runs correctly
cd /d "%~dp0"

echo [1/3] Adding all new changes...
git add .
echo.

echo [2/3] Committing changes...
set /p commitMsg="Enter a message for your commit (or press enter for default): "
if "%commitMsg%"=="" set commitMsg="Update project files"
git commit -m "%commitMsg%"
echo.

echo [3/3] Pushing to GitHub (this will trigger Vercel)...
git push origin main
echo.

echo ==========================================
echo   Done! Vercel should update shortly.
echo ==========================================
pause
