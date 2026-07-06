@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

if not exist backend\.env copy backend\.env.example backend\.env > nul

echo =====================================================
echo Налаштування Telegram та email-сповіщень
ECHO =====================================================
echo.
echo 1. Перевипусти токен у @BotFather.
echo 2. Встав новий токен і TELEGRAM_CHAT_ID у backend\.env.
echo 3. Додай SMTP email та пароль застосунку.
echo 4. Збережи файл і перезапусти backend.
echo.
start "" notepad backend\.env
pause
