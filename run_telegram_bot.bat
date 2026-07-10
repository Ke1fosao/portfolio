@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
if not exist venv\Scripts\activate.bat (
  echo Спочатку запусти setup_windows.bat
  pause
  exit /b 1
)
call venv\Scripts\activate.bat
echo Очікую запуск Django та міграцій...
timeout /t 5 > nul
echo Telegram-бот запущено. Не закривай це вікно.
python manage.py run_telegram_bot
pause
