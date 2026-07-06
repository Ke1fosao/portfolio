import { useMemo, useState } from 'react'
import { ArrowUpRight, Bot, Check, ChevronRight, PanelsTopLeft, ShoppingBag, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

const groups = [
  {
    key: 'site',
    title: 'Сайти для бізнесу',
    label: 'Швидкий старт',
    duration: 'від 7–14 днів',
    icon: PanelsTopLeft,
    slugs: ['business-websites'],
    fallbackPrice: 5000,
    description: 'Продаюча структура, сучасний дизайн, форми, базове SEO й зручне керування контентом.',
    features: ['Дизайн під бренд', 'Форми й онлайн-запис', 'Адаптивність', 'Базове SEO', 'Адмінпанель'],
  },
  {
    key: 'automation',
    title: 'Вебсистеми та AI-автоматизація',
    label: 'Для росту компанії',
    duration: 'від 2–8 тижнів',
    icon: Workflow,
    slugs: ['ai-automation', 'web-systems'],
    fallbackPrice: 12000,
    description: 'Єдина система з кабінетами, ролями, заявками, аналітикою, Telegram та AI-сценаріями.',
    features: ['Кастомні кабінети', 'Ролі й доступи', 'CRM-логіка', 'AI-помічники', 'API та Telegram'],
  },
  {
    key: 'shop',
    title: 'Інтернет-магазини',
    label: 'Складний продукт',
    duration: 'від 4–10 тижнів',
    icon: ShoppingBag,
    slugs: ['ecommerce'],
    fallbackPrice: 25000,
    description: 'Каталог, кошик, оплата, замовлення, облік і панель керування — окрема комплексна розробка.',
    features: ['Каталог і фільтри', 'Кошик та оплата', 'Замовлення', 'Керування товарами', 'Тестування'],
  },
]

function StageVisual({ type }) {
  if (type === 'site') {
    return <div className="s7-service-visual is-site"><header><i /><i /><i /><span>your-business.ua</span></header><main><small>ГОЛОВНА ПРОПОЗИЦІЯ</small><h4>Сайт, який пояснює цінність за кілька секунд.</h4><button>Залишити заявку</button><div><span /><span /><span /></div></main></div>
  }
  if (type === 'automation') {
    return <div className="s7-service-visual is-system"><aside><b>DK.</b><i className="is-active" /><i /><i /><i /></aside><main><header><small>РОБОЧИЙ ПРОСТІР</small><strong>Клієнтський потік</strong></header><section><article><small>Заявки</small><b>12</b></article><article><small>AI-сценарії</small><b>04</b></article></section><div><Bot size={18} /><span>AI підготував відповідь клієнту</span><em>18 с</em></div></main></div>
  }
  return <div className="s7-service-visual is-shop"><header><b>Каталог</b><span>Кошик (2)</span></header><main><article><i /><small>Товар 01</small><b>1 490 грн</b></article><article><i /><small>Товар 02</small><b>2 190 грн</b></article><article><i /><small>Товар 03</small><b>890 грн</b></article></main><footer><span>Разом</span><b>3 680 грн</b></footer></div>
}

export default function HomeServices({ services }) {
  const prepared = useMemo(() => groups.map((group) => {
    const matches = services.filter((item) => group.slugs.includes(item.slug))
    const price = matches.length ? Math.min(...matches.map((item) => Number(item.price_from_uah || group.fallbackPrice))) : group.fallbackPrice
    return { ...group, price }
  }), [services])
  const [active, setActive] = useState(0)
  const service = prepared[active]
  const Icon = service.icon

  return (
    <section className="s7-services" id="services">
      <div className="s7-shell">
        <div className="s7-section-head" data-s7-reveal>
          <span className="s7-index">02 / Послуги</span>
          <h2>Три напрямки без дублювання: від першого сайту до повної цифрової системи.</h2>
          <div><p>Можна почати з компактного рішення й поступово додавати кабінети, AI, інтеграції та складну бізнес-логіку.</p><Link to="/services">Усі послуги й деталі <ArrowUpRight size={17} /></Link></div>
        </div>

        <div className="s7-services-layout" data-s7-reveal>
          <div className="s7-services-list">
            {prepared.map((item, index) => {
              const ItemIcon = item.icon
              return (
                <button key={item.key} type="button" className={active === index ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span><i><ItemIcon size={20} /></i><div><small>{item.label}</small><strong>{item.title}</strong><em>{item.duration}</em></div><ChevronRight size={22} />
                </button>
              )
            })}
            <Link className="s7-services-all" to="/services"><span>Порівняти всі формати, функції та орієнтири вартості</span><ArrowUpRight size={20} /></Link>
          </div>

          <article className={`s7-service-stage is-${service.key}`} key={service.key}>
            <div className="s7-service-stage-top"><span><Icon size={27} /></span><small>{service.label}</small></div>
            <StageVisual type={service.key} />
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <ul>{service.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
            <div className="s7-service-bottom"><span><small>Стартова вартість</small><b>від {service.price.toLocaleString('uk-UA')} грн</b></span><Link to="/services">Детальніше <ArrowUpRight size={18} /></Link></div>
          </article>
        </div>
      </div>
    </section>
  )
}
