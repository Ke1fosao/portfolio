@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

if not exist backend\.env copy backend\.env.example backend\.env > nul

echo =====================================================
echo Telegram, Mini App та email-сповіщення
echo =====================================================
echo.
echo У backend\.env перевір:
echo 1. TELEGRAM_BOT_TOKEN - новий токен від @BotFather.
echo 2. TELEGRAM_ALLOWED_CHAT_IDS - тільки твій Telegram ID.
echo 3. TELEGRAM_WEBAPP_URL - публічна HTTPS-адреса /telegram-app.
echo 4. SMTP-параметри email, якщо потрібні листи.
echo.
echo Після публікації HTTPS запусти configure_telegram_app.bat.
echo Для локального бота достатньо start_all.bat.
echo.
start "" notepad backend\.env
pause
