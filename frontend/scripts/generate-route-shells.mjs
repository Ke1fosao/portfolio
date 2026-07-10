import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { allRoutes, siteUrl } from './seo-routes.mjs'
import { fallbackPosts, fallbackProjects, fallbackServices } from '../src/data/fallbackData.js'

const dist = path.resolve('dist')
const source = await readFile(path.join(dist, 'index.html'), 'utf8')
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function breadcrumb(route) {
  const parts = route.path.split('/').filter(Boolean)
  const labels = { projects: 'Роботи', blog: 'Блог', services: 'Послуги', about: 'Про мене', pricing: 'Вартість', contact: 'Контакти', privacy: 'Конфіденційність', terms: 'Умови сайту', 'work-terms': 'Умови роботи' }
  const items = [{ '@type': 'ListItem', position: 1, name: 'Головна', item: `${siteUrl}/` }]
  let current = ''
  parts.forEach((part, index) => {
    current += `/${part}`
    const isLast = index === parts.length - 1
    items.push({ '@type': 'ListItem', position: index + 2, name: isLast ? route.title.split(' — ')[0] : (labels[part] || part), item: `${siteUrl}${current}` })
  })
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }
}

function schemasFor(route) {
  const result = [breadcrumb(route)]
  if (route.path === '/' || route.path === '/about') {
    result.push({
      '@context': 'https://schema.org', '@type': 'Person', name: 'Ковтунович Дмитро Валерійович', jobTitle: 'Full-stack developer', url: siteUrl,
      address: { '@type': 'PostalAddress', addressLocality: 'Рівне', addressCountry: 'UA' },
      sameAs: ['https://github.com/Ke1fosao', 'https://www.linkedin.com/in/ke1fosao/', 'https://www.instagram.com/dimon_kvt/'],
      knowsAbout: ['Python', 'Django', 'React', 'веброзробка', 'AI-автоматизація'],
    })
  }
  if (route.path === '/services') {
    result.push({
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Послуги з веброзробки',
      itemListElement: fallbackServices.map((service, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Service', name: service.title, description: service.description, provider: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' }, offers: { '@type': 'Offer', priceCurrency: 'UAH', price: service.price_from_uah } } })),
    })
  }
  const post = fallbackPosts.find((item) => route.path === `/blog/${item.slug}`)
  if (post) {
    result.push({ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, image: `${siteUrl}${route.image}`, datePublished: post.published_at, dateModified: post.published_at, author: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' }, mainEntityOfPage: `${siteUrl}${route.path}` })
  }
  const project = fallbackProjects.find((item) => route.path === `/projects/${item.slug}`)
  if (project) {
    result.push({ '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.title, description: project.summary, image: `${siteUrl}${route.image}`, creator: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' }, keywords: project.technologies.join(', '), url: project.live_url || `${siteUrl}${route.path}` })
  }
  return result
}

function shell(route) {
  const canonical = `${siteUrl}${route.path}`
  const image = route.image.startsWith('http') ? route.image : `${siteUrl}${route.image}`
  let html = source
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(route.title)}</title>`)
  html = replaceOrInsert(html, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(route.description)}">`)
  html = replaceOrInsert(html, /<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${route.type || 'website'}">`)
  html = replaceOrInsert(html, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(route.title)}">`)
  html = replaceOrInsert(html, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(route.description)}">`)
  html = replaceOrInsert(html, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}">`)
  html = replaceOrInsert(html, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonical)}">`)
  html = replaceOrInsert(html, /<meta\s+name="twitter:card"[^>]*>/i, '<meta name="twitter:card" content="summary_large_image">')
  html = replaceOrInsert(html, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`)
  const schemaTags = schemasFor(route).map((schema) => `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`).join('\n    ')
  html = html.replace('</head>', `    ${schemaTags}\n  </head>`)
  return html
}

for (const route of allRoutes) {
  const html = shell(route)
  if (route.path === '/') {
    await writeFile(path.join(dist, 'index.html'), html, 'utf8')
    continue
  }
  const directory = path.join(dist, ...route.path.split('/').filter(Boolean))
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'index.html'), html, 'utf8')
}
// Telegram opens the Mini App URL directly. Generate a private route shell so static hosts
// can serve /telegram-app without requiring a custom SPA rewrite rule.
const telegramDirectory = path.join(dist, 'telegram-app')
await mkdir(telegramDirectory, { recursive: true })
let telegramHtml = source
telegramHtml = telegramHtml.replace(/<title>.*?<\/title>/s, '<title>Portfolio CRM — Telegram Mini App</title>')
telegramHtml = replaceOrInsert(telegramHtml, /<meta\s+name="description"[^>]*>/i, '<meta name="description" content="Приватний Telegram CRM-додаток для керування заявками.">')
telegramHtml = replaceOrInsert(telegramHtml, /<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex,nofollow,noarchive">')
await writeFile(path.join(telegramDirectory, 'index.html'), telegramHtml, 'utf8')

console.log(`SEO: generated ${allRoutes.length} public route shells and the private Telegram Mini App shell.`)
