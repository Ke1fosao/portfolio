import { fallbackAboutPage } from '../../../data/fallbackData'
import { useLanguage } from '../../../i18n/LanguageContext'

export default function AboutStory({ about, settings }) {
  const { isEnglish } = useLanguage()
  return <section className="about-manifesto" id="my-story"><div className="about-wide-container">
    <div className="about-chapter-label" data-about-reveal><span>01</span><span>{isEnglish ? 'About me in brief' : 'Коротко про мене'}</span></div>
    <div className="about-manifesto-grid"><h2 data-about-reveal>{about.story_title}</h2><div className="about-manifesto-copy" data-about-reveal><p>{about.story_text || settings.about_full}</p><p>{about.story_support_text}</p></div></div>
    <div className="about-number-grid">{(about.stats?.length ? about.stats : fallbackAboutPage.stats).map((stat) => <article data-about-reveal key={`${stat.value}-${stat.label}`}><strong>{stat.value}</strong><span>{stat.label}</span></article>)}</div>
  </div></section>
}
