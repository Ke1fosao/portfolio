import { useEffect, useMemo, useState } from 'react'
import { BellRing, Mail, Plus, RefreshCw, Send, Trash2 } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import ImageCropUploader from '../../components/admin/ImageCropUploader'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'
import { emptyFor, parsePayload, resources } from './resources'

const leadStatusLabels = [['new', 'Нова'], ['viewed', 'Переглянута'], ['in_progress', 'У роботі'], ['completed', 'Завершена']]

export default function ResourceAdmin({ resourceKey }) {
  const { confirm, notify } = useAdminUI()
  const config = resources[resourceKey]
  const empty = useMemo(() => emptyFor(config.fields), [config])
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [baseline, setBaseline] = useState(empty)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])

  const load = async () => {
    try {
      const response = await api.get(config.endpoint)
      setItems(unwrap(response) || [])
    } catch { notify('Не вдалося завантажити дані.', { type: 'error' }) }
  }

  useEffect(() => {
    const initial = emptyFor(config.fields)
    setEditing(null)
    setForm(initial)
    setBaseline(initial)
    load()
  }, [resourceKey])

  const canLeaveEditor = async () => !dirty || confirm({
    title: 'Скасувати незбережені зміни?',
    description: 'Введені дані повернуться до останнього збереженого стану.',
    confirmLabel: 'Скасувати зміни',
    tone: 'danger',
  })

  const startNew = async () => {
    if (!(await canLeaveEditor())) return
    const initial = emptyFor(config.fields)
    setEditing(null)
    setForm(initial)
    setBaseline(initial)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = async (item) => {
    if (!(await canLeaveEditor())) return
    let current = item
    if (resourceKey === 'leads' && item.status === 'new') {
      try {
        const response = await api.patch(`${config.endpoint}${item.id}/`, { status: 'viewed' })
        current = unwrap(response)
        setItems((previous) => previous.map((entry) => entry.id === item.id ? current : entry))
      } catch { /* Editing remains available even if auto-mark fails. */ }
    }
    setEditing(current)
    setForm({ ...current })
    setBaseline({ ...current })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = parsePayload(form, config.fields)
      const response = editing
        ? await api.patch(`${config.endpoint}${config.lookup ? editing[config.lookup] : editing.id}/`, payload)
        : await api.post(config.endpoint, payload)
      const saved = unwrap(response)
      setEditing(saved)
      setForm(saved)
      setBaseline(saved)
      await load()
      notify(editing ? 'Запис оновлено.' : 'Новий запис створено.')
    } catch (error) {
      notify(error.message || JSON.stringify(error.response?.data || 'Помилка збереження'), { type: 'error' })
    } finally { setSaving(false) }
  }

  const remove = async (item) => {
    const title = item.title || item.name || item.question || item.author || `Запис #${item.id}`
    const accepted = await confirm({
      title: `Видалити «${title}»?`,
      description: 'Запис буде переміщено до кошика або видалено відповідно до налаштувань системи.',
      confirmLabel: 'Видалити',
      tone: 'danger',
    })
    if (!accepted) return
    try {
      await api.delete(`${config.endpoint}${config.lookup ? item[config.lookup] : item.id}/`)
      if (editing?.id === item.id) {
        const initial = emptyFor(config.fields)
        setEditing(null); setForm(initial); setBaseline(initial)
      }
      await load()
      notify('Запис видалено.', { type: 'warning' })
    } catch { notify('Не вдалося видалити запис.', { type: 'error' }) }
  }

  const changeLeadStatus = async (item, status) => {
    try {
      const response = await api.patch(`${config.endpoint}${item.id}/`, { status })
      const saved = unwrap(response)
      setItems((previous) => previous.map((entry) => entry.id === item.id ? saved : entry))
      if (editing?.id === item.id) { setEditing(saved); setForm(saved); setBaseline(saved) }
      notify('Статус оновлено.')
    } catch { notify('Не вдалося оновити статус.', { type: 'error' }) }
  }

  const retryNotifications = async (item) => {
    notify('Повторно надсилаю сповіщення…', { type: 'info' })
    try {
      const response = await api.post(`${config.endpoint}${item.id}/retry_notifications/`)
      const lead = response.data?.lead
      if (lead) {
        setItems((previous) => previous.map((entry) => entry.id === lead.id ? lead : entry))
        if (editing?.id === lead.id) { setEditing(lead); setForm(lead); setBaseline(lead) }
      }
      const errors = response.data?.notifications?.errors || []
      notify(errors.length ? `Є помилки: ${errors.join(' ')}` : 'Telegram та email сповіщення відправлено.', { type: errors.length ? 'warning' : 'success', duration: 5200 })
    } catch { notify('Не вдалося повторити сповіщення. Перевір backend/.env та журнал backend.', { type: 'error', duration: 5200 }) }
  }

  const exportCsv = () => {
    if (!items.length) return notify('Немає записів для експорту.', { type: 'info' })
    const keys = [...new Set(items.flatMap((item) => Object.keys(item).filter((key) => typeof item[key] !== 'object')))]
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [keys.map(escape).join(','), ...items.map((item) => keys.map((key) => escape(item[key])).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${resourceKey}.csv`; anchor.click(); URL.revokeObjectURL(url)
    notify('CSV-файл підготовлено.')
  }

  const mediaUpload = editing && (resourceKey === 'projects' || resourceKey === 'posts')
  const cancelChanges = () => setForm({ ...baseline })

  return <>
    <div className="admin-page-head"><div><span>/admin/{resourceKey}</span><h1>{config.label}</h1><p>{config.description}</p></div><button className="btn btn-dark" onClick={startNew}><Plus size={17}/> Новий запис</button></div>
    <div className={`admin-resource-layout ${mediaUpload ? 'has-media' : ''}`}>
      <div className="admin-card"><div className="admin-section-title"><div><h2>{editing ? `Редагування: ${editing.title || editing.name || editing.question}` : 'Новий запис'}</h2><p>{editing ? 'Панель збереження з’явиться після першої зміни.' : 'Заповни дані. Після створення можна буде додати обкладинку.'}</p></div></div>
        {resourceKey === 'leads' && editing && <div className="lead-notification-panel">
          <div className={editing.telegram_notified_at ? 'is-sent' : 'is-pending'}><BellRing size={18}/><span><strong>Telegram</strong><small>{editing.telegram_notified_at ? 'Надіслано' : 'Не підтверджено'}</small></span></div>
          <div className={editing.email_notified_at ? 'is-sent' : 'is-pending'}><Mail size={18}/><span><strong>Email</strong><small>{editing.email_notified_at ? 'Надіслано' : 'Не підтверджено'}</small></span></div>
          <button className="btn btn-light" onClick={() => retryNotifications(editing)}><Send size={16}/> Повторити сповіщення</button>
          {editing.notification_errors && <p>{editing.notification_errors}</p>}
        </div>}
        <div className="admin-form-grid">{config.fields.map((field) => <AdminField key={field[0]} spec={field} value={form[field[0]]} onChange={update}/>)}</div>
      </div>
      {mediaUpload && <ImageCropUploader title="Обкладинка" hint={resourceKey === 'projects' ? 'Зображення відображатиметься на головній, у списку робіт і всередині кейсу.' : 'Обкладинка статті.'} currentUrl={editing.uploaded_cover_url} uploadUrl={`${config.endpoint}${editing[config.lookup]}/upload_cover/`} removeUrl={resourceKey === 'projects' ? `${config.endpoint}${editing[config.lookup]}/remove_cover/` : ''} aspect={16 / 10} onUploaded={(data) => { setEditing(data); setForm(data); setBaseline(data); load() }}/>} 
    </div>

    <div className="admin-card"><div className="admin-list-head"><h2>Усі записи</h2><div>{resourceKey === 'leads' && <button className="btn btn-light" onClick={exportCsv}>Експорт CSV</button>}<button className="icon-btn" onClick={load} aria-label="Оновити"><RefreshCw size={17}/></button></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Назва / контакт</th><th>Статус</th><th>Сповіщення</th><th>Дії</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className={resourceKey === 'leads' && item.status === 'new' ? 'is-new-lead' : ''}><td>{item.id}</td><td><strong>{item.title || item.name || item.question || item.author}</strong><small>{item.summary || item.contact_value || item.company || item.category}</small></td><td>{resourceKey === 'leads' ? <AdminSelect compact className={`lead-status-select status-${item.status}`} value={item.status} onChange={(status) => changeLeadStatus(item, status)} options={leadStatusLabels}/> : (item.status || (item.is_active === false ? 'Вимкнено' : 'Активно'))}</td><td>{resourceKey === 'leads' ? <div className="lead-notify-mini"><span title="Telegram" className={item.telegram_notified_at ? 'is-ok' : ''}><BellRing size={15}/></span><span title="Email" className={item.email_notified_at ? 'is-ok' : ''}><Mail size={15}/></span></div> : '—'}</td><td><div className="admin-actions"><button onClick={() => startEdit(item)}>Редагувати</button>{resourceKey === 'leads' && <button title="Повторити сповіщення" onClick={() => retryNotifications(item)}><Send size={15}/></button>}<button onClick={() => remove(item)} aria-label="Видалити"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></div>

    <AdminSaveDock dirty={dirty} saving={saving} onSave={save} onCancel={cancelChanges} title={editing ? 'Запис змінено' : 'Новий запис ще не створено'} description="Збережи актуальні дані або поверни попередній стан."/>
  </>
}
