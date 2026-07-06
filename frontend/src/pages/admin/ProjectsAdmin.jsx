import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowUp, BarChart3, Check, CheckCircle2, ChevronRight, CircleDot,
  Copy, ExternalLink, Eye, EyeOff, FileText, FolderKanban, GitBranch, Grid2X2,
  Image as ImageIcon, Layers3, LayoutList, Link2, MoreHorizontal, Pencil,
  Plus, RefreshCw, Rocket, Search, SlidersHorizontal, Sparkles, Star, Trash2,
  X, Zap,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import ImageCropUploader from '../../components/admin/ImageCropUploader'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'
import { emptyFor, parsePayload, resources } from './resources'

const config = resources.projects
const statusOptions = [
  ['all', 'Усі статуси'],
  ['published', 'Опубліковані'],
  ['draft', 'Чернетки'],
  ['concept', 'Концепти'],
]
const statusLabels = { published: 'Опубліковано', draft: 'Чернетка', concept: 'Концепт' }
const statusHints = {
  published: 'Проєкт доступний відвідувачам',
  draft: 'Прихований до завершення роботи',
  concept: 'Ідея або майбутній кейс',
}
const sortOptions = [
  ['order', 'За порядком'],
  ['newest', 'Спочатку нові'],
  ['title', 'За назвою'],
  ['status', 'За статусом'],
]

const tabs = [
  { key: 'base', label: 'Основне', icon: FolderKanban, description: 'Назва, клієнт і коротка презентація.' },
  { key: 'story', label: 'Історія кейсу', icon: FileText, description: 'Проблема, рішення та результат.' },
  { key: 'content', label: 'Наповнення', icon: Layers3, description: 'Технології, функції та метрики.' },
  { key: 'media', label: 'Медіа', icon: ImageIcon, description: 'Обкладинка й галерея проєкту.' },
  { key: 'publish', label: 'Публікація', icon: Rocket, description: 'Посилання, статус і видимість.' },
]

const fieldsByTab = {
  base: ['title', 'slug', 'category', 'client', 'summary', 'duration'],
  story: ['challenge', 'solution', 'result_text'],
  content: ['technologies', 'features', 'metrics'],
  media: ['cover_image_url', 'gallery'],
  publish: ['live_url', 'github_url', 'status', 'featured', 'ai_integration', 'is_verified_case', 'is_active', 'order'],
}

const baseEmpty = () => ({
  ...emptyFor(config.fields),
  technologies: [],
  features: [],
  metrics: [],
  gallery: [],
  status: 'draft',
  featured: false,
  ai_integration: false,
  is_verified_case: true,
  is_active: true,
  order: 0,
})

function getCover(project) {
  if (project?.uploaded_cover_url) return project.uploaded_cover_url
  if (project?.cover_image_url) return project.cover_image_url
  const gallery = Array.isArray(project?.gallery) ? project.gallery : []
  const main = gallery.find((item) => item?.is_main) || gallery[0]
  return typeof main === 'string' ? main : main?.url || ''
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function projectProgress(project) {
  const checks = [
    project?.title,
    project?.slug,
    project?.category,
    project?.summary,
    project?.challenge,
    project?.solution,
    project?.result_text,
    normalizeArray(project?.technologies).length,
    normalizeArray(project?.features).length,
    getCover(project),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function fieldSpec(key) {
  return config.fields.find((field) => field[0] === key)
}

function ProjectStatus({ status }) {
  return <span className={`project-admin-status is-${status || 'draft'}`}><i />{statusLabels[status] || status || 'Чернетка'}</span>
}

export default function ProjectsAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('order')
  const [viewMode, setViewMode] = useState('grid')
  const [selected, setSelected] = useState(() => new Set())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(baseEmpty)
  const [baseline, setBaseline] = useState(baseEmpty)
  const [activeTab, setActiveTab] = useState('base')
  const [saving, setSaving] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const response = await api.get(config.endpoint)
      const data = unwrap(response) || []
      setItems(Array.isArray(data) ? data : [])
    } catch {
      notify('Не вдалося завантажити проєкти.', { type: 'error' })
    } finally { if (!quiet) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!editorOpen) return undefined
    document.body.classList.add('project-editor-open')
    return () => document.body.classList.remove('project-editor-open')
  }, [editorOpen])

  const categories = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk')), [items])

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase()
    const filtered = items.filter((item) => {
      const haystack = `${item.title || ''} ${item.summary || ''} ${item.client || ''} ${item.category || ''} ${normalizeArray(item.technologies).join(' ')}`.toLowerCase()
      if (search && !haystack.includes(search)) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (visibilityFilter === 'active' && item.is_active === false) return false
      if (visibilityFilter === 'hidden' && item.is_active !== false) return false
      if (visibilityFilter === 'featured' && !item.featured) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') return Number(b.id || 0) - Number(a.id || 0)
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'uk')
      if (sortBy === 'status') return String(a.status || '').localeCompare(String(b.status || ''), 'uk')
      return Number(a.order || 0) - Number(b.order || 0) || Number(a.id || 0) - Number(b.id || 0)
    })
  }, [items, query, statusFilter, categoryFilter, visibilityFilter, sortBy])

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((item) => item.status === 'published' && item.is_active !== false).length,
    drafts: items.filter((item) => item.status === 'draft').length,
    featured: items.filter((item) => item.featured).length,
    hidden: items.filter((item) => item.is_active === false).length,
  }), [items])

  const completion = useMemo(() => projectProgress(form), [form])
  const currentFields = fieldsByTab[activeTab].map(fieldSpec).filter(Boolean)
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selected.has(item.id))

  const canLeaveEditor = async () => !editorOpen || !dirty || confirm({
    title: 'Закрити редактор без збереження?',
    description: 'Усі зміни в поточному проєкті буде втрачено.',
    confirmLabel: 'Закрити без збереження',
    tone: 'danger',
  })

  const openNew = async () => {
    if (!(await canLeaveEditor())) return
    const initial = baseEmpty()
    setEditing(null)
    setForm(initial)
    setBaseline(initial)
    setActiveTab('base')
    setEditorOpen(true)
  }

  const openEdit = async (item, tab = 'base') => {
    if (!(await canLeaveEditor())) return
    setEditing(item)
    setForm({ ...baseEmpty(), ...item })
    setBaseline({ ...baseEmpty(), ...item })
    setActiveTab(tab)
    setEditorOpen(true)
  }

  const closeEditor = async () => {
    if (!(await canLeaveEditor())) return
    setForm({ ...baseline })
    setEditorOpen(false)
  }

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const save = async () => {
    if (!String(form.title || '').trim()) {
      setActiveTab('base')
      notify('Додай назву проєкту.', { type: 'warning' })
      return
    }
    setSaving(true)
    try {
      const payload = parsePayload(form, config.fields)
      const response = editing
        ? await api.patch(`${config.endpoint}${editing.slug}/`, payload)
        : await api.post(config.endpoint, payload)
      const saved = unwrap(response)
      setEditing(saved)
      setForm({ ...baseEmpty(), ...saved })
      setBaseline({ ...baseEmpty(), ...saved })
      await load({ quiet: true })
      notify(editing ? 'Проєкт оновлено.' : 'Проєкт створено. Тепер можна додати обкладинку.')
    } catch (error) {
      const details = error.response?.data
      const message = typeof details === 'object' ? Object.values(details).flat().join(' ') : error.message
      notify(message || 'Не вдалося зберегти проєкт.', { type: 'error', duration: 5200 })
    } finally { setSaving(false) }
  }

  const remove = async (item) => {
    const accepted = await confirm({
      title: `Видалити «${item.title}»?`,
      description: 'Проєкт буде переміщено до кошика разом із його даними. Пізніше його можна буде відновити.',
      confirmLabel: 'Перемістити до кошика',
      tone: 'danger',
    })
    if (!accepted) return
    try {
      await api.delete(`${config.endpoint}${item.slug}/`)
      if (editing?.id === item.id) setEditorOpen(false)
      setSelected((current) => { const next = new Set(current); next.delete(item.id); return next })
      await load({ quiet: true })
      notify('Проєкт переміщено до кошика.', { type: 'warning' })
    } catch { notify('Не вдалося видалити проєкт.', { type: 'error' }) }
  }

  const quickPatch = async (item, patch, successMessage = 'Проєкт оновлено.') => {
    try {
      const response = await api.patch(`${config.endpoint}${item.slug}/`, patch)
      const saved = unwrap(response)
      setItems((current) => current.map((entry) => entry.id === item.id ? saved : entry))
      if (editing?.id === item.id && !dirty) {
        setEditing(saved)
        setForm({ ...baseEmpty(), ...saved })
        setBaseline({ ...baseEmpty(), ...saved })
      }
      notify(successMessage)
    } catch { notify('Не вдалося оновити проєкт.', { type: 'error' }) }
  }

  const duplicate = async (item) => {
    const accepted = await confirm({
      title: `Створити копію «${item.title}»?`,
      description: 'Копія буде створена як чернетка й одразу відкриється в редакторі.',
      confirmLabel: 'Створити копію',
    })
    if (!accepted) return
    try {
      const payload = Object.fromEntries(config.fields.map(([key]) => [key, item[key]]))
      payload.title = `${item.title} — копія`
      payload.slug = `${item.slug}-copy-${String(Date.now()).slice(-5)}`
      payload.status = 'draft'
      payload.featured = false
      payload.order = Math.max(0, ...items.map((entry) => Number(entry.order || 0))) + 1
      const response = await api.post(config.endpoint, payload)
      const saved = unwrap(response)
      await load({ quiet: true })
      notify('Копію проєкту створено.')
      await openEdit(saved)
    } catch { notify('Не вдалося створити копію.', { type: 'error' }) }
  }

  const moveProject = async (item, direction) => {
    const ordered = [...items].sort((a, b) => Number(a.order || 0) - Number(b.order || 0) || Number(a.id) - Number(b.id))
    const index = ordered.findIndex((entry) => entry.id === item.id)
    const target = ordered[index + direction]
    if (!target) return
    const itemOrder = Number(item.order || index)
    const targetOrder = Number(target.order || index + direction)
    try {
      const [a, b] = await Promise.all([
        api.patch(`${config.endpoint}${item.slug}/`, { order: targetOrder }),
        api.patch(`${config.endpoint}${target.slug}/`, { order: itemOrder }),
      ])
      const savedA = unwrap(a); const savedB = unwrap(b)
      setItems((current) => current.map((entry) => entry.id === savedA.id ? savedA : entry.id === savedB.id ? savedB : entry))
      notify('Порядок проєктів змінено.')
    } catch { notify('Не вдалося змінити порядок.', { type: 'error' }) }
  }

  const toggleSelected = (id) => setSelected((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const toggleAllVisible = () => setSelected((current) => {
    const next = new Set(current)
    if (allVisibleSelected) filteredItems.forEach((item) => next.delete(item.id))
    else filteredItems.forEach((item) => next.add(item.id))
    return next
  })

  const runBulkPatch = async (patch, message) => {
    const targets = items.filter((item) => selected.has(item.id))
    if (!targets.length) return
    setBulkBusy(true)
    try {
      await Promise.all(targets.map((item) => api.patch(`${config.endpoint}${item.slug}/`, patch)))
      await load({ quiet: true })
      setSelected(new Set())
      notify(message)
    } catch { notify('Частину проєктів не вдалося оновити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }

  const bulkDelete = async () => {
    const targets = items.filter((item) => selected.has(item.id))
    if (!targets.length) return
    const accepted = await confirm({
      title: `Видалити вибрані проєкти (${targets.length})?`,
      description: 'Усі вибрані проєкти буде переміщено до кошика.',
      confirmLabel: 'Видалити вибрані',
      tone: 'danger',
    })
    if (!accepted) return
    setBulkBusy(true)
    try {
      await Promise.all(targets.map((item) => api.delete(`${config.endpoint}${item.slug}/`)))
      await load({ quiet: true })
      setSelected(new Set())
      notify('Вибрані проєкти переміщено до кошика.', { type: 'warning' })
    } catch { notify('Частину проєктів не вдалося видалити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setVisibilityFilter('all')
  }

  return <div className="projects-admin-page">
    <section className="projects-admin-hero">
      <div className="projects-admin-hero-copy">
        <span className="projects-admin-eyebrow"><Sparkles size={14}/> PORTFOLIO MANAGER</span>
        <h1>Проєкти без хаосу.</h1>
        <p>Керуй кейсами, публікацією, обкладинками й порядком показу в одному зручному робочому просторі.</p>
        <div className="projects-admin-hero-actions">
          <button className="btn projects-admin-primary" onClick={openNew}><Plus size={18}/> Створити проєкт</button>
          <a className="btn projects-admin-secondary" href="/projects" target="_blank" rel="noreferrer"><ExternalLink size={17}/> Відкрити портфоліо</a>
        </div>
      </div>
      <div className="projects-admin-hero-visual" aria-hidden="true">
        <div className="projects-admin-orbit orbit-one" />
        <div className="projects-admin-orbit orbit-two" />
        <div className="projects-admin-hero-card card-main"><FolderKanban size={26}/><strong>{stats.total}</strong><span>проєктів у базі</span></div>
        <div className="projects-admin-hero-card card-featured"><Star size={18}/><strong>{stats.featured}</strong><span>на головній</span></div>
        <div className="projects-admin-hero-card card-published"><CheckCircle2 size={18}/><strong>{stats.published}</strong><span>опубліковано</span></div>
      </div>
    </section>

    <section className="projects-admin-stats" aria-label="Статистика проєктів">
      <button onClick={() => { clearFilters(); setVisibilityFilter('all') }}><span><FolderKanban size={18}/></span><div><strong>{stats.total}</strong><small>Усі проєкти</small></div><ChevronRight size={16}/></button>
      <button onClick={() => { clearFilters(); setStatusFilter('published') }}><span><Rocket size={18}/></span><div><strong>{stats.published}</strong><small>Опубліковані</small></div><ChevronRight size={16}/></button>
      <button onClick={() => { clearFilters(); setStatusFilter('draft') }}><span><FileText size={18}/></span><div><strong>{stats.drafts}</strong><small>Чернетки</small></div><ChevronRight size={16}/></button>
      <button onClick={() => { clearFilters(); setVisibilityFilter('featured') }}><span><Star size={18}/></span><div><strong>{stats.featured}</strong><small>На головній</small></div><ChevronRight size={16}/></button>
      <button onClick={() => { clearFilters(); setVisibilityFilter('hidden') }}><span><EyeOff size={18}/></span><div><strong>{stats.hidden}</strong><small>Приховані</small></div><ChevronRight size={16}/></button>
    </section>

    <section className="projects-admin-workspace">
      <header className="projects-admin-workspace-head">
        <div><span>БІБЛІОТЕКА КЕЙСІВ</span><h2>Усі проєкти</h2><p>Знайди потрібний кейс, швидко зміни його стан або відкрий повний редактор.</p></div>
        <button className="icon-btn projects-refresh" onClick={() => load()} title="Оновити"><RefreshCw size={18}/></button>
      </header>

      <div className="projects-admin-toolbar">
        <label className="projects-admin-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за назвою, клієнтом, категорією або технологією…"/>{query && <button onClick={() => setQuery('')} aria-label="Очистити пошук"><X size={15}/></button>}</label>
        <div className="projects-admin-filter"><SlidersHorizontal size={16}/><AdminSelect compact value={statusFilter} onChange={setStatusFilter} options={statusOptions}/></div>
        <AdminSelect compact value={categoryFilter} onChange={setCategoryFilter} options={[['all', 'Усі категорії'], ...categories.map((category) => [category, category])]}/>
        <AdminSelect compact value={visibilityFilter} onChange={setVisibilityFilter} options={[["all","Будь-яка видимість"],["active","Тільки активні"],["hidden","Приховані"],["featured","На головній"]]}/>
        <AdminSelect compact value={sortBy} onChange={setSortBy} options={sortOptions}/>
        <div className="projects-admin-view-toggle" aria-label="Вигляд списку">
          <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="Сітка"><Grid2X2 size={17}/></button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="Список"><LayoutList size={18}/></button>
        </div>
      </div>

      <div className="projects-admin-selection-row">
        <label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible}/><span>{selected.size ? `Вибрано: ${selected.size}` : `Показано ${filteredItems.length} із ${items.length}`}</span></label>
        {(query || statusFilter !== 'all' || categoryFilter !== 'all' || visibilityFilter !== 'all') && <button onClick={clearFilters}><X size={14}/> Скинути фільтри</button>}
      </div>

      {selected.size > 0 && <div className="projects-admin-bulkbar">
        <div><Check size={17}/><strong>{selected.size}</strong><span>проєктів вибрано</span></div>
        <div>
          <button disabled={bulkBusy} onClick={() => runBulkPatch({ status: 'published', is_active: true }, 'Вибрані проєкти опубліковано.')}><Rocket size={15}/> Опублікувати</button>
          <button disabled={bulkBusy} onClick={() => runBulkPatch({ status: 'draft' }, 'Вибрані проєкти переведено в чернетки.')}><FileText size={15}/> У чернетки</button>
          <button disabled={bulkBusy} onClick={() => runBulkPatch({ is_active: false }, 'Вибрані проєкти приховано.')}><EyeOff size={15}/> Приховати</button>
          <button className="danger" disabled={bulkBusy} onClick={bulkDelete}><Trash2 size={15}/> Видалити</button>
          <button className="icon" onClick={() => setSelected(new Set())} aria-label="Скасувати вибір"><X size={16}/></button>
        </div>
      </div>}

      {loading ? <div className="projects-admin-loading"><i/><span>Завантаження проєктів…</span></div> : filteredItems.length ? <div className={`projects-admin-collection is-${viewMode}`}>
        {filteredItems.map((item) => {
          const cover = getCover(item)
          const technologies = normalizeArray(item.technologies)
          const progress = projectProgress(item)
          return <article key={item.id} className={`projects-admin-item ${selected.has(item.id) ? 'is-selected' : ''} ${item.is_active === false ? 'is-hidden' : ''}`}>
            <div className="projects-admin-item-media" onClick={() => openEdit(item, 'media')}>
              {cover ? <img src={cover} alt=""/> : <div className="projects-admin-cover-empty"><ImageIcon size={28}/><span>Додати обкладинку</span></div>}
              <div className="projects-admin-item-topline">
                <label onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelected(item.id)}/><span><Check size={13}/></span></label>
                <div>{item.featured && <span className="project-featured-badge"><Star size={13}/> На головній</span>}<ProjectStatus status={item.status}/></div>
              </div>
              <div className="projects-admin-item-progress"><span style={{ width: `${progress}%` }}/><small>{progress}% заповнено</small></div>
            </div>
            <div className="projects-admin-item-body">
              <div className="projects-admin-item-meta"><span>{item.category || 'Без категорії'}</span>{item.client && <><i/> <span>{item.client}</span></>}</div>
              <button className="projects-admin-item-title" onClick={() => openEdit(item)}><strong>{item.title || 'Без назви'}</strong><Pencil size={15}/></button>
              <p>{item.summary || 'Короткий опис ще не додано.'}</p>
              <div className="projects-admin-techs">{technologies.slice(0, 4).map((tech, index) => <span key={`${tech}-${index}`}>{tech}</span>)}{technologies.length > 4 && <span>+{technologies.length - 4}</span>}{!technologies.length && <span className="empty">Технології не вказані</span>}</div>
              <div className="projects-admin-item-flags">
                <span className={item.is_active === false ? 'is-off' : 'is-on'}>{item.is_active === false ? <EyeOff size={14}/> : <Eye size={14}/>} {item.is_active === false ? 'Прихований' : 'Активний'}</span>
                {item.ai_integration && <span><Sparkles size={14}/> AI</span>}
                {item.is_verified_case && <span><CheckCircle2 size={14}/> Перевірено</span>}
              </div>
            </div>
            <footer className="projects-admin-item-actions">
              <div>
                <button onClick={() => moveProject(item, -1)} title="Підняти вище"><ArrowUp size={15}/></button>
                <button onClick={() => moveProject(item, 1)} title="Опустити нижче"><ArrowDown size={15}/></button>
                <span>#{Number(item.order || 0) + 1}</span>
              </div>
              <div>
                <a href={`/projects/${item.slug}`} target="_blank" rel="noreferrer" title="Переглянути"><Eye size={16}/></a>
                <button onClick={() => duplicate(item)} title="Дублювати"><Copy size={16}/></button>
                <button onClick={() => quickPatch(item, { featured: !item.featured }, item.featured ? 'Проєкт прибрано з головної.' : 'Проєкт додано на головну.')} title={item.featured ? 'Прибрати з головної' : 'Додати на головну'}><Star size={16} fill={item.featured ? 'currentColor' : 'none'}/></button>
                <button onClick={() => openEdit(item)} title="Редагувати"><Pencil size={16}/></button>
                <button className="danger" onClick={() => remove(item)} title="Видалити"><Trash2 size={16}/></button>
              </div>
            </footer>
          </article>
        })}
      </div> : <div className="projects-admin-empty">
        <div><Search size={26}/></div><h3>Нічого не знайдено</h3><p>Зміни пошуковий запит або скинь активні фільтри.</p><button className="btn btn-light" onClick={clearFilters}>Скинути фільтри</button>
      </div>}
    </section>

    {editorOpen && <div className="project-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
      <aside className="project-editor-drawer" role="dialog" aria-modal="true" aria-label={editing ? `Редагування ${editing.title}` : 'Новий проєкт'}>
        <header className="project-editor-header">
          <div><span>{editing ? `PROJECT #${editing.id}` : 'NEW PROJECT'}</span><h2>{editing ? form.title || 'Без назви' : 'Новий проєкт'}</h2><p>{editing ? 'Зміни контент, медіа та параметри публікації.' : 'Створи основу кейсу, а обкладинку додаси після першого збереження.'}</p></div>
          <button onClick={closeEditor} aria-label="Закрити"><X size={20}/></button>
        </header>

        <div className="project-editor-health">
          <div className="project-editor-health-ring" style={{ '--progress': `${completion * 3.6}deg` }}><span>{completion}%</span></div>
          <div><strong>{completion >= 90 ? 'Кейс готовий до публікації' : completion >= 60 ? 'Ще кілька важливих деталей' : 'Заповни основу проєкту'}</strong><small>Рівень заповнення контенту</small></div>
          <ProjectStatus status={form.status}/>
        </div>

        <nav className="project-editor-tabs">
          {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}><Icon size={17}/><span><strong>{tab.label}</strong><small>{tab.description}</small></span><ChevronRight size={15}/></button> })}
        </nav>

        <div className="project-editor-content">
          <section className="project-editor-form-card">
            <div className="project-editor-section-head"><span>{tabs.find((tab) => tab.key === activeTab)?.label}</span><h3>{tabs.find((tab) => tab.key === activeTab)?.description}</h3></div>
            <div className={`admin-form-grid project-editor-form is-${activeTab}`}>
              {currentFields.map((field) => <AdminField key={field[0]} spec={field} value={form[field[0]]} onChange={update}/>)}
            </div>
            {activeTab === 'media' && <div className="project-editor-upload-area">
              {editing ? <ImageCropUploader title="Обкладинка проєкту" hint="Використовується на головній сторінці, у портфоліо та всередині кейсу. Рекомендоване співвідношення 16:10." currentUrl={editing.uploaded_cover_url} uploadUrl={`${config.endpoint}${editing.slug}/upload_cover/`} removeUrl={`${config.endpoint}${editing.slug}/remove_cover/`} aspect={16 / 10} onUploaded={(data) => { setEditing(data); setForm({ ...baseEmpty(), ...data }); setBaseline({ ...baseEmpty(), ...data }); load({ quiet: true }) }}/>: <div className="project-editor-save-first"><ImageIcon size={26}/><div><strong>Спочатку створи проєкт</strong><p>Після першого збереження тут з’явиться обрізання та завантаження обкладинки.</p></div></div>}
            </div>}
          </section>

          <aside className="project-editor-preview">
            <div className="project-editor-preview-head"><span><CircleDot size={13}/> LIVE PREVIEW</span><div><button title="Відкрити сторінку" disabled={!editing}><ExternalLink size={15}/></button><button title="Інші дії"><MoreHorizontal size={16}/></button></div></div>
            <div className="project-preview-card">
              <div className="project-preview-media">{getCover(form) ? <img src={getCover(form)} alt=""/> : <div><ImageIcon size={26}/><span>Обкладинка</span></div>}<ProjectStatus status={form.status}/>{form.featured && <span className="project-preview-featured"><Star size={13}/> Featured</span>}</div>
              <div className="project-preview-copy"><small>{form.category || 'КАТЕГОРІЯ'}</small><h3>{form.title || 'Назва нового проєкту'}</h3><p>{form.summary || 'Короткий опис покаже відвідувачу головну цінність цього кейсу.'}</p><div>{normalizeArray(form.technologies).slice(0, 4).map((tech, index) => <span key={`${tech}-${index}`}>{tech}</span>)}</div></div>
            </div>
            <div className="project-editor-checklist">
              <h4>Перевірка перед публікацією</h4>
              {[
                ['Назва та slug', form.title && form.slug],
                ['Короткий опис', form.summary],
                ['Історія кейсу', form.challenge && form.solution && form.result_text],
                ['Технології', normalizeArray(form.technologies).length],
                ['Обкладинка', getCover(form)],
                ['Посилання на результат', form.live_url],
              ].map(([label, done]) => <div key={label} className={done ? 'done' : ''}>{done ? <Check size={14}/> : <CircleDot size={14}/>}<span>{label}</span></div>)}
            </div>
            {activeTab === 'publish' && <div className="project-editor-quick-publish">
              <h4>Швидкий стан</h4>
              <p>{statusHints[form.status]}</p>
              <div>{['concept', 'draft', 'published'].map((status) => <button key={status} className={form.status === status ? 'active' : ''} onClick={() => update('status', status)}><i/><span>{statusLabels[status]}</span></button>)}</div>
            </div>}
            <div className="project-editor-links">
              {form.live_url && <a href={form.live_url} target="_blank" rel="noreferrer"><Link2 size={16}/> Відкрити сайт <ExternalLink size={14}/></a>}
              {form.github_url && <a href={form.github_url} target="_blank" rel="noreferrer"><GitBranch size={16}/> Відкрити GitHub <ExternalLink size={14}/></a>}
              {!form.live_url && !form.github_url && <p><Link2 size={16}/> Посилання з’являться тут після заповнення.</p>}
            </div>
          </aside>
        </div>
      </aside>
      <AdminSaveDock placement="drawer" dirty={dirty} saving={saving} onSave={save} onCancel={() => setForm({ ...baseline })} title={editing ? 'Проєкт має незбережені зміни' : 'Новий проєкт ще не створено'} description="Збережи зміни або поверни останню версію." saveLabel={editing ? 'Зберегти проєкт' : 'Створити проєкт'}/>
    </div>}
  </div>
}
