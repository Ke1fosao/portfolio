# Оновлення Telegram CRM та сторінки сповіщень

## Що оновлено

- Повністю перероблена сторінка `/admin/notifications`.
- Виправлена помилкова червона плашка після успішного тестового повідомлення.
- Виправлене завантаження центру: збій історії більше не приховує статус і користувача бота.
- Дозволений приватний Telegram автоматично синхронізується з `TELEGRAM_ALLOWED_CHAT_IDS`, навіть якщо polling ще не обробив `/start`.
- Додана безпечна робота під час незастосованої міграції: повідомлення надсилається, а адмінка показує точну інструкцію замість падіння API.
- Mini App більше не вважається критичною помилкою в локальному режимі.
- Автоматичне налаштування бота працює без домену: команди, приватний отримувач і локальна кнопка команд налаштовуються окремо від Mini App.
- Виправлені кольори команд і кодових блоків, які зливалися з фоном.
- Збережені історія доставок Telegram/email, тести, фільтри та керування отримувачами.
- Приватний Telegram Mini App за адресою `/telegram-app` залишається готовим на майбутнє.

## Основні файли

- `frontend/src/pages/admin/NotificationAdmin.jsx`
- `frontend/src/styles/notification-admin-v2.css`
- `frontend/src/pages/TelegramMiniApp.jsx`
- `backend/portfolio/views.py`
- `backend/portfolio/services/notifications.py`
- `backend/portfolio/management/commands/run_telegram_bot.py`
- `backend/portfolio/migrations/0011_notificationdelivery.py`
- `FIX_TELEGRAM_LOCAL.bat`
- `FIX_TELEGRAM_LOCAL_UA.md`

## Перший запуск фіксу

Закрий старі сервери, запусти `FIX_TELEGRAM_LOCAL.bat`, а після завершення — `start_all.bat`.

## Безпека

Токен зберігається тільки в `backend/.env` і не передається у frontend. Доступ до бота обмежується `TELEGRAM_ALLOWED_CHAT_IDS`. Mini App після майбутнього підключення HTTPS додатково перевірятиме підпис Telegram `initData`.
