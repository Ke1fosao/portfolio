@echo off
chcp 65001 > nul
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Встановлення frontend-залежностей...
  call npm install
)
if exist node_modules\.vite rmdir /s /q node_modules\.vite
call npm run dev -- --force
pause
