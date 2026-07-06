import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackPosts } from '../data/fallbackData'
import '../styles/secondary-base.css'
import '../styles/blog.css'
import '../styles/secondary-responsive.css'

const readTime = (content = '') => Math.max(2, Math.ceil(content.trim().split(/\s+/).length / 180))
const dateLabel = (value) => {
  if (!value) return 'Нова стаття'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Нова стаття' : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Blog() {
  const [posts, setPosts] = useState(fallbackPosts)
  const [filter, setFilter] = useState('Усі')

  useEffect(() => {
    api.get('/posts/').then((response) => {
      const remote = unwrap(response) || []
      if (!remote.length) return
      const slugs = new Set(remote.map((post) => post.slug))
      setPosts([...remote, ...fallbackPosts.filter((post) => !slugs.has(post.slug))])
    }).catch(() => {})
  }, [])

  const categories = useMemo(() => ['Усі', ...new Set(posts.map((post) => post.category || 'Практика'))], [posts])
  const filtered = useMemo(() => filter === 'Усі' ? posts : posts.filter((post) => (post.category || 'Практика') === filter), [posts, filter])
  const featured = filtered.find((post) => post.is_featured) || filtered[0]
  const rest = filtered.filter((post) => post !== featured)

  return (
    <div className="blog-page modern-page">
      <section className="modern-section blog-list-section direct-start-section">
        <div className="container-shell">
          <h1 className="visually-hidden">Блог про сайти, вебсистеми та AI-автоматизацію</h1>
          <div className="blog-filter-row">
            <span>Теми</span>
            <div>{categories.map((category) => <button key={category} type="button" className={filter === category ? 'is-active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
          </div>

          {featured && (
            <Link className="blog-featured" to={`/blog/${featured.slug}`}>
              <div className="blog-featured-image"><img src={featured.uploaded_cover_url || featured.cover_image_url || '/assets/blog-automation.svg'} alt={featured.title} /><span><Sparkles size={16} /> Обраний матеріал</span></div>
              <div className="blog-featured-copy">
                <div className="blog-meta"><span>{featured.category || 'Практика'}</span><span><Clock3 size={14} /> {readTime(featured.content)} хв читання</span></div>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
                <div><small>{dateLabel(featured.published_at || featured.created_at)}</small><strong>Читати статтю <ArrowRight size={18} /></strong></div>
              </div>
            </Link>
          )}

          {rest.length > 0 && <div className="blog-modern-grid">{rest.map((post, index) => (
            <Link className="blog-card-modern" key={post.id || post.slug} to={`/blog/${post.slug}`}>
              <div><img src={post.uploaded_cover_url || post.cover_image_url || '/assets/blog-automation.svg'} alt={post.title} /><span>0{index + 2}</span></div>
              <div className="blog-meta"><span>{post.category || 'Практика'}</span><span>{readTime(post.content)} хв</span></div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <strong>Читати <ArrowRight size={17} /></strong>
            </Link>
          ))}</div>}
        </div>
      </section>

      <section className="modern-section blog-note-section">
        <div className="container-shell blog-note"><div><span>Коротко й по суті</span><h2>Пишу про те, що використовую у власних проєктах.</h2></div><p>Без абстрактних трендів: структура сайтів, адмінпанелі, робота із заявками, автоматизація та практичне використання AI.</p></div>
      </section>
    </div>
  )
}
