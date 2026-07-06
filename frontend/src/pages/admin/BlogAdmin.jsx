import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlignLeft, CalendarClock, Check, CheckCircle2, ChevronRight, Clock3, Copy,
  Eye, FileText, Grid2X2, Image as ImageIcon, LayoutList, Link2, ListChecks,
  Monitor, MoreHorizontal, Newspaper, Pencil, Plus, RefreshCw, Rocket, Search,
  SearchCheck, Send, Smartphone, Sparkles, Star, Trash2, Type, X,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import ImageCropUploader from '../../components/admin/ImageCropUploader'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'
import '../../styles/secondary-base.css'
import '../../styles/blog.css'

const endpoint = '/posts/'
const statusOptions = [
  ['all', 'Усі статуси'],
  ['published', 'Опубліковані'],
  ['scheduled', 'Заплановані'],
  ['draft', 'Чернетки'],
]
const statusLabels = { published: 'Опубліковано', scheduled: 'Заплановано', draft: 'Чернетка' }
const sortOptions = [
  ['updated', 'Нещодавно змінені'],
  ['published', 'За датою публікації'],
  ['title', 'За назвою'],
  ['read', 'За часом читання'],
]
const editorTabs = [
  { key: 'base', label: 'Основне', icon: Type, hint: 'Назва, рубрика та анонс' },
  { key: 'content', label: 'Стаття', icon: AlignLeft, hint: 'Текст і структура матеріалу' },
  { key: 'media', label: 'Обкладинка', icon: ImageIcon, hint: 'Фото та зовнішній URL' },
  { key: 'seo', label: 'SEO', icon: SearchCheck, hint: 'Пошукова видача й метадані' },
  { key: 'publish', label: 'Публікація', icon: Send, hint: 'Статус, дата та featured' },
]

const emptyPost = () => ({
  title: '', slug: '', category: 'Практика', excerpt: '', content: '',
  cover_image_url: '', seo_title: '', seo_description: '', is_featured: false,
  status: 'draft', published_at: '',
})

const rawCover = (post) => post?.uploaded_cover_url || post?.cover_image_url || ''
const getCover = (post) => rawCover(post) || '/assets/blog-automation.svg'
const words = (value = '') => value.trim() ? value.trim().split(/\s+/).length : 0
const readTime = (value = '') => Math.max(2, Math.ceil(words(value) / 180))
const headingsCount = (value = '') => value.split('\n').filter((line) => /^##\s/.test(line.trim())).length
const completion = (post) => {
  const checks = [post.title, post.slug, post.category, post.excerpt, words(post.content) >= 120, headingsCount(post.content), rawCover(post), post.seo_title || post.title, post.seo_description || post.excerpt]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}
const formatDate = (value, withTime = false) => {
  if (!value) return 'Без дати'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Без дати'
  return date.toLocaleDateString('uk-UA', withTime ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' })
}
const toLocalInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
const toApiDate = (value) => value ? new Date(value).toISOString() : null
const makeSlug = (value = '') => value.toLowerCase().trim().replace(/[’']/g, '').replace(/[^a-zа-яіїєґ0-9]+/gi, '-').replace(/^-|-$/g, '')

function ArticleBody({ content = '' }) {
  return content.split('\n').filter((line) => line.trim()).map((line, index) => {
    const value = line.trim()
    if (value.startsWith('## ')) return <h2 key={index}>{value.slice(3)}</h2>
    if (value.startsWith('### ')) return <h3 key={index}>{value.slice(4)}</h3>
    return <p key={index}>{value}</p>
  })
}

function StatusBadge({ status }) {
  const Icon = status === 'published' ? CheckCircle2 : status === 'scheduled' ? CalendarClock : FileText
  return <span className={`blog-admin-status is-${status || 'draft'}`}><Icon size={13}/>{statusLabels[status] || 'Чернетка'}</span>
}

function ExactBlogPreview({ post, mode, device }) {
  const cover = getCover(post)
  if (mode === 'card') {
    return <div className={`blog-exact-preview is-card is-${device}`}>
      <div className="blog-preview-card-frame">
        <article className="blog-card-modern">
          <div><img src={cover} alt=""/><span>01</span></div>
          <div className="blog-meta"><span>{post.category || 'Практика'}</span><span>{readTime(post.content)} хв</span></div>
          <h3>{post.title || 'Назва нової статті'}</h3>
          <p>{post.excerpt || 'Короткий опис пояснить читачеві, що саме він отримає з цього матеріалу.'}</p>
          <strong>Читати <ChevronRight size={17}/></strong>
        </article>
      </div>
    </div>
  }
  return <div className={`blog-exact-preview is-article is-${device}`}>
    <div className="blog-preview-article-viewport">
      <div className="blog-preview-article-canvas blog-detail-page modern-page">
        <section className="article-hero">
          <div className="container-shell article-hero-inner">
            <div className="article-meta"><span>{post.category || 'Практика'}</span><span><Clock3 size={15}/> {readTime(post.content)} хв читання</span></div>
            <h1>{post.title || 'Назва нової статті'}</h1>
            <p>{post.excerpt || 'Короткий опис статті з’явиться тут.'}</p>
            <div className="article-author-row"><div className="article-author"><i>DK</i><span><strong>Дмитро Ковтунович</strong><small>Full-stack developer</small></span></div></div>
          </div>
        </section>
        <section className="article-cover-section"><div className="container-shell"><div className="article-cover"><img src={cover} alt=""/><span><Sparkles size={17}/> Практичний матеріал</span></div></div></section>
        <section className="modern-section article-body-section"><div className="container-shell article-layout">
          <aside className="article-aside"><span>У цій статті</span><nav>{post.content.split('\n').filter((line) => /^##\s/.test(line.trim())).slice(0, 5).map((line, index) => <a key={index}>{line.trim().slice(3)}</a>)}</nav></aside>
          <article className="article-content"><div className="article-lead-box"><span>Головна думка</span><p>{post.excerpt || 'Анонс матеріалу'}</p></div><ArticleBody content={post.content || 'Почни писати статтю — preview оновиться одразу.'}/></article>
        </div></section>
      </div>
    </div>
  </div>
}

export default function BlogAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [viewMode, setViewMode] = useState('grid')
  const [selected, setSelected] = useState(() => new Set())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyPost)
  const [baseline, setBaseline] = useState(emptyPost)
  const [activeTab, setActiveTab] = useState('base')
  const [previewMode, setPreviewMode] = useState('card')
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [saving, setSaving] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const contentRef = useRef(null)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const response = await api.get(endpoint)
      const data = unwrap(response) || []
      setItems(Array.isArray(data) ? data : [])
    } catch { notify('Не вдалося завантажити статті.', { type: 'error' }) }
    finally { if (!quiet) setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!editorOpen) return undefined
    document.body.classList.add('blog-editor-open')
    return () => document.body.classList.remove('blog-editor-open')
  }, [editorOpen])

  const categories = useMemo(() => [...new Set(items.map((item) => item.category || 'Практика'))].sort((a, b) => a.localeCompare(b, 'uk')), [items])
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return items.filter((item) => {
      if (search && !`${item.title || ''} ${item.excerpt || ''} ${item.category || ''} ${item.content || ''}`.toLowerCase().includes(search)) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (categoryFilter !== 'all' && (item.category || 'Практика') !== categoryFilter) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'uk')
      if (sortBy === 'published') return new Date(b.published_at || 0) - new Date(a.published_at || 0)
      if (sortBy === 'read') return readTime(b.content) - readTime(a.content)
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
    })
  }, [items, query, statusFilter, categoryFilter, sortBy])

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((item) => item.status === 'published').length,
    scheduled: items.filter((item) => item.status === 'scheduled').length,
    drafts: items.filter((item) => item.status === 'draft').length,
    words: items.reduce((sum, item) => sum + words(item.content), 0),
  }), [items])
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id))
  const formCompletion = completion(form)

  const canLeave = async () => !editorOpen || !dirty || confirm({
    title: 'Закрити редактор без збереження?',
    description: 'Зміни в поточній статті буде втрачено.',
    confirmLabel: 'Закрити без збереження', tone: 'danger',
  })
  const openNew = async () => {
    if (!(await canLeave())) return
    const initial = emptyPost()
    setEditing(null); setForm(initial); setBaseline(initial); setActiveTab('base'); setPreviewMode('card'); setEditorOpen(true)
  }
  const openEdit = async (item, tab = 'base') => {
    if (!(await canLeave())) return
    const normalized = { ...emptyPost(), ...item, published_at: toLocalInput(item.published_at) }
    setEditing(item); setForm(normalized); setBaseline(normalized); setActiveTab(tab); setPreviewMode('card'); setEditorOpen(true)
  }
  const closeEditor = async () => {
    if (!(await canLeave())) return
    setForm({ ...baseline }); setEditorOpen(false)
  }
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const save = async () => {
    if (!form.title.trim()) { setActiveTab('base'); return notify('Додай назву статті.', { type: 'warning' }) }
    if (!form.slug.trim()) { setActiveTab('base'); return notify('Додай slug або згенеруй його з назви.', { type: 'warning' }) }
    if (form.status === 'scheduled' && !form.published_at) { setActiveTab('publish'); return notify('Для запланованої статті потрібна дата публікації.', { type: 'warning' }) }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(), slug: form.slug.trim(), category: form.category.trim() || 'Практика', excerpt: form.excerpt.trim(), content: form.content,
        cover_image_url: form.cover_image_url.trim(), seo_title: form.seo_title.trim(), seo_description: form.seo_description.trim(),
        is_featured: Boolean(form.is_featured), status: form.status, published_at: toApiDate(form.published_at),
      }
      if (payload.is_featured) {
        await Promise.all(items.filter((item) => item.is_featured && item.id !== editing?.id).map((item) => api.patch(`${endpoint}${item.slug}/`, { is_featured: false })))
      }
      const response = editing ? await api.patch(`${endpoint}${editing.slug}/`, payload) : await api.post(endpoint, payload)
      const saved = unwrap(response)
      const normalized = { ...emptyPost(), ...saved, published_at: toLocalInput(saved.published_at) }
      setEditing(saved); setForm(normalized); setBaseline(normalized)
      await load({ quiet: true })
      notify(editing ? 'Статтю оновлено.' : 'Статтю створено. Тепер можна завантажити обкладинку.')
    } catch (error) {
      const details = error.response?.data
      const message = typeof details === 'object' ? Object.values(details).flat().join(' ') : error.message
      notify(message || 'Не вдалося зберегти статтю.', { type: 'error', duration: 5200 })
    } finally { setSaving(false) }
  }

  const remove = async (item) => {
    const accepted = await confirm({ title: `Видалити «${item.title}»?`, description: 'Стаття буде переміщена до кошика.', confirmLabel: 'Перемістити до кошика', tone: 'danger' })
    if (!accepted) return
    try {
      await api.delete(`${endpoint}${item.slug}/`)
      if (editing?.id === item.id) setEditorOpen(false)
      setSelected((current) => { const next = new Set(current); next.delete(item.id); return next })
      await load({ quiet: true }); notify('Статтю переміщено до кошика.', { type: 'warning' })
    } catch { notify('Не вдалося видалити статтю.', { type: 'error' }) }
  }
  const quickPatch = async (item, patch, message) => {
    try {
      if (patch.is_featured) await Promise.all(items.filter((entry) => entry.is_featured && entry.id !== item.id).map((entry) => api.patch(`${endpoint}${entry.slug}/`, { is_featured: false })))
      const response = await api.patch(`${endpoint}${item.slug}/`, patch)
      const saved = unwrap(response)
      setItems((current) => current.map((entry) => entry.id === item.id ? saved : patch.is_featured ? { ...entry, is_featured: false } : entry))
      notify(message)
    } catch { notify('Не вдалося оновити статтю.', { type: 'error' }) }
  }
  const duplicate = async (item) => {
    const accepted = await confirm({ title: `Створити копію «${item.title}»?`, description: 'Копія відкриється як чернетка.', confirmLabel: 'Створити копію' })
    if (!accepted) return
    try {
      const payload = { title: `${item.title} — копія`, slug: `${item.slug}-copy-${String(Date.now()).slice(-5)}`, category: item.category || 'Практика', excerpt: item.excerpt, content: item.content, cover_image_url: item.cover_image_url || '', seo_title: '', seo_description: '', is_featured: false, status: 'draft', published_at: null }
      const response = await api.post(endpoint, payload)
      const saved = unwrap(response); await load({ quiet: true }); notify('Копію створено.'); await openEdit(saved)
    } catch { notify('Не вдалося створити копію.', { type: 'error' }) }
  }

  const toggleSelected = (id) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleAll = () => setSelected((current) => { const next = new Set(current); allVisibleSelected ? filtered.forEach((item) => next.delete(item.id)) : filtered.forEach((item) => next.add(item.id)); return next })
  const bulkPatch = async (patch, message) => {
    const targets = items.filter((item) => selected.has(item.id)); if (!targets.length) return
    setBulkBusy(true)
    try { await Promise.all(targets.map((item) => api.patch(`${endpoint}${item.slug}/`, patch))); await load({ quiet: true }); setSelected(new Set()); notify(message) }
    catch { notify('Частину статей не вдалося оновити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }
  const bulkDelete = async () => {
    const targets = items.filter((item) => selected.has(item.id)); if (!targets.length) return
    const accepted = await confirm({ title: `Видалити вибрані статті (${targets.length})?`, description: 'Матеріали буде переміщено до кошика.', confirmLabel: 'Видалити вибрані', tone: 'danger' })
    if (!accepted) return
    setBulkBusy(true)
    try { await Promise.all(targets.map((item) => api.delete(`${endpoint}${item.slug}/`))); await load({ quiet: true }); setSelected(new Set()); notify('Статті переміщено до кошика.', { type: 'warning' }) }
    catch { notify('Частину статей не вдалося видалити.', { type: 'error' }) }
    finally { setBulkBusy(false) }
  }
  const clearFilters = () => { setQuery(''); setStatusFilter('all'); setCategoryFilter('all') }
  const insertContent = (prefix) => {
    const textarea = contentRef.current
    if (!textarea) return
    const start = textarea.selectionStart; const end = textarea.selectionEnd
    const selectedText = form.content.slice(start, end) || (prefix === '## ' ? 'Новий розділ' : prefix === '### ' ? 'Підзаголовок' : 'Новий абзац')
    const before = form.content.slice(0, start); const after = form.content.slice(end)
    const spacer = before && !before.endsWith('\n') ? '\n\n' : ''
    const next = `${before}${spacer}${prefix}${selectedText}\n\n${after}`
    update('content', next)
    requestAnimationFrame(() => { const position = before.length + spacer.length + prefix.length + selectedText.length; textarea.focus(); textarea.setSelectionRange(position, position) })
  }

  return <div className="blog-admin-page">
    <header className="blog-admin-topbar">
      <div><span><Newspaper size={15}/> РЕДАКЦІЙНИЙ ЦЕНТР</span><h1>Блог</h1><p>Пиши, плануй і публікуй матеріали без хаосу.</p></div>
      <div><a className="btn btn-light" href="/blog" target="_blank" rel="noreferrer"><Eye size={16}/> Відкрити блог</a><button className="btn btn-dark" onClick={openNew}><Plus size={17}/> Нова стаття</button></div>
    </header>

    <section className="blog-admin-summary">
      <button onClick={clearFilters}><span><Newspaper size={18}/></span><strong>{stats.total}</strong><small>Усі матеріали</small></button>
      <button onClick={() => { clearFilters(); setStatusFilter('published') }}><span><Rocket size={18}/></span><strong>{stats.published}</strong><small>Опубліковано</small></button>
      <button onClick={() => { clearFilters(); setStatusFilter('scheduled') }}><span><CalendarClock size={18}/></span><strong>{stats.scheduled}</strong><small>Заплановано</small></button>
      <button onClick={() => { clearFilters(); setStatusFilter('draft') }}><span><FileText size={18}/></span><strong>{stats.drafts}</strong><small>Чернетки</small></button>
      <div><span><AlignLeft size={18}/></span><strong>{stats.words.toLocaleString('uk-UA')}</strong><small>Слів написано</small></div>
    </section>

    <section className="blog-admin-workspace">
      <div className="blog-admin-workspace-head"><div><span>БІБЛІОТЕКА МАТЕРІАЛІВ</span><h2>Статті</h2><p>Швидко знайди матеріал, зміни статус або відкрий повний редактор.</p></div><button className="icon-btn" onClick={() => load()} title="Оновити"><RefreshCw size={18}/></button></div>
      <div className="blog-admin-toolbar">
        <label className="blog-admin-search"><Search size={19}/><span><small>Пошук</small><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва, текст, рубрика…"/></span>{query && <button onClick={() => setQuery('')} aria-label="Очистити"><X size={16}/></button>}<b>{filtered.length}</b></label>
        <AdminSelect compact value={statusFilter} onChange={setStatusFilter} options={statusOptions}/>
        <AdminSelect compact value={categoryFilter} onChange={setCategoryFilter} options={[['all', 'Усі рубрики'], ...categories.map((category) => [category, category])]}/>
        <AdminSelect compact value={sortBy} onChange={setSortBy} options={sortOptions}/>
        <div className="blog-admin-view-toggle"><button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={17}/></button><button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><LayoutList size={18}/></button></div>
      </div>
      <div className="blog-admin-selection"><label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}/><span>{selected.size ? `Вибрано: ${selected.size}` : `Показано ${filtered.length} із ${items.length}`}</span></label>{(query || statusFilter !== 'all' || categoryFilter !== 'all') && <button onClick={clearFilters}><X size={14}/> Скинути фільтри</button>}</div>
      {selected.size > 0 && <div className="blog-admin-bulk"><div><Check size={16}/><strong>{selected.size}</strong><span>вибрано</span></div><div><button disabled={bulkBusy} onClick={() => bulkPatch({ status: 'published', published_at: new Date().toISOString() }, 'Статті опубліковано.')}><Rocket size={15}/> Опублікувати</button><button disabled={bulkBusy} onClick={() => bulkPatch({ status: 'draft' }, 'Статті переведено в чернетки.')}><FileText size={15}/> У чернетки</button><button className="danger" disabled={bulkBusy} onClick={bulkDelete}><Trash2 size={15}/> Видалити</button><button className="icon" onClick={() => setSelected(new Set())}><X size={16}/></button></div></div>}

      {loading ? <div className="blog-admin-loading"><i/><span>Завантаження статей…</span></div> : filtered.length ? <div className={`blog-admin-collection is-${viewMode}`}>{filtered.map((item) => <article key={item.id} className={`blog-admin-card ${selected.has(item.id) ? 'is-selected' : ''}`}>
        <div className="blog-admin-card-media" onClick={() => openEdit(item, 'media')}><img src={getCover(item)} alt=""/><div className="blog-admin-card-top"><label onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelected(item.id)}/><span><Check size={13}/></span></label><div>{item.is_featured && <span className="blog-admin-featured"><Star size={12}/> Головна</span>}<StatusBadge status={item.status}/></div></div><div className="blog-admin-card-progress"><span style={{ width: `${completion(item)}%` }}/><small>{completion(item)}%</small></div></div>
        <div className="blog-admin-card-body"><div className="blog-admin-card-meta"><span>{item.category || 'Практика'}</span><i/><span><Clock3 size={13}/> {readTime(item.content)} хв</span><i/><span>{words(item.content)} слів</span></div><button className="blog-admin-card-title" onClick={() => openEdit(item)}><strong>{item.title || 'Без назви'}</strong><Pencil size={15}/></button><p>{item.excerpt || 'Анонс ще не додано.'}</p><div className="blog-admin-card-date"><CalendarClock size={14}/><span>{item.status === 'scheduled' ? 'Заплановано: ' : item.status === 'published' ? 'Опубліковано: ' : 'Оновлено: '}{formatDate(item.status === 'draft' ? item.updated_at : item.published_at, true)}</span></div></div>
        <footer className="blog-admin-card-actions"><div><button onClick={() => quickPatch(item, { status: item.status === 'published' ? 'draft' : 'published', published_at: item.status === 'published' ? item.published_at : new Date().toISOString() }, item.status === 'published' ? 'Статтю повернено в чернетки.' : 'Статтю опубліковано.')} title={item.status === 'published' ? 'У чернетки' : 'Опублікувати'}>{item.status === 'published' ? <FileText size={16}/> : <Rocket size={16}/>}</button><button onClick={() => quickPatch(item, { is_featured: !item.is_featured }, item.is_featured ? 'Статтю прибрано з головної позиції.' : 'Статтю зроблено головною.')} title="Головна стаття"><Star size={16} fill={item.is_featured ? 'currentColor' : 'none'}/></button><button onClick={() => duplicate(item)} title="Дублювати"><Copy size={16}/></button></div><div>{item.status !== 'draft' && <a href={`/blog/${item.slug}`} target="_blank" rel="noreferrer" title="Переглянути"><Eye size={16}/></a>}<button onClick={() => openEdit(item)} title="Редагувати"><Pencil size={16}/></button><button className="danger" onClick={() => remove(item)} title="Видалити"><Trash2 size={16}/></button></div></footer>
      </article>)}</div> : <div className="blog-admin-empty"><Search size={28}/><h3>Матеріалів не знайдено</h3><p>Зміни запит або скинь активні фільтри.</p><button className="btn btn-light" onClick={clearFilters}>Скинути фільтри</button></div>}
    </section>

    {editorOpen && <div className="blog-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}><aside className="blog-editor-drawer" role="dialog" aria-modal="true">
      <header className="blog-editor-header"><div><span>{editing ? `ARTICLE #${editing.id}` : 'NEW ARTICLE'}</span><h2>{form.title || 'Нова стаття'}</h2><p>{editing ? `Оновлено ${formatDate(editing.updated_at, true)}` : 'Створи основу матеріалу й одразу перевір вигляд на сайті.'}</p></div><button onClick={closeEditor}><X size={20}/></button></header>
      <div className="blog-editor-health"><div className="blog-editor-ring" style={{ '--progress': `${formCompletion * 3.6}deg` }}><span>{formCompletion}%</span></div><div><strong>{formCompletion >= 90 ? 'Матеріал готовий до публікації' : formCompletion >= 60 ? 'Залишилось кілька деталей' : 'Заповни основу статті'}</strong><small>{words(form.content)} слів · {readTime(form.content)} хв · {headingsCount(form.content)} розділів</small></div><StatusBadge status={form.status}/></div>
      <nav className="blog-editor-tabs">{editorTabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}><Icon size={17}/><span><strong>{tab.label}</strong><small>{tab.hint}</small></span></button> })}</nav>
      <div className="blog-editor-content"><section className="blog-editor-form">
        {activeTab === 'base' && <><div className="blog-editor-section-title"><span>ОСНОВА МАТЕРІАЛУ</span><h3>Назва, рубрика та анонс</h3></div><div className="blog-editor-grid"><label className="wide"><span>Назва статті <b>{form.title.length}/220</b></span><input value={form.title} maxLength={220} onChange={(e) => update('title', e.target.value)} placeholder="Наприклад: Як автоматизувати заявки з сайту"/></label><label><span>Рубрика</span><input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Практика"/></label><label><span>Slug</span><div className="blog-slug-input"><input value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="yak-avtomatyzuvaty-zayavky"/><button type="button" onClick={() => update('slug', makeSlug(form.title))}>Згенерувати</button></div></label><label className="wide"><span>Короткий анонс <b>{form.excerpt.length}/320</b></span><textarea value={form.excerpt} maxLength={320} onChange={(e) => update('excerpt', e.target.value)} placeholder="Два-три речення, які пояснюють користь статті."/></label></div></>}
        {activeTab === 'content' && <><div className="blog-editor-section-title"><span>РЕДАКТОР СТАТТІ</span><h3>Побудуй зрозумілу структуру</h3></div><div className="blog-writing-toolbar"><button onClick={() => insertContent('## ')}><Type size={15}/> Розділ H2</button><button onClick={() => insertContent('### ')}><Type size={14}/> Підзаголовок H3</button><button onClick={() => insertContent('')}><AlignLeft size={15}/> Абзац</button><span>{words(form.content)} слів · {readTime(form.content)} хв</span></div><textarea ref={contentRef} className="blog-content-editor" value={form.content} onChange={(e) => update('content', e.target.value)} placeholder={'Почни з короткого вступу.\n\n## Перший розділ\n\nОсновний текст…'}/><div className="blog-writing-tips"><ListChecks size={19}/><div><strong>Зручний формат для сайту</strong><p>Починай розділ з <code>##</code>, підзаголовок — з <code>###</code>. Звичайні рядки перетворюються на абзаци.</p></div></div></>}
        {activeTab === 'media' && <><div className="blog-editor-section-title"><span>МЕДІА</span><h3>Обкладинка матеріалу</h3></div><label className="blog-editor-single-field"><span>Зовнішній URL обкладинки</span><input value={form.cover_image_url} onChange={(e) => update('cover_image_url', e.target.value)} placeholder="https://… або /assets/…"/></label>{editing ? <ImageCropUploader title="Завантажена обкладинка" hint="Використовується у списку блогу, пошуку та на сторінці статті. Рекомендоване співвідношення 16:10." currentUrl={editing.uploaded_cover_url} uploadUrl={`${endpoint}${editing.slug}/upload_cover/`} removeUrl={`${endpoint}${editing.slug}/remove_cover/`} aspect={16 / 10} onUploaded={(data) => { const normalized = { ...emptyPost(), ...data, published_at: toLocalInput(data.published_at) }; setEditing(data); setForm(normalized); setBaseline(normalized); load({ quiet: true }) }}/>: <div className="blog-save-first"><ImageIcon size={25}/><div><strong>Спочатку створи статтю</strong><p>Після першого збереження тут з’явиться завантаження й обрізання обкладинки.</p></div></div>}</>}
        {activeTab === 'seo' && <><div className="blog-editor-section-title"><span>ПОШУКОВА ВИДАЧА</span><h3>SEO без окремих технічних сторінок</h3></div><div className="blog-editor-grid"><label className="wide"><span>SEO title <b>{form.seo_title.length}/60 рекомендовано</b></span><input value={form.seo_title} onChange={(e) => update('seo_title', e.target.value)} placeholder={form.title || 'Назва для Google'}/></label><label className="wide"><span>SEO description <b>{form.seo_description.length}/160 рекомендовано</b></span><textarea value={form.seo_description} onChange={(e) => update('seo_description', e.target.value)} placeholder={form.excerpt || 'Опис для пошукової видачі'}/></label></div><div className="blog-google-preview"><small>dmytro.dev › blog › {form.slug || 'slug-statti'}</small><strong>{form.seo_title || form.title || 'Назва статті для Google'}</strong><p>{form.seo_description || form.excerpt || 'Короткий опис сторінки з’явиться у результатах пошуку.'}</p></div></>}
        {activeTab === 'publish' && <><div className="blog-editor-section-title"><span>ПУБЛІКАЦІЯ</span><h3>Коли й де показувати матеріал</h3></div><div className="blog-publish-statuses">{['draft','scheduled','published'].map((status) => <button key={status} className={form.status === status ? 'active' : ''} onClick={() => update('status', status)}><StatusBadge status={status}/><small>{status === 'draft' ? 'Видно лише в адмінці' : status === 'scheduled' ? 'З’явиться у вибраний час' : 'Доступно всім відвідувачам'}</small></button>)}</div><label className="blog-editor-single-field"><span>{form.status === 'scheduled' ? 'Дата й час автоматичної публікації' : 'Дата публікації'}</span><input type="datetime-local" value={form.published_at} onChange={(e) => update('published_at', e.target.value)}/></label><label className="blog-featured-toggle"><input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)}/><span><Star size={18}/><strong>Головна стаття блогу</strong><small>Матеріал стане великою першою карткою у списку. Попередня головна стаття вимкнеться автоматично.</small></span></label></>}
      </section>
      <aside className="blog-editor-preview-panel"><div className="blog-preview-toolbar"><span><Sparkles size={14}/> ТОЧНИЙ PREVIEW САЙТУ</span><div><button className={previewMode === 'card' ? 'active' : ''} onClick={() => setPreviewMode('card')}><Grid2X2 size={15}/> Картка</button><button className={previewMode === 'article' ? 'active' : ''} onClick={() => setPreviewMode('article')}><FileText size={15}/> Стаття</button><i/><button className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')}><Monitor size={16}/></button><button className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}><Smartphone size={16}/></button></div></div><ExactBlogPreview post={form} mode={previewMode} device={previewDevice}/><div className="blog-editor-checklist"><h4>Готовність матеріалу</h4>{[['Назва й slug', form.title && form.slug], ['Анонс', form.excerpt.length >= 80], ['Основний текст від 120 слів', words(form.content) >= 120], ['Хоча б один розділ H2', headingsCount(form.content) >= 1], ['Обкладинка', rawCover(form)], ['SEO title та description', (form.seo_title || form.title) && (form.seo_description || form.excerpt)]].map(([label, done]) => <div key={label} className={done ? 'done' : ''}>{done ? <Check size={14}/> : <MoreHorizontal size={14}/>}<span>{label}</span></div>)}</div>{editing && <a className="blog-editor-public-link" href={`/blog/${editing.slug}`} target="_blank" rel="noreferrer"><Link2 size={16}/> Відкрити сторінку статті <ChevronRight size={15}/></a>}</aside>
      </div>
    </aside><AdminSaveDock placement="drawer" dirty={dirty} saving={saving} onSave={save} onCancel={() => setForm({ ...baseline })} title={editing ? 'Стаття має незбережені зміни' : 'Нова стаття ще не створена'} description="Збережи матеріал або поверни останню версію." saveLabel={editing ? 'Зберегти статтю' : 'Створити статтю'}/></div>}
  </div>
}
