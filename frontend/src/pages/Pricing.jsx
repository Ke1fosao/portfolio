import { useEffect, useState } from 'react'
import api, { unwrap } from '../lib/api'
import { fallbackPricing, fallbackSettings } from '../data/fallbackData'
import { PricingCard } from '../components/Common'

export default function Pricing() {
  const [plans, setPlans] = useState(fallbackPricing)
  const [settings, setSettings] = useState(fallbackSettings)
  const [currency, setCurrency] = useState('UAH')
  useEffect(() => { Promise.allSettled([api.get('/pricing/'), api.get('/settings/')]).then(([p, s]) => { if (p.status === 'fulfilled' && unwrap(p.value)?.length) setPlans(unwrap(p.value)); if (s.status === 'fulfilled' && unwrap(s.value)?.full_name) setSettings(unwrap(s.value)) }) }, [])
  const rates = settings.currency_rates || { UAH: 1, USD: .02, EUR: .02 }
  return <>
    <section className="page-hero"><div className="container-shell"><div className="eyebrow">Вартість</div><h1 className="display-lg" style={{ margin: '20px 0' }}>Прозорий старт. Індивідуальна оцінка складних рішень.</h1><p className="lead muted">Ціни нижче — орієнтири для першого обговорення. Магазини, кабінети, CRM та AI-системи оцінюються після короткого технічного брифу.</p></div></section>
    <section className="section"><div className="container-shell"><div className="pricing-toolbar"><p className="muted">USD та EUR — округлені орієнтири, не актуальний валютний курс.</p><div className="currency-toggle">{['UAH','USD','EUR'].map((c) => <button key={c} className={currency === c ? 'active' : ''} onClick={() => setCurrency(c)}>{c}</button>)}</div></div><div className="pricing-grid">{plans.map((p) => <PricingCard key={p.id} plan={p} currency={currency} rate={rates[currency] || 1} />)}</div></div></section>
  </>
}
