@echo off
title ThunderCard - Standalone Python Server
color 0a
echo ========================================================
echo   ThunderCard - Standalone Python Web Server
echo   Serving pre-built distribution locally on Windows
echo ========================================================
echo.

cd /d "%~dp0\dist"

echo Starting server on http://localhost:8080 ...
start http://localhost:8080
python -m http.server 8080
pause
