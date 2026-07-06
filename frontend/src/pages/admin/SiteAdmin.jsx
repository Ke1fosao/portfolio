import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ContactRound,
  ExternalLink,
  FileText,
  Globe2,
  LayoutTemplate,
  Link2,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Search,
  SearchCheck,
  Settings2,
  Smartphone,
  Sparkles,
  UserRound,
  WandSparkles,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import { AdminSaveDock, useAdminUI } from '../../components/admin/AdminUI'
import { parsePayload, settingsFields } from './resources'

const fieldMap = Object.fromEntries(settingsFields.map((field) => [field[0], field]))

const sections = [
  {
    id: 'identity',
    eyebrow: '01 · Основне',
    title: 'Профіль і позиціонування',
    description: 'Головні дані, які формують твою присутність на сайті та відображаються у різних блоках.',
    icon: UserRound,
    fields: ['full_name', 'role', 'city', 'age', 'years_experience', 'availability', 'logo_text'],
  },
  {
    id: 'hero',
    eyebrow: '02 · Перший екран',
    title: 'Hero-блок головної сторінки',
    description: 'Перший текст, який бачить клієнт. Тут важливо швидко пояснити, хто ти і яку користь даєш.',
    icon: WandSparkles,
    fields: ['hero_title', 'hero_subtitle'],
  },
  {
    id: 'about',
    eyebrow: '03 · Довіра',
    title: 'Коротко про тебе',
    description: 'Тексти для компактних і розгорнутих блоків про досвід, підхід та спосіб роботи.',
    icon: BriefcaseBusiness,
    fields: ['about_short', 'about_full'],
  },
  {
    id: 'contacts',
    eyebrow: '04 · Комунікація',
    title: 'Контакти та доступність',
    description: 'Усі канали зв’язку, графік роботи та посилання на резюме в одному місці.',
    icon: ContactRound,
    fields: ['email', 'phone', 'telegram', 'working_hours', 'resume_url'],
  },
  {
    id: 'socials',
    eyebrow: '05 · Соцмережі',
    title: 'Публічні профілі',
    description: 'Посилання на професійні та соціальні профілі, які показуються на сайті.',
    icon: Link2,
    fields: ['instagram', 'github', 'linkedin', 'facebook', 'socials'],
  },
  {
    id: 'seo',
    eyebrow: '06 · Пошуковики',
    title: 'SEO головної сторінки',
    description: 'Заголовок і опис для Google, соцмереж та попереднього перегляду посилання.',
    icon: SearchCheck,
    fields: ['seo_title', 'seo_description'],
  },
  {
    id: 'advanced',
    eyebrow: '07 · Система',
    title: 'Додаткові параметри',
    description: 'Службові глобальні дані, які використовуються у калькуляторах та інших модулях.',
    icon: Settings2,
    fields: ['currency_rates'],
  },
]

const importantFields = [
  'full_name',
  'role',
  'city',
  'availability',
  'hero_title',
  'hero_subtitle',
  'about_short',
  'email',
  'phone',
  'telegram',
  'working_hours',
  'seo_title',
  'seo_description',
]

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return String(value ?? '').trim().length > 0
}

const firstLetter = (value) => String(value || 'D').trim().charAt(0).toUpperCase()

export default function SiteAdmin() {
  const { notify, confirm } = useAdminUI()
  const [form, setForm] = useState({})
  const [baseline, setBaseline] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('identity')
  const [search, setSearch] = useState('')
  const [previewMode, setPreviewMode] = useState('desktop')

  useEffect(() => {
    let mounted = true
    api.get('/settings/').then((response) => {
      if (!mounted) return
      const data = unwrap(response) || {}
      setForm(data)
      setBaseline(data)
    }).catch(() => notify('Не вдалося завантажити налаштування головної сторінки.', { type: 'error' }))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [notify])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])
  const completedImportant = useMemo(() => importantFields.filter((key) => hasValue(form[key])).length, [form])
  const completeness = Math.round((completedImportant / importantFields.length) * 100)
  const missingImportant = useMemo(() => importantFields.filter((key) => !hasValue(form[key])), [form])

  const visibleSections = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sections
    return sections.map((section) => ({
      ...section,
      fields: section.fields.filter((key) => {
        const spec = fieldMap[key]
        return key.toLowerCase().includes(query) || spec?.[1]?.toLowerCase().includes(query) || section.title.toLowerCase().includes(query)
      }),
    })).filter((section) => section.fields.length)
  }, [search])

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const scrollToSection = (id) => {
    setActiveSection(id)
    document.getElementById(`home-editor-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = parsePayload(form, settingsFields)
      const response = await api.patch(`/settings/${form.id || 1}/`, payload)
      const saved = unwrap(response)
      setForm(saved)
      setBaseline(saved)
      notify('Головну сторінку успішно оновлено.', { title: 'Зміни збережено' })
    } catch (error) {
      notify(error.message || 'Помилка збереження.', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const cancelChanges = async () => {
    if (!dirty) return
    const approved = await confirm({
      eyebrow: 'Незбережені зміни',
      title: 'Скасувати всі зміни?',
      description: 'Усі поля повернуться до останньої збереженої версії. Цю дію неможливо буде відмінити.',
      confirmLabel: 'Так, скасувати',
      cancelLabel: 'Продовжити редагування',
      tone: 'danger',
    })
    if (approved) {
      setForm(baseline)
      notify('Незбережені зміни скасовано.', { type: 'info' })
    }
  }

  if (loading) return <HomeEditorSkeleton />

  return <main className="home-admin-v2">
    <section className="home-admin-command">
      <div className="home-command-copy">
        <span className="home-command-kicker"><Sparkles size={14}/> Редактор головної сторінки</span>
        <h1>Керуй головною без хаосу.</h1>
        <p>Усі тексти, контакти, профілі та SEO зібрані в логічні секції. Змінюй дані, одразу дивись результат і зберігай тільки тоді, коли все готово.</p>
        <div className="home-command-actions">
          <a className="btn btn-dark" href="/" target="_blank" rel="noreferrer">Відкрити сайт <ExternalLink size={16}/></a>
          <button className="btn btn-light" type="button" onClick={() => scrollToSection('hero')}>Редагувати hero <ArrowUpRight size={16}/></button>
        </div>
      </div>

      <div className="home-command-status">
        <div className="home-completeness-ring" style={{ '--progress': `${completeness * 3.6}deg` }}>
          <div><strong>{completeness}%</strong><span>готовності</span></div>
        </div>
        <div className="home-command-status-copy">
          <span>{dirty ? 'Є незбережені зміни' : 'Усі зміни збережені'}</span>
          <strong>{missingImportant.length ? `${missingImportant.length} важливих полів варто доповнити` : 'Сторінка повністю заповнена'}</strong>
          <small>{dirty ? 'Плаваюча панель збереження вже активна.' : 'Можна безпечно продовжувати редагування.'}</small>
        </div>
      </div>
    </section>

    <section className="home-admin-summary">
      <article>
        <span className="home-summary-icon is-profile"><UserRound size={18}/></span>
        <div><small>Профіль</small><strong>{form.full_name || 'Не заповнено'}</strong><p>{form.role || 'Додай роль або спеціалізацію'}</p></div>
      </article>
      <article>
        <span className="home-summary-icon is-location"><MapPin size={18}/></span>
        <div><small>Локація</small><strong>{form.city || 'Не вказано'}</strong><p>{form.availability || 'Статус доступності відсутній'}</p></div>
      </article>
      <article>
        <span className="home-summary-icon is-contact"><Mail size={18}/></span>
        <div><small>Головний контакт</small><strong>{form.email || form.telegram || 'Не вказано'}</strong><p>{form.working_hours || 'Години роботи не задані'}</p></div>
      </article>
      <article>
        <span className="home-summary-icon is-seo"><SearchCheck size={18}/></span>
        <div><small>SEO</small><strong>{hasValue(form.seo_title) && hasValue(form.seo_description) ? 'Налаштовано' : 'Потрібна увага'}</strong><p>{String(form.seo_title || 'Додай SEO title').slice(0, 46)}</p></div>
      </article>
    </section>

    <section className="home-admin-workspace">
      <aside className="home-editor-sidebar">
        <div className="home-editor-sidebar-head">
          <span>Структура сторінки</span>
          <strong>{sections.length} секцій</strong>
        </div>

        <label className="home-editor-search">
          <Search size={16}/>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Знайти поле…"/>
        </label>

        <nav>
          {sections.map((section, index) => {
            const Icon = section.icon
            const filled = section.fields.filter((key) => hasValue(form[key])).length
            const total = section.fields.length
            return <button key={section.id} type="button" className={activeSection === section.id ? 'is-active' : ''} onClick={() => scrollToSection(section.id)}>
              <span className="home-editor-nav-icon"><Icon size={17}/></span>
              <span><strong>{section.title}</strong><small>{filled}/{total} заповнено</small></span>
              <b>{String(index + 1).padStart(2, '0')}</b>
            </button>
          })}
        </nav>

        <div className="home-editor-health">
          <div><BadgeCheck size={18}/><span><strong>Перевірка сторінки</strong><small>{missingImportant.length ? 'Є що покращити' : 'Все готово'}</small></span></div>
          <i><b style={{ width: `${completeness}%` }}/></i>
          {missingImportant.length > 0 && <p>Заповни ще: {missingImportant.slice(0, 2).map((key) => fieldMap[key]?.[1]).join(', ')}{missingImportant.length > 2 ? '…' : ''}</p>}
        </div>
      </aside>

      <div className="home-editor-content">
        <div className="home-editor-content-head">
          <div><span>Контент і налаштування</span><h2>Редагування сторінки</h2></div>
          <div className={`home-editor-change-state ${dirty ? 'is-dirty' : 'is-saved'}`}>
            {dirty ? <CircleAlert size={16}/> : <CheckCircle2 size={16}/>} {dirty ? 'Не збережено' : 'Збережено'}
          </div>
        </div>

        {!visibleSections.length && <div className="home-editor-empty-search">
          <Search size={24}/><strong>Нічого не знайдено</strong><span>Спробуй іншу назву поля або очисть пошук.</span>
          <button className="btn btn-light" type="button" onClick={() => setSearch('')}>Очистити пошук</button>
        </div>}

        {visibleSections.map((section) => {
          const Icon = section.icon
          const filled = section.fields.filter((key) => hasValue(form[key])).length
          return <article className="home-editor-section" id={`home-editor-${section.id}`} key={section.id} onMouseEnter={() => setActiveSection(section.id)}>
            <header>
              <div className="home-editor-section-icon"><Icon size={21}/></div>
              <div><small>{section.eyebrow}</small><h2>{section.title}</h2><p>{section.description}</p></div>
              <span className="home-editor-section-progress"><b>{filled}</b> / {section.fields.length}</span>
            </header>
            <div className={`admin-form-grid home-editor-fields fields-${section.id}`}>
              {section.fields.map((key) => <AdminField key={key} spec={fieldMap[key]} value={form[key]} onChange={update}/>)}
            </div>
          </article>
        })}
      </div>

      <aside className="home-live-preview">
        <div className="home-live-preview-head">
          <div><span>LIVE PREVIEW</span><strong>Перший екран</strong></div>
          <div className="home-preview-mode">
            <button className={previewMode === 'desktop' ? 'is-active' : ''} type="button" onClick={() => setPreviewMode('desktop')} aria-label="Desktop preview"><Monitor size={15}/></button>
            <button className={previewMode === 'mobile' ? 'is-active' : ''} type="button" onClick={() => setPreviewMode('mobile')} aria-label="Mobile preview"><Smartphone size={15}/></button>
          </div>
        </div>

        <div className={`home-preview-browser is-${previewMode}`}>
          <div className="home-preview-browser-bar"><i/><i/><i/><span>dmytro.dev</span></div>
          <div className="home-preview-page">
            <header><strong>{form.logo_text || 'DK.'}</strong><span>Проєкти&nbsp;&nbsp; Послуги&nbsp;&nbsp; Контакти</span></header>
            <div className="home-preview-hero">
              <span className="home-preview-availability"><i/>{form.availability || 'Відкритий до проєктів'}</span>
              <h3>{form.hero_title || 'Тут буде головний заголовок твоєї сторінки'}</h3>
              <p>{form.hero_subtitle || 'Додай короткий підзаголовок, який пояснить клієнту твою цінність.'}</p>
              <div><button>Обговорити проєкт</button><span>Переглянути роботи →</span></div>
            </div>
            <footer>
              <span><b>{form.years_experience || 0}+</b> років досвіду</span>
              <span><b>{form.city || 'Україна'}</b> локація</span>
            </footer>
          </div>
        </div>

        <div className="home-preview-checklist">
          <div><span><Globe2 size={16}/><strong>Публічні дані</strong></span>{hasValue(form.full_name) && hasValue(form.role) ? <Check size={16}/> : <CircleAlert size={16}/>}</div>
          <div><span><Phone size={16}/><strong>Контакти</strong></span>{hasValue(form.email) || hasValue(form.phone) || hasValue(form.telegram) ? <Check size={16}/> : <CircleAlert size={16}/>}</div>
          <div><span><FileText size={16}/><strong>SEO-опис</strong></span>{hasValue(form.seo_title) && hasValue(form.seo_description) ? <Check size={16}/> : <CircleAlert size={16}/>}</div>
          <div><span><Clock3 size={16}/><strong>Графік роботи</strong></span>{hasValue(form.working_hours) ? <Check size={16}/> : <CircleAlert size={16}/>}</div>
        </div>

        <a className="home-preview-open" href="/" target="_blank" rel="noreferrer"><span><ExternalLink size={16}/><strong>Відкрити повну сторінку</strong></span><ArrowUpRight size={16}/></a>
      </aside>
    </section>

    <AdminSaveDock dirty={dirty} saving={saving} onSave={save} onCancel={cancelChanges} title="Головна сторінка змінена" description="Перевір preview та збережи оновлення або скасуй редагування."/>
  </main>
}

function HomeEditorSkeleton() {
  return <main className="home-admin-v2 is-loading">
    <section className="home-admin-command skeleton-block"/>
    <section className="home-admin-summary">{[1, 2, 3, 4].map((item) => <article className="skeleton-block" key={item}/>)}</section>
    <section className="home-admin-workspace"><aside className="home-editor-sidebar skeleton-block"/><div className="home-editor-content">{[1, 2, 3].map((item) => <article className="home-editor-section skeleton-block" key={item}/>)}</div><aside className="home-live-preview skeleton-block"/></section>
  </main>
}
