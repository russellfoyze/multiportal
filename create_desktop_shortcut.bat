@echo off
title Create MultiPortal Desktop Icon
color 0a

echo Creating MultiPortal Desktop shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create_desktop_shortcut.ps1"
echo.
echo Done! Check your Desktop for the MultiPortal shortcut.
pause
