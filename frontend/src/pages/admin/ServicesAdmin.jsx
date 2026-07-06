import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUp, Bot, Boxes, Check, CheckCircle2, CircleAlert,
  Code2, Copy, Eye, EyeOff, Gauge, Globe2, Grid2X2, LayoutDashboard, LayoutList,
  MoreHorizontal, Pencil, Plus, RefreshCw, Rocket, Search, Settings2, ShoppingBag,
  Sparkles, Tag, Timer, Trash2, TrendingUp, WalletCards, Workflow, X, Zap,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'
import { emptyFor, parsePayload, resources } from './resources'

const config = resources.services

const iconMap = {
  sparkles: Sparkles,
  code: Code2,
  bot: Bot,
  layers: Boxes,
  shopping: ShoppingBag,
  globe: Globe2,
  workflow: Workflow,
  dashboard: LayoutDashboard,
}

const iconOptions = [
  ['sparkles', 'Іскри'], ['code', 'Код'], ['bot', 'AI / бот'], ['layers', 'Система'],
  ['shopping', 'Магазин'], ['globe', 'Сайт'], ['workflow', 'Автоматизація'], ['dashboard', 'Адмінпанель'],
]

const statusOptions = [['all', 'Усі послуги'], ['active', 'Активні'], ['hidden', 'Приховані']]
const priceOptions = [['all', 'Будь-яка ціна'], ['low', 'До 5 000 грн'], ['middle', '5 000–10 000 грн'], ['high', 'Від 10 000 грн']]
const sortOptions = [['order', 'За порядком'], ['price-asc', 'Ціна: від меншої'], ['price-desc', 'Ціна: від більшої'], ['title', 'За назвою'], ['newest', 'Спочатку нові']]

const tabs = [
  { key: 'base', label: 'Основне', icon: Sparkles, description: 'Назва, коротка презентація та іконка.' },
  { key: 'offer', label: 'Пропозиція', icon: WalletCards, description: 'Ціна, строк і рівень складності.' },
  { key: 'content', label: 'Наповнення', icon: CheckCircle2, description: 'Що входить у послугу та детальний опис.' },
  { key: 'publish', label: 'Публікація', icon: Rocket, description: 'Видимість, порядок і готовність до показу.' },
]

const fieldsByTab = {
  base: ['title', 'slug', 'summary', 'icon'],
  offer: ['price_from_uah', 'duration', 'complexity', 'premium_note'],
  content: ['description', 'features'],
  publish: ['is_active', 'order'],
}

const baseEmpty = () => ({
  ...emptyFor(config.fields),
  icon: 'sparkles',
  price_from_uah: 5000,
  complexity: 'Стандартна',
  features: [],
  is_active: true,
  order: 0,
})

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function fieldSpec(key) {
  return config.fields.find((field) => field[0] === key)
}

function serviceProgress(service) {
  const checks = [
    service?.title,
    service?.summary,
    service?.description,
    Number(service?.price_from_uah) > 0,
    service?.duration,
    service?.complexity,
    normalizeArray(service?.features).length >= 3,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function priceLabel(value) {
  return `${Number(value || 0).toLocaleString('uk-UA')} грн`
}

function ServiceIcon({ name, size = 20 }) {
  const Icon = iconMap[name] || Sparkles
  return <Icon size={size}/>
}

function ServiceStatus({ active }) {
  return <span className={`service-admin-status ${active === false ? 'is-hidden' : 'is-active'}`}><i/>{active === false ? 'Прихована' : 'Активна'}</span>
}

export default function ServicesAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [complexityFilter, setComplexityFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
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
      notify('Не вдалося завантажити послуги.', { type: 'error' })
    } finally { if (!quiet) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!editorOpen) return undefined
    document.body.classList.add('service-editor-open')
    return () => document.body.classList.remove('service-editor-open')
  }, [editorOpen])

  const complexities = useMemo(() => [...new Set(items.map((item) => item.complexity).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk')), [items])

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase()
    const filtered = items.filter((item) => {
      const haystack = `${item.title || ''} ${item.summary || ''} ${item.description || ''} ${item.complexity || ''} ${normalizeArray(item.features).join(' ')}`.toLowerCase()
      if (search && !haystack.includes(search)) return false
      if (statusFilter === 'active' && item.is_active === false) return false
      if (statusFilter === 'hidden' && item.is_active !== false) return false
      if (complexityFilter !== 'all' && item.complexity !== complexityFilter) return false
      const price = Number(item.price_from_uah || 0)
      if (priceFilter === 'low' && price > 5000) return false
      if (priceFilter === 'middle' && (price < 5000 || price > 10000)) return false
      if (priceFilter === 'high' && price < 10000) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price_from_uah || 0) - Number(b.price_from_uah || 0)
      if (sortBy === 'price-desc') return Number(b.price_from_uah || 0) - Number(a.price_from_uah || 0)
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'uk')
      if (sortBy === 'newest') return Number(b.id || 0) - Number(a.id || 0)
      return Number(a.order || 0) - Number(b.order || 0) || Number(a.id || 0) - Number(b.id || 0)
    })
  }, [items, query, statusFilter, complexityFilter, priceFilter, sortBy])

  const stats = useMemo(() => {
    const active = items.filter((item) => item.is_active !== false)
    const prices = active.map((item) => Number(item.price_from_uah || 0)).filter(Boolean)
    return {
      total: items.length,
      active: active.length,
      hidden: items.filter((item) => item.is_active === false).length,
      average: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0,
      incomplete: items.filter((item) => serviceProgress(item) < 75).length,
    }
  }, [items])

  const completion = useMemo(() => serviceProgress(form), [form])
  const currentFields = fieldsByTab[activeTab].map(fieldSpec).filter(Boolean)
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selected.has(item.id))

  const canLeaveEditor = async () => !editorOpen || !dirty || confirm({
    title: 'Закрити редактор без збереження?',
    description: 'Усі зміни в поточній послузі буде втрачено.',
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
    const current = { ...baseEmpty(), ...item, features: normalizeArray(item.features) }
    setEditing(item)
    setForm(current)
    setBaseline(current)
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
    const missing = []
    if (!String(form.title || '').trim()) missing.push('назву')
    if (!String(form.summary || '').trim()) missing.push('короткий опис')
    if (!String(form.description || '').trim()) missing.push('детальний опис')
    if (missing.length) {
      setActiveTab(missing.includes('детальний опис') ? 'content' : 'base')
      notify(`Додай ${missing.join(', ')}.`, { type: 'warning' })
      return
    }
    setSaving(true)
    try {
      const payload = parsePayload(form, config.fields)
      const response = editing
        ? await api.patch(`${config.endpoint}${editing.id}/`, payload)
        : await api.post(config.endpoint, payload)
      const saved = unwrap(response)
      const normalized = { ...baseEmpty(), ...saved, features: normalizeArray(saved.features) }
      setEditing(saved)
      setForm(normalized)
      setBaseline(normalized)
      await load({ quiet: true })
      notify(editing ? 'Послугу оновлено.' : 'Нову послугу створено.')
    } catch (error) {
      const details = error.response?.data
      const message = typeof details === 'object' ? Object.values(details).flat().join(' ') : error.message
      notify(message || 'Не вдалося зберегти послугу.', { type: 'error', duration: 5200 })
    } finally { setSaving(false) }
  }

  const patchItem = async (item, payload, message = 'Послугу оновлено.') => {
    try {
      const response = await api.patch(`${config.endpoint}${item.id}/`, payload)
      const saved = unwrap(response)
      setItems((current) => current.map((entry) => entry.id === item.id ? saved : entry))
      if (editing?.id === item.id) {
        const normalized = { ...baseEmpty(), ...saved, features: normalizeArray(saved.features) }
        setEditing(saved); setForm(normalized); setBaseline(normalized)
      }
      notify(message)
      return saved
    } catch {
      notify('Не вдалося виконати дію.', { type: 'error' })
      return null
    }
  }

  const remove = async (item) => {
    const accepted = await confirm({
      title: `Видалити «${item.title}»?`,
      description: 'Послугу буде переміщено до кошика. Її можна буде відновити пізніше.',
      confirmLabel: 'Перемістити до кошика',
      tone: 'danger',
    })
    if (!accepted) return
    try {
      await api.delete(`${config.endpoint}${item.id}/`)
      if (editing?.id === item.id) setEditorOpen(false)
      setSelected((current) => { const next = new Set(current); next.delete(item.id); return next })
      await load({ quiet: true })
      notify('Послугу переміщено до кошика.', { type: 'warning' })
    } catch { notify('Не вдалося видалити послугу.', { type: 'error' }) }
  }

  const duplicate = async (item) => {
    try {
      const source = { ...baseEmpty(), ...item, title: `${item.title} — копія`, slug: '', is_active: false, order: items.length + 1 }
      const payload = parsePayload(source, config.fields)
      const response = await api.post(config.endpoint, payload)
      const saved = unwrap(response)
      await load({ quiet: true })
      notify('Копію створено як приховану послугу.')
      openEdit(saved)
    } catch (error) {
      const details = error.response?.data
      notify(typeof details === 'object' ? Object.values(details).flat().join(' ') : 'Не вдалося створити копію.', { type: 'error' })
    }
  }

  const move = async (item, direction) => {
    const ordered = [...items].sort((a, b) => Number(a.order || 0) - Number(b.order || 0) || a.id - b.id)
    const index = ordered.findIndex((entry) => entry.id === item.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= ordered.length) return
    const target = ordered[targetIndex]
    try {
      await Promise.all([
        api.patch(`${config.endpoint}${item.id}/`, { order: Number(target.order || targetIndex) }),
        api.patch(`${config.endpoint}${target.id}/`, { order: Number(item.order || index) }),
      ])
      await load({ quiet: true })
      notify('Порядок послуг оновлено.')
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

  const bulkUpdate = async (payload, successMessage) => {
    if (!selected.size) return
    setBulkBusy(true)
    try {
      await Promise.all([...selected].map((id) => api.patch(`${config.endpoint}${id}/`, payload)))
      await load({ quiet: true })
      notify(successMessage)
      setSelected(new Set())
    } catch { notify('Не всі послуги вдалося оновити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }

  const bulkDelete = async () => {
    if (!selected.size) return
    const accepted = await confirm({
      title: `Видалити вибрані послуги (${selected.size})?`,
      description: 'Усі вибрані записи буде переміщено до кошика.',
      confirmLabel: 'Видалити вибрані',
      tone: 'danger',
    })
    if (!accepted) return
    setBulkBusy(true)
    try {
      await Promise.all([...selected].map((id) => api.delete(`${config.endpoint}${id}/`)))
      await load({ quiet: true })
      setSelected(new Set())
      notify('Вибрані послуги переміщено до кошика.', { type: 'warning' })
    } catch { notify('Не всі послуги вдалося видалити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }

  const resetFilters = () => {
    setQuery(''); setStatusFilter('all'); setComplexityFilter('all'); setPriceFilter('all'); setSortBy('order')
  }

  const checks = [
    ['Назва та короткий опис', Boolean(form.title && form.summary)],
    ['Детальний опис', Boolean(form.description)],
    ['Ціна і строк', Boolean(Number(form.price_from_uah) > 0 && form.duration)],
    ['Щонайменше 3 переваги', normalizeArray(form.features).length >= 3],
  ]

  return <main className="services-admin-page">
    <section className="services-admin-hero">
      <div className="services-admin-hero-copy">
        <span className="services-admin-kicker"><Sparkles size={14}/> Каталог пропозицій</span>
        <h1>Послуги, які легко<br/><em>керувати й продавати.</em></h1>
        <p>Контролюй ціни, наповнення, видимість і порядок. Усе важливе видно одразу, а редагування не заважає переглядати каталог.</p>
        <div className="services-admin-hero-actions">
          <button className="btn btn-lime" type="button" onClick={openNew}><Plus size={17}/> Додати послугу</button>
          <a className="btn btn-ghost-light" href="/services" target="_blank" rel="noreferrer"><Eye size={17}/> Відкрити сторінку</a>
        </div>
      </div>
      <div className="services-admin-hero-visual" aria-hidden="true">
        <div className="services-admin-orbit"><span><Globe2/></span><span><Bot/></span><span><Workflow/></span></div>
        <div className="services-admin-mini-card is-front"><small>АКТИВНА ПРОПОЗИЦІЯ</small><strong>{items.find((item) => item.is_active !== false)?.title || 'Створіть першу послугу'}</strong><span>від {priceLabel(items.find((item) => item.is_active !== false)?.price_from_uah)}</span></div>
        <div className="services-admin-mini-card is-back"><Zap/><b>{stats.active}</b><small>активних послуг</small></div>
      </div>
    </section>

    <section className="services-admin-stats">
      <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}><span><Grid2X2/></span><div><small>Усього</small><strong>{stats.total}</strong><em>у каталозі</em></div></button>
      <button type="button" className={statusFilter === 'active' ? 'active' : ''} onClick={() => setStatusFilter('active')}><span><CheckCircle2/></span><div><small>Активні</small><strong>{stats.active}</strong><em>бачать клієнти</em></div></button>
      <button type="button" className={statusFilter === 'hidden' ? 'active' : ''} onClick={() => setStatusFilter('hidden')}><span><EyeOff/></span><div><small>Приховані</small><strong>{stats.hidden}</strong><em>не публікуються</em></div></button>
      <button type="button" onClick={() => setSortBy('price-asc')}><span><TrendingUp/></span><div><small>Середній старт</small><strong>{priceLabel(stats.average)}</strong><em>по активних</em></div></button>
      <button type="button" className={stats.incomplete ? 'needs-attention' : ''} onClick={() => setSortBy('newest')}><span><CircleAlert/></span><div><small>Потребують уваги</small><strong>{stats.incomplete}</strong><em>заповнено менше 75%</em></div></button>
    </section>

    <section className="services-admin-workspace">
      <header className="services-admin-workspace-head">
        <div><span>РОБОЧИЙ КАТАЛОГ</span><h2>Усі послуги</h2><p>Знайди потрібну пропозицію, швидко зміни статус або відкрий повний редактор.</p></div>
        <button className="btn btn-light" type="button" onClick={() => load()} disabled={loading}><RefreshCw size={16} className={loading ? 'admin-spin' : ''}/> Оновити</button>
      </header>

      <div className="services-admin-toolbar">
        <label className="services-admin-search">
          <span className="services-admin-search-icon"><Search size={21}/></span>
          <span className="services-admin-search-copy">
            <small>ШВИДКИЙ ПОШУК</small>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Знайти послугу за назвою, описом або функцією…"/>
          </span>
          <span className="services-admin-search-meta">{query ? `${filteredItems.length} знайдено` : `${items.length} у каталозі`}</span>
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистити пошук"><X size={17}/></button>}
        </label>
        <div className="services-admin-filter-row">
          <AdminSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions}/>
          <AdminSelect value={complexityFilter} onChange={setComplexityFilter} options={[['all', 'Усі рівні'], ...complexities.map((value) => [value, value])]}/>
          <AdminSelect value={priceFilter} onChange={setPriceFilter} options={priceOptions}/>
          <AdminSelect value={sortBy} onChange={setSortBy} options={sortOptions}/>
          <div className="services-admin-view-toggle"><button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="Сітка"><Grid2X2 size={17}/></button><button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="Список"><LayoutList size={17}/></button></div>
        </div>
      </div>

      <div className="services-admin-selection-row">
        <label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible}/><span>{allVisibleSelected ? 'Зняти вибір' : 'Вибрати показані'}</span></label>
        <p>Показано <strong>{filteredItems.length}</strong> із {items.length}</p>
        {(query || statusFilter !== 'all' || complexityFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'order') && <button type="button" onClick={resetFilters}>Скинути фільтри</button>}
      </div>

      {selected.size > 0 && <div className="services-admin-bulkbar">
        <div><strong>{selected.size}</strong><span>вибрано</span></div>
        <div><button type="button" disabled={bulkBusy} onClick={() => bulkUpdate({ is_active: true }, 'Вибрані послуги активовано.')}><Eye size={15}/> Активувати</button><button type="button" disabled={bulkBusy} onClick={() => bulkUpdate({ is_active: false }, 'Вибрані послуги приховано.')}><EyeOff size={15}/> Приховати</button><button type="button" disabled={bulkBusy} onClick={bulkDelete} className="danger"><Trash2 size={15}/> У кошик</button><button type="button" onClick={() => setSelected(new Set())}><X size={15}/> Скасувати</button></div>
      </div>}

      {loading ? <div className="services-admin-loading"><RefreshCw className="admin-spin"/><strong>Завантажуємо каталог…</strong></div>
        : filteredItems.length === 0 ? <div className="services-admin-empty"><Sparkles/><h3>Нічого не знайдено</h3><p>Зміни фільтри або створи нову послугу.</p><div><button className="btn btn-light" type="button" onClick={resetFilters}>Скинути фільтри</button><button className="btn btn-dark" type="button" onClick={openNew}><Plus size={16}/> Нова послуга</button></div></div>
        : <div className={`services-admin-collection is-${viewMode}`}>
          {filteredItems.map((item, index) => {
            const progress = serviceProgress(item)
            const features = normalizeArray(item.features)
            return <article key={item.id} className={`services-admin-item tone-${index % 4} ${selected.has(item.id) ? 'is-selected' : ''} ${item.is_active === false ? 'is-hidden' : ''}`}>
              <div className="services-admin-item-top">
                <label className="services-admin-checkbox"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelected(item.id)}/><span/></label>
                <ServiceStatus active={item.is_active}/>
                <button type="button" className="services-admin-more" onClick={() => openEdit(item)} aria-label="Редагувати"><MoreHorizontal size={18}/></button>
              </div>
              <div className="services-admin-item-icon"><ServiceIcon name={item.icon} size={27}/><i/><i/></div>
              <div className="services-admin-item-copy">
                <small>{item.complexity || 'Стандартна'} · {item.duration || 'строк не вказано'}</small>
                <h3>{item.title}</h3>
                <p>{item.summary || item.description || 'Додайте короткий опис послуги.'}</p>
              </div>
              <div className="services-admin-item-price"><span>СТАРТ ВІД</span><strong>{priceLabel(item.price_from_uah)}</strong></div>
              <div className="services-admin-item-features">
                {features.slice(0, 3).map((feature) => <span key={feature}><Check size={13}/>{feature}</span>)}
                {!features.length && <span className="is-muted"><CircleAlert size={13}/>Наповнення не додано</span>}
                {features.length > 3 && <em>+{features.length - 3} ще</em>}
              </div>
              <div className="services-admin-item-health"><div><span style={{ width: `${progress}%` }}/></div><small>{progress}% готовності</small></div>
              <div className="services-admin-item-actions">
                <button type="button" className="primary" onClick={() => openEdit(item)}><Pencil size={15}/> Редагувати</button>
                <button type="button" onClick={() => patchItem(item, { is_active: item.is_active === false }, item.is_active === false ? 'Послугу активовано.' : 'Послугу приховано.')} title={item.is_active === false ? 'Активувати' : 'Приховати'}>{item.is_active === false ? <Eye size={15}/> : <EyeOff size={15}/>}</button>
                <button type="button" onClick={() => duplicate(item)} title="Дублювати"><Copy size={15}/></button>
                <button type="button" onClick={() => move(item, -1)} title="Вище"><ArrowUp size={15}/></button>
                <button type="button" onClick={() => move(item, 1)} title="Нижче"><ArrowDown size={15}/></button>
                <button type="button" className="danger" onClick={() => remove(item)} title="Видалити"><Trash2 size={15}/></button>
              </div>
            </article>
          })}
        </div>}
    </section>

    {editorOpen && <div className="service-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
      <aside className="service-editor-drawer">
        <header className="service-editor-header">
          <div className="service-editor-title-icon"><ServiceIcon name={form.icon} size={24}/></div>
          <div><small>{editing ? `ПОСЛУГА #${editing.id}` : 'НОВА ПОСЛУГА'}</small><h2>{form.title || 'Без назви'}</h2><p>{editing ? 'Зміни відобразяться на публічній сторінці після збереження.' : 'Створи зрозумілу пропозицію для потенційного клієнта.'}</p></div>
          <button type="button" className="service-editor-close" onClick={closeEditor}><X size={20}/></button>
        </header>

        <div className="service-editor-health">
          <div className="service-editor-progress"><span style={{ width: `${completion}%` }}/></div><strong>{completion}%</strong><small>готовності</small><ServiceStatus active={form.is_active}/>
        </div>

        <nav className="service-editor-tabs">
          {tabs.map(({ key, label, icon: Icon, description }) => <button key={key} type="button" className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}><Icon size={17}/><span><strong>{label}</strong><small>{description}</small></span><ArrowRight size={14}/></button>)}
        </nav>

        <div className="service-editor-content">
          <section className="service-editor-form-card">
            <header className="service-editor-section-head"><span>КРОК {String(tabs.findIndex((tab) => tab.key === activeTab) + 1).padStart(2, '0')}</span><h3>{tabs.find((tab) => tab.key === activeTab)?.label}</h3><p>{tabs.find((tab) => tab.key === activeTab)?.description}</p></header>
            <div className={`admin-form service-editor-form is-${activeTab}`}>
              {currentFields.map((spec) => spec[0] === 'icon'
                ? <div className="field" key="icon"><label>Іконка</label><AdminSelect value={form.icon} onChange={(value) => update('icon', value)} options={iconOptions}/></div>
                : <AdminField key={spec[0]} spec={spec} value={form[spec[0]]} onChange={update}/>)}
            </div>
            {activeTab === 'publish' && <div className="service-editor-publish-note"><Settings2/><div><strong>Порядок визначає позицію на сайті</strong><p>Менше число показує послугу вище. Прихована послуга лишається в адмінці, але клієнти її не бачать.</p></div></div>}
          </section>

          <aside className="service-editor-preview">
            <div className="service-editor-preview-head"><span><Eye size={14}/> LIVE PREVIEW</span><a href="/services" target="_blank" rel="noreferrer">Сторінка <ArrowRight size={13}/></a></div>
            <article className="service-preview-card">
              <div className="service-preview-symbol"><ServiceIcon name={form.icon} size={30}/><i/><i/></div>
              <div className="service-preview-badges"><span>{form.complexity || 'Стандартна'}</span><span>{form.duration || 'строк після оцінки'}</span></div>
              <h3>{form.title || 'Назва послуги'}</h3>
              <p>{form.summary || 'Коротко поясни, який результат отримає клієнт.'}</p>
              <div className="service-preview-features">{normalizeArray(form.features).slice(0, 4).map((feature) => <span key={feature}><Check size={13}/>{feature}</span>)}{!normalizeArray(form.features).length && <span className="is-placeholder"><Check size={13}/>Основна перевага послуги</span>}</div>
              <footer><div><small>Вартість від</small><strong>{priceLabel(form.price_from_uah)}</strong></div><button type="button">Обговорити <ArrowRight size={14}/></button></footer>
            </article>

            <div className="service-editor-checklist"><h4>Готовність до публікації</h4>{checks.map(([label, done]) => <div key={label} className={done ? 'done' : ''}>{done ? <CheckCircle2 size={15}/> : <CircleAlert size={15}/>}<span>{label}</span></div>)}</div>

            <div className="service-editor-quick-status"><h4>Швидка видимість</h4><p>Можна змінити ще до збереження всіх інших полів.</p><div><button type="button" className={form.is_active !== false ? 'active' : ''} onClick={() => update('is_active', true)}><Eye size={14}/> Активна</button><button type="button" className={form.is_active === false ? 'active' : ''} onClick={() => update('is_active', false)}><EyeOff size={14}/> Прихована</button></div></div>
          </aside>
        </div>
      </aside>
      <AdminSaveDock visible={dirty} dirty={dirty} saving={saving} onSave={save} onCancel={() => setForm({ ...baseline })} title={editing ? 'Послугу змінено' : 'Нова послуга не збережена'} description="Перевір preview та збережи зміни." placement="drawer"/>
    </div>}
  </main>
}
