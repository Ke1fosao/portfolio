import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Monitor } from 'lucide-react'
import { fallbackAboutPage, fallbackProjects, fallbackSettings } from '../../../data/fallbackData'
import AboutHero from '../../about/sections/AboutHero'
import AboutStory from '../../about/sections/AboutStory'
import AboutJourney from '../../about/sections/AboutJourney'
import AboutProject from '../../about/sections/AboutProject'
import AboutAI from '../../about/sections/AboutAI'
import AboutPrinciples from '../../about/sections/AboutPrinciples'
import AboutEducation from '../../about/sections/AboutEducation'
import AboutFinal from '../../about/sections/AboutFinal'

function arrayValue(value, fallback = []) {
  if (Array.isArray(value)) return value
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch { return fallback }
}

function normalizeAbout(form = {}) {
  return {
    ...fallbackAboutPage,
    ...form,
    stats: arrayValue(form.stats, fallbackAboutPage.stats),
    journey: arrayValue(form.journey, fallbackAboutPage.journey),
    project_facts: arrayValue(form.project_facts, fallbackAboutPage.project_facts),
    ai_items: arrayValue(form.ai_items, fallbackAboutPage.ai_items),
    principles: arrayValue(form.principles, fallbackAboutPage.principles),
  }
}

function ExactPreviewViewport({ children, label }) {
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(.32)
  const [height, setHeight] = useState(360)
  const virtualWidth = 1440

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas) return undefined

    const measure = () => {
      const available = Math.max(260, viewport.clientWidth - 2)
      const nextScale = Math.min(1, available / virtualWidth)
      setScale(nextScale)
      const fullHeight = Math.max(canvas.scrollHeight, canvas.getBoundingClientRect().height / Math.max(nextScale, .01))
      setHeight(Math.max(260, Math.ceil(fullHeight * nextScale)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(canvas)
    const timer = window.setTimeout(measure, 80)
    return () => { observer.disconnect(); window.clearTimeout(timer) }
  }, [children])

  return <section className="about-admin-exact-preview">
    <header className="about-admin-exact-preview-head">
      <div><span><Monitor size={14}/> ТОЧНИЙ PREVIEW</span><strong>{label}</strong><small>Використовується той самий React-компонент і ті самі CSS-стилі, що й на публічному сайті.</small></div>
      <a href="/about" target="_blank" rel="noreferrer" aria-label="Відкрити сторінку Про мене"><ExternalLink size={15}/></a>
    </header>
    <div className="about-admin-exact-viewport" ref={viewportRef} style={{ height }}>
      <div className="about-admin-exact-canvas" ref={canvasRef} style={{ width: virtualWidth, transform: `scale(${scale})` }}>
        <div className="about-story about-admin-exact-site">{children}</div>
      </div>
    </div>
  </section>
}

export default function AboutSectionPreview({ sectionKey, form, settings = fallbackSettings, babyland = fallbackProjects[0], telegram }) {
  const about = useMemo(() => normalizeAbout(form), [form])
  const siteSettings = useMemo(() => ({ ...fallbackSettings, ...settings }), [settings])
  const project = useMemo(() => ({ ...fallbackProjects[0], ...babyland }), [babyland])
  const telegramUrl = telegram || siteSettings.socials?.telegram || `https://t.me/${String(siteSettings.telegram || '').replace('@', '')}`

  let content = null
  let label = 'Секція сторінки «Про мене»'

  if (sectionKey === 'hero') {
    label = 'Перший екран сторінки'
    content = <AboutHero settings={siteSettings} about={about}/>
  } else if (sectionKey === 'story') {
    label = 'Секція «Коротко про мене»'
    content = <AboutStory settings={siteSettings} about={about}/>
  } else if (sectionKey === 'journey') {
    label = 'Секція професійного шляху'
    content = <AboutJourney about={about}/>
  } else if (sectionKey === 'project') {
    label = 'Секція кейсу BABY LAND'
    content = <AboutProject about={about} babyland={project}/>
  } else if (sectionKey === 'ai') {
    label = 'Секції AI та принципів роботи'
    content = <><AboutAI about={about}/><AboutPrinciples about={about}/></>
  } else if (sectionKey === 'education') {
    label = 'Секція освіти й диплома'
    content = <AboutEducation about={about}/>
  } else if (sectionKey === 'final') {
    label = 'Фінальний заклик до дії'
    content = <AboutFinal about={about} telegram={telegramUrl}/>
  }

  if (!content) return null
  return <ExactPreviewViewport label={label}>{content}</ExactPreviewViewport>
}
