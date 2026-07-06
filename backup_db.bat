@echo off
chcp 65001 > nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$stamp=Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'; $dest=Join-Path '%~dp0backups' $stamp; New-Item -ItemType Directory -Force -Path $dest | Out-Null; Copy-Item '%~dp0backend\db.sqlite3' (Join-Path $dest 'db.sqlite3') -Force; if (Test-Path '%~dp0backend\media') { Copy-Item '%~dp0backend\media' (Join-Path $dest 'media') -Recurse -Force }; Write-Host ('Резервну копію створено: ' + $dest)"
pause
