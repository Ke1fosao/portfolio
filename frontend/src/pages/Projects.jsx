import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackProjects } from '../data/fallbackData'
import { ProjectCard } from '../components/Common'
import ProjectMedia from '../components/ProjectMedia'
import { useLanguage } from '../i18n/LanguageContext'
import { localizeProjects } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/projects.css'
import '../styles/secondary-responsive.css'

export default function Projects() {
  const { language } = useLanguage()
  const c = language === 'en' ? { all:'All', h1:'Projects and completed work', choose:'Choose a category', one:'project', many:'projects', launch:'Commercial launch', main:'01 · Featured case', features:['Online applications','Custom admin panel','Content and team'], open:'Open full case study', empty:'There are no published projects in this category yet.', cta:'Your project could be the next case study', ctaTitle:'Need a website, portal, or AI system with the same attention to detail?', action:'Tell me about the task' } : { all:'Усі', h1:'Роботи та реалізовані проєкти', choose:'Виберіть напрям', one:'робота', many:'роботи', launch:'Комерційний запуск', main:'01 · Основний кейс', features:['Онлайн-заявки','Кастомна адмінпанель','Контент і команда'], open:'Відкрити повний кейс', empty:'У цій категорії поки немає опублікованих проєктів.', cta:'Наступний кейс може бути вашим', ctaTitle:'Потрібен сайт, кабінет або AI-система з такою ж увагою до деталей?', action:'Розповісти про задачу' }
  const [rawProjects, setRawProjects] = useState(fallbackProjects)
  const [filter, setFilter] = useState('all')
  useEffect(() => { api.get('/projects/').then((response) => { const data = unwrap(response); if (data?.length) setRawProjects(data) }).catch(() => {}) }, [])
  const projects = useMemo(() => localizeProjects(rawProjects, language), [rawProjects, language])
  const categories = useMemo(() => [{ key:'all', label:c.all }, ...Array.from(new Map(projects.map((project) => [project.category, { key:project.category, label:project.category }]).filter(([key]) => key)).values())], [projects, c.all])
  const filtered = useMemo(() => filter === 'all' ? projects : projects.filter((project) => project.category === filter), [projects, filter])
  const babyland = projects.find((project) => project.slug === 'baby-land') || localizeProjects(fallbackProjects, language)[0]
  const otherProjects = filtered.filter((project) => project.slug !== 'baby-land')
  const showBabyland = filter === 'all' || babyland.category === filter
  useEffect(() => { setFilter('all') }, [language])

  return <div className="projects-page modern-page"><section className="modern-section projects-list-section direct-start-section"><div className="container-shell"><h1 className="visually-hidden">{c.h1}</h1><div className="projects-filter-bar"><div><span>{c.choose}</span><strong>{filtered.length} {filtered.length === 1 ? c.one : c.many}</strong></div><div className="projects-filter-buttons">{categories.map((category) => <button key={category.key} type="button" className={filter === category.key ? 'is-active' : ''} onClick={() => setFilter(category.key)}>{category.label}</button>)}</div></div>
    {showBabyland && <Link to="/projects/baby-land" className="projects-featured-card"><div className="projects-featured-copy"><div className="project-badges"><span>{c.launch}</span><span>Full-stack</span></div><small>{c.main}</small><h2>BABY LAND</h2><p>{babyland.summary}</p><ul>{c.features.map((feature) => <li key={feature}><CheckCircle2 size={16} /> {feature}</li>)}</ul><div><strong>{c.open}</strong><i><ArrowRight size={20} /></i></div></div><div className="projects-featured-visual"><ProjectMedia project={babyland} compact /></div></Link>}
    {otherProjects.length > 0 && <div className="projects-modern-grid">{otherProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}
    {!showBabyland && otherProjects.length === 0 && <div className="projects-empty">{c.empty}</div>}
  </div></section><section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>{c.cta}</span><h2>{c.ctaTitle}</h2><Link className="modern-button is-lime" to="/contact">{c.action} <ArrowRight size={18} /></Link></div></div></section></div>
}
