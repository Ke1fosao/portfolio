import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, Share2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackPosts } from '../data/fallbackData'
import SEO, { breadcrumbSchema } from '../components/SEO'
import { useLanguage } from '../i18n/LanguageContext'
import { localizePost } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/blog.css'
import '../styles/secondary-responsive.css'

const readTime = (content = '') => Math.max(2, Math.ceil(content.trim().split(/\s+/).length / 180))
function ArticleContent({ content = '' }) { return content.split('\n').filter((line) => line.trim()).map((line,index) => { const value = line.trim(); if (value.startsWith('## ')) return <h2 id={`section-${index}`} key={index}>{value.slice(3)}</h2>; if (value.startsWith('### ')) return <h3 key={index}>{value.slice(4)}</h3>; return <p key={index}>{value}</p> }) }

export default function BlogDetail() {
  const { language } = useLanguage()
  const c = language === 'en' ? { missing:'Article not found', missingDesc:'The requested article could not be found.', home:'Home', blog:'Blog', back:'Back to blog', practice:'Practice', read:'min read', copied:'Link copied', copy:'Copy link', practical:'Practical article', contents:'In this article', main:'Main idea', system:'Need a similar system?', systemText:'Let us discuss the task and define the minimum useful functionality.', contact:'Message Dmytro', summary:'Summary', final:'A digital product should save time or create new value. Otherwise, it is simply another page on the internet.', action:'Discuss your project', author:'Dmytro Kovtunovych' } : { missing:'Статтю не знайдено', missingDesc:'Запитану статтю не знайдено.', home:'Головна', blog:'Блог', back:'До блогу', practice:'Практика', read:'хв читання', copied:'Посилання скопійовано', copy:'Скопіювати посилання', practical:'Практичний матеріал', contents:'У цій статті', main:'Основна думка', system:'Потрібна така система?', systemText:'Обговоримо задачу й визначимо мінімальний корисний функціонал.', contact:'Написати Дмитру', summary:'Підсумок', final:'Цифровий продукт має економити час або створювати нову цінність — інакше це просто ще одна сторінка в інтернеті.', action:'Обговорити свій проєкт', author:'Дмитро Ковтунович' }
  const { slug } = useParams()
  const [rawPost, setRawPost] = useState(fallbackPosts.find((item) => item.slug === slug))
  const post = useMemo(() => localizePost(rawPost, language), [rawPost, language])
  const [copied,setCopied] = useState(false)
  const [progress,setProgress] = useState(0)
  useEffect(() => { api.get(`/posts/${slug}/`).then((response) => setRawPost(unwrap(response))).catch(() => {}) }, [slug])
  useEffect(() => { const onScroll = () => { const total = document.documentElement.scrollHeight - window.innerHeight; setProgress(total > 0 ? Math.min(100,(window.scrollY/total)*100) : 0) }; onScroll(); window.addEventListener('scroll',onScroll,{ passive:true }); return () => window.removeEventListener('scroll',onScroll) }, [])
  const headings = useMemo(() => (post?.content || '').split('\n').map((line,index) => ({ line:line.trim(), index })).filter((item) => item.line.startsWith('## ')), [post])
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false),1800) } catch { setCopied(false) } }
  if (!post) return <><SEO title={c.missing} description={c.missingDesc} path={`/blog/${slug}`} noindex /><section className="page-hero"><div className="container-shell"><h1>{c.missing}.</h1></div></section></>
  const articleImage = post.uploaded_cover_url || post.cover_image_url || '/assets/blog-automation.svg'
  const articleSchema = { '@context':'https://schema.org', '@type':'Article', headline:post.title, description:post.excerpt, image:articleImage, datePublished:post.published_at || undefined, dateModified:post.updated_at || post.published_at || undefined, author:{ '@type':'Person', name:c.author }, publisher:{ '@type':'Person', name:c.author }, mainEntityOfPage:`/blog/${post.slug}` }
  return <><SEO title={post.seo_title || post.title} description={post.seo_description || post.excerpt} path={`/blog/${post.slug}`} image={articleImage} type="article" schema={[breadcrumbSchema([{ name:c.home,path:'/' },{ name:c.blog,path:'/blog' },{ name:post.title,path:`/blog/${post.slug}` }]),articleSchema]} /><div className="blog-detail-page modern-page"><div className="article-progress" style={{ transform:`scaleX(${progress/100})` }} /><section className="article-hero"><div className="container-shell article-hero-inner"><Link className="detail-back" to="/blog"><ArrowLeft size={16} /> {c.back}</Link><div className="article-meta"><span>{post.category || c.practice}</span><span><Clock3 size={15} /> {readTime(post.content)} {c.read}</span></div><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-author-row"><div className="article-author"><i>DK</i><span><strong>{c.author}</strong><small>Full-stack developer</small></span></div><button type="button" onClick={copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? c.copied : c.copy}</button></div></div></section>
    <section className="article-cover-section"><div className="container-shell"><div className="article-cover"><img src={articleImage} alt={post.title} /><span><Share2 size={17} /> {c.practical}</span></div></div></section>
    <section className="modern-section article-body-section"><div className="container-shell article-layout"><aside className="article-aside"><span>{c.contents}</span><nav>{headings.length ? headings.map((heading) => <a key={heading.index} href={`#section-${heading.index}`}>{heading.line.slice(3)}</a>) : <a href="#article-start">{c.main}</a>}</nav><div><strong>{c.system}</strong><p>{c.systemText}</p><Link to="/contact">{c.contact} <ArrowRight size={16} /></Link></div></aside><article className="article-content" id="article-start"><div className="article-lead-box"><span>{c.main}</span><p>{post.excerpt}</p></div><ArticleContent content={post.content} /><div className="article-ending"><span>{c.summary}</span><h2>{c.final}</h2><Link to="/contact">{c.action} <ArrowRight size={18} /></Link></div></article></div></section>
  </div></>
}
