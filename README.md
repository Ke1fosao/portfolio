# Dmytro Portfolio

Portfolio site and admin panel for Dmytro Kovtunovych.

## Stack

- Frontend: React, Vite
- Backend: Django REST Framework
- Database: SQLite

## What is included

- Public portfolio website
- Admin dashboard
- CRM for leads
- Telegram bot notifications
- Visual editor with preview
- Media library
- SEO center
- Version history
- Trash and soft delete
- Analytics
- Backup and audit log
- Security settings and 2FA

## Local run

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

```powershell
cd frontend
npm install
npm run dev
```

## Notes

- Secrets stay in `backend/.env`
- Git ignores local build artifacts, logs, backups, and virtual environments
- Telegram bot can be started with `python manage.py run_telegram_bot`

