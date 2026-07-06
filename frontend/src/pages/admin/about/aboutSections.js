export const aboutAdminSections = [
  { key: 'hero', label: 'Перший екран', short: 'Вступ', description: 'Заголовок, вступ, фото та підпис.' },
  { key: 'story', label: 'Коротка історія', short: 'Історія', description: 'Маніфест, цифри й головна думка.' },
  { key: 'journey', label: 'Шлях у професію', short: 'Шлях', description: 'Етапи від мрії до першого продукту.' },
  { key: 'project', label: 'Кейс BABY LAND', short: 'Кейс', description: 'Текст, факти й медіа першого кейсу.' },
  { key: 'ai', label: 'AI та принципи', short: 'AI', description: 'AI-схема й підхід до роботи.' },
  { key: 'education', label: 'Освіта', short: 'Освіта', description: 'Коледж, диплом і результат навчання.' },
  { key: 'documents', label: 'Фото й документи', short: 'Файли', description: 'Портрет, резюме, диплом і обкладинка.' },
  { key: 'final', label: 'Фінальний блок', short: 'CTA', description: 'Останній заклик до контакту.' },
]

export const fieldsBySection = {
  hero: [
    ['hero_kicker','Надзаголовок','text'],
    ['hero_title','Головний заголовок','textarea'],
    ['hero_text','Вступний текст','textarea'],
    ['hero_photo_alt','Опис фотографії','text'],
  ],
  story: [
    ['story_title','Заголовок історії','textarea'],
    ['story_text','Перший абзац','textarea'],
    ['story_support_text','Другий абзац','textarea'],
    ['stats','Цифри та факти','items', [['value','Значення'],['label','Пояснення']]],
  ],
  journey: [
    ['journey_heading','Заголовок хронології','textarea'],
    ['journey_intro','Вступ до хронології','textarea'],
    ['journey','Етапи шляху','items', [['index','Номер'],['label','Коротка мітка'],['title','Заголовок'],['text','Опис'],['meta','Технології або результат']]],
  ],
  project: [
    ['babyland_title','Заголовок кейсу','textarea'],
    ['babyland_text','Опис кейсу','textarea'],
    ['project_facts','Факти кейсу','items', [['value','Значення'],['label','Пояснення']]],
  ],
  ai: [
    ['ai_title','Заголовок AI-блоку','textarea'],
    ['ai_text','Опис AI-напряму','textarea'],
    ['ai_items','Вузли AI-схеми','items', [['title','Назва'],['text','Що виконує'],['icon','Ключ іконки']]],
    ['principles_title','Заголовок принципів','textarea'],
    ['principles','Принципи роботи','items', [['number','Номер'],['title','Назва'],['text','Пояснення'],['icon','Ключ іконки']]],
  ],
  education: [
    ['education_title','Заголовок освіти','textarea'],
    ['education_text','Текст про освіту','textarea'],
    ['college_name','Навчальний заклад','text'],
    ['diploma_title','Статус диплома','text'],
    ['diploma_description','Опис диплома','textarea'],
  ],
  final: [
    ['final_kicker','Надзаголовок','text'],
    ['final_title','Фінальний заголовок','textarea'],
    ['final_text','Фінальний текст','textarea'],
  ],
}
