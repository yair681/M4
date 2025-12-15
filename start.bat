@echo off
title MasterCode Business Manager - Server
color 0A
cls

echo ========================================
echo   MasterCode Business Manager
echo   Starting Server...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please run INSTALL.bat first or download Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo ERROR: Dependencies not installed!
    echo Please run INSTALL.bat first.
    echo.
    pause
    exit /b 1
)

echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node server.js

REM If server crashes
echo.
echo ========================================
echo Server stopped!
echo ========================================
pause
