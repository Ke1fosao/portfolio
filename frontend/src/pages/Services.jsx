import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bot, Check, Code2, Layers3, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackServices } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizeServices } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/services.css'
import '../styles/secondary-responsive.css'

const icons = [Code2, Bot, Layers3, ShoppingBag]
const DATA = {
  uk: {
    head:'01 · Напрями роботи', title:'Оберіть задачу — побачите, що входить у рішення.', intro:'Кожен проєкт формується індивідуально. Нижче — зрозуміла база, від якої можна відштовхнутися.', tabs:'Послуги', custom:'Індивідуальна складність', from:'від', currency:'грн', deadline:'Орієнтовний строк', after:'після оцінки', estimate:'Отримати оцінку',
    result:'02 · Результат', resultTitle:'Що має змінитися після запуску.', results:[['Більше довіри','Зрозумілий дизайн і структура показують рівень бізнесу ще до першої розмови.'],['Менше ручної роботи','Форми, статуси, повідомлення й контент можна зібрати в одну керовану систему.'],['Готовність до росту','Архітектура не ламається після першого оновлення й дозволяє поступово додавати функції.']],
    process:'03 · Процес', processTitle:'Прозоро на кожному етапі.', processText:'Без хаотичної розробки й нескінченних переробок. Спочатку логіка, потім візуал і технічна реалізація.', consult:'Почати з консультації', stages:[['01','Розбір задачі','Визначаємо ціль, аудиторію, функціонал, обмеження та реальний пріоритет запуску.'],['02','Структура й прототип','Формую логіку сторінок і сценарії користувача до того, як витрачати час на детальний дизайн.'],['03','Дизайн і розробка','Створюю адаптивний інтерфейс, backend, базу даних, інтеграції та адмінпанель.'],['04','Тестування й запуск','Перевіряю ключові сценарії, швидкість, мобільну версію та передаю готовий продукт.']],
    cta:'Є задача, але не знаєте, який формат підійде?', ctaTitle:'Опишіть її простими словами — я запропоную адекватний варіант без зайвого функціоналу.', ctaAction:'Розповісти про проєкт',
  },
  en: {
    head:'01 · Areas of work', title:'Choose a task to see what the solution includes.', intro:'Every project is shaped individually. Below is a clear starting point for discussion.', tabs:'Services', custom:'Custom complexity', from:'from', currency:'UAH', deadline:'Estimated timeline', after:'after assessment', estimate:'Get an estimate',
    result:'02 · Outcome', resultTitle:'What should change after launch.', results:[['More trust','Clear design and structure demonstrate the level of the business before the first conversation.'],['Less manual work','Forms, statuses, notifications, and content can be combined in one manageable system.'],['Ready for growth','The architecture remains stable after updates and allows new functionality to be added gradually.']],
    process:'03 · Process', processTitle:'Transparent at every stage.', processText:'No chaotic development or endless rework. Logic comes first, followed by visual design and technical implementation.', consult:'Start with a consultation', stages:[['01','Task analysis','We define the goal, audience, functionality, limitations, and the real launch priority.'],['02','Structure and prototype','I shape page logic and user scenarios before spending time on detailed design.'],['03','Design and development','I build a responsive interface, backend, database, integrations, and admin panel.'],['04','Testing and launch','I test key scenarios, performance, and the mobile version, then deliver a finished product.']],
    cta:'Have a task but are unsure which format fits?', ctaTitle:'Describe it in simple terms and I will suggest a practical option without unnecessary functionality.', ctaAction:'Tell me about the project',
  },
}

export default function Services() {
  const { language, locale } = useLanguage()
  const c = DATA[language]
  const [rawServices, setRawServices] = useState(fallbackServices)
  const [active, setActive] = useState(0)
  useEffect(() => { api.get('/services/').then((response) => { const data = unwrap(response); if (data?.length) setRawServices(data) }).catch(() => {}) }, [])
  const services = useMemo(() => localizeServices(rawServices, language), [rawServices, language])
  const current = useMemo(() => services[active] || services[0] || localizeServices(fallbackServices, language)[0], [services, active, language])
  const CurrentIcon = icons[active % icons.length]
  return <div className="services-page modern-page">
    <section className="modern-section services-selector-section direct-start-section"><div className="container-shell"><div className="modern-section-heading"><div><span>{c.head}</span><h1>{c.title}</h1></div><p>{c.intro}</p></div><div className="services-selector"><div className="services-tabs" role="tablist" aria-label={c.tabs}>{services.map((service,index) => { const Icon = icons[index % icons.length]; return <button key={service.id || service.slug || service.title} type="button" className={active === index ? 'is-active' : ''} onClick={() => setActive(index)} role="tab" aria-selected={active === index}><span><Icon size={20} /></span><div><small>0{index+1}</small><strong>{service.title}</strong></div><ArrowRight size={18} /></button> })}</div><article className="service-focus-card" key={current.id || current.title}><div className="service-focus-top"><span className="service-focus-icon"><CurrentIcon size={28} /></span><div><small>{current.complexity || c.custom}</small><strong>{c.from} {Number(current.price_from_uah || 0).toLocaleString(locale)} {c.currency}</strong></div></div><h3>{current.title}</h3><p>{current.description || current.summary}</p><div className="service-focus-features">{(current.features || []).map((feature) => <span key={feature}><Check size={15} /> {feature}</span>)}</div><div className="service-focus-footer"><div><small>{c.deadline}</small><strong>{current.duration || c.after}</strong></div><Link to="/contact">{c.estimate} <ArrowRight size={17} /></Link></div></article></div></div></section>
    <section className="modern-section services-results-section"><div className="container-shell"><div className="modern-section-heading compact-heading"><div><span>{c.result}</span><h2>{c.resultTitle}</h2></div></div><div className="services-results-grid">{c.results.map(([title,text],index) => <article key={title}><span>0{index+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="modern-section services-process-section"><div className="container-shell services-process-grid"><div className="services-process-sticky"><span>{c.process}</span><h2>{c.processTitle}</h2><p>{c.processText}</p><Link className="modern-button is-dark" to="/contact">{c.consult} <ArrowRight size={18} /></Link></div><div className="services-process-list">{c.stages.map(([number,title,text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
    <section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>{c.cta}</span><h2>{c.ctaTitle}</h2><Link className="modern-button is-lime" to="/contact">{c.ctaAction} <ArrowRight size={18} /></Link></div></div></section>
  </div>
}
