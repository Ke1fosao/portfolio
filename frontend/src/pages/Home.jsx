import { useEffect, useRef, useState } from 'react'
import api, { unwrap } from '../lib/api'
import { fallbackFaqs, fallbackPricing, fallbackProjects, fallbackServices, fallbackSettings } from '../data/fallbackData'
import HomeHero from './home-v4/HomeHero'
import HomeBusinessJourney from './home-v4/HomeBusinessJourney'
import HomeServices from './home-v4/HomeServices'
import HomeCases from './home-v4/HomeCases'
import HomeProcess from './home-v4/HomeProcess'
import HomePricing from './home-v4/HomePricing'
import HomeFaq from './home-v4/HomeFaq'
import HomeFinalCta from './home-v4/HomeFinalCta'

export default function Home() {
  const [settings, setSettings] = useState(fallbackSettings)
  const [services, setServices] = useState(fallbackServices)
  const [projects, setProjects] = useState(fallbackProjects)
  const [pricing, setPricing] = useState(fallbackPricing)
  const [faqs, setFaqs] = useState(fallbackFaqs)
  const rootRef = useRef(null)

  useEffect(() => {
    Promise.allSettled([
      api.get('/settings/'),
      api.get('/services/'),
      api.get('/projects/?featured=true'),
      api.get('/pricing/'),
      api.get('/faqs/'),
    ]).then(([s, sv, p, pr, f]) => {
      if (s.status === 'fulfilled' && unwrap(s.value)?.full_name) setSettings(unwrap(s.value))
      if (sv.status === 'fulfilled' && unwrap(sv.value)?.length) setServices(unwrap(sv.value))
      if (p.status === 'fulfilled' && unwrap(p.value)?.length) setProjects(unwrap(p.value))
      if (pr.status === 'fulfilled' && unwrap(pr.value)?.length) setPricing(unwrap(pr.value))
      if (f.status === 'fulfilled' && unwrap(f.value)?.length) setFaqs(unwrap(f.value))
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const elements = root.querySelectorAll('[data-sales-reveal]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' })
    elements.forEach((element) => observer.observe(element))

    const onPointerMove = (event) => {
      root.style.setProperty('--sales-pointer-x', `${event.clientX}px`)
      root.style.setProperty('--sales-pointer-y', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  const telegram = settings.socials?.telegram || `https://t.me/${String(settings.telegram || '@Ke1fosao').replace('@', '')}`

  return (
    <div className="sales3-home" ref={rootRef}>
      <HomeHero settings={settings} telegram={telegram} />
      <HomeBusinessJourney />
      <HomeServices services={services} />
      <HomeCases projects={projects} telegram={telegram} />
      <HomeProcess telegram={telegram} />
      <HomePricing pricing={pricing} />
      <HomeFaq faqs={faqs} />
      <HomeFinalCta settings={settings} telegram={telegram} />
    </div>
  )
}
