import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectMedia from './ProjectMedia'

export function SectionHeading({ eyebrow, title, text, action }) {
  return <div className="section-head"><div><div className="eyebrow">{eyebrow}</div><h2 className="display-md" style={{ margin: '15px 0 0' }}>{title}</h2></div><div>{text && <p>{text}</p>}{action}</div></div>
}

export function ProjectCard({ project }) {
  return <Link className="project-card" to={`/projects/${project.slug}`}>
    <div className="project-visual"><ProjectMedia project={project} compact /></div>
    <div className="project-info">
      <div>
        <div className="project-badges"><span className="project-status">{project.category}</span>{project.ai_integration && <span className="project-status">AI integration</span>}{project.status === 'concept' && <span className="project-status">У розробці</span>}</div>
        <h3>{project.title}</h3><p>{project.summary}</p>
      </div>
      <span className="icon-btn"><ArrowRight size={20} /></span>
    </div>
  </Link>
}

export function FAQList({ items }) {
  const [open, setOpen] = useState(items?.[0]?.id || null)
  return <div className="faq-list">{items.map((item) => <div className="faq-item" key={item.id}><button className="faq-question" onClick={() => setOpen(open === item.id ? null : item.id)}><span>{item.question}</span>{open === item.id ? <ChevronUp /> : <ChevronDown />}</button>{open === item.id && <div className="faq-answer">{item.answer}</div>}</div>)}</div>
}

export function PricingCard({ plan, currency = 'UAH', rate = 1 }) {
  const amount = Math.round(plan.price_uah * rate)
  const symbol = currency === 'UAH' ? '₴' : currency === 'USD' ? '$' : '€'
  const display = currency === 'UAH' ? `${amount.toLocaleString('uk-UA')} ${symbol}` : `${symbol}${amount.toLocaleString('uk-UA')}`
  return <div className={`price-card ${plan.highlighted ? 'highlighted' : ''}`}>
    <div className="eyebrow">{plan.highlighted ? 'Найчастіший вибір' : 'Пакет'}</div>
    <h3 style={{ fontSize: 32, margin: '18px 0 8px', letterSpacing: '-.04em' }}>{plan.title}</h3>
    <p className="muted" style={{ lineHeight: 1.6 }}>{plan.tagline}</p>
    <div className="price">від {display}</div><div className="muted">{plan.duration}</div>
    <ul>{(plan.features || []).map((feature) => <li key={feature}><Check size={18} /> <span>{feature}</span></li>)}</ul>
    {plan.complexity_note && <p className="muted" style={{ fontSize: 13 }}>{plan.complexity_note}</p>}
    <Link className="btn btn-light" to="/contact">Обговорити проєкт <ArrowRight size={18} /></Link>
  </div>
}
