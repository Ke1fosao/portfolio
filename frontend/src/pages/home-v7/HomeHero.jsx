import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  Globe2,
  MousePointerClick,
  Sparkles,
  Users,
} from 'lucide-react'

const demoViews = [
  {
    key: 'site',
    label: 'Сайт',
    icon: Globe2,
    eyebrow: 'Публічна частина',
    title: 'Сторінка, яка веде до заявки',
    description: 'Структура, довіра, послуги й форма контакту працюють як один зрозумілий шлях клієнта.',
    stats: [['24/7', 'приймання звернень'], ['+07', 'нових лідів']],
    events: [['01', 'Відкрито сторінку послуги', 'зараз'], ['02', 'Переглянуто кейс', '9 с'], ['03', 'Надіслано заявку', '48 с']],
  },
  {
    key: 'leads',
    label: 'Заявки',
    icon: Database,
    eyebrow: 'Керування зверненнями',
    title: 'Кожен контакт збережений і має статус',
    description: 'Заявки, джерела, нотатки й етапи роботи зібрані в одному місці замість хаосу в чатах.',
    stats: [['12', 'лідів у роботі'], ['03', 'чекають відповіді']],
    events: [['01', 'Нова заявка з форми', 'зараз'], ['02', 'Додано нотатку', '1 хв'], ['03', 'Статус: «У роботі»', '4 хв']],
  },
  {
    key: 'ai',
    label: 'AI',
    icon: Bot,
    eyebrow: 'Автоматизація',
    title: 'AI допомагає відповідати швидше',
    description: 'Система знає ваші послуги, ціни й правила та готує релевантні відповіді на типові запити.',
    stats: [['18 с', 'до чернетки'], ['04', 'активні сценарії']],
    events: [['01', 'Розпізнано намір', '3 с'], ['02', 'Підібрано послугу', '7 с'], ['03', 'Відповідь готова', '18 с']],
  },
  {
    key: 'content',
    label: 'Контент',
    icon: FileText,
    eyebrow: 'Кастомна адмінпанель',
    title: 'Команда оновлює сайт самостійно',
    description: 'Новини, послуги, команда й ціни редагуються через зручну панель без звернення до розробника.',
    stats: [['5 хв', 'на оновлення'], ['01', 'панель керування']],
    events: [['01', 'Створено новину', 'зараз'], ['02', 'AI перевірив текст', '9 с'], ['03', 'Матеріал опубліковано', '22 с']],
  },
]

export default function HomeHero({ settings, telegram }) {
  const [activeKey, setActiveKey] = useState('site')
  const [pulse, setPulse] = useState(0)
  const active = useMemo(() => demoViews.find((item) => item.key === activeKey) || demoViews[0], [activeKey])

  return (
    <section className="s7-hero" id="top">
      <div className="s7-grid-bg" aria-hidden="true" />
      <div className="s7-hero-glow" aria-hidden="true" />
      <div className="s7-shell s7-hero-grid">
        <div className="s7-hero-copy">
          <div className="s7-availability" data-s7-reveal>
            <span><i /> {settings.availability || 'Відкритий до нових проєктів'}</span>
            <b>{settings.city || 'Рівне, Україна'}</b>
          </div>

          <p className="s7-kicker" data-s7-reveal>Сайти · вебсистеми · AI-автоматизація</p>
          <h1 data-s7-reveal>
            Будую цифрові продукти, які
            <em> приводять клієнтів і прибирають рутину.</em>
          </h1>
          <p className="s7-hero-lead" data-s7-reveal>
            Від першого екрану до адмінпанелі й AI-сценаріїв — створюю систему,
            яка допомагає бізнесу продавати, керувати процесами та швидше рости.
          </p>

          <div className="s7-actions" data-s7-reveal>
            <a className="s7-btn s7-btn-dark" href={telegram} target="_blank" rel="noreferrer">
              <span>Обговорити проєкт</span><ArrowUpRight size={18} />
            </a>
            <a className="s7-btn s7-btn-light" href="#cases">
              <span>Подивитися кейси</span><ArrowDown size={17} />
            </a>
          </div>

          <div className="s7-proof" data-s7-reveal>
            <span><CheckCircle2 size={17} /> Повний цикл розробки</span>
            <span><CheckCircle2 size={17} /> Кастомне керування</span>
            <span><CheckCircle2 size={17} /> Підтримка після запуску</span>
          </div>
        </div>

        <div className="s7-hero-demo" data-s7-reveal>
          <div className="s7-demo-window">
            <div className="s7-demo-bar">
              <div><i /><i /><i /></div><span>business-system.local</span><b>ONLINE</b>
            </div>
            <div className="s7-demo-layout">
              <aside>
                <strong>DK<span>.</span></strong>
                <nav>
                  {demoViews.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={activeKey === item.key ? 'is-active' : ''}
                        onClick={() => { setActiveKey(item.key); setPulse((value) => value + 1) }}
                      >
                        <Icon size={16} /><span>{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
                <small><MousePointerClick size={13} /> Натисніть на вкладку</small>
              </aside>

              <main key={`${active.key}-${pulse}`}>
                <header>
                  <div><small>{active.eyebrow}</small><h3>{active.title}</h3></div>
                  <span><i /> LIVE</span>
                </header>
                <p>{active.description}</p>
                <div className="s7-demo-stats">
                  {active.stats.map(([value, label]) => <article key={label}><small>{label}</small><strong>{value}</strong><em>оновлюється онлайн</em></article>)}
                </div>
                <div className="s7-demo-feed">
                  {active.events.map(([number, label, time], index) => (
                    <button key={label} type="button" className={index === 0 ? 'is-new' : ''} onClick={() => setPulse((value) => value + 1)}>
                      <i>{number}</i><span><b>{label}</b><small>{index === 0 ? 'нова активність' : 'система зафіксувала подію'}</small></span><em>{time}</em>
                    </button>
                  ))}
                </div>
              </main>
            </div>
          </div>

          <button className="s7-floating-card s7-floating-card-a" type="button" onClick={() => setActiveKey('ai')}>
            <Bot size={16} /><span>24/7</span><small>AI допомагає відповідати</small>
          </button>
          <button className="s7-floating-card s7-floating-card-b" type="button" onClick={() => setActiveKey('leads')}>
            <Users size={16} /><span>1 панель</span><small>весь клієнтський потік</small>
          </button>
          <div className="s7-demo-spark"><Sparkles size={17} /></div>
        </div>
      </div>

      <div className="s7-shell s7-tech-strip" data-s7-reveal>
        <span>Python / Django</span><span>React</span><span>Custom Admin</span><span>AI Integration</span><span>Business Automation</span>
      </div>
    </section>
  )
}
