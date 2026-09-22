@echo off
title ThunderCard - War Thunder Statcard Editor
color 0b
echo ========================================================
echo   ThunderCard - Modern War Thunder Statcard Editor
echo   Local Windows Edition (Offline)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Node modules not found. Running npm install...
    call npm install
)

echo [2/2] Starting local web application...
echo Opening your browser at http://localhost:5173 ...
echo.
echo Press Ctrl+C in this console window to stop the server when done.
echo.

start http://localhost:5173
call npx vite --open
pause
