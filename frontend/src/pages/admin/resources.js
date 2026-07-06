export const resources = {
  projects: {
    label: 'Проєкти', endpoint: '/projects/', lookup: 'slug', description: 'Кейси, обкладинки, метрики та посилання.',
    fields: [
      ['title','Назва','text'], ['slug','Slug','text'], ['category','Категорія','text'], ['client','Клієнт','text'],
      ['summary','Короткий опис','textarea'], ['challenge','Проблема','textarea'], ['solution','Рішення','textarea'], ['result_text','Результат','textarea'],
      ['live_url','Посилання','text'], ['github_url','GitHub','text'], ['duration','Строк','text'], ['cover_image_url','Зовнішня обкладинка URL (необов’язково)','text'],
      ['technologies','Технології','tags'], ['features','Функції','items', [['title','Назва'],['text','Опис']]], ['metrics','Метрики','items', [['value','Значення'],['label','Підпис']]], ['gallery','Галерея','gallery'],
      ['status','Статус','select', [['published','Опубліковано'],['draft','Чернетка'],['concept','Концепт']]],
      ['featured','На головній','checkbox'], ['ai_integration','AI-інтеграція','checkbox'], ['is_verified_case','Кейс підтверджено','checkbox'], ['is_active','Активний','checkbox'], ['order','Порядок','number'],
    ],
  },
  services: {
    label: 'Послуги', endpoint: '/services/', description: 'Послуги, строки та ціни від.',
    fields: [['title','Назва','text'],['slug','Slug','text'],['summary','Коротко','textarea'],['description','Опис','textarea'],['icon','Іконка','select', [['sparkles','Іскри'],['code','Код'],['bot','AI / бот'],['layers','Система'],['shopping','Магазин'],['globe','Сайт'],['workflow','Автоматизація'],['dashboard','Адмінпанель']]],['price_from_uah','Ціна від, грн','number'],['duration','Строк','text'],['complexity','Складність','text'],['features','Функції','tags'],['premium_note','Примітка','textarea'],['is_active','Активна','checkbox'],['order','Порядок','number']],
  },
  pricing: {
    label: 'Ціни', endpoint: '/pricing/', description: 'Пакети й наповнення тарифів.',
    fields: [['title','Назва','text'],['tagline','Підзаголовок','textarea'],['price_uah','Ціна, грн','number'],['duration','Строк','text'],['features','Що входить','tags'],['complexity_note','Примітка','textarea'],['highlighted','Виділений','checkbox'],['is_active','Активний','checkbox'],['order','Порядок','number']],
  },
  testimonials: {
    label: 'Відгуки', endpoint: '/testimonials/', description: 'Публікуй лише підтверджені відгуки.',
    fields: [['author','Автор','text'],['role','Посада','text'],['company','Компанія','text'],['text','Текст','textarea'],['photo_url','Фото URL','text'],['project','ID проєкту','number'],['is_verified','Підтверджено клієнтом','checkbox'],['is_published','Публікувати','checkbox'],['is_active','Активний','checkbox'],['order','Порядок','number']],
  },
  faqs: {
    label: 'FAQ', endpoint: '/faqs/', description: 'Питання та відповіді для клієнтів.',
    fields: [['question','Питання','text'],['answer','Відповідь','textarea'],['category','Категорія','text'],['is_active','Активне','checkbox'],['order','Порядок','number']],
  },
  posts: {
    label: 'Блог', endpoint: '/posts/', lookup: 'slug', description: 'Статті, обкладинки та статус публікації.',
    fields: [['title','Назва','text'],['slug','Slug','text'],['category','Рубрика','text'],['excerpt','Короткий опис','textarea'],['content','Текст','textarea'],['cover_image_url','Зовнішня обкладинка URL','text'],['seo_title','SEO title','text'],['seo_description','SEO description','textarea'],['is_featured','Головна стаття','checkbox'],['status','Статус','select',[['draft','Чернетка'],['scheduled','Заплановано'],['published','Опубліковано']]],['published_at','Дата публікації','datetime']],
  },
  certificates: {
    label: 'Документи', endpoint: '/certificates/', description: 'Додаткові сертифікати та документи.',
    fields: [['title','Назва','text'],['issuer','Заклад','text'],['description','Опис','textarea'],['file_url','Посилання на файл','text'],['expected_date','Очікувана дата','date'],['is_ready','Готовий','checkbox'],['is_active','Активний','checkbox'],['order','Порядок','number']],
  },
  leads: {
    label: 'Заявки', endpoint: '/leads/', description: 'Звернення з контактної форми.',
    fields: [['name','Ім’я','text'],['contact_method','Спосіб','select',[['telegram','Telegram'],['phone','Телефон'],['email','Email']]],['contact_value','Контакт','text'],['message','Повідомлення','textarea'],['status','Статус','select',[['new','Нова'],['viewed','Переглянута'],['in_progress','У роботі'],['completed','Завершена']]],['notes','Нотатки','textarea']],
  },
}

export const settingsFields = [
  ['full_name','Повне ім’я','text'],['role','Роль','text'],['city','Місто','text'],['age','Вік','number'],['years_experience','Досвід','number'],['availability','Статус','text'],['logo_text','Логотип','text'],
  ['hero_title','Головний заголовок','textarea'],['hero_subtitle','Підзаголовок','textarea'],['about_short','Коротко про мене','textarea'],['about_full','Загальний текст про мене','textarea'],
  ['email','Email','text'],['phone','Телефон','text'],['telegram','Telegram','text'],['instagram','Instagram','text'],['github','GitHub','text'],['linkedin','LinkedIn','text'],['facebook','Facebook','text'],['working_hours','Години','text'],['resume_url','Старе резюме URL','text'],
  ['socials','Соцмережі JSON','json'],['currency_rates','Курси JSON','json'],['seo_title','SEO title','text'],['seo_description','SEO description','textarea'],
]

export const emptyFor = (fields) => Object.fromEntries(fields.map(([key,,type]) => [key, type === 'checkbox' ? false : type === 'json' ? [] : '']))

export function parsePayload(form, fields) {
  const payload = Object.fromEntries(fields.map(([key]) => [key, form[key]]))
  for (const [key,,type] of fields) {
    if (type === 'json' && typeof payload[key] === 'string') {
      try { payload[key] = JSON.parse(payload[key] || '[]') } catch { throw new Error(`Поле «${key}» містить некоректний JSON.`) }
    }
    if (type === 'number' && payload[key] === '') payload[key] = 0
    if ((type === 'date' || type === 'datetime') && payload[key] === '') payload[key] = null
  }
  return payload
}
