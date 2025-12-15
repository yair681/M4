@echo off
chcp 65001 >nul 2>&1
cls
color 0A

echo.
echo ====================================================
echo.
echo        MASTERCODE Business Manager
echo        Installing Dependencies...
echo.
echo ====================================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Installing required packages...
echo This may take a few minutes...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo  Installation Complete!
echo ====================================================
echo.
echo Now you can run: start.bat
echo.
pause
