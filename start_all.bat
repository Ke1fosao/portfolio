@echo off
chcp 65001 > nul
cd /d "%~dp0"
start "Django Backend" cmd /k run_backend.bat
start "React Frontend" cmd /k run_frontend.bat
start "Telegram Bot" cmd /k run_telegram_bot.bat
timeout /t 4 > nul
start http://127.0.0.1:5173
