import { useState } from 'react'
import { BarChart3, Bell, ChevronRight, FileText, LayoutDashboard, Users } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export function projectImage(project) {
  if (project?.uploaded_cover_url) return project.uploaded_cover_url
  if (project?.cover_image_url && !project.cover_image_url.includes('babyland-cover.svg')) return project.cover_image_url
  return ''
}

function BabylandPublicMock({ image = '', compact = false }) {
  const { isEnglish } = useLanguage()
  const c = isEnglish ? {
    alt: 'BABY LAND homepage', home: 'Home', about: 'About', groups: 'Groups', news: 'News', enroll: 'Enroll',
    label: 'Private kindergarten · Rivne', titleA: 'A place where childhood', titleB: 'becomes an adventure.', text: 'Care, development, and a safe space for happy children.', apply: 'Apply', more: 'Learn more',
    team: 'Caring team', development: 'Modern development', online: 'Online application',
  } : {
    alt: 'Головна сторінка BABY LAND', home: 'Головна', about: 'Про нас', groups: 'Групи', news: 'Новини', enroll: 'Записатися',
    label: 'Приватний дитячий садок · Рівне', titleA: 'Місце, де дитинство', titleB: 'стає пригодою.', text: 'Турбота, розвиток і безпечний простір для щасливих дітей.', apply: 'Подати заявку', more: 'Дізнатися більше',
    team: 'Турботлива команда', development: 'Сучасний розвиток', online: 'Заявка онлайн',
  }
  if (image) return <div className="bl-lite-upload"><img src={image} alt={c.alt} /></div>
  return <div className={`bl-lite-site ${compact ? 'is-compact' : ''}`}>
    <header><strong><i /> BABY LAND</strong><nav><span className="active">{c.home}</span><span>{c.about}</span><span>{c.groups}</span><span>{c.news}</span></nav><button>{c.enroll}</button></header>
    <div className="bl-lite-hero"><div className="bl-lite-copy"><small>{c.label}</small><h3>{c.titleA} <em>{c.titleB}</em></h3><p>{c.text}</p><div><button>{c.apply}</button><span>{c.more} <ChevronRight size={13} /></span></div></div><div className="bl-lite-art"><div className="bl-sun" /><div className="bl-cloud bl-cloud-one" /><div className="bl-cloud bl-cloud-two" /><div className="bl-hill bl-hill-one" /><div className="bl-hill bl-hill-two" /><div className="bl-house"><i /><b /><span /></div><div className="bl-tree bl-tree-one"><i /><b /></div><div className="bl-tree bl-tree-two"><i /><b /></div></div></div>
    <div className="bl-lite-benefits"><article><span>01</span><strong>{c.team}</strong></article><article><span>02</span><strong>{c.development}</strong></article><article><span>03</span><strong>{c.online}</strong></article></div>
  </div>
}

function BabylandAdminMock() {
  const { isEnglish } = useLanguage()
  const c = isEnglish ? { panel: 'Management panel', hello: 'Good afternoon, administrator', newLeads: 'New applications', week: '+3 this week', groups: 'Active groups', full: 'all filled', materials: 'Materials', published: 'published', seven: 'Applications over 7 days', updated: 'Updated now', recent: 'Latest inquiries', middle: 'Middle group', young: 'Younger group', fresh: 'New', progress: 'In progress' } : { panel: 'Панель керування', hello: 'Добрий день, адміністраторе', newLeads: 'Нові заявки', week: '+3 цього тижня', groups: 'Активні групи', full: 'усі заповнені', materials: 'Матеріали', published: 'опубліковано', seven: 'Заявки за 7 днів', updated: 'Оновлено зараз', recent: 'Останні звернення', middle: 'Середня група', young: 'Молодша група', fresh: 'Нова', progress: 'В роботі' }
  return <div className="bl-lite-admin"><aside><strong>BL<span>.</span></strong><nav><i className="active"><LayoutDashboard size={16} /></i><i><Users size={16} /></i><i><FileText size={16} /></i><i><BarChart3 size={16} /></i></nav></aside><main>
    <header><div><small>{c.panel}</small><h3>{c.hello}</h3></div><span><Bell size={16} /><i /></span></header>
    <div className="bl-admin-lite-stats"><article><small>{c.newLeads}</small><strong>07</strong><span>{c.week}</span></article><article><small>{c.groups}</small><strong>08</strong><span>{c.full}</span></article><article><small>{c.materials}</small><strong>42</strong><span>{c.published}</span></article></div>
    <div className="bl-admin-lite-body"><section><div><strong>{c.seven}</strong><span>{c.updated}</span></div><div className="bl-admin-bars"><i /><i /><i /><i /><i /><i /><i /></div></section><section><strong>{c.recent}</strong><div><i>МК</i><span><b>{isEnglish ? 'Maria Koval' : 'Марія Коваль'}</b><small>{c.middle}</small></span><em>{c.fresh}</em></div><div><i>ОП</i><span><b>{isEnglish ? 'Oleh Petrenko' : 'Олег Петренко'}</b><small>{c.young}</small></span><em>{c.progress}</em></div></section></div>
  </main></div>
}

export function BabylandShowcase({ project, compact = false }) {
  const { isEnglish } = useLanguage()
  const [active, setActive] = useState('public')
  const image = projectImage(project)
  if (compact) return <div className="babyland-lite-frame is-compact"><div className="babyland-lite-browserbar"><i /><i /><i /><span>babyland.com.ua</span><b>LIVE</b></div><BabylandPublicMock image={image} compact /></div>
  return <div className="babyland-lite-showcase"><div className="babyland-lite-toolbar"><div><i /><i /><i /><span>{active === 'public' ? 'babyland.com.ua' : 'admin.babyland.local'}</span></div><nav><button type="button" className={active === 'public' ? 'is-active' : ''} onClick={() => setActive('public')}>{isEnglish ? 'Parent website' : 'Сайт для батьків'}</button><button type="button" className={active === 'admin' ? 'is-active' : ''} onClick={() => setActive('admin')}>{isEnglish ? 'Admin panel' : 'Адмінпанель'}</button></nav><b>{active === 'public' ? 'LIVE' : 'SECURE'}</b></div><div className="babyland-lite-screen" key={active}>{active === 'public' ? <BabylandPublicMock image={image} /> : <BabylandAdminMock />}</div></div>
}

export default function ProjectMedia({ project, className = '', compact = false }) {
  const { isEnglish } = useLanguage()
  if (project?.slug === 'baby-land' || project?.title === 'BABY LAND') return <BabylandShowcase project={project} compact={compact} />
  const image = projectImage(project)
  if (image) return <img className={className} src={image} alt={project?.title || (isEnglish ? 'Project' : 'Проєкт')} />
  return <div className={`project-generic-art ${className}`}><span>{project?.category || (isEnglish ? 'Project' : 'Проєкт')}</span><strong>{project?.title || 'Digital product'}</strong></div>
}
