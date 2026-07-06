import { BrainCircuit, Code2, Layers3 } from 'lucide-react'
import { defaultPrinciples } from '../constants'

export default function AboutPrinciples({ about }) {
  const icons = [Layers3, Code2, BrainCircuit]
  return <section className="about-principles-section"><div className="about-wide-container"><div className="about-principles-heading"><div className="about-chapter-label" data-about-reveal><span>05</span><span>Як я працюю</span></div><h2 data-about-reveal>{about.principles_title}</h2></div><div className="about-principles-grid">{(about.principles?.length ? about.principles : defaultPrinciples).map((item, index) => { const Icon = item.icon || icons[index % icons.length]; return <article className="about-principle" key={item.number || index} data-about-reveal><div><span>{item.number || `0${index + 1}`}</span><Icon size={25} /></div><h3>{item.title}</h3><p>{item.text}</p></article> })}</div></div></section>
}
