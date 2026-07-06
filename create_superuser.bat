@echo off
chcp 65001 > nul
cd /d "%~dp0backend"
if not exist venv\Scripts\activate.bat (
  echo Спочатку запустіть setup_windows.bat
  pause
  exit /b 1
)
call venv\Scripts\activate.bat
python manage.py createsuperuser
pause
