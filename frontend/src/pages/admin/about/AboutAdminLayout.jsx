import { ArrowUpRight, CheckCircle2, CircleDotDashed, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AdminSaveDock } from '../../../components/admin/AdminUI'
import { aboutAdminSections } from './aboutSections'

export default function AboutAdminLayout({ sectionKey, title, description, children, onSave, onCancel, dirty = false, saving = false, savingLabel = 'Зберегти розділ', hideSave = false }) {
  return <div className="about-admin-v3-shell">
    <header className="about-admin-v3-toolbar">
      <div className="about-admin-v3-heading">
        <span className="about-admin-v3-icon"><UserRound size={18}/></span>
        <div><small>Сторінка «Про мене»</small><strong>{title}</strong><p>{description}</p></div>
      </div>
      <div className="about-admin-v3-toolbar-actions">
        <span className={`about-admin-v3-state ${dirty ? 'is-dirty' : ''}`}>{dirty ? <CircleDotDashed size={15}/> : <CheckCircle2 size={15}/>} {dirty ? 'Є незбережені зміни' : 'Усе збережено'}</span>
        <a className="about-admin-v3-public-link" href="/about" target="_blank" rel="noreferrer">Переглянути сторінку <ArrowUpRight size={16}/></a>
      </div>
    </header>

    <nav className="about-admin-v3-tabs" aria-label="Розділи сторінки Про мене">
      {aboutAdminSections.map((item, index) => <NavLink key={item.key} to={`/admin/about/${item.key}`} className={sectionKey === item.key ? 'active' : ''}>
        <span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.short || item.label}</strong><small>{item.label}</small></div>
      </NavLink>)}
    </nav>

    <main className="about-admin-v3-canvas">{children}</main>

    {!hideSave && <AdminSaveDock dirty={dirty} saving={saving} onSave={onSave} onCancel={onCancel} saveLabel={savingLabel} title={`Змінено: ${title}`} description="Збережи зміни або поверни останню опубліковану версію."/>}
  </div>
}
