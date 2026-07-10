import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Bot, Check, ChevronRight, LayoutDashboard, MessageCircle, RefreshCcw, Send, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

const CONTENT = {
  uk: {
    section: '03 / Роботи', title: 'Не просто красиві екрани. Продукти, якими вже можна користуватися.', intro: 'Показую не лише дизайн, а й логіку, керування та реальний шлях користувача всередині продукту.', launched: 'Запущений продукт', development: 'Продукт у розробці',
    website: 'Сайт для батьків', public: 'Публічна частина', admin: 'Адмінпанель', management: 'Керування закладом', launchedLabel: 'ЗАПУЩЕНО', projectParts: 'Частини проєкту BABY LAND',
    baby: { about:'Про нас', groups:'Групи', news:'Новини', enroll:'Записатися', label:'ПРИВАТНИЙ ДИТЯЧИЙ САДОК · РІВНЕ', title:'Місце, де дитинство стає особливим.', text:'Зрозуміла презентація закладу, команди та програми — з онлайн-заявкою для батьків.', apply:'Подати заявку', space:'Переглянути простір', accepts:'приймання заявок', directions:'напрямів розвитку', clear:'зрозумілий сайт' },
    adminMock: { overview:'Огляд', leads:'Заявки', news:'Новини', team:'Команда', gallery:'Галерея', panel:'ПАНЕЛЬ КЕРУВАННЯ', hello:'Добрий день, адміністраторе', add:'+ Додати новину', newLeads:'Нові заявки', week:'+3 за тиждень', published:'Опубліковано', materials:'матеріали', profiles:'профілів', latest:'Останні заявки', all:'Переглянути всі', maria:'Марія Коваль', young:'Молодша група', new:'Нова', oleh:'Олег Петренко', consultation:'Консультація', progress:'В роботі' },
    hint: 'Натисніть на вкладки, щоб побачити дві частини одного продукту.',
    aiName:'AI-менеджер', online:'онлайн', restart:'Почати чат заново', today:'Сьогодні', now:'зараз', try:'Спробуйте запитання:', choose:'Оберіть готову фразу вище', send:'Надіслати',
    welcome:'Вітаю! Я AI-менеджер. Можу розповісти про вартість, строки та процес розробки сайту.', resetWelcome:'Вітаю! Я AI-менеджер. Оберіть одне із запитань нижче — і я покажу, як може виглядати консультація клієнта.',
    replies:[
      { id:'price', question:'Скільки коштує сайт?', answer:'Базовий сайт стартує орієнтовно від 5 000 грн. Щоб назвати точнішу суму, підкажіть: вам потрібна лише презентація послуг чи також заявки й адмінпанель?' },
      { id:'deadline', question:'Які строки розробки?', answer:'Невеликий сайт можна запустити приблизно за 1–2 тижні. Для вебсистеми з кабінетами, ролями або інтеграціями строки визначаються після короткого брифу.' },
      { id:'admin', question:'Чи зможу я сам змінювати контент?', answer:'Так. Я можу зробити окрему зручну адмінпанель, де ви самостійно змінюватимете тексти, ціни, фото, послуги та заявки без редагування коду.' },
      { id:'start', question:'Що потрібно для старту?', answer:'Достатньо коротко описати бізнес, бажаний результат і приблизні строки. Далі я допоможу сформувати структуру, функціонал та перший варіант рішення.' },
    ],
    publicSite:'Публічний сайт для батьків', customAdmin:'Кастомна адмінпанель для команди', allInOne:'Заявки, контент, команда та відгуки', open:'Відкрити сайт', full:'Повний кейс',
    aiTitle:'AI-менеджер, який підтримує діалог і веде клієнта до заявки.', aiPoints:['Знає послуги, ціни та правила компанії','Спілкується у звичному Telegram-форматі','Налаштовується під конкретний бізнес'], pilot:'Забронювати пілот',
  },
  en: {
    section: '03 / Projects', title: 'More than polished screens. Products that can already be used.', intro: 'I show not only visual design, but also logic, management tools, and the real user journey inside the product.', launched: 'Launched product', development: 'Product in development',
    website: 'Website for parents', public: 'Public website', admin: 'Admin panel', management: 'Kindergarten management', launchedLabel: 'LAUNCHED', projectParts: 'BABY LAND project sections',
    baby: { about:'About', groups:'Groups', news:'News', enroll:'Enroll', label:'PRIVATE KINDERGARTEN · RIVNE', title:'A place where childhood becomes special.', text:'A clear presentation of the kindergarten, team, and program, with an online application for parents.', apply:'Apply online', space:'View the space', accepts:'application intake', directions:'development areas', clear:'clear website' },
    adminMock: { overview:'Overview', leads:'Applications', news:'News', team:'Team', gallery:'Gallery', panel:'MANAGEMENT PANEL', hello:'Good afternoon, administrator', add:'+ Add news', newLeads:'New applications', week:'+3 this week', published:'Published', materials:'items', profiles:'profiles', latest:'Latest applications', all:'View all', maria:'Maria Koval', young:'Younger group', new:'New', oleh:'Oleh Petrenko', consultation:'Consultation', progress:'In progress' },
    hint: 'Use the tabs to view the two parts of the same product.',
    aiName:'AI sales assistant', online:'online', restart:'Restart chat', today:'Today', now:'now', try:'Try a question:', choose:'Choose a prepared phrase above', send:'Send',
    welcome:'Hello! I am an AI sales assistant. I can explain website pricing, timelines, and the development process.', resetWelcome:'Hello! I am an AI sales assistant. Choose one of the questions below and I will demonstrate a client consultation.',
    replies:[
      { id:'price', question:'How much does a website cost?', answer:'A basic website usually starts at about UAH 5,000. To estimate it more accurately, do you need only a presentation of services, or also lead forms and an admin panel?' },
      { id:'deadline', question:'How long does development take?', answer:'A small website can usually be launched in 1–2 weeks. A web system with dashboards, roles, or integrations is estimated after a short brief.' },
      { id:'admin', question:'Can I update the content myself?', answer:'Yes. I can build a convenient admin panel where you can update text, prices, photos, services, and inquiries without editing code.' },
      { id:'start', question:'What is needed to get started?', answer:'A short description of the business, the desired result, and an approximate timeline is enough. I will help shape the structure, functionality, and first solution.' },
    ],
    publicSite:'Public website for parents', customAdmin:'Custom admin panel for the team', allInOne:'Applications, content, team, and reviews', open:'Open website', full:'Full case study',
    aiTitle:'An AI sales assistant that maintains a conversation and guides the client toward an inquiry.', aiPoints:['Knows the company’s services, prices, and rules','Communicates in a familiar Telegram format','Configured for a specific business'], pilot:'Reserve a pilot',
  },
}

function BabylandPreview({ c }) {
  const [active, setActive] = useState('website')
  return <div className="sales3-babyland-preview"><div className="sales3-babyland-browser"><div className="sales3-babyland-browserbar"><div><i /><i /><i /></div><span>babyland.com.ua</span><b>{c.launchedLabel}</b></div><div className="sales3-babyland-tabs" role="tablist" aria-label={c.projectParts}><button type="button" className={active === 'website' ? 'is-active' : ''} onClick={() => setActive('website')}><Users size={16} /><span>{c.website}</span><small>{c.public}</small></button><button type="button" className={active === 'admin' ? 'is-active' : ''} onClick={() => setActive('admin')}><LayoutDashboard size={16} /><span>{c.admin}</span><small>{c.management}</small></button></div>
    <div className="sales3-babyland-screen" key={active}>{active === 'website' ? <div className="sales3-bl-site"><header><strong><i /> BABY LAND</strong><nav><span>{c.baby.about}</span><span>{c.baby.groups}</span><span>{c.baby.news}</span></nav><button>{c.baby.enroll}</button></header><main><div className="sales3-bl-copy"><small>{c.baby.label}</small><h4>{c.baby.title}</h4><p>{c.baby.text}</p><div><button>{c.baby.apply}</button><span>{c.baby.space} <ChevronRight size={14} /></span></div></div><div className="sales3-bl-art" aria-hidden="true"><span>☺</span><i /><i /><i /></div></main><footer><span><b>24/7</b> {c.baby.accepts}</span><span><b>8</b> {c.baby.directions}</span><span><b>1</b> {c.baby.clear}</span></footer></div> : <div className="sales3-bl-admin"><aside><strong>BL</strong><span className="is-active">{c.adminMock.overview}</span><span>{c.adminMock.leads}</span><span>{c.adminMock.news}</span><span>{c.adminMock.team}</span><span>{c.adminMock.gallery}</span></aside><main><header><div><small>{c.adminMock.panel}</small><h4>{c.adminMock.hello}</h4></div><button>{c.adminMock.add}</button></header><div className="sales3-bl-admin-stats"><article><small>{c.adminMock.newLeads}</small><strong>07</strong><em>{c.adminMock.week}</em></article><article><small>{c.adminMock.published}</small><strong>32</strong><em>{c.adminMock.materials}</em></article><article><small>{c.adminMock.team}</small><strong>18</strong><em>{c.adminMock.profiles}</em></article></div><section><div><strong>{c.adminMock.latest}</strong><span>{c.adminMock.all}</span></div><p><i>МК</i><b>{c.adminMock.maria}</b><small>{c.adminMock.young}</small><em>{c.adminMock.new}</em></p><p><i>ОП</i><b>{c.adminMock.oleh}</b><small>{c.adminMock.consultation}</small><em>{c.adminMock.progress}</em></p></section></main></div>}</div></div><p className="sales3-babyland-hint">{c.hint}</p></div>
}

function AiChatDemo({ c }) {
  const [messages, setMessages] = useState([{ id:'welcome', type:'ai', text:c.welcome }])
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState([])
  const timerRef = useRef(null)
  const chatRef = useRef(null)
  useEffect(() => () => window.clearTimeout(timerRef.current), [])
  useEffect(() => { setMessages([{ id:`welcome-${Date.now()}`, type:'ai', text:c.welcome }]); setUsed([]); setTyping(false) }, [c])
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' }) }, [messages, typing])
  const selectReply = (reply) => { if (typing) return; setMessages((current) => [...current,{ id:`${reply.id}-q-${Date.now()}`, type:'client', text:reply.question }]); setUsed((current) => [...new Set([...current,reply.id])]); setTyping(true); timerRef.current = window.setTimeout(() => { setMessages((current) => [...current,{ id:`${reply.id}-a-${Date.now()}`, type:'ai', text:reply.answer }]); setTyping(false) },650) }
  const resetChat = () => { window.clearTimeout(timerRef.current); setTyping(false); setUsed([]); setMessages([{ id:`welcome-${Date.now()}`, type:'ai', text:c.resetWelcome }]) }
  return <div className="sales3-ai-demo"><div className="sales3-ai-demo-head"><div className="sales3-ai-avatar"><Bot size={18} /></div><span><strong>{c.aiName}</strong><small><i /> {c.online}</small></span><button type="button" onClick={resetChat} aria-label={c.restart}><RefreshCcw size={15} /></button></div><div className="sales3-chat" ref={chatRef} aria-live="polite"><div className="sales3-chat-day">{c.today}</div>{messages.map((message) => <div key={message.id} className={message.type === 'client' ? 'sales3-chat-client' : 'sales3-chat-ai'}><p>{message.text}<time>{message.type === 'client' ? '✓✓' : c.now}</time></p></div>)}{typing && <div className="sales3-chat-ai"><p className="sales3-chat-typing"><i /><i /><i /></p></div>}</div><div className="sales3-chat-quick"><span>{c.try}</span><div>{c.replies.map((reply) => <button key={reply.id} type="button" disabled={typing} className={used.includes(reply.id) ? 'is-used' : ''} onClick={() => selectReply(reply)}>{reply.question}</button>)}</div></div><div className="sales3-chat-input"><span>{c.choose}</span><button type="button" aria-label={c.send}><Send size={17} /></button></div></div>
}

export default function HomeCases({ projects, telegram }) {
  const { language } = useLanguage()
  const c = CONTENT[language]
  const babyland = projects.find((item) => item.slug === 'baby-land') || projects[0]
  const aiManager = projects.find((item) => item.slug === 'ai-sales-manager') || projects[1]
  return <section className="sales3-cases" id="cases"><div className="sales3-shell"><div className="sales3-section-head sales3-section-head-light" data-sales-reveal><span className="sales3-section-index">{c.section}</span><h2>{c.title}</h2><p>{c.intro}</p></div>
    {babyland && <article className="sales3-case sales3-case-babyland" data-sales-reveal><div className="sales3-case-info"><div className="sales3-case-label"><span>{c.launched}</span><b>01</b></div><h3>{babyland.title}</h3><p>{babyland.summary}</p><div className="sales3-case-metrics">{(babyland.metrics || []).slice(0,3).map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small></span>)}</div><ul><li><Check size={16} /> {c.publicSite}</li><li><Check size={16} /> {c.customAdmin}</li><li><Check size={16} /> {c.allInOne}</li></ul><div className="sales3-case-actions"><a className="sales3-btn sales3-btn-case-primary" href={babyland.live_url} target="_blank" rel="noreferrer"><span>{c.open}</span><ArrowUpRight size={18} /></a><Link className="sales3-btn sales3-btn-case-ghost" to={`/projects/${babyland.slug}`}><span>{c.full}</span><ChevronRight size={18} /></Link></div></div><div className="sales3-case-visual"><BabylandPreview c={c} /></div></article>}
    {aiManager && <article className="sales3-ai-case" data-sales-reveal><div className="sales3-ai-copy"><div className="sales3-case-label"><span>{c.development}</span><b>02</b></div><h3>{c.aiTitle}</h3><p>{aiManager.summary}</p><div className="sales3-ai-points"><span><Bot size={19} /> {c.aiPoints[0]}</span><span><MessageCircle size={19} /> {c.aiPoints[1]}</span><span><Sparkles size={19} /> {c.aiPoints[2]}</span></div><div className="sales3-ai-actions"><a className="sales3-btn sales3-btn-lime" href={telegram} target="_blank" rel="noreferrer"><span>{c.pilot}</span><ArrowUpRight size={18} /></a><Link className="sales3-btn sales3-btn-dark-outline" to="/projects/ai-sales-manager"><span>{c.full}</span><ChevronRight size={18} /></Link></div></div><AiChatDemo c={c} /></article>}
  </div></section>
}
