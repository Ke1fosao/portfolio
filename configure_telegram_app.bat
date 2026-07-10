@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
if not exist venv\Scripts\activate.bat (
  echo Спочатку запусти setup_windows.bat
  pause
  exit /b 1
)
call venv\Scripts\activate.bat
python manage.py migrate --noinput
if errorlevel 1 (
  echo Помилка міграцій.
  pause
  exit /b 1
)
python manage.py configure_telegram_bot
if errorlevel 1 (
  echo.
  echo Перевір TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_CHAT_IDS і HTTPS TELEGRAM_WEBAPP_URL у backend\.env
  pause
  exit /b 1
)
echo.
echo Telegram Mini App налаштовано.
pause
