@echo off
cd /d "%~dp0"
if exist "C:\Program Files\nodejs\node.exe" (
  "C:\Program Files\nodejs\node.exe" tools\publish.mjs
) else (
  node tools\publish.mjs
)
echo.
pause
