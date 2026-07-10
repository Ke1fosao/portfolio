import { useEffect, useMemo, useState } from 'react'
import api, { unwrap } from '../lib/api'
import { fallbackPricing, fallbackSettings } from '../data/fallbackData'
import { PricingCard } from '../components/Common'
import { useLanguage } from '../i18n/LanguageContext'
import { localizePricing, localizeSettings } from '../i18n/localizedData'

export default function Pricing() {
  const { language } = useLanguage()
  const c = language === 'en' ? { eyebrow:'Pricing', title:'A transparent starting point and an individual estimate for complex solutions.', intro:'The prices below are guides for an initial discussion. Online stores, client portals, CRM, and AI systems are estimated after a short technical brief.', note:'USD and EUR are rounded estimates, not live exchange rates.' } : { eyebrow:'Вартість', title:'Прозорий старт. Індивідуальна оцінка складних рішень.', intro:'Ціни нижче — орієнтири для першого обговорення. Магазини, кабінети, CRM та AI-системи оцінюються після короткого технічного брифу.', note:'USD та EUR — округлені орієнтири, не актуальний валютний курс.' }
  const [rawPlans,setRawPlans] = useState(fallbackPricing)
  const [rawSettings,setRawSettings] = useState(fallbackSettings)
  const [currency,setCurrency] = useState('UAH')
  useEffect(() => { Promise.allSettled([api.get('/pricing/'),api.get('/settings/')]).then(([p,s]) => { if (p.status === 'fulfilled' && unwrap(p.value)?.length) setRawPlans(unwrap(p.value)); if (s.status === 'fulfilled' && unwrap(s.value)?.full_name) setRawSettings(unwrap(s.value)) }) }, [])
  const plans = useMemo(() => localizePricing(rawPlans,language), [rawPlans,language])
  const settings = useMemo(() => localizeSettings(rawSettings,language), [rawSettings,language])
  const rates = settings.currency_rates || { UAH:1, USD:.02, EUR:.02 }
  return <><section className="page-hero"><div className="container-shell"><div className="eyebrow">{c.eyebrow}</div><h1 className="display-lg" style={{ margin:'20px 0' }}>{c.title}</h1><p className="lead muted">{c.intro}</p></div></section><section className="section"><div className="container-shell"><div className="pricing-toolbar"><p className="muted">{c.note}</p><div className="currency-toggle">{['UAH','USD','EUR'].map((item) => <button key={item} className={currency === item ? 'active' : ''} onClick={() => setCurrency(item)}>{item}</button>)}</div></div><div className="pricing-grid">{plans.map((plan) => <PricingCard key={plan.id} plan={plan} currency={currency} rate={rates[currency] || 1} />)}</div></div></section></>
}
