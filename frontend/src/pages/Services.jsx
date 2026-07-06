import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Layers3,
  ShoppingBag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackServices } from '../data/fallbackData'
import '../styles/secondary-base.css'
import '../styles/services.css'
import '../styles/secondary-responsive.css'

const icons = [Code2, Bot, Layers3, ShoppingBag]
const results = [
  ['Більше довіри', 'Зрозумілий дизайн і структура показують рівень бізнесу ще до першої розмови.'],
  ['Менше ручної роботи', 'Форми, статуси, повідомлення й контент можна зібрати в одну керовану систему.'],
  ['Готовність до росту', 'Архітектура не ламається після першого оновлення й дозволяє поступово додавати функції.'],
]
const stages = [
  ['01', 'Розбір задачі', 'Визначаємо ціль, аудиторію, функціонал, обмеження та реальний пріоритет запуску.'],
  ['02', 'Структура й прототип', 'Формую логіку сторінок і сценарії користувача до того, як витрачати час на детальний дизайн.'],
  ['03', 'Дизайн і розробка', 'Створюю адаптивний інтерфейс, backend, базу даних, інтеграції та адмінпанель.'],
  ['04', 'Тестування й запуск', 'Перевіряю ключові сценарії, швидкість, мобільну версію та передаю готовий продукт.'],
]

export default function Services() {
  const [services, setServices] = useState(fallbackServices)
  const [active, setActive] = useState(0)

  useEffect(() => {
    api.get('/services/').then((response) => {
      const data = unwrap(response)
      if (data?.length) setServices(data)
    }).catch(() => {})
  }, [])

  const current = useMemo(() => services[active] || services[0] || fallbackServices[0], [services, active])
  const CurrentIcon = icons[active % icons.length]

  return (
    <div className="services-page modern-page">
      <section className="modern-section services-selector-section direct-start-section">
        <div className="container-shell">
          <div className="modern-section-heading">
            <div><span>01 · Напрями роботи</span><h1>Оберіть задачу — побачите, що входить у рішення.</h1></div>
            <p>Кожен проєкт формується індивідуально. Нижче — зрозуміла база, від якої можна відштовхнутися.</p>
          </div>

          <div className="services-selector">
            <div className="services-tabs" role="tablist" aria-label="Послуги">
              {services.map((service, index) => {
                const Icon = icons[index % icons.length]
                return (
                  <button
                    key={service.id || service.slug || service.title}
                    type="button"
                    className={active === index ? 'is-active' : ''}
                    onClick={() => setActive(index)}
                    role="tab"
                    aria-selected={active === index}
                  >
                    <span><Icon size={20} /></span>
                    <div><small>0{index + 1}</small><strong>{service.title}</strong></div>
                    <ArrowRight size={18} />
                  </button>
                )
              })}
            </div>

            <article className="service-focus-card" key={current.id || current.title}>
              <div className="service-focus-top">
                <span className="service-focus-icon"><CurrentIcon size={28} /></span>
                <div><small>{current.complexity || 'Індивідуальна складність'}</small><strong>від {Number(current.price_from_uah || 0).toLocaleString('uk-UA')} грн</strong></div>
              </div>
              <h3>{current.title}</h3>
              <p>{current.description || current.summary}</p>
              <div className="service-focus-features">
                {(current.features || []).map((feature) => <span key={feature}><Check size={15} /> {feature}</span>)}
              </div>
              <div className="service-focus-footer">
                <div><small>Орієнтовний строк</small><strong>{current.duration || 'після оцінки'}</strong></div>
                <Link to="/contact">Отримати оцінку <ArrowRight size={17} /></Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="modern-section services-results-section">
        <div className="container-shell">
          <div className="modern-section-heading compact-heading">
            <div><span>02 · Результат</span><h2>Що має змінитися після запуску.</h2></div>
          </div>
          <div className="services-results-grid">
            {results.map(([title, text], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="modern-section services-process-section">
        <div className="container-shell services-process-grid">
          <div className="services-process-sticky">
            <span>03 · Процес</span>
            <h2>Прозоро на кожному етапі.</h2>
            <p>Без хаотичної розробки й нескінченних переробок. Спочатку логіка, потім візуал і технічна реалізація.</p>
            <Link className="modern-button is-dark" to="/contact">Почати з консультації <ArrowRight size={18} /></Link>
          </div>
          <div className="services-process-list">
            {stages.map(([number, title, text]) => (
              <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="modern-section modern-cta-wrap">
        <div className="container-shell">
          <div className="modern-cta">
            <span>Є задача, але не знаєте, який формат підійде?</span>
            <h2>Опишіть її простими словами — я запропоную адекватний варіант без зайвого функціоналу.</h2>
            <Link className="modern-button is-lime" to="/contact">Розповісти про проєкт <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
