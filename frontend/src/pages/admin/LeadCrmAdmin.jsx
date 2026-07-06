import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Copy, KanbanSquare, ListFilter, Mail, Phone, RefreshCw, Search, Send, Trash2, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const statuses = [
  ['new', 'Нова'],
  ['viewed', 'Переглянута'],
  ['in_progress', 'У роботі'],
  ['waiting_client', 'Очікує клієнта'],
  ['completed', 'Завершена'],
  ['rejected', 'Відхилена'],
]
const allStatuses = [...statuses, ['spam', 'Спам']]
const statusLabels = Object.fromEntries(allStatuses)
const statusFilterOptions = [['', 'Усі статуси'], ...allStatuses]
const readOptions = [['', 'Прочитання'], ['unread', 'Непрочитані'], ['read', 'Прочитані']]
const periodOptions = [['', 'Увесь час'], ['today', 'Сьогодні'], ['7d', '7 днів'], ['30d', '30 днів']]
const orderingOptions = [['newest', 'Спочатку нові'], ['oldest', 'Спочатку старі'], ['updated', 'Останні оновлення'], ['next_action', 'Найближча дія'], ['status', 'За статусом']]

const emptyFilters = { q: '', status: '', read: '', service: '', source: '', period: '', ordering: 'newest', overdue: '', spam: '' }

const toLocalInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const fromLocalInput = (value) => value ? new Date(value).toISOString() : null

function contactHref(lead) {
  if (lead.contact_method === 'phone') return `tel:${lead.contact_value}`
  if (lead.contact_method === 'email') return `mailto:${lead.contact_value}`
  if (lead.contact_method === 'telegram') return `https://t.me/${String(lead.contact_value || '').replace('@', '')}`
  if (lead.telegram) return `https://t.me/${String(lead.telegram).replace('@', '')}`
  return ''
}
function leadSnippet(lead) { return lead.message ? `${lead.message.slice(0, 96)}${lead.message.length > 96 ? '...' : ''}` : 'Без повідомлення' }
function activeFilterCount(filters) { return Object.entries(filters).filter(([key, value]) => key !== 'ordering' && Boolean(value)).length }
function withLocalDates(lead) {
  if (!lead) return null
  return {
    ...lead,
    first_response_at_local: lead.first_response_at_local ?? toLocalInput(lead.first_response_at),
    last_contact_at_local: lead.last_contact_at_local ?? toLocalInput(lead.last_contact_at),
    next_action_at_local: lead.next_action_at_local ?? toLocalInput(lead.next_action_at),
  }
}

export default function LeadCrmAdmin() {
  const { confirm, notify } = useAdminUI()
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('portfolio_lead_view') || 'list')

  const dirty = useMemo(() => Boolean(selected && baseline && JSON.stringify(selected) !== JSON.stringify(baseline)), [selected, baseline])
  const filters = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, params.get(key) || emptyFilters[key]]))
  }, [location.search])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
      const response = await api.get(`/leads/?${params.toString()}`)
      setItems(unwrap(response) || [])
    } catch { notify('Не вдалося завантажити заявки.', { type: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [location.search])
  useEffect(() => {
    const leadId = new URLSearchParams(location.search).get('lead')
    if (leadId && !selected) openLead(leadId)
  }, [])

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(location.search)
    if (value) params.set(key, value); else params.delete(key)
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params}` : '' }, { replace: true })
  }
  const clearFilters = () => navigate('/admin/contact')
  const setMode = (mode) => { localStorage.setItem('portfolio_lead_view', mode); setViewMode(mode) }

  const openLead = async (leadOrId) => {
    const id = typeof leadOrId === 'object' ? leadOrId.id : leadOrId
    if (selected?.id !== Number(id) && dirty) {
      const accepted = await confirm({ title: 'Відкрити іншу заявку?', description: 'Незбережені нотатки поточної заявки буде втрачено.', confirmLabel: 'Відкрити', tone: 'danger' })
      if (!accepted) return
    }
    try {
      const response = await api.get(`/leads/${id}/`)
      const lead = withLocalDates(unwrap(response))
      setSelected(lead); setBaseline(lead)
      setItems((previous) => previous.map((item) => item.id === lead.id ? lead : item))
      const params = new URLSearchParams(location.search); params.set('lead', lead.id)
      navigate({ pathname: location.pathname, search: `?${params}` }, { replace: true })
    } catch { notify('Не вдалося відкрити заявку.', { type: 'error' }) }
  }

  const closeLead = async (force = false) => {
    if (!force && dirty) {
      const accepted = await confirm({ title: 'Закрити заявку без збереження?', description: 'Внутрішні нотатки та змінені поля буде втрачено.', confirmLabel: 'Закрити', tone: 'danger' })
      if (!accepted) return
    }
    setSelected(null); setBaseline(null)
    const params = new URLSearchParams(location.search); params.delete('lead')
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params}` : '' }, { replace: true })
  }

  const patchLead = async (id, payload, success = 'Зміни збережено.') => {
    setSaving(true)
    try {
      const response = await api.patch(`/leads/${id}/`, payload)
      const saved = withLocalDates(unwrap(response))
      setItems((previous) => previous.map((item) => item.id === saved.id ? saved : item))
      if (selected?.id === saved.id) { setSelected(saved); setBaseline(saved) }
      notify(success)
      return saved
    } catch { notify('Не вдалося зберегти зміни.', { type: 'error' }); throw new Error('save failed') }
    finally { setSaving(false) }
  }

  const updateStatus = (lead, status) => patchLead(lead.id, { status }, 'Статус оновлено.')
  const updateSelected = (key, value) => setSelected((previous) => ({ ...previous, [key]: value }))
  const saveSelected = async () => {
    if (!selected) return
    await patchLead(selected.id, {
      status: selected.status,
      is_read: selected.is_read,
      first_response_at: fromLocalInput(selected.first_response_at_local),
      last_contact_at: fromLocalInput(selected.last_contact_at_local),
      next_action_at: fromLocalInput(selected.next_action_at_local),
      internal_notes: selected.internal_notes || '',
      notes: selected.notes || '',
      service: selected.service || '',
      budget: selected.budget || '',
      telegram: selected.telegram || '',
    })
  }

  const removeLead = async (lead) => {
    const accepted = await confirm({ title: `Видалити заявку від ${lead.name}?`, description: 'Цю дію не можна буде скасувати з CRM.', confirmLabel: 'Видалити заявку', tone: 'danger' })
    if (!accepted) return
    try {
      await api.delete(`/leads/${lead.id}/`)
      setItems((previous) => previous.filter((item) => item.id !== lead.id))
      if (selected?.id === lead.id) await closeLead(true)
      notify('Заявку видалено.', { type: 'warning' })
    } catch { notify('Не вдалося видалити заявку.', { type: 'error' }) }
  }

  const onDropStatus = async (status) => {
    if (!dragging || dragging.status === status) return
    const previous = items
    setItems((current) => current.map((item) => item.id === dragging.id ? { ...item, status } : item))
    try { await patchLead(dragging.id, { status }, 'Картку переміщено.') }
    catch { setItems(previous) }
    finally { setDragging(null) }
  }

  const copied = async (value) => { await navigator.clipboard?.writeText(value); notify('Контакт скопійовано.') }
  const grouped = useMemo(() => Object.fromEntries(statuses.map(([key]) => [key, items.filter((item) => item.status === key)])), [items])
  const active = activeFilterCount(filters)

  return <div className="admin-crm">
    <div className="admin-page-head">
      <div><span>/admin/contact</span><h1>CRM заявок</h1><p>Робочий простір для заявок: фільтри, список, Kanban, статуси, прочитання і швидкі контактні дії.</p></div>
      <div className="admin-head-actions">
        <button className="btn btn-light" onClick={load}><RefreshCw size={17}/> Оновити</button>
        <button className={`btn ${viewMode === 'list' ? 'btn-dark' : 'btn-light'}`} onClick={() => setMode('list')}><ListFilter size={17}/> Список</button>
        <button className={`btn ${viewMode === 'kanban' ? 'btn-dark' : 'btn-light'}`} onClick={() => setMode('kanban')}><KanbanSquare size={17}/> Kanban</button>
      </div>
    </div>

    <div className="admin-card crm-filters">
      <div className="crm-search"><Search size={17}/><input value={filters.q} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Пошук за ім’ям, телефоном, email, Telegram або текстом"/></div>
      <AdminSelect value={filters.status} onChange={(value) => updateFilter('status', value)} options={statusFilterOptions}/>
      <AdminSelect value={filters.read} onChange={(value) => updateFilter('read', value)} options={readOptions}/>
      <AdminSelect value={filters.period} onChange={(value) => updateFilter('period', value)} options={periodOptions}/>
      <AdminSelect value={filters.ordering} onChange={(value) => updateFilter('ordering', value)} options={orderingOptions}/>
      <button className={`btn ${filters.overdue ? 'btn-dark' : 'btn-light'}`} onClick={() => updateFilter('overdue', filters.overdue ? '' : '1')}>Прострочені</button>
      <button className={`btn ${filters.spam ? 'btn-dark' : 'btn-light'}`} onClick={() => updateFilter('spam', filters.spam ? '' : '1')}>Показати спам</button>
      <button className="btn btn-light" onClick={clearFilters}><X size={16}/> Очистити {active ? `(${active})` : ''}</button>
    </div>

    {loading ? <div className="admin-card crm-skeleton">Завантаження заявок...</div> : viewMode === 'list'
      ? <LeadList items={items} openLead={openLead} updateStatus={updateStatus} removeLead={removeLead}/>
      : <div className="crm-kanban">{statuses.map(([status, label]) => <div className="crm-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={() => onDropStatus(status)}><header><strong>{label}</strong><span>{grouped[status]?.length || 0}</span></header>{(grouped[status] || []).map((lead) => <article key={lead.id} draggable onDragStart={() => setDragging(lead)} onClick={() => openLead(lead)} className={lead.is_read ? '' : 'is-unread'}><b>{lead.name}</b><p>{leadSnippet(lead)}</p><small>{lead.contact_value}</small><em>{lead.service || 'Послуга не вказана'}</em>{lead.next_action_at && <span>Наступна дія: {new Date(lead.next_action_at).toLocaleString('uk-UA')}</span>}</article>)}</div>)}</div>}

    {selected && <LeadDrawer lead={selected} updateSelected={updateSelected} closeLead={closeLead} updateStatus={updateStatus} copied={copied} removeLead={removeLead}/>} 
    <AdminSaveDock dirty={dirty} saving={saving} onSave={saveSelected} onCancel={() => setSelected(baseline)} placement="drawer" title="Заявку змінено" description="Збережи поля та внутрішні нотатки або скасуй зміни."/>
  </div>
}

function LeadList({ items, openLead, updateStatus, removeLead }) {
  if (!items.length) return <div className="admin-card crm-empty">Заявок за цими фільтрами немає.</div>
  return <div className="admin-card crm-list"><table className="admin-table crm-table"><thead><tr><th><input type="checkbox" aria-label="Вибрати всі заявки"/></th><th>Клієнт</th><th>Контакт</th><th>Послуга</th><th>Джерело</th><th>Дата</th><th>Статус</th><th>Наступна дія</th><th>Дії</th></tr></thead><tbody>{items.map((lead) => <tr key={lead.id} className={lead.is_read ? '' : 'is-new-lead'} onClick={() => openLead(lead)}><td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Вибрати заявку ${lead.id}`}/></td><td><strong>{lead.name}</strong><small>{leadSnippet(lead)}</small></td><td>{lead.contact_value}</td><td>{lead.service || '—'}</td><td>{lead.source}</td><td>{new Date(lead.created_at).toLocaleString('uk-UA')}</td><td onClick={(event) => event.stopPropagation()}><AdminSelect compact className={`lead-status-select status-${lead.status}`} value={lead.status} onChange={(value) => updateStatus(lead, value)} options={allStatuses}/></td><td>{lead.next_action_at ? new Date(lead.next_action_at).toLocaleString('uk-UA') : '—'}</td><td onClick={(event) => event.stopPropagation()}><div className="admin-actions"><button onClick={() => openLead(lead)}>Відкрити</button><button onClick={() => removeLead(lead)} aria-label="Видалити"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>
}

function LeadDrawer({ lead, updateSelected, closeLead, updateStatus, copied, removeLead }) {
  const href = contactHref(lead)
  return <aside className="lead-drawer">
    <header><div><small>Заявка #{lead.id}</small><h2>{lead.name}</h2></div><button className="icon-btn" onClick={() => closeLead()} aria-label="Закрити"><X size={18}/></button></header>
    <section><h3>Основна інформація</h3><dl><dt>Контакт</dt><dd>{lead.contact_value}</dd><dt>Повідомлення</dt><dd>{lead.message || 'Не вказано'}</dd><dt>Дата</dt><dd>{new Date(lead.created_at).toLocaleString('uk-UA')}</dd><dt>Джерело</dt><dd>{lead.source}</dd><dt>Сторінка</dt><dd>{lead.page_url || '—'}</dd><dt>UTM</dt><dd>{[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ') || '—'}</dd></dl></section>
    <section><h3>Керування</h3><label>Статус<AdminSelect value={lead.status} onChange={(value) => updateStatus(lead, value)} options={allStatuses}/></label><label className="admin-check"><input type="checkbox" checked={Boolean(lead.is_read)} onChange={(event) => updateSelected('is_read', event.target.checked)}/><span>Прочитана</span></label><label>Послуга<input value={lead.service || ''} onChange={(event) => updateSelected('service', event.target.value)}/></label><label>Бюджет<input value={lead.budget || ''} onChange={(event) => updateSelected('budget', event.target.value)}/></label><label>Telegram<input value={lead.telegram || ''} onChange={(event) => updateSelected('telegram', event.target.value)}/></label><label>Перша відповідь<input type="datetime-local" value={lead.first_response_at_local || ''} onChange={(event) => updateSelected('first_response_at_local', event.target.value)}/></label><label>Останній контакт<input type="datetime-local" value={lead.last_contact_at_local || ''} onChange={(event) => updateSelected('last_contact_at_local', event.target.value)}/></label><label>Наступна дія<input type="datetime-local" value={lead.next_action_at_local || ''} onChange={(event) => updateSelected('next_action_at_local', event.target.value)}/></label><label className="wide">Внутрішні нотатки<textarea value={lead.internal_notes || lead.notes || ''} onChange={(event) => updateSelected('internal_notes', event.target.value)}/></label></section>
    <section><h3>Швидкі дії</h3><div className="lead-quick-actions">{href && <a className="btn btn-light" href={href} target="_blank" rel="noreferrer">{lead.contact_method === 'email' ? <Mail size={16}/> : lead.contact_method === 'phone' ? <Phone size={16}/> : <Send size={16}/>} Написати</a>}{lead.contact_method === 'phone' && <a className="btn btn-light" href={`tel:${lead.contact_value}`}><Phone size={16}/> Подзвонити</a>}<button className="btn btn-light" onClick={() => copied(lead.contact_value)}><Copy size={16}/> Скопіювати</button><button className="btn btn-light" onClick={() => updateStatus(lead, 'in_progress')}>Взяти в роботу</button><button className="btn btn-light" onClick={() => updateStatus(lead, 'completed')}>Завершити</button><button className="btn btn-light" onClick={() => updateStatus(lead, 'spam')}>Спам</button><button className="btn admin-danger-btn" onClick={() => removeLead(lead)}><Trash2 size={16}/> Видалити</button></div></section>
    <section><h3>Історія</h3><ul className="lead-history"><li>Створено: {new Date(lead.created_at).toLocaleString('uk-UA')}</li>{lead.viewed_at && <li>Перший перегляд: {new Date(lead.viewed_at).toLocaleString('uk-UA')}</li>}<li>Оновлено: {new Date(lead.updated_at).toLocaleString('uk-UA')}</li>{lead.telegram_notified_at && <li>Telegram сповіщення: {new Date(lead.telegram_notified_at).toLocaleString('uk-UA')}</li>}</ul></section>
    <a className="lead-open-public" href="/" target="_blank" rel="noreferrer">Відкрити сайт <ArrowUpRight size={15}/></a>
  </aside>
}
