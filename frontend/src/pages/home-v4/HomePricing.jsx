import { Check, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePricing({ pricing }) {
  return (
    <section className="sales3-pricing" id="pricing">
      <div className="sales3-shell">
        <div className="sales3-section-head" data-sales-reveal>
          <span className="sales3-section-index">05 / Орієнтири вартості</span>
          <h2>Можна почати з малого. Головне — одразу закласти правильну основу.</h2>
          <p>Фінальна оцінка залежить від сторінок, логіки, інтеграцій та обсягу контенту.</p>
        </div>
        <div className="sales3-pricing-grid">
          {pricing.slice(0, 3).map((plan, index) => (
            <article key={plan.id || plan.title} className={plan.highlighted ? 'is-featured' : ''} data-sales-reveal>
              <div className="sales3-price-top"><span>{String(index + 1).padStart(2, '0')}</span><small>{plan.duration}</small></div>
              <h3>{plan.title}</h3>
              <p>{plan.tagline}</p>
              <div className="sales3-price-value"><small>від</small><strong>{Number(plan.price_uah).toLocaleString('uk-UA')} грн</strong></div>
              <ul>{(plan.features || []).map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
              <Link to="/contact">Отримати оцінку <ArrowUpRight size={18} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
