@echo off
title MA HOSSAIN Private Document Portal
cls
echo ====================================================================
echo   MA HOSSAIN - Private Document Portal ^& Vault Launcher
echo ====================================================================
echo.

cd /d "%~dp0"

REM 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this computer!
    echo Node.js is required to run the portal.
    echo.
    echo Please install Node.js LTS from: https://nodejs.org/
    echo.
    set /p opennode="Would you like to open the Node.js download page now? (Y/N): "
    if /i "%opennode%"=="Y" (
        start https://nodejs.org/
    )
    pause
    exit /b 1
)

echo [OK] Node.js found:
node -v
echo.

REM 2. Check if .env.local exists
if not exist ".env.local" (
    if exist ".env.example" (
        echo [SETUP] Creating .env.local from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [OK] .env.local created successfully.
    ) else (
        echo [WARNING] Neither .env.local nor .env.example was found!
    )
) else (
    echo [OK] Environment file .env.local is present.
)

REM 3. Check if node_modules folder exists
if not exist "node_modules\" (
    echo.
    echo ====================================================================
    echo   First Time Setup: Installing Dependencies (npm install)...
    echo   This will take 1-2 minutes depending on your internet connection.
    echo ====================================================================
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Please check your internet connection and try running 'npm install' manually.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
)

REM 4. Launch the application
echo.
echo ====================================================================
echo   Starting Portal Server on http://localhost:3000 ...
echo ====================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start "" http://localhost:3000

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [NOTE] Server has stopped.
    pause
)
