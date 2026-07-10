import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api, { unwrap } from '../lib/api'
import { fallbackProjects, fallbackServices, fallbackPosts } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizePosts, localizeProjects, localizeServices } from '../i18n/localizedData'

export default function SearchModal({ onClose }) {
  const { language } = useLanguage()
  const copy = language === 'en' ? { placeholder: 'Search the website…', empty: 'Nothing found.', project: 'Project', service: 'Service', article: 'Article' } : { placeholder: 'Пошук по сайту…', empty: 'Нічого не знайдено.', project: 'Проєкт', service: 'Послуга', article: 'Стаття' }
  const fallback = useMemo(() => ({ projects: localizeProjects(fallbackProjects, language), services: localizeServices(fallbackServices, language), posts: localizePosts(fallbackPosts, language) }), [language])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ projects: [], services: [], posts: [] })

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) { setResults({ projects: [], services: [], posts: [] }); return }
    const timer = setTimeout(() => {
      api.get('/search/', { params: { q } }).then((response) => {
        const data = unwrap(response) || {}
        setResults({ projects: localizeProjects(data.projects || [], language), services: localizeServices(data.services || [], language), posts: localizePosts(data.posts || [], language) })
      }).catch(() => setResults({
        projects: fallback.projects.filter((x) => `${x.title} ${x.summary}`.toLowerCase().includes(q)),
        services: fallback.services.filter((x) => `${x.title} ${x.summary}`.toLowerCase().includes(q)),
        posts: fallback.posts.filter((x) => `${x.title} ${x.excerpt}`.toLowerCase().includes(q)),
      }))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, language, fallback])

  const total = (results.projects?.length || 0) + (results.services?.length || 0) + (results.posts?.length || 0)

  return <div className="search-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="search-panel">
    <div className="search-input"><Search size={28} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.placeholder} /><button className="icon-btn" onClick={onClose} aria-label={language === 'en' ? 'Close search' : 'Закрити пошук'}><X size={20} /></button></div>
    <div className="search-results">
      {query.length >= 2 && total === 0 && <p className="muted">{copy.empty}</p>}
      {results.projects?.map((item) => <Link className="search-result" key={`p-${item.id}`} to={`/projects/${item.slug}`} onClick={onClose}><strong>{item.title}</strong><span>{copy.project} · {item.summary}</span></Link>)}
      {results.services?.map((item) => <Link className="search-result" key={`s-${item.id}`} to="/services" onClick={onClose}><strong>{item.title}</strong><span>{copy.service} · {item.summary}</span></Link>)}
      {results.posts?.map((item) => <Link className="search-result" key={`b-${item.id}`} to={`/blog/${item.slug}`} onClick={onClose}><strong>{item.title}</strong><span>{copy.article} · {item.excerpt}</span></Link>)}
    </div>
  </div></div>
}
