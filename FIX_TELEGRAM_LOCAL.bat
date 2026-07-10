@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

echo =====================================================
echo Виправлення Telegram-центру та локальної бази даних
echo =====================================================
echo.

if not exist "backend\venv\Scripts\activate.bat" (
  echo [ПОМИЛКА] Не знайдено backend\venv.
  echo Спочатку один раз запусти setup_windows.bat
  pause
  exit /b 1
)

echo [1/4] Застосування міграцій без видалення твоїх даних...
cd backend
call venv\Scripts\activate.bat
python manage.py migrate --noinput
if errorlevel 1 goto :error

echo.
echo [2/4] Перевірка Django...
python manage.py check
if errorlevel 1 goto :error

cd ..\frontend
echo.
echo [3/4] Очищення кешу Vite...
if exist node_modules\.vite rmdir /s /q node_modules\.vite

if not exist node_modules (
  echo node_modules не знайдено. Встановлення залежностей...
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo [4/4] Перезбірка frontend...
call npm run build
if errorlevel 1 goto :error

cd ..
echo.
echo =====================================================
echo Готово. Дані та заявки не видалялися.
echo Закрий старі вікна серверів і запусти start_all.bat
echo =====================================================
pause
exit /b 0

:error
cd /d "%~dp0"
echo.
echo [ПОМИЛКА] Виправлення не завершилося. Скопіюй текст помилки з цього вікна.
pause
exit /b 1
