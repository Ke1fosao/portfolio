@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

echo =============================================
echo Налаштування портфоліо Ковтуновича Дмитра
echo =============================================

echo.
echo [1/6] Створення Python-оточення...
cd backend
if not exist venv py -m venv venv
call venv\Scripts\activate.bat

echo.
echo [2/6] Встановлення backend-залежностей...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
if not exist .env copy .env.example .env > nul

echo [3/6] Міграції бази даних...
python manage.py migrate

echo.
echo [4/6] Стартовий контент...
python manage.py seed_portfolio

echo.
echo [5/6] Створення адміністратора...
echo Введіть власний логін, email і пароль.
python manage.py createsuperuser

cd ..\frontend
echo.
echo [6/6] Встановлення frontend-залежностей...
call npm install

cd ..
echo.
echo Готово. Тепер запустіть start_all.bat
pause
