import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackPosts } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizePosts } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/blog.css'
import '../styles/secondary-responsive.css'

const readTime = (content = '') => Math.max(2, Math.ceil(content.trim().split(/\s+/).length / 180))

export default function Blog() {
  const { language, locale } = useLanguage()
  const c = language === 'en' ? { all:'All', practice:'Practice', newArticle:'New article', h1:'Blog about websites, web systems, and AI automation', topics:'Topics', featured:'Featured article', read:'min read', article:'Read article', shortRead:'min', open:'Read', note:'Clear and practical', noteTitle:'I write about tools and approaches I use in my own projects.', noteText:'No abstract trends: website structure, admin panels, lead processing, automation, and practical AI use.' } : { all:'Усі', practice:'Практика', newArticle:'Нова стаття', h1:'Блог про сайти, вебсистеми та AI-автоматизацію', topics:'Теми', featured:'Обраний матеріал', read:'хв читання', article:'Читати статтю', shortRead:'хв', open:'Читати', note:'Коротко й по суті', noteTitle:'Пишу про те, що використовую у власних проєктах.', noteText:'Без абстрактних трендів: структура сайтів, адмінпанелі, робота із заявками, автоматизація та практичне використання AI.' }
  const [rawPosts, setRawPosts] = useState(fallbackPosts)
  const [filter, setFilter] = useState('all')
  useEffect(() => { api.get('/posts/').then((response) => { const remote = unwrap(response) || []; if (!remote.length) return; const slugs = new Set(remote.map((post) => post.slug)); setRawPosts([...remote, ...fallbackPosts.filter((post) => !slugs.has(post.slug))]) }).catch(() => {}) }, [])
  const posts = useMemo(() => localizePosts(rawPosts, language), [rawPosts, language])
  const categories = useMemo(() => [{ key:'all', label:c.all }, ...Array.from(new Map(posts.map((post) => [post.category || c.practice, { key:post.category || c.practice, label:post.category || c.practice }])).values())], [posts, c])
  const filtered = useMemo(() => filter === 'all' ? posts : posts.filter((post) => (post.category || c.practice) === filter), [posts, filter, c])
  const featured = filtered.find((post) => post.is_featured) || filtered[0]
  const rest = filtered.filter((post) => post !== featured)
  useEffect(() => { setFilter('all') }, [language])
  const dateLabel = (value) => { if (!value) return c.newArticle; const date = new Date(value); return Number.isNaN(date.getTime()) ? c.newArticle : date.toLocaleDateString(locale, { day:'numeric', month:'long', year:'numeric' }) }
  return <div className="blog-page modern-page"><section className="modern-section blog-list-section direct-start-section"><div className="container-shell"><h1 className="visually-hidden">{c.h1}</h1><div className="blog-filter-row"><span>{c.topics}</span><div>{categories.map((category) => <button key={category.key} type="button" className={filter === category.key ? 'is-active' : ''} onClick={() => setFilter(category.key)}>{category.label}</button>)}</div></div>
    {featured && <Link className="blog-featured" to={`/blog/${featured.slug}`}><div className="blog-featured-image"><img src={featured.uploaded_cover_url || featured.cover_image_url || '/assets/blog-automation.svg'} alt={featured.title} /><span><Sparkles size={16} /> {c.featured}</span></div><div className="blog-featured-copy"><div className="blog-meta"><span>{featured.category || c.practice}</span><span><Clock3 size={14} /> {readTime(featured.content)} {c.read}</span></div><h2>{featured.title}</h2><p>{featured.excerpt}</p><div><small>{dateLabel(featured.published_at || featured.created_at)}</small><strong>{c.article} <ArrowRight size={18} /></strong></div></div></Link>}
    {rest.length > 0 && <div className="blog-modern-grid">{rest.map((post,index) => <Link className="blog-card-modern" key={post.id || post.slug} to={`/blog/${post.slug}`}><div><img src={post.uploaded_cover_url || post.cover_image_url || '/assets/blog-automation.svg'} alt={post.title} /><span>0{index+2}</span></div><div className="blog-meta"><span>{post.category || c.practice}</span><span>{readTime(post.content)} {c.shortRead}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><strong>{c.open} <ArrowRight size={17} /></strong></Link>)}</div>}
  </div></section><section className="modern-section blog-note-section"><div className="container-shell blog-note"><div><span>{c.note}</span><h2>{c.noteTitle}</h2></div><p>{c.noteText}</p></div></section></div>
}
