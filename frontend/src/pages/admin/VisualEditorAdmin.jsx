import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Copy, Eye, EyeOff, GripVertical, History, Maximize2, Monitor, Plus, RefreshCw, Smartphone, Tablet, Trash2 } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const pages = [['home', 'Головна'], ['about', 'Про мене'], ['projects', 'Проєкти'], ['services', 'Послуги'], ['pricing', 'Ціни'], ['blog', 'Блог'], ['contact', 'Контакти']]
const widths = { desktop: 1180, tablet: 820, mobile: 390 }
const draftKey = (page) => `portfolio_editor_draft_${page}`

export default function VisualEditorAdmin() {
  const { confirm, notify } = useAdminUI()
  const [page, setPage] = useState('home')
  const [sections, setSections] = useState([])
  const [baseline, setBaseline] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [showPreview, setShowPreview] = useState(true)
  const [saveState, setSaveState] = useState('Усі зміни збережено')
  const [lastSavedAt, setLastSavedAt] = useState('')
  const [dragging, setDragging] = useState(null)
  const saveTimer = useRef(null)

  const selected = useMemo(() => sections.find((section) => section.id === selectedId) || sections[0], [sections, selectedId])
  const dirty = useMemo(() => JSON.stringify(sections) !== JSON.stringify(baseline), [sections, baseline])
  const saving = saveState === 'Збереження'

  const refreshPreview = async (targetPage = page, localSections = sections) => {
    try {
      const response = await api.get(`/editor-preview/?page=${targetPage}`)
      setPreviewData({ ...response.data, sections: localSections })
    } catch { notify('Preview тимчасово недоступний.', { type: 'warning' }) }
  }

  const load = async (targetPage = page) => {
    try {
      const response = await api.get(`/page-sections/?page=${targetPage}`)
      let serverSections = unwrap(response) || []
      if (!serverSections.length) {
        const seeded = await api.post('/page-sections/seed_defaults/', { page: targetPage })
        serverSections = seeded.data.sections || []
      }
      let loaded = serverSections
      const localDraft = localStorage.getItem(draftKey(targetPage))
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft)
          if (Array.isArray(parsed.sections)) {
            loaded = parsed.sections
            setSaveState('Є локальна чернетка')
            notify('Відновлено локальну чернетку редактора.', { type: 'info' })
          }
        } catch { localStorage.removeItem(draftKey(targetPage)) }
      } else setSaveState('Усі зміни збережено')
      setBaseline(serverSections)
      setSections(loaded)
      setSelectedId(loaded[0]?.id || null)
      await refreshPreview(targetPage, loaded)
    } catch { notify('Не вдалося завантажити візуальний редактор.', { type: 'error' }) }
  }

  useEffect(() => { load(page) }, [page])
  useEffect(() => {
    const beforeUnload = (event) => {
      if (dirty) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  const queueSave = (nextSections) => {
    setSections(nextSections)
    setPreviewData((current) => current ? { ...current, sections: nextSections } : current)
    setSaveState('Є незбережені зміни')
    localStorage.setItem(draftKey(page), JSON.stringify({ sections: nextSections, updated_at: new Date().toISOString() }))
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveSections(nextSections), 1300)
  }

  const saveSections = async (nextSections = sections) => {
    window.clearTimeout(saveTimer.current)
    setSaveState('Збереження')
    try {
      await Promise.all(nextSections.map((section, index) => api.patch(`/page-sections/${section.id}/`, {
        title: section.title,
        icon: section.icon,
        order: index,
        is_active: section.is_active,
        settings: section.settings || {},
      })))
      const normalized = nextSections.map((section, index) => ({ ...section, order: index }))
      localStorage.removeItem(draftKey(page))
      setSections(normalized)
      setBaseline(normalized)
      setSaveState('Усі зміни збережено')
      setLastSavedAt(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }))
      await refreshPreview(page, normalized)
      notify('Зміни візуального редактора збережено.')
    } catch {
      setSaveState('Помилка збереження')
      notify('Не вдалося зберегти на сервері. Чернетку залишено локально.', { type: 'error', duration: 5200 })
    }
  }

  const cancelChanges = () => {
    window.clearTimeout(saveTimer.current)
    localStorage.removeItem(draftKey(page))
    setSections(baseline)
    setSelectedId(baseline[0]?.id || null)
    setSaveState('Усі зміни збережено')
    setPreviewData((current) => current ? { ...current, sections: baseline } : current)
    notify('Незбережені зміни скасовано.', { type: 'info' })
  }

  const changePage = async (nextPage) => {
    if (nextPage === page) return
    if (dirty) {
      const accepted = await confirm({ title: 'Перейти на іншу сторінку?', description: 'Незбережені зміни поточної сторінки буде скасовано.', confirmLabel: 'Перейти', tone: 'danger' })
      if (!accepted) return
      window.clearTimeout(saveTimer.current)
      localStorage.removeItem(draftKey(page))
    }
    setPage(nextPage)
  }

  const updateSection = (patch) => queueSave(sections.map((section) => section.id === selected.id ? { ...section, ...patch } : section))
  const updateSettings = (key, value) => updateSection({ settings: { ...(selected.settings || {}), [key]: value } })
  const moveSection = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    queueSave(next.map((section, order) => ({ ...section, order })))
  }
  const dropOn = (targetId) => {
    if (!dragging || dragging === targetId) return
    const current = sections.find((section) => section.id === dragging)
    const rest = sections.filter((section) => section.id !== dragging)
    const targetIndex = rest.findIndex((section) => section.id === targetId)
    const next = [...rest.slice(0, targetIndex), current, ...rest.slice(targetIndex)]
    setDragging(null)
    queueSave(next.map((section, order) => ({ ...section, order })))
  }

  const duplicateSection = async (section) => {
    try {
      const response = await api.post('/page-sections/', { page, section_type: `${section.section_type}-${Date.now()}`, title: `${section.title} копія`, icon: section.icon, order: sections.length, is_active: section.is_active, settings: section.settings || {} })
      const next = [...sections, response.data]
      queueSave(next)
      setSelectedId(response.data.id)
      notify('Секцію продубльовано.')
    } catch { notify('Не вдалося дублювати секцію.', { type: 'error' }) }
  }

  const deleteSection = async (section) => {
    if (section.is_system) return notify('Системну секцію не можна видалити. Її можна приховати.', { type: 'warning' })
    const accepted = await confirm({ title: `Видалити секцію «${section.title}»?`, description: 'Секція зникне зі сторінки. Дію буде записано в історію.', confirmLabel: 'Видалити секцію', tone: 'danger' })
    if (!accepted) return
    try {
      await api.delete(`/page-sections/${section.id}/`)
      const next = sections.filter((item) => item.id !== section.id)
      setSections(next); setBaseline(next); setSelectedId(next[0]?.id || null)
      await refreshPreview(page, next)
      notify('Секцію видалено.', { type: 'warning' })
    } catch { notify('Не вдалося видалити секцію.', { type: 'error' }) }
  }

  return <div className="visual-editor">
    <div className="editor-topbar">
      <div><span>/admin/editor</span><h1>Візуальний редактор</h1><p>{saveState}{lastSavedAt ? ` · ${lastSavedAt}` : ''}</p></div>
      <div>
        <AdminSelect value={page} onChange={changePage} options={pages}/>
        <button className="btn btn-light" onClick={() => setShowPreview((value) => !value)}>{showPreview ? <EyeOff size={16}/> : <Eye size={16}/>} Preview</button>
        <button className="btn btn-light" onClick={() => refreshPreview()}><RefreshCw size={16}/> Оновити</button>
        <a className="btn btn-light" href={`/admin/versions?entity_type=pagesection${selected ? `&entity_id=${selected.id}` : ''}`}><History size={16}/> Історія версій</a>
        <a className="btn btn-light" href="/" target="_blank" rel="noreferrer">Сайт <ArrowUpRight size={16}/></a>
      </div>
    </div>

    <div className={`editor-grid ${showPreview ? '' : 'no-preview'}`}>
      <aside className="section-list">
        <header><strong>Секції</strong><button onClick={() => api.post('/page-sections/seed_defaults/', { page }).then(() => load(page))} aria-label="Додати базові секції"><Plus size={15}/></button></header>
        {sections.map((section, index) => <article key={section.id} className={selected?.id === section.id ? 'is-selected' : ''} draggable onDragStart={() => setDragging(section.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(section.id)} onClick={() => setSelectedId(section.id)}>
          <GripVertical size={15}/><span><b>{section.title}</b><small>{section.section_type}</small></span>{!section.is_active && <i>hidden</i>}
          <button onClick={(event) => { event.stopPropagation(); moveSection(index, -1) }}>↑</button><button onClick={(event) => { event.stopPropagation(); moveSection(index, 1) }}>↓</button>
        </article>)}
      </aside>

      <main className="section-editor">
        {selected ? <div className="admin-card">
          <div className="admin-section-title"><div><h2>{selected.title}</h2><p>Контент, видимість і налаштування секції. Preview праворуч показує незбережені зміни.</p></div></div>
          <div className="editor-fields">
            <label>Назва секції<input value={selected.title || ''} onChange={(event) => updateSection({ title: event.target.value })}/></label>
            <label>Іконка<input value={selected.icon || ''} onChange={(event) => updateSection({ icon: event.target.value })}/></label>
            <label className="admin-check"><input type="checkbox" checked={Boolean(selected.is_active)} onChange={(event) => updateSection({ is_active: event.target.checked })}/><span>Показувати секцію</span></label>
            <label>Заголовок<input value={selected.settings?.heading || ''} onChange={(event) => updateSettings('heading', event.target.value)}/></label>
            <label className="wide">Опис<textarea value={selected.settings?.description || ''} onChange={(event) => updateSettings('description', event.target.value)}/></label>
            <label>CTA текст<input value={selected.settings?.cta || ''} onChange={(event) => updateSettings('cta', event.target.value)}/></label>
            <label>Зображення URL<input value={selected.settings?.image || ''} onChange={(event) => updateSettings('image', event.target.value)}/></label>
          </div>
          <div className="editor-actions"><button className="btn btn-light" onClick={() => duplicateSection(selected)}><Copy size={16}/> Дублювати</button><button className="btn btn-light" onClick={() => updateSection({ is_active: !selected.is_active })}>{selected.is_active ? 'Приховати' : 'Показати'}</button><button className="btn admin-danger-btn" onClick={() => deleteSection(selected)}><Trash2 size={16}/> Видалити</button></div>
        </div> : <div className="admin-card">Оберіть секцію.</div>}
      </main>

      {showPreview && <aside className="live-preview-panel">
        <header><div><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={15}/> Desktop</button><button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')}><Tablet size={15}/> Tablet</button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={15}/> Mobile</button></div><span>{widths[device]}px</span><button onClick={() => setShowPreview(false)}><Maximize2 size={15}/></button></header>
        <div className="preview-stage"><div className={`preview-document ${device}`} style={{ maxWidth: widths[device] }}>{previewData?.sections?.filter((section) => section.is_active).map((section) => <section key={section.id} className={selected?.id === section.id ? 'is-highlighted' : ''} onClick={() => setSelectedId(section.id)}><small>{section.title}</small><h3>{section.settings?.heading || section.title}</h3><p>{section.settings?.description || `Секція ${section.title} використовує реальні дані сторінки ${page}.`}</p>{section.settings?.image && <img src={section.settings.image} alt=""/>}{section.settings?.cta && <button>{section.settings.cta}</button>}</section>)}</div></div>
      </aside>}
    </div>
    <AdminSaveDock dirty={dirty} saving={saving} onSave={() => saveSections()} onCancel={cancelChanges} title="Є зміни у структурі сторінки" description="Автозбереження увімкнено. Можна зберегти зараз або скасувати." saveLabel="Зберегти зараз"/>
  </div>
}
