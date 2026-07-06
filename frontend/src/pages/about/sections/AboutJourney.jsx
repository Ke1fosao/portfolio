import { defaultJourney } from '../constants'

export default function AboutJourney({ about }) {
  return <section className="about-journey-section"><div className="about-wide-container about-journey-layout">
    <div className="about-journey-heading"><div className="about-chapter-label" data-about-reveal><span>02</span><span>Шлях</span></div><h2 data-about-reveal>{about.journey_heading}</h2><p data-about-reveal>{about.journey_intro}</p></div>
    <div className="about-timeline">{(about.journey?.length ? about.journey : defaultJourney).map((item) => <article className="about-timeline-item" key={item.index} data-about-reveal><div className="about-timeline-index">{item.index}</div><div className="about-timeline-content"><span>{item.label}</span><h3>{item.title}</h3><p>{item.text}</p><small>{item.meta}</small></div></article>)}</div>
  </div></section>
}
