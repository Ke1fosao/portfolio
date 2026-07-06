import { useMemo, useState } from 'react'
import { ArrowUpRight, BarChart3, Bot, Check, Clock3, LayoutDashboard, Send, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const babyTabs = [
  { key: 'site', label: 'Публічний сайт' },
  { key: 'admin', label: 'Адмінпанель' },
  { key: 'result', label: 'Результат' },
]

const prompts = [
  {
    question: 'Скільки коштує сайт?',
    answer: 'Базовий сайт для малого бізнесу стартує орієнтовно від 5 000 грн. Точна оцінка залежить від структури, форм і адмінпанелі. Поставити кілька уточнювальних запитань?',
  },
  {
    question: 'Чи можна автоматизувати відповіді?',
    answer: 'Так. AI-менеджер може працювати 24/7, знати ваші послуги й ціни, збирати контакти та передавати складні діалоги людині.',
  },
  {
    question: 'Як швидко запустити пілот?',
    answer: 'Починаємо з найчастіших запитів клієнтів, створюємо базу знань і підключаємо Telegram. Далі тестуємо відповіді на реальних сценаріях.',
  },
]

function BabylandVisual({ active, project }) {
  if (active === 'admin') {
    return (
      <div className="s7-bl-admin">
        <aside><strong><i /> BL</strong><span className="is-active">⌘ <b>Дашборд</b></span><span>◇ <b>Заявки</b></span><span>▣ <b>Новини</b></span><span>◎ <b>Відгуки</b></span><span>⚙ <b>Налаштування</b></span></aside>
        <main><header><div><small>СИСТЕМА ОНЛАЙН</small><h4>Операційний центр</h4></div><button>0 нових заявок</button></header><section><article><small>Заявки</small><strong>07</strong><span>+3 за тиждень</span></article><article><small>Групи</small><strong>08</strong><span>активні</span></article><article><small>Команда</small><strong>29</strong><span>профілів</span></article></section><div className="s7-bl-admin-bottom"><div><b>Динаміка заявок</b><i /><i /><i /><i /><em /></div><div><b>Швидкі дії</b><span>＋ Новина</span><span>▧ Фото</span><span>✦ Відгук</span></div></div></main>
      </div>
    )
  }

  if (active === 'result') {
    return (
      <div className="s7-bl-results">
        <div className="s7-bl-orbit"><span>BL</span><i /><i /><i /></div>
        <div>
          <article><strong>90+</strong><span>технічні оцінки</span><small>швидкість і якість</small></article>
          <article><strong>24/7</strong><span>онлайн-заявки</span><small>поза робочим часом</small></article>
          <article><strong>2 тижні</strong><span>до запуску</span><small>повний цикл</small></article>
          <article className="is-goal"><strong>+20–30%</strong><span>ціль росту заявок</span><small>після підключення аналітики</small></article>
        </div>
      </div>
    )
  }

  const cover = project?.uploaded_cover_url || project?.cover_image_url
  return (
    <div className="s7-bl-site">
      <nav><strong><i /> BABY LAND</strong><div><span className="is-active">Головна</span><span>Про заклад</span><span>Сервіси</span></div><button>Записатися</button></nav>
      {cover && !cover.includes('ai-manager') ? <div className="s7-bl-cover"><img src={cover} alt="Головна сторінка BABY LAND" /></div> : (
        <main><div><small>ПРИВАТНИЙ САДОЧОК · РІВНЕ</small><h4>Простір щасливого дитинства</h4><p>Турбота, розвиток, безпека та сучасний підхід.</p><span><button>Подати заявку</button><b>Дізнатися більше →</b></span></div><div className="s7-bl-shape"><i /><i /><i /><strong>☺</strong></div></main>
      )}
      <footer><article><b>01</b><strong>Онлайн-заявка</strong><small>у кілька кроків</small></article><article><b>02</b><strong>Команда й новини</strong><small>актуальна інформація</small></article><article><b>03</b><strong>Сервіси для батьків</strong><small>в одному місці</small></article></footer>
    </div>
  )
}

export default function HomeCases({ projects, telegram }) {
  const babyland = projects.find((item) => item.slug === 'baby-land') || projects[0]
  const aiManager = projects.find((item) => item.slug === 'ai-sales-manager') || projects[1]
  const [babyTab, setBabyTab] = useState('site')
  const [promptIndex, setPromptIndex] = useState(0)
  const [sendTick, setSendTick] = useState(0)
  const prompt = useMemo(() => prompts[promptIndex], [promptIndex])

  return (
    <section className="s7-cases" id="cases">
      <div className="s7-shell">
        <div className="s7-section-head" data-s7-reveal>
          <span className="s7-index">03 / Роботи</span>
          <h2>Показую не статичну картинку, а логіку продукту зсередини.</h2>
          <div><p>Перемикайте вкладки, відкривайте різні частини кейсу та протестуйте демонстраційний AI-чат.</p><Link to="/projects">Переглянути всі роботи <ArrowUpRight size={17} /></Link></div>
        </div>

        {babyland && (
          <article className="s7-baby-case" data-s7-reveal>
            <div className="s7-case-copy">
              <div className="s7-case-label"><span>Запущений продукт</span><b>01</b></div>
              <h3><span>BABY</span> <strong>LAND</strong></h3>
              <p>{babyland.summary || 'Повноцінний багатосторінковий сайт із заявками, контентом, командою та кастомною системою керування.'}</p>
              <div className="s7-kpis"><span><strong>90+</strong><small>технічні оцінки</small></span><span><strong>24/7</strong><small>приймання заявок</small></span><span><strong>2 тижні</strong><small>до запуску</small></span></div>
              <ul><li><Check size={16} /> Публічний сайт для батьків</li><li><Check size={16} /> Кастомна адмінпанель для команди</li><li><Check size={16} /> Основа для AI-інтеграцій</li></ul>
              <div className="s7-case-actions"><a className="s7-btn s7-btn-dark" href={babyland.live_url} target="_blank" rel="noreferrer"><span>Відкрити сайт</span><ArrowUpRight size={18} /></a><Link className="s7-btn s7-btn-light" to={`/projects/${babyland.slug}`}><span>Повний кейс</span><ArrowUpRight size={17} /></Link></div>
            </div>

            <div className="s7-case-stage">
              <div className="s7-case-tabs">{babyTabs.map((tab) => <button key={tab.key} type="button" className={babyTab === tab.key ? 'is-active' : ''} onClick={() => setBabyTab(tab.key)}>{tab.label}</button>)}</div>
              <div className="s7-browser"><header><div><i /><i /><i /></div><span>{babyTab === 'site' ? 'babyland.com.ua' : babyTab === 'admin' ? 'babyland.com.ua/admin/dashboard' : 'impact.dashboard'}</span><b>LIVE</b></header><BabylandVisual active={babyTab} project={babyland} /></div>
              <small>Натискайте вкладки — це різні частини одного продукту.</small>
            </div>
          </article>
        )}

        {aiManager && (
          <article className="s7-ai-case" data-s7-reveal>
            <div className="s7-ai-copy">
              <div className="s7-case-label"><span>Пілотне впровадження</span><b>02</b></div>
              <span className="s7-ai-badge"><Sparkles size={15} /> Можна забронювати під свою компанію</span>
              <h3>AI-менеджер у Telegram, який відповідає 24/7 і готує клієнта до розмови з вами.</h3>
              <p>Система знає послуги, ціни й правила компанії, уточнює задачу, збирає контакти та передає менеджеру вже структурований запит.</p>
              <div className="s7-ai-benefits"><span><Clock3 size={20} /><b>24/7</b><small>без пауз і вихідних</small></span><span><Users size={20} /><b>Менше рутини</b><small>для команди</small></span><span><BarChart3 size={20} /><b>Єдина якість</b><small>за вашими правилами</small></span><span><LayoutDashboard size={20} /><b>Контроль</b><small>через власну панель</small></span></div>
              <div className="s7-ai-actions"><a className="s7-btn s7-btn-dark" href={telegram} target="_blank" rel="noreferrer"><span>Забронювати пілот</span><ArrowUpRight size={18} /></a><Link className="s7-btn s7-btn-light" to={`/projects/${aiManager.slug}`}><span>Повний кейс</span><ArrowUpRight size={17} /></Link></div>
              <small>Пілот налаштовується під конкретні послуги. У складних рішеннях діалог передається людині.</small>
            </div>

            <div className="s7-telegram">
              <header><span><i>DK</i><b>AI Sales Manager</b><small>бот · онлайн</small></span><em>•••</em></header>
              <main key={`${promptIndex}-${sendTick}`}><div>Сьогодні</div><article className="is-client"><p>{prompt.question}</p><small>12:41 ✓✓</small></article><article className="is-ai"><span><Bot size={15} /> AI-менеджер</span><p>{prompt.answer}</p><small>12:41</small></article><footer><i /><i /><i /> відповідь із бази знань</footer></main>
              <div className="s7-chat-prompts">{prompts.map((item, index) => <button key={item.question} type="button" className={promptIndex === index ? 'is-active' : ''} onClick={() => { setPromptIndex(index); setSendTick((value) => value + 1) }}>{item.question}</button>)}</div>
              <div className="s7-chat-input"><span>{prompt.question}</span><button type="button" onClick={() => setSendTick((value) => value + 1)} aria-label="Надіслати"><Send size={17} /></button></div>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}
