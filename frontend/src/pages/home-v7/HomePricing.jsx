import { ArrowUpRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePricing({ pricing }) {
  return (
    <section className="s7-pricing" id="pricing">
      <div className="s7-shell">
        <div className="s7-section-head" data-s7-reveal>
          <span className="s7-index">05 / Орієнтири вартості</span>
          <h2>Починаємо з потрібного мінімуму й додаємо лише те, що дає бізнесу користь.</h2>
          <div><p>Фінальна оцінка залежить від структури, логіки, інтеграцій і контенту.</p><Link to="/pricing">Детальні ціни <ArrowUpRight size={17} /></Link></div>
        </div>
        <div className="s7-pricing-grid">
          {pricing.slice(0, 3).map((plan, index) => (
            <article key={plan.id || plan.title} className={plan.highlighted ? 'is-featured' : ''} data-s7-reveal>
              <header><span>{String(index + 1).padStart(2, '0')}</span><small>{plan.duration}</small></header>
              {plan.highlighted && <em>Найчастіший вибір</em>}
              <h3>{plan.title}</h3><p>{plan.tagline}</p>
              <div><small>від</small><strong>{Number(plan.price_uah).toLocaleString('uk-UA')} грн</strong></div>
              <ul>{(plan.features || []).map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
              <Link to="/contact"><span>Отримати оцінку</span><ArrowUpRight size={18} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
