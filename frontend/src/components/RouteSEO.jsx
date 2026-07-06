import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import SEO, { breadcrumbSchema, personSchema } from './SEO'
import { fallbackPosts, fallbackProjects, fallbackServices, fallbackSettings } from '../data/fallbackData'

const staticPages = {
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
}

export default function RouteSEO({ settings = fallbackSettings }) {
  const location = useLocation()
  const isDynamicDetail = /^\/(projects|blog)\/[^/]+\/?$/.test(location.pathname)
  const data = useMemo(() => {
    if (staticPages[location.pathname]) return staticPages[location.pathname]
    if (location.pathname.startsWith('/projects/')) {
      const slug = location.pathname.split('/').filter(Boolean)[1]
      const project = fallbackProjects.find((item) => item.slug === slug)
      if (project) return [project.title, project.summary, project.slug === 'baby-land' ? '/assets/baby-land-og.png' : (project.cover_image_url || '/assets/og-image.png')]
    }
    if (location.pathname.startsWith('/blog/')) {
      const slug = location.pathname.split('/').filter(Boolean)[1]
      const post = fallbackPosts.find((item) => item.slug === slug)
      if (post) return [post.title, post.excerpt, post.cover_image_url || '/assets/blog-automation.svg']
    }
    return ['Сторінку не знайдено', 'Запитаної сторінки не існує або її адресу змінено.', '/assets/og-image.png']
  }, [location.pathname])

  const [title, description, image] = data
  const schemas = useMemo(() => {
    const result = [breadcrumbSchema(location.pathname === '/' ? [{ name: 'Головна', path: '/' }] : [
      { name: 'Головна', path: '/' },
      { name: title, path: location.pathname },
    ])]
    if (location.pathname === '/' || location.pathname === '/about') result.push(personSchema(settings))
    if (location.pathname === '/services') {
      result.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Послуги з веброзробки',
        itemListElement: fallbackServices.map((service, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: { '@type': 'Service', name: service.title, description: service.description, offers: { '@type': 'Offer', priceCurrency: 'UAH', price: service.price_from_uah } },
        })),
      })
    }
    return result
  }, [location.pathname, settings, title])

  if (isDynamicDetail) return null
  return <SEO title={title} description={description} path={location.pathname} image={image} noindex={!staticPages[location.pathname] && !location.pathname.startsWith('/projects/') && !location.pathname.startsWith('/blog/')} schema={schemas} />
}
