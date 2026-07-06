# Портфоліо Ковтуновича Дмитра — структурована версія

Стек: **React + Vite + Tailwind CSS + Django REST Framework + SQLite**.


## Нові заявки та сповіщення

- кожна заявка зберігається в SQLite до спроби сповіщення;
- статуси: **Нова → Переглянута → У роботі → Завершена**;
- підтримуються Telegram та email-сповіщення;
- є honeypot, перевірка контактів, захист від повторної заявки та обмеження частоти;
- секрети зберігаються тільки в `backend/.env`;
- детальна інструкція: `backend/NOTIFICATIONS_SETUP_UA.md`.

Після розпакування запустіть `configure_notifications.bat` або скопіюйте `backend/.env.example` у `backend/.env`, після чого додайте **новий** Telegram-токен, chat ID та SMTP-дані. Токен, який уже надсилався у чат, потрібно перевипустити в `@BotFather`.

## SEO та продуктивність

- метадані `title`, `description`, canonical, Open Graph і Twitter Card для всіх маршрутів;
- окреме OG-зображення BABY LAND;
- JSON-LD `Person`, `Service`, `Article`, `BreadcrumbList`;
- `sitemap.xml` і `robots.txt` створюються автоматично перед `npm run build`;
- production-збірка створює route HTML-shell для Telegram та пошукових краулерів;
- CSS розділено на lazy route chunks, а дві застарілі версії стилів головної видалено;
- окрема сторінка умов роботи: `/work-terms`;
- мобільна нижня панель і повне меню використовуються до 820 px, тому охоплюють також ширину 768 px.

## Налаштування перед production

Перед публікацією замініть локальні адреси на реальний домен:

```text
frontend/.env: VITE_SITE_URL=https://ваш-домен.ua
backend/.env: PUBLIC_SITE_URL=https://ваш-домен.ua
```

Після цього виконайте `npm run build` — sitemap, robots, canonical, Open Graph та HTML-shell маршрутів буде створено заново.

Сторінка `/work-terms` ізольована. Для її видалення достатньо прибрати маршрут у `frontend/src/App.jsx`, посилання у `frontend/src/components/Layout.jsx` та файл `frontend/src/pages/WorkTerms.jsx`.

## Що змінено у цій версії

- кейс BABY LAND тепер показує **дві різні частини продукту**:
  - публічний сайт для батьків;
  - кастомну адмінпанель для працівників;
- обидві презентації побудовані кодом, без вставленої фотографії адмінпанелі;
- великий дубльований напис `BABY LAND` поверх макета прибрано;
- повторна однакова презентація внизу сторінки кейсу прибрана;
- сторінка «Про мене» розділена на окремі компоненти та файли;
- редактор сторінки «Про мене» повністю перебудований;
- кожна частина редактора має окрему адресу;
- завантаження фотографії, обрізка, резюме, диплом і скриншот проєкту винесені в окремий розділ;
- основні публічні сторінки зберігаються в окремих React-файлах;
- Privacy, Terms і 404 також більше не зберігаються разом в одному файлі.

## Структура сторінки «Про мене»

```text
frontend/src/pages/About.jsx
frontend/src/pages/about/constants.js
frontend/src/pages/about/hooks/useAboutData.js
frontend/src/pages/about/hooks/useAboutMotion.js
frontend/src/pages/about/sections/AboutHero.jsx
frontend/src/pages/about/sections/AboutStory.jsx
frontend/src/pages/about/sections/AboutJourney.jsx
frontend/src/pages/about/sections/AboutProject.jsx
frontend/src/pages/about/sections/AboutAI.jsx
frontend/src/pages/about/sections/AboutPrinciples.jsx
frontend/src/pages/about/sections/AboutEducation.jsx
frontend/src/pages/about/sections/AboutFinal.jsx
```

## Адреси редактора «Про мене»

```text
/admin/about/overview    — огляд і готовність контенту
/admin/about/hero        — перший екран і портрет
/admin/about/story       — коротка історія та цифри
/admin/about/journey     — етапи професійного шляху
/admin/about/project     — кейс BABY LAND
/admin/about/ai          — AI-напрям і принципи
/admin/about/education   — коледж і диплом
/admin/about/documents   — портрет, резюме, диплом, скриншот
/admin/about/final       — фінальний заклик
```

Повна адреса прикладу:

```text
http://127.0.0.1:5173/admin/about/project
```

## Основні адреси адмінпанелі

```text
/admin/overview          — огляд
/admin/home              — головна сторінка та загальні налаштування
/admin/projects          — сторінка робіт і кейси
/admin/services          — послуги
/admin/about/overview    — сторінка «Про мене»
/admin/blog              — блог
/admin/contact           — заявки
/admin/pricing           — ціни
/admin/testimonials      — відгуки
/admin/faqs              — FAQ
/admin/certificates      — документи
```

## Перший запуск на Windows

Розпакуй архів у **нову порожню папку**, наприклад:

```text
F:\dmytro_portfolio
```

Запусти:

```text
setup_windows.bat
```

Потім:

```text
start_all.bat
```

Сайт:

```text
http://127.0.0.1:5173
```

Адмінпанель:

```text
http://127.0.0.1:5173/admin/login
```

## Як створити суперкористувача

Найпростіше — запусти:

```text
create_superuser.bat
```

Або вручну у PowerShell:

```powershell
cd backend
venv\Scripts\activate
python manage.py createsuperuser
```

Під час введення пароля символи не показуються — це нормально.

## Фото й документи

У розділі:

```text
http://127.0.0.1:5173/admin/about/documents
```

можна:

- завантажити портрет;
- обрізати його у форматі 4:5;
- змінити масштаб і поворот;
- завантажити резюме;
- завантажити диплом;
- завантажити реальний скриншот головної BABY LAND.

Скриншот BABY LAND замінює лише кодову сцену публічного сайту. Кодова сцена адмінпанелі залишається окремою, тому дві частини продукту не дублюються.

## Ручний запуск

Backend:

```powershell
cd backend
venv\Scripts\activate
python manage.py migrate
python manage.py runserver
```

Frontend в іншому терміналі:

```powershell
cd frontend
npm install
npm run dev
```

## Перевірка

У цій збірці виконано:

```text
npm run build
python manage.py check
python manage.py test
```

React зібрався без помилок, Django system check пройдено, backend-тести пройдено.
