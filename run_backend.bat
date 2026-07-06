@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
if not exist venv\Scripts\activate.bat (
  echo Спочатку запустіть setup_windows.bat
  pause
  exit /b 1
)
call venv\Scripts\activate.bat
echo Перевірка структури бази даних...
python manage.py migrate --noinput
if errorlevel 1 (
  echo Не вдалося застосувати міграції.
  pause
  exit /b 1
)
python manage.py runserver 127.0.0.1:8000
pause
