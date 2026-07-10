import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Bot, CalendarCheck2, FileText, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

const DATA = {
  uk: {
    section: '01 / Що змінюється', title: 'Сайт має не просто існувати. Він має знімати конкретні проблеми бізнесу.', intro: 'Під час розробки я дивлюся не лише на дизайн, а на весь шлях: від першого візиту до заявки та подальшої роботи команди.',
    chapters: [
      { icon: CalendarCheck2, tag: 'Заявки', title: 'Клієнт не шукає, куди вам написати.', text: 'Форми, онлайн-запис і зрозумілі заклики до дії збирають звернення навіть тоді, коли ви не в мережі.', result: 'Усі контакти потрапляють в одну систему.' },
      { icon: FileText, tag: 'Контент', title: 'Команда сама оновлює сайт без розробника.', text: 'Новини, послуги, ціни, команда, відгуки та сторінки редагуються через зручну кастомну адмінпанель.', result: 'Сайт не застаріває після запуску.' },
      { icon: Bot, tag: 'Автоматизація', title: 'Рутинні дії виконує система, а не людина.', text: 'AI допомагає з текстами, модерацією, первинними відповідями та обробкою повторюваних запитів.', result: 'Менше ручної роботи та швидша комунікація.' },
      { icon: LayoutDashboard, tag: 'Керування', title: 'Власник бачить процес, а не хаос у повідомленнях.', text: 'Статуси, дані, заявки, контент і аналітика зібрані в одному зрозумілому робочому просторі.', result: 'Бізнес отримує контроль і основу для росту.' },
    ],
  },
  en: {
    section: '01 / What changes', title: 'A website should do more than exist. It should solve specific business problems.', intro: 'During development I look beyond visual design and consider the entire journey: from the first visit to an inquiry and the team’s follow-up work.',
    chapters: [
      { icon: CalendarCheck2, tag: 'Inquiries', title: 'Clients do not have to search for a way to contact you.', text: 'Forms, online booking, and clear calls to action collect inquiries even when you are offline.', result: 'Every contact enters one system.' },
      { icon: FileText, tag: 'Content', title: 'The team updates the website without a developer.', text: 'News, services, prices, team profiles, reviews, and pages are edited through a convenient custom admin panel.', result: 'The website stays current after launch.' },
      { icon: Bot, tag: 'Automation', title: 'The system handles routine actions instead of a person.', text: 'AI helps with copy, moderation, first replies, and repetitive requests.', result: 'Less manual work and faster communication.' },
      { icon: LayoutDashboard, tag: 'Management', title: 'The owner sees the process, not message chaos.', text: 'Statuses, data, inquiries, content, and analytics are combined in one clear workspace.', result: 'The business gains control and a foundation for growth.' },
    ],
  },
}

export default function HomeBusinessJourney() {
  const { language } = useLanguage()
  const data = DATA[language]
  const chapters = useMemo(() => data.chapters, [data])
  const [active, setActive] = useState(0)
  const refs = useRef([])
  useEffect(() => { const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(Number(entry.target.dataset.index || 0)) }), { threshold: .58, rootMargin: '-12% 0px -25% 0px' }); refs.current.forEach((item) => item && observer.observe(item)); return () => observer.disconnect() }, [])
  return <section className="sales3-journey" id="benefits"><div className="sales3-shell sales3-journey-layout"><aside className="sales3-journey-sticky"><span className="sales3-section-index">{data.section}</span><h2>{data.title}</h2><p>{data.intro}</p><div className="sales3-journey-progress">{chapters.map((chapter, index) => <button key={chapter.tag} type="button" className={active === index ? 'is-active' : ''} onClick={() => refs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><i /><span>{String(index + 1).padStart(2, '0')}</span><b>{chapter.tag}</b></button>)}</div></aside><div className="sales3-journey-chapters">{chapters.map((chapter, index) => { const Icon = chapter.icon; return <article key={chapter.tag} ref={(node) => { refs.current[index] = node }} data-index={index} className={`sales3-journey-card ${active === index ? 'is-active' : ''}`}><header><span>{String(index + 1).padStart(2, '0')}</span><Icon size={25} /></header><small>{chapter.tag}</small><h3>{chapter.title}</h3><p>{chapter.text}</p><div><ArrowRight size={18} /><strong>{chapter.result}</strong></div></article> })}</div></div></section>
}
