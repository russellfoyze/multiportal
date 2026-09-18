@echo off
title Create PORTAL Desktop Icon
color 0a

echo Creating Desktop shortcut with Abir Vai Logo...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create_desktop_shortcut.ps1"
echo.
echo Done! Check your Desktop for the PORTAL shortcut with Abir Vai's logo.
pause
