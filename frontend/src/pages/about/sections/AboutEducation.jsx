import { FileText, GraduationCap } from 'lucide-react'

export default function AboutEducation({ about }) {
  return <section className="about-education-section"><div className="about-wide-container about-education-grid"><div className="about-education-copy"><div className="about-chapter-label" data-about-reveal><span>06</span><span>Освіта</span></div><h2 data-about-reveal>{about.education_title}</h2><p data-about-reveal>{about.education_text}</p><div className="about-education-meta" data-about-reveal><span>Заклад</span><strong>{about.college_name}</strong></div></div>
    <article className="about-diploma-card" data-about-reveal><div className="about-diploma-top"><GraduationCap size={32} /><span>Диплом · 2026</span></div><div><small>Статус</small><h3>{about.diploma_title}</h3><p>{about.diploma_description}</p></div>{about.diploma_file_url ? <a className="about-button about-button-dark" href={about.diploma_file_url} target="_blank" rel="noreferrer"><span>Відкрити диплом</span><FileText size={18} /></a> : <button className="about-button about-button-muted" type="button" disabled><span>Диплом ще не завантажено</span><FileText size={18} /></button>}</article>
  </div></section>
}
