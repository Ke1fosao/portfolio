import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackProjects } from '../data/fallbackData'
import { ProjectCard } from '../components/Common'
import ProjectMedia from '../components/ProjectMedia'
import '../styles/secondary-base.css'
import '../styles/projects.css'
import '../styles/secondary-responsive.css'

export default function Projects() {
  const [projects, setProjects] = useState(fallbackProjects)
  const [filter, setFilter] = useState('Усі')

  useEffect(() => {
    api.get('/projects/').then((response) => {
      const data = unwrap(response)
      if (data?.length) setProjects(data)
    }).catch(() => {})
  }, [])

  const categories = useMemo(() => ['Усі', ...new Set(projects.map((project) => project.category).filter(Boolean))], [projects])
  const filtered = useMemo(() => filter === 'Усі' ? projects : projects.filter((project) => project.category === filter), [projects, filter])
  const babyland = projects.find((project) => project.slug === 'baby-land') || fallbackProjects[0]
  const otherProjects = filtered.filter((project) => project.slug !== 'baby-land')
  const showBabyland = filter === 'Усі' || babyland.category === filter

  return (
    <div className="projects-page modern-page">
      <section className="modern-section projects-list-section direct-start-section">
        <div className="container-shell">
          <h1 className="visually-hidden">Роботи та реалізовані проєкти</h1>
          <div className="projects-filter-bar">
            <div><span>Виберіть напрям</span><strong>{filtered.length} {filtered.length === 1 ? 'робота' : 'роботи'}</strong></div>
            <div className="projects-filter-buttons">
              {categories.map((category) => <button key={category} type="button" className={filter === category ? 'is-active' : ''} onClick={() => setFilter(category)}>{category}</button>)}
            </div>
          </div>

          {showBabyland && (
            <Link to="/projects/baby-land" className="projects-featured-card">
              <div className="projects-featured-copy">
                <div className="project-badges"><span>Комерційний запуск</span><span>Full-stack</span></div>
                <small>01 · Основний кейс</small>
                <h2>BABY LAND</h2>
                <p>{babyland.summary}</p>
                <ul><li><CheckCircle2 size={16} /> Онлайн-заявки</li><li><CheckCircle2 size={16} /> Кастомна адмінпанель</li><li><CheckCircle2 size={16} /> Контент і команда</li></ul>
                <div><strong>Відкрити повний кейс</strong><i><ArrowRight size={20} /></i></div>
              </div>
              <div className="projects-featured-visual"><ProjectMedia project={babyland} compact /></div>
            </Link>
          )}

          {otherProjects.length > 0 && <div className="projects-modern-grid">{otherProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}
          {!showBabyland && otherProjects.length === 0 && <div className="projects-empty">У цій категорії поки немає опублікованих проєктів.</div>}
        </div>
      </section>

      <section className="modern-section modern-cta-wrap">
        <div className="container-shell"><div className="modern-cta"><span>Наступний кейс може бути вашим</span><h2>Потрібен сайт, кабінет або AI-система з такою ж увагою до деталей?</h2><Link className="modern-button is-lime" to="/contact">Розповісти про задачу <ArrowRight size={18} /></Link></div></div>
      </section>
    </div>
  )
}
