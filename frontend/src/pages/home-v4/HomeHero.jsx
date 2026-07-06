import { useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Database,
  FilePenLine,
  Globe2,
  Sparkles,
} from 'lucide-react'

const systemTabs = [
  {
    id: 'site',
    label: 'Сайт',
    icon: Globe2,
    eyebrow: 'Публічна частина',
    title: 'Сайт, який веде до заявки',
    status: 'LIVE',
    stats: [
      { label: 'Нові звернення', value: '+07', note: 'за цей тиждень' },
      { label: 'Конверсійні точки', value: '06', note: 'у структурі сайту' },
    ],
    feed: [
      { title: 'Відвідувач відкрив послугу', text: 'Перейшов до форми консультації', time: 'зараз' },
      { title: 'Форму успішно надіслано', text: 'Контакт збережено в системі', time: '12 с' },
      { title: 'Менеджеру створено задачу', text: 'Заявка вже готова до обробки', time: '1 хв' },
    ],
  },
  {
    id: 'leads',
    label: 'Заявки',
    icon: Database,
    eyebrow: 'Робочий простір',
    title: 'Усі звернення в одному місці',
    status: 'SYNC',
    stats: [
      { label: 'Нові ліди', value: '07', note: 'потребують відповіді' },
      { label: 'У роботі', value: '12', note: 'зі збереженою історією' },
    ],
    feed: [
      { title: 'Нова заявка з сайту', text: 'Бюджет і послуга вже зазначені', time: 'зараз' },
      { title: 'Статус змінено', text: 'Клієнт перейшов у «Переговори»', time: '4 хв' },
      { title: 'Нагадування заплановано', text: 'Система не дасть втратити контакт', time: '1 год' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Bot,
    eyebrow: 'Автоматизація',
    title: 'AI бере на себе повторювані дії',
    status: 'ONLINE',
    stats: [
      { label: 'AI-сценарії', value: '04', note: 'активні зараз' },
      { label: 'Чернетки відповідей', value: '19', note: 'підготовлено за день' },
    ],
    feed: [
      { title: 'AI визначив запит клієнта', text: 'Потрібен сайт із адмінпанеллю', time: 'зараз' },
      { title: 'Відповідь підготовлено', text: 'Менеджеру залишилось перевірити', time: '8 с' },
      { title: 'Лід кваліфіковано', text: 'Бюджет і строки додано до картки', time: '22 с' },
    ],
  },
  {
    id: 'content',
    label: 'Контент',
    icon: Sparkles,
    eyebrow: 'Керування сайтом',
    title: 'Оновлення без звернення до розробника',
    status: 'READY',
    stats: [
      { label: 'Матеріали', value: '32', note: 'опубліковано' },
      { label: 'Чернетки', value: '05', note: 'готові до перевірки' },
    ],
    feed: [
      { title: 'Створено нову сторінку', text: 'Структуру збережено автоматично', time: 'зараз' },
      { title: 'Фото оптимізовано', text: 'Сайт залишиться швидким', time: '16 с' },
      { title: 'Зміни опубліковано', text: 'Новий контент уже бачать клієнти', time: '2 хв' },
    ],
  },
]

export default function HomeHero({ settings, telegram }) {
  const [activeTab, setActiveTab] = useState('site')
  const panel = systemTabs.find((item) => item.id === activeTab) || systemTabs[0]

  return (
    <section className="sales3-hero" id="top">
      <div className="sales3-shell sales3-hero-grid">
        <div className="sales3-hero-copy">
          <div className="sales3-availability" data-sales-reveal>
            <span><i /> {settings.availability || 'Відкритий до нових проєктів'}</span>
            <b>{settings.city || 'Рівне, Україна'}</b>
          </div>

          <p className="sales3-kicker" data-sales-reveal>Full-stack розробка · дизайн · автоматизація</p>
          <h1 data-sales-reveal>
            Створюю цифрові продукти,
            <em> які працюють на бізнес.</em>
          </h1>
          <p className="sales3-hero-lead" data-sales-reveal>
            Від першої ідеї до готового запуску: продумую структуру, створюю сучасний інтерфейс,
            backend, базу даних і зручне керування — щоб сайт приносив заявки, а не просто займав місце в інтернеті.
          </p>

          <div className="sales3-hero-actions" data-sales-reveal>
            <a className="sales3-btn sales3-btn-primary" href={telegram} target="_blank" rel="noreferrer">
              <span>Обговорити проєкт</span> <ArrowUpRight size={18} />
            </a>
            <a className="sales3-btn sales3-btn-secondary" href="#cases">
              <span>Подивитися роботи</span> <ArrowDown size={17} />
            </a>
          </div>

          <div className="sales3-proof-line" data-sales-reveal>
            <span><CheckCircle2 size={17} /> Повний цикл розробки</span>
            <span><CheckCircle2 size={17} /> Кастомна адмінпанель</span>
            <span><CheckCircle2 size={17} /> Підтримка після запуску</span>
          </div>
        </div>

        <div className="sales3-hero-system" data-sales-reveal aria-label="Інтерактивна демонстрація бізнес-системи">
          <div className="sales3-system-glow" />
          <div className="sales3-system-window">
            <div className="sales3-system-bar">
              <div><i /><i /><i /></div>
              <span>business-system.local</span>
              <b>ONLINE</b>
            </div>

            <div className="sales3-system-dashboard">
              <aside>
                <strong>DK<span>.</span></strong>
                <nav aria-label="Розділи демонстрації">
                  {systemTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = tab.id === activeTab
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={isActive ? 'is-active' : ''}
                        aria-pressed={isActive}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon size={15} /> <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
                <div className="sales3-system-side-note"><FilePenLine size={14} /><span>Демо можна поклікати</span></div>
              </aside>

              <div className="sales3-system-main" key={panel.id}>
                <header>
                  <div><small>{panel.eyebrow}</small><h3>{panel.title}</h3></div>
                  <span><i /> {panel.status}</span>
                </header>

                <div className="sales3-system-stats">
                  {panel.stats.map((stat) => (
                    <article key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong><span>{stat.note}</span></article>
                  ))}
                </div>

                <div className="sales3-activity-feed">
                  {panel.feed.map((item, index) => (
                    <div key={item.title} className={index === 0 ? 'is-new' : ''}>
                      <i>{String(index + 1).padStart(2, '0')}</i>
                      <span><b>{item.title}</b><small>{item.text}</small></span>
                      <em>{item.time}</em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="sales3-floating-note sales3-floating-note-a">
            <span>24/7</span><small>сайт приймає звернення</small>
          </div>
          <div className="sales3-floating-note sales3-floating-note-b">
            <span>1 панель</span><small>для керування бізнесом</small>
          </div>
        </div>
      </div>

      <div className="sales3-shell sales3-hero-strip" data-sales-reveal>
        <span>Python / Django</span><span>React</span><span>Custom Admin</span><span>AI Integration</span><span>Business Automation</span>
      </div>
    </section>
  )
}
