import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutFinal({ about, telegram }) {
  return <section className="about-final-section"><div className="about-final-orbit" aria-hidden="true" /><div className="about-wide-container about-final-content"><span data-about-reveal>{about.final_kicker}</span><h2 data-about-reveal>{about.final_title}</h2><p data-about-reveal>{about.final_text}</p><div className="about-final-actions" data-about-reveal><a className="about-button about-button-accent" href={telegram} target="_blank" rel="noreferrer"><span>Написати в Telegram</span><ArrowUpRight size={18} /></a><Link className="about-button about-button-outline" to="/contact"><span>Форма зв’язку</span><ArrowRight size={18} /></Link></div></div></section>
}
