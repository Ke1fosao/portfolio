import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  LayoutDashboard,
  MessageCircle,
  RefreshCcw,
  Send,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const quickReplies = [
  {
    id: 'price',
    question: 'Скільки коштує сайт?',
    answer: 'Базовий сайт стартує орієнтовно від 5 000 грн. Щоб назвати точнішу суму, підкажіть: вам потрібна лише презентація послуг чи також заявки й адмінпанель?',
  },
  {
    id: 'deadline',
    question: 'Які строки розробки?',
    answer: 'Невеликий сайт можна запустити приблизно за 1–2 тижні. Для вебсистеми з кабінетами, ролями або інтеграціями строки визначаються після короткого брифу.',
  },
  {
    id: 'admin',
    question: 'Чи зможу я сам змінювати контент?',
    answer: 'Так. Я можу зробити окрему зручну адмінпанель, де ви самостійно змінюватимете тексти, ціни, фото, послуги та заявки без редагування коду.',
  },
  {
    id: 'start',
    question: 'Що потрібно для старту?',
    answer: 'Достатньо коротко описати бізнес, бажаний результат і приблизні строки. Далі я допоможу сформувати структуру, функціонал та перший варіант рішення.',
  },
]

function BabylandPreview() {
  const [active, setActive] = useState('website')

  return (
    <div className="sales3-babyland-preview">
      <div className="sales3-babyland-browser">
        <div className="sales3-babyland-browserbar">
          <div><i /><i /><i /></div>
          <span>babyland.com.ua</span>
          <b>ЗАПУЩЕНО</b>
        </div>
        <div className="sales3-babyland-tabs" role="tablist" aria-label="Частини проєкту BABY LAND">
          <button type="button" className={active === 'website' ? 'is-active' : ''} onClick={() => setActive('website')}>
            <Users size={16} /><span>Сайт для батьків</span><small>Публічна частина</small>
          </button>
          <button type="button" className={active === 'admin' ? 'is-active' : ''} onClick={() => setActive('admin')}>
            <LayoutDashboard size={16} /><span>Адмінпанель</span><small>Керування закладом</small>
          </button>
        </div>

        <div className="sales3-babyland-screen" key={active}>
          {active === 'website' ? (
            <div className="sales3-bl-site">
              <header><strong><i /> BABY LAND</strong><nav><span>Про нас</span><span>Групи</span><span>Новини</span></nav><button>Записатися</button></header>
              <main>
                <div className="sales3-bl-copy">
                  <small>ПРИВАТНИЙ ДИТЯЧИЙ САДОК · РІВНЕ</small>
                  <h4>Місце, де дитинство стає особливим.</h4>
                  <p>Зрозуміла презентація закладу, команди та програми — з онлайн-заявкою для батьків.</p>
                  <div><button>Подати заявку</button><span>Переглянути простір <ChevronRight size={14} /></span></div>
                </div>
                <div className="sales3-bl-art" aria-hidden="true"><span>☺</span><i /><i /><i /></div>
              </main>
              <footer><span><b>24/7</b> приймання заявок</span><span><b>8</b> напрямів розвитку</span><span><b>1</b> зрозумілий сайт</span></footer>
            </div>
          ) : (
            <div className="sales3-bl-admin">
              <aside><strong>BL</strong><span className="is-active">Огляд</span><span>Заявки</span><span>Новини</span><span>Команда</span><span>Галерея</span></aside>
              <main>
                <header><div><small>ПАНЕЛЬ КЕРУВАННЯ</small><h4>Добрий день, адміністраторе</h4></div><button>+ Додати новину</button></header>
                <div className="sales3-bl-admin-stats"><article><small>Нові заявки</small><strong>07</strong><em>+3 за тиждень</em></article><article><small>Опубліковано</small><strong>32</strong><em>матеріали</em></article><article><small>Команда</small><strong>18</strong><em>профілів</em></article></div>
                <section><div><strong>Останні заявки</strong><span>Переглянути всі</span></div><p><i>МК</i><b>Марія Коваль</b><small>Молодша група</small><em>Нова</em></p><p><i>ОП</i><b>Олег Петренко</b><small>Консультація</small><em>В роботі</em></p></section>
              </main>
            </div>
          )}
        </div>
      </div>
      <p className="sales3-babyland-hint">Натисніть на вкладки, щоб побачити дві частини одного продукту.</p>
    </div>
  )
}

function AiChatDemo() {
  const [messages, setMessages] = useState([
    { id: 'welcome', type: 'ai', text: 'Вітаю! Я AI-менеджер. Можу розповісти про вартість, строки та процес розробки сайту.' },
  ])
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState([])
  const timerRef = useRef(null)
  const chatRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const selectReply = (reply) => {
    if (typing) return
    setMessages((current) => [...current, { id: `${reply.id}-q-${Date.now()}`, type: 'client', text: reply.question }])
    setUsed((current) => [...new Set([...current, reply.id])])
    setTyping(true)
    timerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, { id: `${reply.id}-a-${Date.now()}`, type: 'ai', text: reply.answer }])
      setTyping(false)
    }, 650)
  }

  const resetChat = () => {
    window.clearTimeout(timerRef.current)
    setTyping(false)
    setUsed([])
    setMessages([{ id: `welcome-${Date.now()}`, type: 'ai', text: 'Вітаю! Я AI-менеджер. Оберіть одне із запитань нижче — і я покажу, як може виглядати консультація клієнта.' }])
  }

  return (
    <div className="sales3-ai-demo">
      <div className="sales3-ai-demo-head">
        <div className="sales3-ai-avatar"><Bot size={18} /></div>
        <span><strong>AI-менеджер</strong><small><i /> онлайн</small></span>
        <button type="button" onClick={resetChat} aria-label="Почати чат заново"><RefreshCcw size={15} /></button>
      </div>
      <div className="sales3-chat" ref={chatRef} aria-live="polite">
        <div className="sales3-chat-day">Сьогодні</div>
        {messages.map((message) => (
          <div key={message.id} className={message.type === 'client' ? 'sales3-chat-client' : 'sales3-chat-ai'}>
            <p>{message.text}<time>{message.type === 'client' ? '✓✓' : 'зараз'}</time></p>
          </div>
        ))}
        {typing && <div className="sales3-chat-ai"><p className="sales3-chat-typing"><i /><i /><i /></p></div>}
      </div>
      <div className="sales3-chat-quick">
        <span>Спробуйте запитання:</span>
        <div>
          {quickReplies.map((reply) => (
            <button key={reply.id} type="button" disabled={typing} className={used.includes(reply.id) ? 'is-used' : ''} onClick={() => selectReply(reply)}>{reply.question}</button>
          ))}
        </div>
      </div>
      <div className="sales3-chat-input"><span>Оберіть готову фразу вище</span><button type="button" aria-label="Надіслати"><Send size={17} /></button></div>
    </div>
  )
}

export default function HomeCases({ projects, telegram }) {
  const babyland = projects.find((item) => item.slug === 'baby-land') || projects[0]
  const aiManager = projects.find((item) => item.slug === 'ai-sales-manager') || projects[1]

  return (
    <section className="sales3-cases" id="cases">
      <div className="sales3-shell">
        <div className="sales3-section-head sales3-section-head-light" data-sales-reveal>
          <span className="sales3-section-index">03 / Роботи</span>
          <h2>Не просто красиві екрани. Продукти, якими вже можна користуватися.</h2>
          <p>Показую не лише дизайн, а й логіку, керування та реальний шлях користувача всередині продукту.</p>
        </div>

        {babyland && (
          <article className="sales3-case sales3-case-babyland" data-sales-reveal>
            <div className="sales3-case-info">
              <div className="sales3-case-label"><span>Запущений продукт</span><b>01</b></div>
              <h3>{babyland.title}</h3>
              <p>{babyland.summary}</p>
              <div className="sales3-case-metrics">
                {(babyland.metrics || []).slice(0, 3).map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small></span>)}
              </div>
              <ul>
                <li><Check size={16} /> Публічний сайт для батьків</li>
                <li><Check size={16} /> Кастомна адмінпанель для команди</li>
                <li><Check size={16} /> Заявки, контент, команда та відгуки</li>
              </ul>
              <div className="sales3-case-actions">
                <a className="sales3-btn sales3-btn-case-primary" href={babyland.live_url} target="_blank" rel="noreferrer"><span>Відкрити сайт</span><ArrowUpRight size={18} /></a>
                <Link className="sales3-btn sales3-btn-case-ghost" to={`/projects/${babyland.slug}`}><span>Повний кейс</span><ChevronRight size={18} /></Link>
              </div>
            </div>
            <div className="sales3-case-visual"><BabylandPreview /></div>
          </article>
        )}

        {aiManager && (
          <article className="sales3-ai-case" data-sales-reveal>
            <div className="sales3-ai-copy">
              <div className="sales3-case-label"><span>Продукт у розробці</span><b>02</b></div>
              <h3>AI-менеджер, який підтримує діалог і веде клієнта до заявки.</h3>
              <p>{aiManager.summary}</p>
              <div className="sales3-ai-points">
                <span><Bot size={19} /> Знає послуги, ціни та правила компанії</span>
                <span><MessageCircle size={19} /> Спілкується у звичному Telegram-форматі</span>
                <span><Sparkles size={19} /> Налаштовується під конкретний бізнес</span>
              </div>
              <div className="sales3-ai-actions">
                <a className="sales3-btn sales3-btn-lime" href={telegram} target="_blank" rel="noreferrer"><span>Забронювати пілот</span><ArrowUpRight size={18} /></a>
                <Link className="sales3-btn sales3-btn-dark-outline" to="/projects/ai-sales-manager"><span>Повний кейс</span><ChevronRight size={18} /></Link>
              </div>
            </div>

            <AiChatDemo />
          </article>
        )}
      </div>
    </section>
  )
}
