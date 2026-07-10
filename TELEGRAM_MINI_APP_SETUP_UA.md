# Як запустити приватний Telegram Mini App

У проєкті вже готові:

- сторінка Mini App: `/telegram-app`;
- захищений Django API для заявок;
- перевірка цифрового підпису Telegram `initData`;
- доступ тільки для ID з `TELEGRAM_ALLOWED_CHAT_IDS`;
- кнопка **«Відкрити CRM»** у меню бота;
- команди бота, історія доставок і діагностика в `/admin/notifications`.

## Локально

1. Запусти `setup_windows.bat`, якщо середовище ще не створене.
2. Запусти `start_all.bat`.
3. Відкриється frontend, backend і окреме вікно Telegram-бота.
4. Напиши боту `/start`.

Локально працюють сповіщення та команди. Сам Mini App не може нормально відкриватися з `127.0.0.1`, тому що Telegram вимагає публічну HTTPS-адресу.

## Щоб Mini App реально відкрився в Telegram

1. Опублікуй frontend і Django backend у мережі через HTTPS.
2. У `backend/.env` вкажи:

```env
PUBLIC_SITE_URL=https://your-site.example
TELEGRAM_WEBAPP_URL=https://your-site.example/telegram-app
TELEGRAM_ALLOWED_CHAT_IDS=YOUR_TELEGRAM_ID
```

3. У `frontend/.env` вкажи публічну адресу API:

```env
VITE_API_URL=https://your-api.example/api
VITE_SITE_URL=https://your-site.example
```

4. Додай домени frontend/API до `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
5. Перезапусти backend.
6. Запусти `configure_telegram_app.bat` або натисни **«Налаштувати бота й Mini App»** на сторінці `/admin/notifications`.
7. Напиши боту `/start` або `/app`.

## Чому доступ маєш тільки ти

Кожен запит Mini App містить підписані Telegram-дані. Django:

1. перевіряє HMAC-підпис через токен бота;
2. перевіряє час створення сесії;
3. бере Telegram user ID;
4. звіряє його з `TELEGRAM_ALLOWED_CHAT_IDS`.

Навіть якщо хтось дізнається URL Mini App, API не віддасть йому заявки.

## Важливо про токен

Токен бота ніколи не записується у frontend. Він зберігається тільки в `backend/.env`, який уже виключений через `.gitignore`.

Якщо токен колись надсилався в чат або потрапляв у відкритий репозиторій, перевипусти його через `@BotFather` і заміни значення `TELEGRAM_BOT_TOKEN`.
