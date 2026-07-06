import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RefreshCw, SearchCheck, TriangleAlert } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const seoFilters = [['', 'Усі записи'], ['missing_title', 'Без title'], ['missing_description', 'Без description'], ['missing_og', 'Без OG image'], ['noindex', 'Noindex']]

export default function SeoAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => Boolean(selected && baseline && JSON.stringify(selected) !== JSON.stringify(baseline)), [selected, baseline])

  const load = async () => {
    try {
      const response = await api.get(`/seo-metadata/${filter ? `?filter=${filter}` : ''}`)
      let data = unwrap(response) || []
      if (!data.length && !filter) {
        const seeded = await api.post('/seo-metadata/seed_defaults/')
        data = seeded.data || []
      }
      setItems(data)
      const next = selected ? data.find((item) => item.id === selected.id) || data[0] : data[0]
      if (!dirty) { setSelected(next || null); setBaseline(next || null) }
    } catch { notify('Не вдалося завантажити SEO-дані.', { type: 'error' }) }
  }

  useEffect(() => { load() }, [filter])

  const issueCount = useMemo(() => items.reduce((sum, item) => sum + (item.issues?.length || 0), 0), [items])

  const choose = async (item) => {
    if (selected?.id === item.id) return
    if (dirty) {
      const accepted = await confirm({ title: 'Перейти без збереження SEO?', description: 'Зміни поточного запису буде втрачено.', confirmLabel: 'Перейти', tone: 'danger' })
      if (!accepted) return
    }
    setSelected(item)
    setBaseline(item)
  }

  const saveSelected = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const response = await api.patch(`/seo-metadata/${selected.id}/`, selected)
      const saved = response.data
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setSelected(saved)
      setBaseline(saved)
      notify('SEO-налаштування сторінки збережено.')
    } catch { notify('Не вдалося зберегти SEO.', { type: 'error' }) }
    finally { setSaving(false) }
  }

  const seed = async () => {
    try { await api.post('/seo-metadata/seed_defaults/'); await load(); notify('Базові SEO-записи створено.') }
    catch { notify('Не вдалося створити базові SEO-записи.', { type: 'error' }) }
  }

  return <div className="seo-admin">
    <div className="admin-page-head">
      <div><span>/admin/seo</span><h1>SEO-центр</h1><p>Метадані, Open Graph preview, індексація і конкретні проблеми без псевдоточних оцінок.</p></div>
      <div className="admin-head-actions"><button className="btn btn-light" onClick={load}><RefreshCw size={16}/> Оновити</button><button className="btn btn-dark" onClick={seed}><SearchCheck size={16}/> Створити базові записи</button></div>
    </div>

    <div className="admin-grid notification-stats">
      <div className="admin-stat"><span>SEO записи</span><strong>{items.length}</strong><small>Публічні сторінки і матеріали</small></div>
      <div className="admin-stat"><span>Проблеми</span><strong>{issueCount}</strong><small>Конкретні пункти для виправлення</small></div>
      <div className="admin-stat"><span>Готові</span><strong>{items.filter((item) => !item.issues?.length).length}</strong><small>Без базових помилок</small></div>
      <div className="admin-stat"><span>Noindex</span><strong>{items.filter((item) => !item.index).length}</strong><small>Виключені з індексації</small></div>
    </div>

    <div className="admin-card media-toolbar"><AdminSelect value={filter} onChange={setFilter} options={seoFilters}/></div>

    <div className="seo-layout">
      <div className="admin-card seo-list">
        <table className="admin-table"><thead><tr><th>Сторінка</th><th>Title</th><th>Description</th><th>Index</th><th>Проблеми</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} onClick={() => choose(item)} className={selected?.id === item.id ? 'is-new-lead' : ''}><td><strong>{item.page_key}</strong><small>{item.path || item.slug}</small></td><td>{item.seo_title || '—'}</td><td>{item.seo_description ? item.seo_description.slice(0, 80) : '—'}</td><td>{item.index ? 'index' : 'noindex'}</td><td>{item.issues?.length ? <span className="status-chip status-rejected">{item.issues.length}</span> : <span className="status-chip status-completed">OK</span>}</td></tr>)}</tbody></table>
      </div>

      {selected && <aside className="admin-card seo-editor">
        <h2>{selected.page_key}</h2>
        <div className="seo-preview google"><small>Google preview</small><strong>{selected.seo_title || 'SEO title не задано'}</strong><span>{selected.canonical_url || selected.path || '/'}</span><p>{selected.seo_description || 'SEO description не задано.'}</p></div>
        <div className="seo-preview og"><small>Telegram / Facebook preview</small>{selected.og_image_url_resolved && <img src={selected.og_image_url_resolved} alt=""/>}<strong>{selected.og_title || selected.seo_title || 'OG title'}</strong><p>{selected.og_description || selected.seo_description || 'OG description'}</p></div>
        <label>SEO title<input value={selected.seo_title || ''} onChange={(event) => setSelected({ ...selected, seo_title: event.target.value })}/></label>
        <label>Description<textarea value={selected.seo_description || ''} onChange={(event) => setSelected({ ...selected, seo_description: event.target.value })}/></label>
        <label>Slug<input value={selected.slug || ''} onChange={(event) => setSelected({ ...selected, slug: event.target.value })}/></label>
        <label>Canonical URL<input value={selected.canonical_url || ''} onChange={(event) => setSelected({ ...selected, canonical_url: event.target.value })}/></label>
        <label>OG title<input value={selected.og_title || ''} onChange={(event) => setSelected({ ...selected, og_title: event.target.value })}/></label>
        <label>OG description<textarea value={selected.og_description || ''} onChange={(event) => setSelected({ ...selected, og_description: event.target.value })}/></label>
        <label>OG image URL<input value={selected.og_image_url || ''} onChange={(event) => setSelected({ ...selected, og_image_url: event.target.value })}/></label>
        <label>Фокусна фраза<input value={selected.focus_keyword || ''} onChange={(event) => setSelected({ ...selected, focus_keyword: event.target.value })}/></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(selected.index)} onChange={(event) => setSelected({ ...selected, index: event.target.checked })}/><span>index</span></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(selected.follow)} onChange={(event) => setSelected({ ...selected, follow: event.target.checked })}/><span>follow</span></label>
        <div className="seo-issues"><strong>Проблеми</strong>{selected.issues?.length ? selected.issues.map((issue) => <p key={issue}><TriangleAlert size={15}/>{issue}</p>) : <p><CheckCircle2 size={15}/> Базових SEO проблем не знайдено.</p>}</div>
      </aside>}
    </div>
    <AdminSaveDock dirty={dirty} saving={saving} onSave={saveSelected} onCancel={() => setSelected(baseline)} title="Змінено SEO сторінки" description="Збережи метадані або поверни попередні значення."/>
  </div>
}
