import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../i18n/LanguageContext'

export default function AboutHero({ settings, about }) {
  const { isEnglish } = useLanguage()
  return <section className="about-opening" aria-labelledby="about-opening-title">
    <div className="about-opening-copy">
      <div className="about-opening-status about-hero-enter about-hero-enter-1"><span className="status-dot" /><span>{settings.availability}</span></div>
      <div className="about-opening-main">
        <p className="about-opening-overline about-hero-enter about-hero-enter-2">{about.hero_kicker}</p>
        <h1 id="about-opening-title" className="about-opening-title about-hero-enter about-hero-enter-3">{about.hero_title}</h1>
        <p className="about-opening-text about-hero-enter about-hero-enter-4">{about.hero_text}</p>
        <div className="about-opening-actions about-hero-enter about-hero-enter-5">
          <a className="about-button about-button-dark" href="#my-story"><span>{isEnglish ? 'Read my story' : 'Дізнатися мою історію'}</span><ArrowDown size={18} /></a>
          <Link className="about-text-action" to="/projects">{isEnglish ? 'View projects' : 'Переглянути роботи'} <ArrowUpRight size={17} /></Link>
        </div>
        <div className="about-opening-meta about-hero-enter about-hero-enter-6">
          <div><strong>{settings.age}</strong><span>{isEnglish ? 'years old' : 'років'}</span></div><div><strong>{settings.years_experience}</strong><span>{isEnglish ? 'years of progress' : 'роки шляху'}</span></div><div><strong>01</strong><span>{isEnglish ? 'launched product' : 'запущений продукт'}</span></div>
        </div>
      </div>
      <div className="about-opening-footer about-hero-enter about-hero-enter-6">
        <div><span>{isEnglish ? 'Find me' : 'Знайдіть мене'}</span><a href={settings.github} target="_blank" rel="noreferrer">GitHub</a><a href={settings.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a></div>
        <div><span>{isEnglish ? 'Resume' : 'Резюме'}</span>{about.resume_file_url ? <a href={about.resume_file_url} target="_blank" rel="noreferrer">{isEnglish ? 'Download PDF' : 'Завантажити PDF'} <ArrowUpRight size={13} /></a> : <span className="about-resume-pending">{isEnglish ? 'Will be added when ready' : 'Буде додано після підготовки'}</span>}</div>
      </div>
    </div>
    <div className="about-opening-visual about-hero-enter about-hero-enter-visual">
      <img src={about.hero_photo_url || '/assets/about-portrait.svg'} alt={about.hero_photo_alt || (isEnglish ? 'Portrait of Dmytro' : 'Портрет Дмитра')} />
      <div className="about-visual-noise" aria-hidden="true" />
      <div className="about-visual-badge"><span>{settings.city}</span><strong>{settings.role}</strong></div>
    </div>
    <a className="about-opening-scroll" href="#my-story" aria-label={isEnglish ? 'Scroll to my story' : 'Прокрутити до історії'}><span>Scroll</span><ArrowDown size={16} /></a>
  </section>
}
