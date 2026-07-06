@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo Закривайте старі вікна Django та React перед запуском цього файлу.
echo.
if exist frontend\node_modules\.vite rmdir /s /q frontend\node_modules\.vite
if exist frontend\dist rmdir /s /q frontend\dist
cd frontend
if not exist node_modules call npm install
call npm run build
cd ..
start_all.bat
