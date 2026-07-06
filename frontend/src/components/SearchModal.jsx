import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api, { unwrap } from '../lib/api'
import { fallbackProjects, fallbackServices, fallbackPosts } from '../data/fallbackData'

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ projects: [], services: [], posts: [] })

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) {
      setResults({ projects: [], services: [], posts: [] })
      return
    }
    const timer = setTimeout(() => {
      api.get('/search/', { params: { q } }).then((response) => setResults(unwrap(response))).catch(() => {
        setResults({
          projects: fallbackProjects.filter((x) => `${x.title} ${x.summary}`.toLowerCase().includes(q)),
          services: fallbackServices.filter((x) => `${x.title} ${x.summary}`.toLowerCase().includes(q)),
          posts: fallbackPosts.filter((x) => `${x.title} ${x.excerpt}`.toLowerCase().includes(q)),
        })
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const total = (results.projects?.length || 0) + (results.services?.length || 0) + (results.posts?.length || 0)

  return (
    <div className="search-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-panel">
        <div className="search-input">
          <Search size={28} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук по сайту…" />
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="search-results">
          {query.length >= 2 && total === 0 && <p className="muted">Нічого не знайдено.</p>}
          {results.projects?.map((item) => <Link className="search-result" key={`p-${item.id}`} to={`/projects/${item.slug}`} onClick={onClose}><strong>{item.title}</strong><span>Проєкт · {item.summary}</span></Link>)}
          {results.services?.map((item) => <Link className="search-result" key={`s-${item.id}`} to="/services" onClick={onClose}><strong>{item.title}</strong><span>Послуга · {item.summary}</span></Link>)}
          {results.posts?.map((item) => <Link className="search-result" key={`b-${item.id}`} to={`/blog/${item.slug}`} onClick={onClose}><strong>{item.title}</strong><span>Стаття · {item.excerpt}</span></Link>)}
        </div>
      </div>
    </div>
  )
}
