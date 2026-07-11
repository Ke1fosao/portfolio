# Портфоліо Дмитра Ковтуновича

[![React](https://img.shields.io/badge/React-frontend-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Django](https://img.shields.io/badge/Django-API-0C4B33?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deployment-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Персональний сайт **Ковтуновича Дмитра Валерійовича**, Full-stack developer із Рівного. Проєкт поєднує публічне портфоліо, блог, сторінки послуг і вартості з повноцінною CRM та кастомною панеллю керування.

## Живий сайт

**[Відкрити портфоліо](https://portfolio-ke1fosaos-projects.vercel.app)**

> Frontend розгортається на Vercel. Django API, база даних, CRM-функції та Telegram-інтеграція потребують окремого backend deployment і значення `VITE_API_URL`.

## Можливості

### Публічна частина

- адаптивна українська та англійська версії;
- головна сторінка, інформація про розробника, послуги та ціни;
- портфоліо з детальними сторінками проєктів;
- блог, контакти, умови роботи та юридичні сторінки;
- SEO-метадані, sitemap, robots.txt і статичні route shells;
- форми заявок та інтеграція з backend API;
- Google Analytics і Search Console verification через env-змінні.

### Панель керування

- CRM заявок зі статусами, пошуком і фільтрами;
- керування проєктами, послугами, блогом і сторінками сайту;
- візуальний редактор і live preview;
- медіабібліотека, SEO-центр і аналітика;
- історія версій, кошик, резервні копії та журнал дій;
- центр сповіщень, Telegram-бот і Telegram Mini App;
- налаштування безпеки та двофакторна автентифікація.

## Технології

| Частина | Технології |
|---|---|
| Frontend | React, Vite, React Router, Axios, Tailwind CSS, Lucide React |
| Backend | Python, Django, Django REST Framework |
| Database | SQLite локально; для production рекомендовано PostgreSQL |
| Інтеграції | Telegram Bot API, email-сповіщення, Google Analytics |
| Deployment | Vercel для frontend; Render або Railway для backend |

## Структура

```text
portfolio/
├── frontend/          # React/Vite сайт і кастомна адмінпанель
│   ├── public/        # Статичні файли, robots.txt, sitemap.xml
│   ├── scripts/       # Генерація SEO та статичних route shells
│   └── src/           # Компоненти, сторінки, стилі, API та i18n
├── backend/           # Django REST API, CRM та інтеграції
├── vercel.json        # Конфігурація frontend deployment
└── README.md
```

## Локальний запуск

### 1. Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Для macOS/Linux активація середовища виконується командою `source venv/bin/activate`.

### 2. Frontend

```powershell
cd frontend
npm ci
copy .env.example .env
npm run dev
```

Після запуску сайт доступний за адресою `http://127.0.0.1:5173`.

## Змінні середовища frontend

| Змінна | Призначення |
|---|---|
| `VITE_API_URL` | Повна адреса Django API, наприклад `https://api.example.com/api` |
| `VITE_SITE_URL` | Канонічна адреса frontend для SEO та sitemap |
| `VITE_SITE_NAME` | Назва сайту в метаданих |
| `VITE_GA_ID` | Google Analytics Measurement ID (необов’язково) |
| `VITE_GOOGLE_SITE_VERIFICATION` | Код підтвердження Google Search Console (необов’язково) |

Секрети зберігаються лише у локальних `.env` або в налаштуваннях хостингу. Файли зі справжніми ключами не потрібно додавати в Git.

## Production-збірка

```bash
cd frontend
npm ci
VITE_SITE_URL=https://portfolio-ke1fosaos-projects.vercel.app npm run build
npm run preview
```

Результат створюється у `frontend/dist`. Під час збірки автоматично генеруються sitemap і окремі HTML-shells для публічних маршрутів.

## Деплой

Кореневий `vercel.json` налаштовує Vercel на:

- встановлення залежностей із `frontend/package-lock.json`;
- виконання production-збірки Vite;
- публікацію `frontend/dist`;
- коректну роботу прямих переходів React Router.

Після підключення репозиторію до Vercel кожен push у `main` автоматично створює новий production deployment. Для повної роботи заявок, CRM та адмінпанелі потрібно окремо розгорнути Django backend, дозволити CORS для frontend-домену й задати production `VITE_API_URL` у Vercel.

## Автор

**Дмитро Ковтунович** — Full-stack developer, Рівне, Україна.

- [GitHub](https://github.com/Ke1fosao)
- [LinkedIn](https://www.linkedin.com/in/ke1fosao/)
