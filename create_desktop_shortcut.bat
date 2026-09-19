@echo off
title Create PORTAL Desktop Icon
color 0a

echo Creating PORTAL Desktop shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create_desktop_shortcut.ps1"
echo.
echo Done! Check your Desktop for the PORTAL shortcut.
pause
