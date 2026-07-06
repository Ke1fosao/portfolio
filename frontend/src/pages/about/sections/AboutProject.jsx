import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectMedia from '../../../components/ProjectMedia'
import { fallbackAboutPage } from '../../../data/fallbackData'

export default function AboutProject({ about, babyland }) {
  return <section className="about-project-story">
    <div className="about-project-visual" data-about-reveal><ProjectMedia project={babyland} /></div>
    <div className="about-project-copy"><div className="about-chapter-label" data-about-reveal><span>03</span><span>Результат</span></div><h2 data-about-reveal>{about.babyland_title}</h2><p data-about-reveal>{about.babyland_text}</p>
      <div className="about-project-facts">{(about.project_facts?.length ? about.project_facts : fallbackAboutPage.project_facts).map((fact) => <div data-about-reveal key={`${fact.value}-${fact.label}`}><strong>{fact.value}</strong><span>{fact.label}</span></div>)}</div>
      <div className="about-project-actions" data-about-reveal><a className="about-button about-button-light" href="https://babyland.com.ua/" target="_blank" rel="noreferrer"><span>Відкрити живий сайт</span><ArrowUpRight size={18} /></a><Link className="about-text-action about-text-action-light" to="/projects/baby-land">Повний кейс <ArrowRight size={17} /></Link></div>
    </div>
  </section>
}
