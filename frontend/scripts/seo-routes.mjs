import { fallbackPosts, fallbackProjects } from '../src/data/fallbackData.js'

export const siteUrl = (process.env.VITE_SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')

export const staticRoutes = [
  { path: '/', title: 'Full-stack developer: сайти, вебсистеми та AI — Ковтунович Дмитро', description: 'Розробка сучасних сайтів, вебсистем та AI-автоматизації для бізнесу в Рівному та по Україні.', image: '/assets/og-image.png', priority: '1.0' },
  { path: '/projects', title: 'Роботи та кейси — Ковтунович Дмитро', description: 'Портфоліо Дмитра Ковтуновича: BABY LAND, AI Sales Manager та інші вебпродукти для бізнесу.', image: '/assets/og-image.png', priority: '0.9' },
  { path: '/services', title: 'Послуги з веброзробки та AI — Ковтунович Дмитро', description: 'Сайти для бізнесу, вебсистеми, особисті кабінети, інтернет-магазини та AI-автоматизація.', image: '/assets/og-image.png', priority: '0.9' },
  { path: '/about', title: 'Про мене — Ковтунович Дмитро', description: 'Full-stack developer із Рівного: Python, Django, React, бази даних та AI-інтеграції.', image: '/assets/og-image.png', priority: '0.8' },
  { path: '/pricing', title: 'Вартість розробки — Ковтунович Дмитро', description: 'Орієнтовна вартість сайтів, вебсистем і AI-рішень. Прозорий склад робіт та індивідуальна оцінка.', image: '/assets/og-image.png', priority: '0.8' },
  { path: '/blog', title: 'Блог про сайти та автоматизацію — Ковтунович Дмитро', description: 'Практичні матеріали про веброзробку, автоматизацію бізнесу, заявки, AI та цифрові продукти.', image: '/assets/og-image.png', priority: '0.8' },
  { path: '/contact', title: 'Контакти — Ковтунович Дмитро', description: 'Telegram, телефон, email та форма заявки на розробку сайту, вебсистеми або AI-рішення.', image: '/assets/og-image.png', priority: '0.9' },
  { path: '/work-terms', title: 'Умови роботи — Ковтунович Дмитро', description: 'Початок роботи, передоплата, правки, передача проєкту, підтримка та права на код і дизайн.', image: '/assets/og-image.png', priority: '0.6' },
  { path: '/privacy', title: 'Політика конфіденційності — Ковтунович Дмитро', description: 'Правила збору, використання, зберігання та захисту персональних даних.', image: '/assets/og-image.png', priority: '0.4' },
  { path: '/terms', title: 'Умови використання сайту — Ковтунович Дмитро', description: 'Правила користування сайтом, надсилання заявок, авторські права та відповідальність.', image: '/assets/og-image.png', priority: '0.4' },
]

export const projectRoutes = fallbackProjects.map((project) => ({
  path: `/projects/${project.slug}`,
  title: `${project.title} — кейс Ковтуновича Дмитра`,
  description: project.summary,
  image: project.slug === 'baby-land' ? '/assets/baby-land-og.png' : '/assets/og-image.png',
  type: 'article',
  priority: project.slug === 'baby-land' ? '0.9' : '0.7',
}))

export const postRoutes = fallbackPosts.filter((post) => post.status === 'published').map((post) => ({
  path: `/blog/${post.slug}`,
  title: `${post.title} — Ковтунович Дмитро`,
  description: post.excerpt,
  image: '/assets/og-image.png',
  type: 'article',
  lastmod: post.published_at,
  priority: '0.7',
}))

export const allRoutes = [...staticRoutes, ...projectRoutes, ...postRoutes]
