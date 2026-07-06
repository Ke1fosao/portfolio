@echo off
chcp 65001 > nul
cd /d "%~dp0"
schtasks /Create /F /SC DAILY /ST 22:00 /TN "DmytroPortfolioBackup" /TR "\"%~dp0backup_db.bat\""
echo Щоденне резервне копіювання налаштовано на 22:00.
pause
