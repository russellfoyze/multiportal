@echo off
title MA HOSSAIN Private Document Portal
color 0b

:: Change working directory to the directory where this script is located
cd /d "%~dp0"

echo ===================================================================
echo   MA HOSSAIN - Private Document Portal & Vault
echo ===================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not added to PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, otherwise install dependencies
if not exist "node_modules\" (
    echo [INFO] Dependencies not detected. Installing npm packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0c
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Next.js portal server...
echo [INFO] URL: http://localhost:3000
echo.
echo Press Ctrl+C in this window anytime to stop the server.
echo ===================================================================
echo.

:: Automatically open default browser after 2 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the Next.js development server
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server exited with an error.
    pause
)
