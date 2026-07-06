import { useEffect } from 'react'

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Ковтунович Дмитро — Full-stack developer'
const configuredSiteUrl = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')

function absoluteUrl(value, siteUrl) {
  if (!value) return `${siteUrl}/assets/og-image.png`
  if (/^https?:\/\//i.test(value)) return value
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function upsertMeta(selector, attributes) {
  let node = document.head.querySelector(selector)
  if (!node) {
    node = document.createElement('meta')
    document.head.appendChild(node)
  }
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`)
  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', rel)
    document.head.appendChild(node)
  }
  node.setAttribute('href', href)
}

export default function SEO({
  title,
  description,
  path = '/',
  canonical = '',
  image = '/assets/og-image.png',
  ogTitle = '',
  ogDescription = '',
  type = 'website',
  noindex = false,
  follow = true,
  schema = [],
}) {
  useEffect(() => {
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const siteUrl = configuredSiteUrl || runtimeOrigin
    const canonicalUrl = absoluteUrl(canonical || path, siteUrl)
    const ogImage = absoluteUrl(image, siteUrl)
    const fullTitle = title?.includes('Ковтунович') ? title : `${title} — Ковтунович Дмитро`
    const resolvedOgTitle = ogTitle || fullTitle || SITE_NAME
    const resolvedOgDescription = ogDescription || description

    document.title = fullTitle || SITE_NAME
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: `${noindex ? 'noindex' : 'index'},${follow ? 'follow' : 'nofollow'},max-image-preview:large` })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'uk_UA' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: resolvedOgTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: resolvedOgDescription })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage })
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' })
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: resolvedOgTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: resolvedOgDescription })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage })
    upsertLink('canonical', canonicalUrl)

    document.querySelectorAll('script[data-portfolio-schema]').forEach((node) => node.remove())
    const schemas = Array.isArray(schema) ? schema.filter(Boolean) : [schema].filter(Boolean)
    schemas.forEach((entry, index) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.portfolioSchema = String(index)
      script.textContent = JSON.stringify(entry)
      document.head.appendChild(script)
    })

    return () => {
      document.querySelectorAll('script[data-portfolio-schema]').forEach((node) => node.remove())
    }
  }, [title, description, path, canonical, image, ogTitle, ogDescription, type, noindex, follow, schema])

  return null
}

export function breadcrumbSchema(items = []) {
  const origin = configuredSiteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  }
}

export function personSchema(settings = {}) {
  const origin = configuredSiteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.full_name || 'Ковтунович Дмитро Валерійович',
    jobTitle: settings.role || 'Full-stack developer',
    url: origin,
    email: settings.email ? `mailto:${settings.email}` : undefined,
    telephone: settings.phone || undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Рівне', addressCountry: 'UA' },
    sameAs: [settings.github, settings.linkedin, settings.instagram, settings.facebook].filter(Boolean),
    knowsAbout: ['Django', 'React', 'Python', 'веброзробка', 'AI-автоматизація'],
  }
}
