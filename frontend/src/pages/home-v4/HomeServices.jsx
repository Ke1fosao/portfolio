import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, Code2, Cpu, PanelsTopLeft, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

const icons = [PanelsTopLeft, Cpu, Code2, ShoppingBag]
export default function HomeServices({ services }) {
  const { language, locale } = useLanguage()
  const c = language === 'en' ? { index:'02 / Services', title:'From a first website to an internal company system.', intro:'Start with a compact solution and expand it together with the business.', custom:'Custom development', price:'Starting price', from:'from', currency:'UAH', details:'Details' } : { index:'02 / Послуги', title:'Від першого сайту до внутрішньої системи для компанії.', intro:'Можна почати з компактного рішення й розвивати його разом із бізнесом.', custom:'Індивідуальна розробка', price:'Стартова вартість', from:'від', currency:'грн', details:'Детальніше' }
  const visible = useMemo(() => services.slice(0, 4), [services])
  const [active, setActive] = useState(0)
  const service = visible[active] || visible[0]
  const Icon = icons[active] || Code2
  return <section className="sales3-services" id="services"><div className="sales3-shell"><div className="sales3-section-head" data-sales-reveal><span className="sales3-section-index">{c.index}</span><h2>{c.title}</h2><p>{c.intro}</p></div><div className="sales3-services-layout" data-sales-reveal><div className="sales3-services-list">{visible.map((item, index) => <button key={item.id || item.slug} type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className={active === index ? 'is-active' : ''}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.duration}</small></div><ChevronRight size={22} /></button>)}</div>{service && <article className="sales3-service-stage" key={service.id || service.slug}><div className="sales3-service-stage-top"><span><Icon size={28} /></span><small>{service.complexity || c.custom}</small></div><h3>{service.title}</h3><p>{service.description || service.summary}</p><ul>{(service.features || []).slice(0, 5).map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><div className="sales3-service-stage-bottom"><span><small>{c.price}</small><b>{c.from} {Number(service.price_from_uah || 5000).toLocaleString(locale)} {c.currency}</b></span><Link to="/services">{c.details} <ArrowUpRight size={18} /></Link></div></article>}</div></div></section>
}
