import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, CalendarCheck2, FileText, LayoutDashboard, MessageSquareMore, Sparkles, Users } from 'lucide-react'

const chapters = [
  {
    icon: CalendarCheck2,
    tag: 'Заявки',
    title: 'Клієнт одразу бачить наступний крок.',
    text: 'Сильна пропозиція, форми й зрозумілі CTA перетворюють перегляд сайту на конкретну дію.',
    result: 'Менше втрачених звернень.',
    visual: 'lead',
  },
  {
    icon: FileText,
    tag: 'Контент і керування',
    title: 'Команда оновлює сайт і процеси самостійно.',
    text: 'Новини, послуги, ціни, команда, заявки та статуси керуються через одну кастомну панель.',
    result: 'Один інструмент замість кількох розрізнених систем.',
    visual: 'content',
  },
  {
    icon: Bot,
    tag: 'AI-автоматизація',
    title: 'Повторювану роботу бере на себе система.',
    text: 'AI допомагає з первинними відповідями, контентом, модерацією й типових сценаріях спілкування.',
    result: 'Швидша комунікація без збільшення штату.',
    visual: 'ai',
  },
  {
    icon: LayoutDashboard,
    tag: 'Контроль',
    title: 'Власник бачить процес, а не хаос у повідомленнях.',
    text: 'Заявки, статуси, нотатки й аналітика зібрані в одному зрозумілому робочому просторі.',
    result: 'Більше контролю та основа для росту.',
    visual: 'dashboard',
  },
]

function Visual({ type }) {
  if (type === 'lead') {
    return (
      <div className="s7-journey-visual s7-visual-lead">
        <article><Users size={20} /><span><b>Новий відвідувач</b><small>відкрив послугу</small></span></article>
        <ArrowRight size={18} />
        <article><MessageSquareMore size={20} /><span><b>Коротка форма</b><small>3 прості поля</small></span></article>
        <ArrowRight size={18} />
        <article className="is-accent"><CalendarCheck2 size={20} /><span><b>Лід створено</b><small>уже в системі</small></span></article>
      </div>
    )
  }
  if (type === 'content') {
    return (
      <div className="s7-journey-visual s7-visual-content">
        <div><FileText size={21} /><span><b>Нова послуга</b><small>чернетка збережена</small></span><em>Редагувати</em></div>
        <div><Sparkles size={21} /><span><b>AI перевірив текст</b><small>стиль і помилки</small></span><em>Готово</em></div>
        <div className="is-accent"><span>✓</span><span><b>Опубліковано</b><small>одразу на сайті</small></span><em>LIVE</em></div>
      </div>
    )
  }
  if (type === 'ai') {
    return (
      <div className="s7-journey-visual s7-visual-ai">
        <div className="is-client">Скільки коштує сайт для малого бізнесу?</div>
        <span><i /><i /><i /> AI аналізує запит</span>
        <div className="is-ai">Стартова розробка — від 5 000 грн. Підкажіть, чи потрібна адмінпанель?</div>
      </div>
    )
  }
  return (
    <div className="s7-journey-visual s7-visual-dashboard">
      <article><small>Нові заявки</small><strong>07</strong><span>+3 цього тижня</span></article>
      <article><small>У роботі</small><strong>04</strong><span>активні ліди</span></article>
      <article><small>Конверсія</small><strong>31%</strong><span>з перегляду в контакт</span></article>
      <div><i /><i /><i /><i /><b /></div>
    </div>
  )
}

export default function HomeBusinessJourney() {
  const [active, setActive] = useState(0)
  const cards = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(Number(entry.target.dataset.index || 0))
      })
    }, { threshold: 0.58, rootMargin: '-16% 0px -28% 0px' })
    cards.current.forEach((item) => item && observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="s7-journey" id="benefits">
      <div className="s7-shell s7-journey-layout">
        <aside className="s7-journey-sticky" data-s7-reveal>
          <span className="s7-index">01 / Що змінюється</span>
          <h2>Сайт стає частиною роботи бізнесу, а не просто сторінкою в інтернеті.</h2>
          <p>Під час розробки я дивлюся на весь шлях: від першого візиту до заявки, відповіді й подальшого керування.</p>
          <div className="s7-journey-nav">
            {chapters.map((item, index) => (
              <button key={item.tag} type="button" className={active === index ? 'is-active' : ''} onClick={() => cards.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                <i /><span>{String(index + 1).padStart(2, '0')}</span><b>{item.tag}</b>
              </button>
            ))}
          </div>
        </aside>

        <div className="s7-journey-cards">
          {chapters.map((item, index) => {
            const Icon = item.icon
            return (
              <article
                key={item.tag}
                ref={(node) => { cards.current[index] = node }}
                data-index={index}
                className={`s7-journey-card ${active === index ? 'is-active' : ''}`}
              >
                <header><span>{String(index + 1).padStart(2, '0')}</span><Icon size={25} /></header>
                <small>{item.tag}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Visual type={item.visual} />
                <footer><ArrowRight size={18} /><strong>{item.result}</strong></footer>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
