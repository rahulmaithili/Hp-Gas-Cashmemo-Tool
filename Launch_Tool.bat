@echo off
title HP Gas Delivery Memo Pro
color 0A
cls
echo.
echo  =====================================================
echo    HP GAS DELIVERY MEMO PRO - OFFLINE TOOL
echo    By Rahul HP Gas Service
echo  =====================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    )
)

:: Re-check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed on this computer!
    echo.
    echo  Please download and install Node.js from:
    echo  https://nodejs.org  - Download the LTS version
    echo.
    echo  After installing Node.js, run this file again.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js found.

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo.
    echo  [SETUP] First time setup - Installing dependencies...
    echo  This will take 1-2 minutes. Please wait...
    echo.
    npm install --production
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Failed to install dependencies.
        echo  Make sure you have an internet connection for the first run.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Setup complete!
)

:: Create settings.json if it doesn't exist
if not exist "settings.json" (
    echo  [SETUP] Creating default settings...
    echo {} > settings.json
)

echo.
echo  [OK] Starting HP Gas Delivery Memo Pro...
echo  [OK] Opening browser at http://localhost:3001
echo.
echo  To stop the tool, close this window.
echo  =====================================================
echo.

:: Wait 1 second then open browser
timeout /t 1 /nobreak >nul
start "" http://localhost:3001

:: Start the server (keeps running until window is closed)
node server.js

pause
