import { mkdir, writeFile } from 'node:fs/promises'
import { allRoutes, siteUrl } from './seo-routes.mjs'

const publicDir = new URL('../public/', import.meta.url)
await mkdir(publicDir, { recursive: true })
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
const urls = allRoutes.map((route) => `  <url>\n    <loc>${escapeXml(`${siteUrl}${route.path}`)}</loc>\n    <lastmod>${escapeXml(route.lastmod || today)}</lastmod>\n    <changefreq>${route.path.startsWith('/blog/') ? 'monthly' : route.path === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${route.priority || '0.6'}</priority>\n  </url>`).join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
await writeFile(new URL('sitemap.xml', publicDir), sitemap, 'utf8')
await writeFile(new URL('robots.txt', publicDir), `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8')
console.log(`SEO: generated sitemap with ${allRoutes.length} URLs for ${siteUrl}`)
