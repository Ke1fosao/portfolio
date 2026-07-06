import { useEffect, useMemo, useState } from 'react'
import { FileText, Grid3X3, List, RefreshCw, Upload } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const mediaTypes = [['', 'Усі типи'], ['image', 'Зображення'], ['document', 'Документи']]

export default function MediaAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [mode, setMode] = useState('grid')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => Boolean(selected && baseline && JSON.stringify(selected) !== JSON.stringify(baseline)), [selected, baseline])

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (type) params.set('type', type)
      const response = await api.get(`/media-assets/?${params}`)
      const data = unwrap(response) || []
      setItems(data)
      if (selected) {
        const refreshed = data.find((item) => item.id === selected.id)
        if (refreshed && !dirty) { setSelected(refreshed); setBaseline(refreshed) }
      }
    } catch { notify('Не вдалося завантажити медіабібліотеку.', { type: 'error' }) }
  }

  useEffect(() => { load() }, [])

  const upload = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    let success = 0
    for (const file of list) {
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      try {
        await api.post('/media-assets/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        success += 1
      } catch (error) {
        notify(error.response?.data?.detail || `Не вдалося завантажити ${file.name}`, { type: 'error' })
      }
    }
    await load()
    if (success) notify(`Завантажено файлів: ${success}.`)
  }

  const chooseItem = async (item) => {
    if (selected?.id === item.id) return
    if (dirty) {
      const accepted = await confirm({ title: 'Закрити незбережені метадані?', description: 'Зміни поточного медіафайлу буде втрачено.', confirmLabel: 'Закрити без збереження', tone: 'danger' })
      if (!accepted) return
    }
    setSelected(item)
    setBaseline(item)
  }

  const saveSelected = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const response = await api.patch(`/media-assets/${selected.id}/`, {
        title: selected.title,
        alt_text: selected.alt_text,
        description: selected.description,
        caption: selected.caption,
        category: selected.category,
      })
      const saved = response.data
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setSelected(saved)
      setBaseline(saved)
      notify('Метадані медіафайлу збережено.')
    } catch { notify('Не вдалося зберегти метадані.', { type: 'error' }) }
    finally { setSaving(false) }
  }

  const replaceFile = async (file) => {
    if (!selected || !file) return
    const accepted = await confirm({ title: 'Замінити поточний файл?', description: 'Усі місця використання отримають нову версію файлу.', confirmLabel: 'Замінити файл' })
    if (!accepted) return
    const form = new FormData(); form.append('file', file)
    try {
      const response = await api.post(`/media-assets/${selected.id}/replace_file/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSelected(response.data)
      setBaseline(response.data)
      setItems((current) => current.map((item) => item.id === response.data.id ? response.data : item))
      notify('Файл успішно замінено.')
    } catch { notify('Не вдалося замінити файл.', { type: 'error' }) }
  }

  return <div className="media-admin">
    <div className="admin-page-head">
      <div><span>/admin/media</span><h1>Медіабібліотека</h1><p>Зображення, PDF, документи, alt-тексти, використання файлів і безпечне завантаження.</p></div>
      <div className="admin-head-actions"><button className="btn btn-light" onClick={load}><RefreshCw size={16}/> Оновити</button><label className="btn btn-dark"><Upload size={16}/> Завантажити<input hidden multiple type="file" onChange={(event) => upload(event.target.files)}/></label></div>
    </div>

    <div className="admin-card media-toolbar">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук медіа" onKeyDown={(event) => { if (event.key === 'Enter') load() }}/>
      <AdminSelect value={type} onChange={setType} options={mediaTypes}/>
      <button className="btn btn-light" onClick={load}>Знайти</button>
      <button className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')} aria-label="Сітка"><Grid3X3 size={16}/></button>
      <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')} aria-label="Список"><List size={16}/></button>
    </div>

    <div className={`media-layout ${selected ? 'has-selected' : ''}`}>
      <div className={`admin-card media-${mode}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files) }}>
        {!items.length ? <div className="crm-empty">Медіафайлів поки немає. Перетягни файли сюди або натисни «Завантажити».</div> : items.map((item) => <article key={item.id} onClick={() => chooseItem(item)} className={selected?.id === item.id ? 'is-selected' : ''}>
          <div>{item.thumbnail_url || item.file_url ? <img src={item.thumbnail_url || item.file_url} alt={item.alt_text || ''}/> : <FileText size={28}/>}</div>
          <strong>{item.title}</strong>
          <small>{item.mime_type || 'file'} · {Math.round((item.size || 0) / 1024)} KB</small>
          {mode === 'list' && <><span>Alt: {item.alt_text || 'немає'}</span><span>Використання: {item.usage?.length ? item.usage.join(', ') : 'не знайдено'}</span></>}
        </article>)}
      </div>

      {selected && <aside className="admin-card media-details">
        <h2>{selected.title}</h2>
        {selected.file_url && <a href={selected.file_url} target="_blank" rel="noreferrer">Відкрити файл ↗</a>}
        <label>Назва<input value={selected.title || ''} onChange={(event) => setSelected({ ...selected, title: event.target.value })}/></label>
        <label>Alt-текст<input value={selected.alt_text || ''} onChange={(event) => setSelected({ ...selected, alt_text: event.target.value })}/></label>
        <label>Категорія<input value={selected.category || ''} onChange={(event) => setSelected({ ...selected, category: event.target.value })}/></label>
        <label>Підпис<input value={selected.caption || ''} onChange={(event) => setSelected({ ...selected, caption: event.target.value })}/></label>
        <label>Опис<textarea value={selected.description || ''} onChange={(event) => setSelected({ ...selected, description: event.target.value })}/></label>
        {!selected.alt_text && selected.mime_type?.startsWith('image/') && <p className="media-warning">Зображення не має alt-тексту.</p>}
        <div className="media-usage"><strong>Використання</strong>{selected.usage?.length ? selected.usage.map((usage) => <span key={usage}>{usage}</span>) : <span>Не знайдено у публічному контенті</span>}</div>
        <label className="btn btn-light">Замінити файл<input hidden type="file" onChange={(event) => replaceFile(event.target.files?.[0])}/></label>
      </aside>}
    </div>

    <AdminSaveDock dirty={dirty} saving={saving} onSave={saveSelected} onCancel={() => setSelected(baseline)} title="Змінено метадані файлу" description="Збережи назву, alt-текст і опис або скасуй редагування."/>
  </div>
}
