import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, ExternalLink, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectMedia from '../../components/ProjectMedia'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function projectState(project) {
  if (project?.status === 'concept') return 'У розробці'
  if (project?.live_url) return 'Запущено'
  return 'Кейс'
}

export default function HomeProjectDeck({ projects = [] }) {
  const sectionRef = useRef(null)
  const frameRef = useRef(null)
  const [progress, setProgress] = useState(0)

  const items = useMemo(() => projects.slice(0, 4), [projects])
  const exactIndex = items.length > 1 ? progress * (items.length - 1) : 0
  const activeIndex = clamp(Math.round(exactIndex), 0, Math.max(items.length - 1, 0))

  useEffect(() => {
    const section = sectionRef.current
    if (!section || items.length < 2) return undefined

    const update = () => {
      const rect = section.getBoundingClientRect()
      const viewport = window.innerHeight
      const travel = Math.max(1, rect.height - viewport)
      setProgress(clamp(-rect.top / travel))
      frameRef.current = null
    }

    const requestUpdate = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
    }
  }, [items.length])

  if (!items.length) return null

  return (
    <section
      ref={sectionRef}
      className="dk2-project-deck"
      id="projects"
      style={{ '--deck-count': items.length, '--deck-height': `${Math.max(2, items.length) * 100 + 35}svh` }}
      aria-label="Вибрані проєкти"
    >
      <div className="dk2-project-deck-sticky">
        <div className="dk2-project-deck-grid" aria-hidden="true" />

        <header className="dk2-project-deck-header">
          <div>
            <span className="dk2-section-index">03 / Роботи</span>
            <h2>Продукти, які можна не лише переглянути — ними можна користуватися.</h2>
          </div>
          <div className="dk2-project-deck-progress">
            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            <div><i style={{ transform: `scaleX(${items.length > 1 ? exactIndex / (items.length - 1) : 1})` }} /></div>
            <span>{String(items.length).padStart(2, '0')}</span>
          </div>
        </header>

        <div className="dk2-project-deck-scene">
          {items.map((project, index) => {
            const delta = index - exactIndex
            const isPast = delta < 0
            const translate = isPast
              ? Math.max(-17, delta * 13)
              : Math.min(92, delta * 88)
            const scale = isPast
              ? Math.max(.86, 1 + delta * .065)
              : Math.max(.94, 1 - delta * .035)
            const opacity = delta < -1.35 ? 0 : delta > 1.2 ? .2 : 1
            const blur = delta < -1 ? Math.min(7, Math.abs(delta + 1) * 8) : 0
            const rotate = delta > 0 ? Math.min(3.5, delta * 2.4) : Math.max(-1.2, delta * .7)
            const isActive = index === activeIndex

            return (
              <article
                key={project.id ?? project.slug}
                className={`dk2-deck-card ${isActive ? 'is-active' : ''}`}
                style={{
                  '--deck-y': `${translate}%`,
                  '--deck-scale': scale,
                  '--deck-opacity': opacity,
                  '--deck-blur': `${blur}px`,
                  '--deck-rotate': `${rotate}deg`,
                  '--deck-z': items.length - index,
                }}
                aria-hidden={!isActive}
              >
                <div className="dk2-deck-card-copy">
                  <div className="dk2-deck-card-topline">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{project.category}</span>
                    <span className="dk2-deck-state"><i /> {projectState(project)}</span>
                  </div>

                  <div className="dk2-deck-card-main">
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <div className="dk2-deck-tags">
                      {(project.technologies || []).slice(0, 5).map((technology) => <span key={technology}>{technology}</span>)}
                    </div>
                  </div>

                  <div className="dk2-deck-metrics">
                    {(project.metrics || []).slice(0, 3).map((metric) => (
                      <div key={`${metric.value}-${metric.label}`}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="dk2-deck-actions">
                    <Link to={`/projects/${project.slug}`}>Повний кейс <ArrowUpRight size={18} /></Link>
                    {project.live_url ? (
                      <a href={project.live_url} target="_blank" rel="noreferrer">Живий продукт <ExternalLink size={17} /></a>
                    ) : (
                      <Link to="/contact">Обговорити впровадження <ArrowUpRight size={18} /></Link>
                    )}
                  </div>
                </div>

                <Link className="dk2-deck-card-media" to={`/projects/${project.slug}`} tabIndex={isActive ? 0 : -1}>
                  <ProjectMedia project={project} compact />
                  <span className="dk2-deck-media-label"><Layers3 size={16} /> Дослідити продукт</span>
                  <span className="dk2-deck-media-arrow"><ArrowUpRight size={28} /></span>
                </Link>
              </article>
            )
          })}
        </div>

        <div className="dk2-project-deck-footer">
          <span>Гортай вниз</span>
          <div className="dk2-deck-dots">
            {items.map((project, index) => (
              <i key={project.id ?? project.slug} className={index === activeIndex ? 'is-active' : ''} />
            ))}
          </div>
          <Link to="/projects">Усі роботи <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>
  )
}
