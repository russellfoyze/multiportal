@echo off
title MA HOSSAIN Private Document Vault
color 0b

echo ===================================================================
echo   MA HOSSAIN - Private Document Portal & Vault (Abir Vai)
echo ===================================================================
echo.

:: 1. Detect and switch to the PORTAL application directory
if exist "C:\Users\Flindor\OneDrive\Desktop\PORTAL\package.json" (
    cd /d "C:\Users\Flindor\OneDrive\Desktop\PORTAL"
) else if exist "%~dp0package.json" (
    cd /d "%~dp0"
) else if exist "%~dp0PORTAL\package.json" (
    cd /d "%~dp0PORTAL"
) else if exist "%USERPROFILE%\OneDrive\Desktop\PORTAL\package.json" (
    cd /d "%USERPROFILE%\OneDrive\Desktop\PORTAL"
) else if exist "%USERPROFILE%\Desktop\PORTAL\package.json" (
    cd /d "%USERPROFILE%\Desktop\PORTAL"
) else (
    color 0c
    echo [ERROR] Could not locate the PORTAL folder!
    echo Looked in:
    echo   - C:\Users\Flindor\OneDrive\Desktop\PORTAL
    echo   - %~dp0
    echo   - %~dp0PORTAL
    echo.
    pause
    exit /b 1
)

echo [INFO] App Directory: %CD%
echo.

:: 2. Ensure Desktop shortcut with Abir Vai's custom logo icon exists
if exist "scripts\create_desktop_shortcut.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\create_desktop_shortcut.ps1" >nul 2>&1
)

:: 3. Verify Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not added to your system PATH.
    echo Please download and install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 4. Check for dependencies and install if missing
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
echo [INFO] Portal URL: http://localhost:3000
echo.
echo Press Ctrl+C in this window anytime to stop the server.
echo ===================================================================
echo.

:: 5. Automatically open default browser after 2 seconds
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: 6. Run the Next.js server
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server exited with an error code.
    pause
)
