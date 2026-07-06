import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowUp, BadgeCheck, CalendarDays, Check, CheckCircle2, ChevronDown,
  CircleDollarSign, Clock3, Copy, Eye, EyeOff, FileBadge2, FileText, Grid2X2,
  HelpCircle, Link2, List, Loader2, MessageSquareQuote, MoreHorizontal, Pencil,
  Plus, RefreshCw, Search, Sparkles, Star, Trash2, UsersRound, X
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'
import { emptyFor, parsePayload, resources } from './resources'

const profiles = {
  pricing: {
    label: 'Тарифи', singular: 'тариф', eyebrow: 'Комерційні пропозиції', icon: CircleDollarSign,
    endpoint: '/pricing/', description: 'Керуй пакетами, цінами та наповненням без довгих таблиць.',
    searchPlaceholder: 'Знайти тариф за назвою, описом або наповненням…',
    search: (item) => [item.title, item.tagline, item.duration, item.complexity_note, ...(item.features || [])],
    filters: [['all','Усі тарифи'],['active','Активні'],['inactive','Приховані'],['highlighted','Рекомендовані']],
    filter: (item, value) => value === 'all' || (value === 'active' && item.is_active) || (value === 'inactive' && !item.is_active) || (value === 'highlighted' && item.highlighted),
    sorts: [['order','Порядок на сайті'],['price-asc','Ціна: від меншої'],['price-desc','Ціна: від більшої'],['title','За назвою']],
    groups: [
      { id:'main', label:'Основне', fields:['title','tagline','price_uah','duration'] },
      { id:'content', label:'Наповнення', fields:['features','complexity_note'] },
      { id:'publish', label:'Публікація', fields:['highlighted','is_active','order'] },
    ],
    initial: { is_active: true, highlighted: false, features: [], order: 0 },
  },
  testimonials: {
    label: 'Відгуки', singular: 'відгук', eyebrow: 'Соціальний доказ', icon: MessageSquareQuote,
    endpoint: '/testimonials/', description: 'Збирай, перевіряй і публікуй відгуки клієнтів у зрозумілому потоці.',
    searchPlaceholder: 'Пошук за автором, компанією або текстом відгуку…',
    search: (item) => [item.author, item.role, item.company, item.text, item.project_title],
    filters: [['all','Усі відгуки'],['published','Опубліковані'],['pending','Очікують перевірки'],['verified','Підтверджені'],['hidden','Приховані']],
    filter: (item, value) => value === 'all' || (value === 'published' && item.is_active && item.is_published) || (value === 'pending' && !item.is_verified) || (value === 'verified' && item.is_verified) || (value === 'hidden' && (!item.is_active || !item.is_published)),
    sorts: [['order','Порядок на сайті'],['author','За автором'],['company','За компанією'],['verified','Спочатку підтверджені']],
    groups: [
      { id:'person', label:'Клієнт', fields:['author','role','company','photo_url','project'] },
      { id:'review', label:'Відгук', fields:['text'] },
      { id:'publish', label:'Перевірка', fields:['is_verified','is_published','is_active','order'] },
    ],
    initial: { is_active: true, is_verified: false, is_published: false, project: null, order: 0 },
  },
  faqs: {
    label: 'FAQ', singular: 'питання', eyebrow: 'База відповідей', icon: HelpCircle,
    endpoint: '/faqs/', description: 'Організуй часті питання за категоріями та швидко керуй видимістю.',
    searchPlaceholder: 'Знайти питання, відповідь або категорію…',
    search: (item) => [item.question, item.answer, item.category],
    filters: [['all','Усі питання'],['active','Активні'],['inactive','Приховані']],
    filter: (item, value) => value === 'all' || (value === 'active' && item.is_active) || (value === 'inactive' && !item.is_active),
    sorts: [['order','Порядок на сайті'],['question','За питанням'],['category','За категорією']],
    groups: [
      { id:'content', label:'Питання й відповідь', fields:['question','answer'] },
      { id:'organize', label:'Організація', fields:['category','is_active','order'] },
    ],
    initial: { is_active: true, category: 'Загальне', order: 0 },
  },
  certificates: {
    label: 'Документи', singular: 'документ', eyebrow: 'Сертифікати й підтвердження', icon: FileBadge2,
    endpoint: '/certificates/', description: 'Зберігай сертифікати, дипломи й майбутні документи в одному каталозі.',
    searchPlaceholder: 'Пошук за назвою, закладом або описом…',
    search: (item) => [item.title, item.issuer, item.description, item.file_url],
    filters: [['all','Усі документи'],['ready','Готові'],['expected','Очікуються'],['hidden','Приховані']],
    filter: (item, value) => value === 'all' || (value === 'ready' && item.is_ready && item.is_active) || (value === 'expected' && !item.is_ready) || (value === 'hidden' && !item.is_active),
    sorts: [['order','Порядок на сайті'],['date','За датою'],['title','За назвою'],['issuer','За закладом']],
    groups: [
      { id:'main', label:'Документ', fields:['title','issuer','description'] },
      { id:'file', label:'Файл і дата', fields:['file_url','expected_date'] },
      { id:'publish', label:'Публікація', fields:['is_ready','is_active','order'] },
    ],
    initial: { is_active: true, is_ready: false, order: 0 },
  },
}

const fieldMap = Object.fromEntries(Object.values(resources).flatMap((resource) => resource.fields).map((field) => [field[0], field]))

function normalizeText(value) {
  return String(value ?? '').toLocaleLowerCase('uk-UA')
}

function completeness(resourceKey, item) {
  const required = {
    pricing: ['title','tagline','price_uah','duration','features'],
    testimonials: ['author','text','company'],
    faqs: ['question','answer','category'],
    certificates: ['title','issuer','description','file_url'],
  }[resourceKey]
  const filled = required.filter((key) => Array.isArray(item[key]) ? item[key].length : Boolean(item[key])).length
  return Math.round((filled / required.length) * 100)
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uk-UA')} грн`
}

function statusFor(resourceKey, item) {
  if (resourceKey === 'pricing') return item.is_active ? (item.highlighted ? ['Рекомендований','featured'] : ['Активний','active']) : ['Прихований','hidden']
  if (resourceKey === 'testimonials') {
    if (!item.is_active || !item.is_published) return ['Не опубліковано','hidden']
    if (!item.is_verified) return ['Без підтвердження','warning']
    return ['Опубліковано','active']
  }
  if (resourceKey === 'faqs') return item.is_active ? ['Активне','active'] : ['Приховане','hidden']
  if (resourceKey === 'certificates') return !item.is_active ? ['Прихований','hidden'] : item.is_ready ? ['Готовий','active'] : ['Очікується','warning']
  return ['Активний','active']
}

function Preview({ resourceKey, item }) {
  if (resourceKey === 'pricing') return <article className={`cc-preview-pricing ${item.highlighted ? 'is-featured' : ''}`}>
    <header><span>{item.highlighted ? 'Найчастіший вибір' : 'Пакет'}</span><small>{item.duration || 'Строк не вказано'}</small></header>
    <h3>{item.title || 'Назва тарифу'}</h3><p>{item.tagline || 'Коротко опиши, кому підходить цей пакет.'}</p>
    <strong>від {formatMoney(item.price_uah)}</strong>
    <ul>{(item.features || []).slice(0, 5).map((feature, index) => <li key={`${feature}-${index}`}><Check size={14}/>{feature}</li>)}</ul>
  </article>
  if (resourceKey === 'testimonials') return <article className="cc-preview-testimonial">
    <MessageSquareQuote size={26}/><blockquote>“{item.text || 'Тут з’явиться текст відгуку клієнта.'}”</blockquote>
    <footer>{item.photo_url ? <img src={item.photo_url} alt=""/> : <span>{(item.author || 'К').slice(0,1)}</span>}<div><strong>{item.author || 'Ім’я клієнта'}</strong><small>{[item.role, item.company].filter(Boolean).join(' · ') || 'Посада та компанія'}</small></div>{item.is_verified && <BadgeCheck size={19}/>}</footer>
  </article>
  if (resourceKey === 'faqs') return <article className="cc-preview-faq is-open"><button type="button"><span>01</span><strong>{item.question || 'Питання клієнта'}</strong><i><ChevronDown size={19}/></i></button><div><p>{item.answer || 'Тут буде зрозуміла й коротка відповідь.'}</p></div></article>
  return <article className="cc-preview-document">
    <span><FileBadge2 size={30}/></span><div><small>{item.issuer || 'Навчальний заклад / організація'}</small><h3>{item.title || 'Назва документа'}</h3><p>{item.description || 'Коротко опиши, що підтверджує документ.'}</p></div><footer><b>{item.is_ready ? 'Готовий' : 'Очікується'}</b>{item.expected_date && <time>{item.expected_date}</time>}</footer>
  </article>
}

function Card({ resourceKey, item, selected, onSelect, onEdit, onRemove, onDuplicate, onToggle, onMove, view }) {
  const [statusLabel, statusTone] = statusFor(resourceKey, item)
  const ready = completeness(resourceKey, item)
  return <article className={`cc-item-card is-${view} ${selected ? 'is-selected' : ''}`}>
    <div className="cc-card-topline">
      <label className="cc-select-check"><input type="checkbox" checked={selected} onChange={() => onSelect(item.id)}/><span><Check size={13}/></span></label>
      <span className={`cc-status is-${statusTone}`}>{statusLabel}</span>
      <div className="cc-card-order"><button onClick={() => onMove(item,-1)} aria-label="Вище"><ArrowUp size={14}/></button><b>{Number(item.order || 0) + 1}</b><button onClick={() => onMove(item,1)} aria-label="Нижче"><ArrowDown size={14}/></button></div>
    </div>
    <div className="cc-card-preview"><Preview resourceKey={resourceKey} item={item}/></div>
    <div className="cc-card-meta">
      <div><small>Готовність</small><strong>{ready}%</strong></div><span><i style={{ width: `${ready}%` }}/></span>
    </div>
    <div className="cc-card-actions">
      <button className="btn btn-dark" onClick={() => onEdit(item)}><Pencil size={15}/> Редагувати</button>
      <button className="icon-btn" onClick={() => onToggle(item)} title={item.is_active ? 'Приховати' : 'Активувати'}>{item.is_active ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
      <button className="icon-btn" onClick={() => onDuplicate(item)} title="Дублювати"><Copy size={16}/></button>
      <button className="icon-btn is-danger" onClick={() => onRemove(item)} title="Видалити"><Trash2 size={16}/></button>
    </div>
  </article>
}

export default function ContentCollectionsAdmin({ resourceKey }) {
  const { confirm, notify } = useAdminUI()
  const profile = profiles[resourceKey]
  const resource = resources[resourceKey]
  const Icon = profile.icon
  const empty = useMemo(() => ({ ...emptyFor(resource.fields), ...profile.initial }), [resourceKey])
  const [items, setItems] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('order')
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [baseline, setBaseline] = useState(empty)
  const [tab, setTab] = useState(profile.groups[0].id)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const requests = [api.get(profile.endpoint)]
      if (resourceKey === 'testimonials') requests.push(api.get('/projects/'))
      const responses = await Promise.all(requests)
      setItems(unwrap(responses[0]) || [])
      if (responses[1]) setProjects(unwrap(responses[1]) || [])
    } catch (requestError) {
      setError('Не вдалося завантажити дані. Перевір, чи запущений backend.')
      notify('Не вдалося завантажити сторінку.', { type: 'error' })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [resourceKey])

  const visibleItems = useMemo(() => {
    const needle = normalizeText(query.trim())
    const result = items.filter((item) => profile.filter(item, filter)).filter((item) => !needle || profile.search(item).some((value) => normalizeText(value).includes(needle)))
    return [...result].sort((a,b) => {
      if (sort === 'order') return Number(a.order || 0) - Number(b.order || 0)
      if (sort === 'price-asc') return Number(a.price_uah || 0) - Number(b.price_uah || 0)
      if (sort === 'price-desc') return Number(b.price_uah || 0) - Number(a.price_uah || 0)
      if (sort === 'verified') return Number(Boolean(b.is_verified)) - Number(Boolean(a.is_verified))
      if (sort === 'date') return String(b.expected_date || '').localeCompare(String(a.expected_date || ''))
      return normalizeText(a[sort]).localeCompare(normalizeText(b[sort]), 'uk')
    })
  }, [items, query, filter, sort, profile])

  const stats = useMemo(() => {
    if (resourceKey === 'pricing') return [
      ['Усього', items.length, CircleDollarSign], ['Активні', items.filter((item) => item.is_active).length, Eye], ['Рекомендовані', items.filter((item) => item.highlighted).length, Star], ['Середня ціна', formatMoney(items.length ? items.reduce((sum,item) => sum + Number(item.price_uah || 0),0) / items.length : 0), Sparkles],
    ]
    if (resourceKey === 'testimonials') return [
      ['Усього', items.length, MessageSquareQuote], ['Опубліковані', items.filter((item) => item.is_published && item.is_active).length, Eye], ['Підтверджені', items.filter((item) => item.is_verified).length, BadgeCheck], ['Очікують', items.filter((item) => !item.is_verified).length, Clock3],
    ]
    if (resourceKey === 'faqs') return [
      ['Усього', items.length, HelpCircle], ['Активні', items.filter((item) => item.is_active).length, Eye], ['Категорії', new Set(items.map((item) => item.category).filter(Boolean)).size, Grid2X2], ['Середня готовність', `${Math.round(items.reduce((sum,item) => sum + completeness(resourceKey,item),0) / Math.max(items.length,1))}%`, CheckCircle2],
    ]
    return [
      ['Усього', items.length, FileBadge2], ['Готові', items.filter((item) => item.is_ready && item.is_active).length, CheckCircle2], ['Очікуються', items.filter((item) => !item.is_ready).length, CalendarDays], ['З посиланням', items.filter((item) => item.file_url).length, Link2],
    ]
  }, [items, resourceKey])

  const canDiscard = async () => !dirty || confirm({ title: 'Закрити редактор без збереження?', description: 'Усі незбережені зміни буде втрачено.', confirmLabel: 'Закрити без збереження', tone: 'danger' })

  const openNew = async () => {
    if (!(await canDiscard())) return
    const next = { ...empty, order: items.length }
    setEditing(null); setForm(next); setBaseline(next); setTab(profile.groups[0].id); setEditorOpen(true)
  }

  const openEdit = async (item) => {
    if (!(await canDiscard())) return
    setEditing(item); setForm({ ...item }); setBaseline({ ...item }); setTab(profile.groups[0].id); setEditorOpen(true)
  }

  const closeEditor = async () => {
    if (!(await canDiscard())) return
    setEditorOpen(false)
  }

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = parsePayload(form, resource.fields)
      if (resourceKey === 'testimonials' && !payload.project) payload.project = null
      const response = editing ? await api.patch(`${profile.endpoint}${editing.id}/`, payload) : await api.post(profile.endpoint, payload)
      const saved = unwrap(response)
      setEditing(saved); setForm(saved); setBaseline(saved)
      await load(); notify(editing ? 'Зміни збережено.' : `${profile.singular[0].toUpperCase()}${profile.singular.slice(1)} створено.`)
    } catch (saveError) {
      notify(saveError.message || JSON.stringify(saveError.response?.data || 'Помилка збереження'), { type: 'error', duration: 5200 })
    } finally { setSaving(false) }
  }

  const remove = async (item) => {
    const name = item.title || item.author || item.question
    const accepted = await confirm({ title: `Видалити «${name}»?`, description: 'Запис буде переміщено до кошика.', confirmLabel: 'Видалити', tone: 'danger' })
    if (!accepted) return
    try { await api.delete(`${profile.endpoint}${item.id}/`); if (editing?.id === item.id) setEditorOpen(false); await load(); notify('Запис переміщено до кошика.', { type:'warning' }) } catch { notify('Не вдалося видалити запис.', { type:'error' }) }
  }

  const duplicate = async (item) => {
    try {
      const payload = { ...item }
      ;['id','deleted_at','deleted_by','project_title'].forEach((key) => delete payload[key])
      payload.order = items.length
      payload.is_active = false
      if (resourceKey === 'pricing' || resourceKey === 'certificates') payload.title = `${item.title} — копія`
      if (resourceKey === 'testimonials') { payload.author = `${item.author} — копія`; payload.is_published = false }
      if (resourceKey === 'faqs') payload.question = `${item.question} — копія`
      await api.post(profile.endpoint, payload); await load(); notify('Копію створено як приховану.')
    } catch { notify('Не вдалося дублювати запис.', { type:'error' }) }
  }

  const quickToggle = async (item) => {
    try { await api.patch(`${profile.endpoint}${item.id}/`, { is_active: !item.is_active }); await load(); notify(item.is_active ? 'Запис приховано.' : 'Запис активовано.') } catch { notify('Не вдалося змінити видимість.', { type:'error' }) }
  }

  const move = async (item, direction) => {
    const ordered = [...items].sort((a,b) => Number(a.order || 0) - Number(b.order || 0))
    const index = ordered.findIndex((entry) => entry.id === item.id)
    const target = ordered[index + direction]
    if (!target) return
    try {
      await Promise.all([
        api.patch(`${profile.endpoint}${item.id}/`, { order: target.order }),
        api.patch(`${profile.endpoint}${target.id}/`, { order: item.order }),
      ])
      await load()
    } catch { notify('Не вдалося змінити порядок.', { type:'error' }) }
  }

  const toggleSelected = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current,id])

  const bulk = async (action) => {
    if (!selected.length) return
    if (action === 'delete') {
      const accepted = await confirm({ title:`Видалити вибрані записи (${selected.length})?`, description:'Вони будуть переміщені до кошика.', confirmLabel:'Видалити', tone:'danger' })
      if (!accepted) return
    }
    try {
      if (action === 'delete') await Promise.all(selected.map((id) => api.delete(`${profile.endpoint}${id}/`)))
      else await Promise.all(selected.map((id) => api.patch(`${profile.endpoint}${id}/`, { is_active: action === 'show' })))
      setSelected([]); await load(); notify('Масову дію виконано.')
    } catch { notify('Не вдалося виконати масову дію.', { type:'error' }) }
  }

  const activeGroup = profile.groups.find((group) => group.id === tab) || profile.groups[0]
  const categoryOptions = resourceKey === 'faqs' ? [...new Set(items.map((item) => item.category).filter(Boolean))] : []

  return <div className={`cc-admin cc-${resourceKey}`}>
    <div className="cc-topbar">
      <div className="cc-title"><span><Icon size={20}/></span><div><small>{profile.eyebrow}</small><h1>{profile.label}</h1><p>{profile.description}</p></div></div>
      <div className="cc-top-actions"><button className="icon-btn" onClick={load} aria-label="Оновити"><RefreshCw size={17}/></button><button className="btn btn-dark" onClick={openNew}><Plus size={17}/> Додати {profile.singular}</button></div>
    </div>

    <section className="cc-stats">{stats.map(([label,value,StatIcon]) => <article key={label}><span><StatIcon size={18}/></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>

    <section className="cc-toolbar">
      <label className="cc-search"><span><Search size={20}/></span><div><small>Швидкий пошук</small><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={profile.searchPlaceholder}/></div>{query && <button onClick={() => setQuery('')} aria-label="Очистити"><X size={17}/></button>}<b>{visibleItems.length}</b></label>
      <div className="cc-filters"><AdminSelect value={filter} onChange={setFilter} options={profile.filters}/><AdminSelect value={sort} onChange={setSort} options={profile.sorts}/><div className="cc-view-switch"><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid2X2 size={16}/></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={17}/></button></div></div>
    </section>

    {selected.length > 0 && <section className="cc-bulk"><div><CheckCircle2 size={18}/><strong>Вибрано: {selected.length}</strong></div><div><button onClick={() => bulk('show')}><Eye size={15}/> Показати</button><button onClick={() => bulk('hide')}><EyeOff size={15}/> Приховати</button><button className="is-danger" onClick={() => bulk('delete')}><Trash2 size={15}/> Видалити</button><button onClick={() => setSelected([])}><X size={15}/></button></div></section>}

    {loading ? <div className="cc-state"><Loader2 className="admin-spin" size={30}/><h3>Завантажуємо дані…</h3></div> : error ? <div className="cc-state is-error"><HelpCircle size={30}/><h3>{error}</h3><button className="btn btn-dark" onClick={load}>Спробувати ще раз</button></div> : visibleItems.length ? <section className={`cc-library is-${view}`}>{visibleItems.map((item) => <Card key={item.id} resourceKey={resourceKey} item={item} view={view} selected={selected.includes(item.id)} onSelect={toggleSelected} onEdit={openEdit} onRemove={remove} onDuplicate={duplicate} onToggle={quickToggle} onMove={move}/>)}</section> : <div className="cc-state"><Search size={30}/><h3>Нічого не знайдено</h3><p>Зміни пошуковий запит або очисти фільтри.</p><button className="btn btn-light" onClick={() => { setQuery(''); setFilter('all') }}>Очистити фільтри</button></div>}

    {editorOpen && <div className="cc-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
      <aside className="cc-drawer">
        <header><div><small>{editing ? `Редагування #${editing.id}` : `Новий ${profile.singular}`}</small><h2>{form.title || form.author || form.question || `Новий ${profile.singular}`}</h2></div><button className="icon-btn" onClick={closeEditor}><X size={19}/></button></header>
        <div className="cc-drawer-tabs">{profile.groups.map((group) => <button key={group.id} className={tab === group.id ? 'active' : ''} onClick={() => setTab(group.id)}>{group.label}</button>)}</div>
        <div className="cc-editor-layout">
          <div className="cc-editor-form">
            <div className="admin-form-grid">{activeGroup.fields.map((key) => {
              if (resourceKey === 'testimonials' && key === 'project') return <div className="field" key={key}><label>Пов’язаний проєкт</label><AdminSelect value={form.project || ''} onChange={(value) => update('project', value || null)} placeholder="Без прив’язки" options={[['','Без прив’язки'], ...projects.map((project) => [project.id, project.title])]}/></div>
              if (resourceKey === 'faqs' && key === 'category') return <div className="field" key={key}><label>Категорія</label><input list="faq-category-options" value={form.category || ''} onChange={(event) => update('category', event.target.value)}/><datalist id="faq-category-options">{categoryOptions.map((category) => <option value={category} key={category}/>)}</datalist></div>
              return <AdminField key={key} spec={fieldMap[key]} value={form[key]} onChange={update}/>
            })}</div>
          </div>
          <aside className="cc-live-preview"><div className="cc-preview-head"><div><small>Живий preview</small><strong>Так запис виглядатиме на сайті</strong></div><span>{completeness(resourceKey, form)}%</span></div><Preview resourceKey={resourceKey} item={form}/>
            <div className="cc-checklist"><h3>Перевірка готовності</h3>{profile.groups.flatMap((group) => group.fields).filter((key) => !['order','is_active','is_published','is_verified','highlighted','is_ready','project','photo_url','expected_date'].includes(key)).slice(0,6).map((key) => <div key={key} className={Array.isArray(form[key]) ? form[key].length ? 'is-done' : '' : form[key] ? 'is-done' : ''}><span>{(Array.isArray(form[key]) ? form[key].length : form[key]) ? <Check size={13}/> : <MoreHorizontal size={13}/>}</span><p>{fieldMap[key]?.[1]}</p></div>)}</div>
            {resourceKey === 'certificates' && form.file_url && <a className="btn btn-light cc-file-link" href={form.file_url} target="_blank" rel="noreferrer"><FileText size={16}/> Відкрити файл</a>}
          </aside>
        </div>
      </aside>
    </div>}

    <AdminSaveDock visible={editorOpen && dirty} dirty={editorOpen && dirty} saving={saving} onSave={save} onCancel={() => setForm({ ...baseline })} title={editing ? 'Запис змінено' : `Новий ${profile.singular} ще не створено`} description="Перевір preview та збережи зміни." placement="drawer"/>
  </div>
}
