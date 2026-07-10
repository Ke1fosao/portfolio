import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import SEO, { breadcrumbSchema, personSchema } from './SEO'
import api, { unwrap } from '../lib/api'
import { fallbackPosts, fallbackProjects, fallbackServices, fallbackSettings } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizePosts, localizeProjects, localizeServices } from '../i18n/localizedData'

const pages = {
  uk: {
    '/': ['Full-stack developer: сайти, вебсистеми та AI', 'Розробка сучасних сайтів, вебсистем та AI-автоматизації для бізнесу в Рівному та по Україні.', '/assets/og-image.png'],
    '/projects': ['Роботи та кейси', 'Портфоліо Дмитра Ковтуновича: BABY LAND, AI Sales Manager та інші вебпродукти для бізнесу.', '/assets/og-image.png'],
    '/services': ['Послуги з веброзробки та AI', 'Сайти для бізнесу, вебсистеми, особисті кабінети, інтернет-магазини та AI-автоматизація.', '/assets/og-image.png'],
    '/about': ['Про мене', 'Дмитро Ковтунович — full-stack developer із Рівного. Python, Django, React, бази даних та AI-інтеграції.', '/assets/og-image.png'],
    '/pricing': ['Вартість розробки', 'Орієнтовна вартість сайтів, вебсистем і AI-рішень. Прозорий склад робіт та індивідуальна оцінка.', '/assets/og-image.png'],
    '/blog': ['Блог про сайти та автоматизацію', 'Практичні матеріали про веброзробку, автоматизацію бізнесу, заявки, AI та цифрові продукти.', '/assets/blog-automation.svg'],
    '/contact': ['Контакти', 'Зв’яжіться з Дмитром Ковтуновичем у Telegram, телефоном або email та залиште заявку на розробку.', '/assets/og-image.png'],
    '/work-terms': ['Умови роботи', 'Як починається розробка, передоплата, правки, передача проєкту, підтримка та права на код і дизайн.', '/assets/og-image.png'],
    '/privacy': ['Політика конфіденційності', 'Правила збору, використання, зберігання та захисту персональних даних на сайті портфоліо.', '/assets/og-image.png'],
    '/terms': ['Умови використання сайту', 'Правила користування сайтом, надсилання заявок, авторські права та обмеження відповідальності.', '/assets/og-image.png'],
  },
  en: {
    '/': ['Full-stack developer: websites, web systems, and AI', 'Modern websites, web systems, and AI automation for businesses in Ukraine and worldwide.', '/assets/og-image.png'],
    '/projects': ['Projects and case studies', 'Dmytro Kovtunovych’s portfolio: BABY LAND, AI Sales Manager, and other digital products for business.', '/assets/og-image.png'],
    '/services': ['Web development and AI services', 'Business websites, web systems, client portals, online stores, and AI automation.', '/assets/og-image.png'],
    '/about': ['About me', 'Dmytro Kovtunovych is a full-stack developer from Rivne working with Python, Django, React, databases, and AI integrations.', '/assets/og-image.png'],
    '/pricing': ['Development pricing', 'Estimated pricing for websites, web systems, and AI solutions, with a transparent scope and individual estimate.', '/assets/og-image.png'],
    '/blog': ['Blog about websites and automation', 'Practical articles about web development, business automation, leads, AI, and digital products.', '/assets/blog-automation.svg'],
    '/contact': ['Contact', 'Contact Dmytro Kovtunovych through Telegram, phone, or email and submit a development request.', '/assets/og-image.png'],
    '/work-terms': ['Working terms', 'How a project starts, deposits, revisions, delivery, support, and rights to code and design.', '/assets/og-image.png'],
    '/privacy': ['Privacy policy', 'How personal data is collected, used, stored, and protected on this portfolio website.', '/assets/og-image.png'],
    '/terms': ['Website terms of use', 'Rules for using the website, submitting inquiries, copyright, and limitations of liability.', '/assets/og-image.png'],
  },
}

function normalizePath(pathname) { if (!pathname || pathname === '/') return '/'; return pathname.replace(/\/+$/, '') || '/' }

export default function RouteSEO({ settings = fallbackSettings }) {
  const { language } = useLanguage()
  const staticPages = pages[language]
  const location = useLocation()
  const pathname = normalizePath(location.pathname)
  const [storedMeta, setStoredMeta] = useState(null)
  const isDynamicDetail = /^\/(projects|blog)\/[^/]+\/?$/.test(location.pathname)
  const projects = useMemo(() => localizeProjects(fallbackProjects, language), [language])
  const posts = useMemo(() => localizePosts(fallbackPosts, language), [language])
  const services = useMemo(() => localizeServices(fallbackServices, language), [language])

  useEffect(() => {
    let active = true
    setStoredMeta(null)
    if (isDynamicDetail || !staticPages[pathname] || language === 'en') return () => { active = false }
    api.get(`/seo-metadata/?path=${encodeURIComponent(pathname)}`).then((response) => { const data = unwrap(response); if (active) setStoredMeta(Array.isArray(data) ? data[0] || null : null) }).catch(() => { if (active) setStoredMeta(null) })
    return () => { active = false }
  }, [pathname, isDynamicDetail, staticPages, language])

  const data = useMemo(() => {
    if (staticPages[pathname]) return staticPages[pathname]
    if (pathname.startsWith('/projects/')) { const slug = pathname.split('/').filter(Boolean)[1]; const project = projects.find((item) => item.slug === slug); if (project) return [project.title, project.summary, project.slug === 'baby-land' ? '/assets/baby-land-og.png' : (project.cover_image_url || '/assets/og-image.png')] }
    if (pathname.startsWith('/blog/')) { const slug = pathname.split('/').filter(Boolean)[1]; const post = posts.find((item) => item.slug === slug); if (post) return [post.title, post.excerpt, post.cover_image_url || '/assets/blog-automation.svg'] }
    return language === 'en' ? ['Page not found', 'The requested page does not exist or its address has changed.', '/assets/og-image.png'] : ['Сторінку не знайдено', 'Запитаної сторінки не існує або її адресу змінено.', '/assets/og-image.png']
  }, [pathname, staticPages, projects, posts, language])

  const [fallbackTitle, fallbackDescription, fallbackImage] = data
  const title = storedMeta?.seo_title || fallbackTitle
  const description = storedMeta?.seo_description || fallbackDescription
  const image = storedMeta?.og_image_url_resolved || storedMeta?.og_image_url || fallbackImage

  const schemas = useMemo(() => {
    const homeName = language === 'en' ? 'Home' : 'Головна'
    const result = [breadcrumbSchema(pathname === '/' ? [{ name: homeName, path: '/' }] : [{ name: homeName, path: '/' }, { name: title, path: pathname }])]
    if (pathname === '/' || pathname === '/about') result.push(personSchema(settings))
    if (pathname === '/services') result.push({ '@context': 'https://schema.org', '@type': 'ItemList', name: language === 'en' ? 'Web development services' : 'Послуги з веброзробки', itemListElement: services.map((service, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Service', name: service.title, description: service.description, offers: { '@type': 'Offer', priceCurrency: 'UAH', price: service.price_from_uah } } })) })
    if (storedMeta?.structured_data && Object.keys(storedMeta.structured_data).length) result.push(storedMeta.structured_data)
    return result
  }, [pathname, settings, title, storedMeta, language, services])

  if (isDynamicDetail) return null
  return <SEO title={title} description={description} ogTitle={storedMeta?.og_title || title} ogDescription={storedMeta?.og_description || description} path={pathname} canonical={storedMeta?.canonical_url || pathname} image={image} noindex={storedMeta ? !storedMeta.index : !staticPages[pathname]} follow={storedMeta ? storedMeta.follow : true} schema={schemas} />
}
