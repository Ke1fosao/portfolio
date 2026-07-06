# Структура frontend

## Публічні сторінки

Кожна основна URL-сторінка має власний файл у `frontend/src/pages/`:

- `Home.jsx` — головна;
- `Projects.jsx` — список робіт;
- `ProjectDetail.jsx` — сторінка кейсу;
- `Services.jsx` — послуги;
- `About.jsx` — збірка сторінки «Про мене»;
- `Pricing.jsx` — ціни;
- `Blog.jsx` — блог;
- `BlogDetail.jsx` — стаття;
- `Contact.jsx` — контакти;
- `Privacy.jsx` — політика конфіденційності;
- `Terms.jsx` — умови;
- `NotFound.jsx` — 404.

## Сторінка «Про мене»

Велика сторінка додатково розділена на секції в `frontend/src/pages/about/sections/`.
Дані та анімації винесені в `frontend/src/pages/about/hooks/`.

## Адмінпанель «Про мене»

Кожен редактор зберігається в окремому файлі у `frontend/src/pages/admin/about/` і має власний URL.

## Повторно використовувані елементи

- `frontend/src/components/ProjectMedia.jsx` — кодові презентації проєктів;
- `frontend/src/components/admin/` — поля, завантаження файлів та обрізка фото;
- `frontend/src/lib/api.js` — єдиний клієнт Django API.
