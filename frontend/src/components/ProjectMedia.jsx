import { useState } from 'react'
import { BarChart3, Bell, ChevronRight, FileText, LayoutDashboard, Users } from 'lucide-react'

export function projectImage(project) {
  if (project?.uploaded_cover_url) return project.uploaded_cover_url
  if (project?.cover_image_url && !project.cover_image_url.includes('babyland-cover.svg')) return project.cover_image_url
  return ''
}

function BabylandPublicMock({ image = '', compact = false }) {
  if (image) return <div className="bl-lite-upload"><img src={image} alt="Головна сторінка BABY LAND" /></div>

  return (
    <div className={`bl-lite-site ${compact ? 'is-compact' : ''}`}>
      <header>
        <strong><i /> BABY LAND</strong>
        <nav><span className="active">Головна</span><span>Про нас</span><span>Групи</span><span>Новини</span></nav>
        <button>Записатися</button>
      </header>
      <div className="bl-lite-hero">
        <div className="bl-lite-copy">
          <small>Приватний дитячий садок · Рівне</small>
          <h3>Місце, де дитинство <em>стає пригодою.</em></h3>
          <p>Турбота, розвиток і безпечний простір для щасливих дітей.</p>
          <div><button>Подати заявку</button><span>Дізнатися більше <ChevronRight size={13} /></span></div>
        </div>
        <div className="bl-lite-art">
          <div className="bl-sun" />
          <div className="bl-cloud bl-cloud-one" />
          <div className="bl-cloud bl-cloud-two" />
          <div className="bl-hill bl-hill-one" />
          <div className="bl-hill bl-hill-two" />
          <div className="bl-house"><i /><b /><span /></div>
          <div className="bl-tree bl-tree-one"><i /><b /></div>
          <div className="bl-tree bl-tree-two"><i /><b /></div>
        </div>
      </div>
      <div className="bl-lite-benefits">
        <article><span>01</span><strong>Турботлива команда</strong></article>
        <article><span>02</span><strong>Сучасний розвиток</strong></article>
        <article><span>03</span><strong>Заявка онлайн</strong></article>
      </div>
    </div>
  )
}

function BabylandAdminMock() {
  return (
    <div className="bl-lite-admin">
      <aside>
        <strong>BL<span>.</span></strong>
        <nav><i className="active"><LayoutDashboard size={16} /></i><i><Users size={16} /></i><i><FileText size={16} /></i><i><BarChart3 size={16} /></i></nav>
      </aside>
      <main>
        <header><div><small>Панель керування</small><h3>Добрий день, адміністраторе</h3></div><span><Bell size={16} /><i /></span></header>
        <div className="bl-admin-lite-stats">
          <article><small>Нові заявки</small><strong>07</strong><span>+3 цього тижня</span></article>
          <article><small>Активні групи</small><strong>08</strong><span>усі заповнені</span></article>
          <article><small>Матеріали</small><strong>42</strong><span>опубліковано</span></article>
        </div>
        <div className="bl-admin-lite-body">
          <section><div><strong>Заявки за 7 днів</strong><span>Оновлено зараз</span></div><div className="bl-admin-bars"><i /><i /><i /><i /><i /><i /><i /></div></section>
          <section><strong>Останні звернення</strong><div><i>МК</i><span><b>Марія Коваль</b><small>Середня група</small></span><em>Нова</em></div><div><i>ОП</i><span><b>Олег Петренко</b><small>Молодша група</small></span><em>В роботі</em></div></section>
        </div>
      </main>
    </div>
  )
}

export function BabylandShowcase({ project, compact = false }) {
  const [active, setActive] = useState('public')
  const image = projectImage(project)

  if (compact) {
    return (
      <div className="babyland-lite-frame is-compact">
        <div className="babyland-lite-browserbar"><i /><i /><i /><span>babyland.com.ua</span><b>LIVE</b></div>
        <BabylandPublicMock image={image} compact />
      </div>
    )
  }

  return (
    <div className="babyland-lite-showcase">
      <div className="babyland-lite-toolbar">
        <div><i /><i /><i /><span>{active === 'public' ? 'babyland.com.ua' : 'admin.babyland.local'}</span></div>
        <nav>
          <button type="button" className={active === 'public' ? 'is-active' : ''} onClick={() => setActive('public')}>Сайт для батьків</button>
          <button type="button" className={active === 'admin' ? 'is-active' : ''} onClick={() => setActive('admin')}>Адмінпанель</button>
        </nav>
        <b>{active === 'public' ? 'LIVE' : 'SECURE'}</b>
      </div>
      <div className="babyland-lite-screen" key={active}>
        {active === 'public' ? <BabylandPublicMock image={image} /> : <BabylandAdminMock />}
      </div>
    </div>
  )
}

export default function ProjectMedia({ project, className = '', compact = false }) {
  if (project?.slug === 'baby-land' || project?.title === 'BABY LAND') {
    return <BabylandShowcase project={project} compact={compact} />
  }
  const image = projectImage(project)
  if (image) return <img className={className} src={image} alt={project?.title || 'Проєкт'} />
  return <div className={`project-generic-art ${className}`}><span>{project?.category || 'Проєкт'}</span><strong>{project?.title || 'Digital product'}</strong></div>
}
