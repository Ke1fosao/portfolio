import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, Share2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackPosts } from '../data/fallbackData'
import SEO, { breadcrumbSchema } from '../components/SEO'
import '../styles/secondary-base.css'
import '../styles/blog.css'
import '../styles/secondary-responsive.css'

const readTime = (content = '') => Math.max(2, Math.ceil(content.trim().split(/\s+/).length / 180))

function ArticleContent({ content = '' }) {
  return content.split('\n').filter((line) => line.trim()).map((line, index) => {
    const value = line.trim()
    if (value.startsWith('## ')) return <h2 id={`section-${index}`} key={index}>{value.slice(3)}</h2>
    if (value.startsWith('### ')) return <h3 key={index}>{value.slice(4)}</h3>
    return <p key={index}>{value}</p>
  })
}

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(fallbackPosts.find((item) => item.slug === slug))
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    api.get(`/posts/${slug}/`).then((response) => setPost(unwrap(response))).catch(() => {})
  }, [slug])

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headings = useMemo(() => (post?.content || '').split('\n').map((line, index) => ({ line: line.trim(), index })).filter((item) => item.line.startsWith('## ')), [post])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (!post) return <><SEO title="Статтю не знайдено" description="Запитану статтю не знайдено." path={`/blog/${slug}`} noindex /><section className="page-hero"><div className="container-shell"><h1>Статтю не знайдено.</h1></div></section></>

  const articleImage = post.uploaded_cover_url || post.cover_image_url || '/assets/blog-automation.svg'
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: articleImage,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' },
    publisher: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' },
    mainEntityOfPage: `/blog/${post.slug}`,
  }

  return (
    <>
      <SEO title={post.title} description={post.excerpt} path={`/blog/${post.slug}`} image={articleImage} type="article" schema={[breadcrumbSchema([{ name: 'Головна', path: '/' }, { name: 'Блог', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }]), articleSchema]} />
    <div className="blog-detail-page modern-page">
      <div className="article-progress" style={{ transform: `scaleX(${progress / 100})` }} />
      <section className="article-hero">
        <div className="container-shell article-hero-inner">
          <Link className="detail-back" to="/blog"><ArrowLeft size={16} /> До блогу</Link>
          <div className="article-meta"><span>{post.category || 'Практика'}</span><span><Clock3 size={15} /> {readTime(post.content)} хв читання</span></div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="article-author-row"><div className="article-author"><i>DK</i><span><strong>Дмитро Ковтунович</strong><small>Full-stack developer</small></span></div><button type="button" onClick={copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Посилання скопійовано' : 'Скопіювати посилання'}</button></div>
        </div>
      </section>

      <section className="article-cover-section"><div className="container-shell"><div className="article-cover"><img src={post.uploaded_cover_url || post.cover_image_url || '/assets/blog-automation.svg'} alt={post.title} /><span><Share2 size={17} /> Практичний матеріал</span></div></div></section>

      <section className="modern-section article-body-section">
        <div className="container-shell article-layout">
          <aside className="article-aside">
            <span>У цій статті</span>
            <nav>{headings.length ? headings.map((heading) => <a key={heading.index} href={`#section-${heading.index}`}>{heading.line.slice(3)}</a>) : <a href="#article-start">Основна думка</a>}</nav>
            <div><strong>Потрібна така система?</strong><p>Обговоримо задачу й визначимо мінімальний корисний функціонал.</p><Link to="/contact">Написати Дмитру <ArrowRight size={16} /></Link></div>
          </aside>
          <article className="article-content" id="article-start">
            <div className="article-lead-box"><span>Головна думка</span><p>{post.excerpt}</p></div>
            <ArticleContent content={post.content} />
            <div className="article-ending"><span>Підсумок</span><h2>Цифровий продукт має економити час або створювати нову цінність — інакше це просто ще одна сторінка в інтернеті.</h2><Link to="/contact">Обговорити свій проєкт <ArrowRight size={18} /></Link></div>
          </article>
        </div>
      </section>
    </div>
    </>
  )
}
