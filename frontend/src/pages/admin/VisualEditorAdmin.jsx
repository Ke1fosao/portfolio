import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Image,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const pages = [
  ['home', 'Головна', 'Перший екран, послуги, кейси, CTA'],
  ['about', 'Про мене', 'Історія, шлях, документи'],
  ['projects', 'Проєкти', 'Каталог робіт і фільтри'],
  ['services', 'Послуги', 'Пакети послуг і процес'],
  ['pricing', 'Ціни', 'Прайс і FAQ'],
  ['blog', 'Блог', 'Список статей'],
  ['contact', 'Контакти', 'Форма і канали звʼязку'],
]

const widths = { desktop: 1180, tablet: 820, mobile: 390 }
const draftKey = (page) => `portfolio_editor_draft_${page}`

const countFilled = (section = {}) => {
  const settings = section.settings || {}
  return ['title', 'icon', 'heading', 'description', 'cta', 'image']
    .filter((key) => String(key in section ? section[key] : settings[key] || '').trim()).length
}

const sectionScore = (section) => Math.round((countFilled(section) / 6) * 100)

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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const saveTimer = useRef(null)

  const selected = useMemo(() => sections.find((section) => section.id === selectedId) || sections[0], [sections, selectedId])
  const dirty = useMemo(() => JSON.stringify(sections) !== JSON.stringify(baseline), [sections, baseline])
  const saving = saveState === 'Збереження'
  const pageMeta = pages.find(([value]) => value === page) || pages[0]
  const activeCount = sections.filter((section) => section.is_active).length
  const hiddenCount = sections.length - activeCount
  const readiness = sections.length ? Math.round(sections.reduce((sum, section) => sum + sectionScore(section), 0) / sections.length) : 0

  const refreshPreview = async (targetPage = page, localSections = sections) => {
    try {
      const response = await api.get(`/editor-preview/?page=${targetPage}`)
      setPreviewData({ ...response.data, sections: localSections })
    } catch {
      setPreviewData({ page: targetPage, sections: localSections })
      notify('Preview тимчасово працює в локальному режимі.', { type: 'warning' })
    }
  }

  const load = async (targetPage = page) => {
    setLoading(true)
    setLoadError('')
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
        } catch {
          localStorage.removeItem(draftKey(targetPage))
        }
      } else {
        setSaveState('Усі зміни збережено')
      }
      setBaseline(serverSections)
      setSections(loaded)
      setSelectedId(loaded[0]?.id || null)
      await refreshPreview(targetPage, loaded)
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Не вдалося завантажити візуальний редактор.'
      setLoadError(detail)
      notify(detail, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    return () => window.clearTimeout(saveTimer.current)
  }, [page])

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
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
      notify('Візуальний редактор збережено.')
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
      const accepted = await confirm({
        title: 'Перейти на іншу сторінку?',
        description: 'Незбережені зміни поточної сторінки буде скасовано.',
        confirmLabel: 'Перейти',
        tone: 'danger',
      })
      if (!accepted) return
      window.clearTimeout(saveTimer.current)
      localStorage.removeItem(draftKey(page))
    }
    setPage(nextPage)
  }

  const updateSection = (patch) => {
    if (!selected) return
    queueSave(sections.map((section) => section.id === selected.id ? { ...section, ...patch } : section))
  }

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
    if (!current) return
    const rest = sections.filter((section) => section.id !== dragging)
    const targetIndex = rest.findIndex((section) => section.id === targetId)
    const next = [...rest.slice(0, targetIndex), current, ...rest.slice(targetIndex)]
    setDragging(null)
    queueSave(next.map((section, order) => ({ ...section, order })))
  }

  const duplicateSection = async (section) => {
    try {
      const response = await api.post('/page-sections/', {
        page,
        section_type: `${section.section_type}-${Date.now()}`,
        title: `${section.title} копія`,
        icon: section.icon,
        order: sections.length,
        is_active: section.is_active,
        settings: section.settings || {},
      })
      const next = [...sections, response.data]
      queueSave(next)
      setSelectedId(response.data.id)
      notify('Секцію продубльовано.')
    } catch {
      notify('Не вдалося дублювати секцію.', { type: 'error' })
    }
  }

  const deleteSection = async (section) => {
    if (section.is_system) {
      notify('Системну секцію не можна видалити. Її можна приховати.', { type: 'warning' })
      return
    }
    const accepted = await confirm({
      title: `Видалити секцію "${section.title}"?`,
      description: 'Секція зникне зі сторінки. Дію буде записано в історію.',
      confirmLabel: 'Видалити секцію',
      tone: 'danger',
    })
    if (!accepted) return
    try {
      await api.delete(`/page-sections/${section.id}/`)
      const next = sections.filter((item) => item.id !== section.id)
      setSections(next)
      setBaseline(next)
      setSelectedId(next[0]?.id || null)
      await refreshPreview(page, next)
      notify('Секцію видалено.', { type: 'warning' })
    } catch {
      notify('Не вдалося видалити секцію.', { type: 'error' })
    }
  }

  const seedDefaults = async () => {
    try {
      await api.post('/page-sections/seed_defaults/', { page })
      await load(page)
      notify('Базові секції підключено.')
    } catch {
      notify('Не вдалося створити базові секції.', { type: 'error' })
    }
  }

  return <div className="visual-editor ve2">
    <section className="ve2-hero">
      <div>
        <span className="ve2-eyebrow"><Sparkles size={15}/> Content command center</span>
        <h1>Візуальний редактор сторінок</h1>
        <p>Керуй секціями, порядком, видимістю і ключовими текстами з живим preview для desktop, tablet та mobile.</p>
      </div>
      <div className="ve2-hero-panel">
        <div><strong>{sections.length}</strong><span>секцій</span></div>
        <div><strong>{activeCount}</strong><span>активні</span></div>
        <div><strong>{readiness}%</strong><span>готовність</span></div>
      </div>
    </section>

    <div className="ve2-toolbar">
      <div>
        <AdminSelect value={page} onChange={changePage} options={pages.map(([value, label, hint]) => ({ value, label, hint }))}/>
        <span>{pageMeta[2]}</span>
      </div>
      <div>
        <button className="btn btn-light" type="button" onClick={() => setShowPreview((value) => !value)}>{showPreview ? <EyeOff size={16}/> : <Eye size={16}/>} {showPreview ? 'Сховати preview' : 'Показати preview'}</button>
        <button className="btn btn-light" type="button" onClick={() => refreshPreview()}><RefreshCw size={16}/> Оновити</button>
        <a className="btn btn-light" href={`/admin/versions?entity_type=pagesection${selected ? `&entity_id=${selected.id}` : ''}`}><History size={16}/> Версії</a>
        <a className="btn btn-dark" href="/" target="_blank" rel="noreferrer">Відкрити сайт <ArrowUpRight size={16}/></a>
      </div>
    </div>

    {loading && <section className="ve2-loading"><Loader2 className="admin-spin" size={22}/><strong>Завантажуємо редактор...</strong><span>Підтягуємо секції сторінки і preview.</span></section>}

    {!loading && loadError && <section className="ve2-error">
      <strong>Не вдалося завантажити візуальний редактор.</strong>
      <p>{loadError}</p>
      <button className="btn btn-dark" type="button" onClick={() => load(page)}><RefreshCw size={16}/> Спробувати ще раз</button>
    </section>}

    {!loading && !loadError && <div className={`ve2-workspace ${showPreview ? '' : 'no-preview'}`}>
      <aside className="ve2-section-list">
        <header>
          <div>
            <strong>Структура</strong>
            <span>{hiddenCount ? `${hiddenCount} приховано` : 'усе видиме'}</span>
          </div>
          <button type="button" onClick={seedDefaults} aria-label="Додати базові секції"><Plus size={17}/></button>
        </header>

        {!sections.length && <div className="ve2-empty">
          <LayoutTemplate size={28}/>
          <strong>Секцій ще немає</strong>
          <p>Створи базову структуру для цієї сторінки.</p>
          <button type="button" onClick={seedDefaults}>Створити секції</button>
        </div>}

        {sections.map((section, index) => <article
          key={section.id}
          className={selected?.id === section.id ? 'is-selected' : ''}
          draggable
          onDragStart={() => setDragging(section.id)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOn(section.id)}
          onClick={() => setSelectedId(section.id)}
        >
          <GripVertical size={16}/>
          <span>
            <b>{section.title}</b>
            <small>{section.section_type} · {sectionScore(section)}%</small>
          </span>
          {!section.is_active && <i>hidden</i>}
          <div>
            <button type="button" onClick={(event) => { event.stopPropagation(); moveSection(index, -1) }} aria-label="Підняти секцію"><ArrowUp size={14}/></button>
            <button type="button" onClick={(event) => { event.stopPropagation(); moveSection(index, 1) }} aria-label="Опустити секцію"><ArrowDown size={14}/></button>
          </div>
        </article>)}
      </aside>

      <main className="ve2-editor">
        {selected ? <section className="ve2-card">
          <header className="ve2-card-head">
            <div>
              <span>Секція #{String(sections.findIndex((item) => item.id === selected.id) + 1).padStart(2, '0')}</span>
              <h2>{selected.title}</h2>
              <p>Preview праворуч оновлюється одразу, а автозбереження відправляє зміни на сервер із затримкою.</p>
            </div>
            <div className={`ve2-status ${selected.is_active ? 'is-live' : 'is-hidden'}`}>
              {selected.is_active ? <Eye size={15}/> : <EyeOff size={15}/>}
              {selected.is_active ? 'На сайті' : 'Приховано'}
            </div>
          </header>

          <div className="ve2-health">
            <div><span style={{ width: `${sectionScore(selected)}%` }}/></div>
            <strong>{sectionScore(selected)}%</strong>
            <small>заповнення секції</small>
          </div>

          <div className="ve2-fields">
            <label><span>Назва секції</span><input value={selected.title || ''} onChange={(event) => updateSection({ title: event.target.value })}/></label>
            <label><span>Іконка / ключ</span><input value={selected.icon || ''} onChange={(event) => updateSection({ icon: event.target.value })}/></label>
            <label className="wide"><span>Заголовок у preview</span><input value={selected.settings?.heading || ''} onChange={(event) => updateSettings('heading', event.target.value)} placeholder={selected.title}/></label>
            <label className="wide"><span>Опис</span><textarea value={selected.settings?.description || ''} onChange={(event) => updateSettings('description', event.target.value)} placeholder="Коротко поясни, що має показувати ця секція."/></label>
            <label><span>CTA текст</span><input value={selected.settings?.cta || ''} onChange={(event) => updateSettings('cta', event.target.value)} placeholder="Написати в Telegram"/></label>
            <label><span>Зображення URL</span><input value={selected.settings?.image || ''} onChange={(event) => updateSettings('image', event.target.value)} placeholder="/media/... або https://"/></label>
          </div>

          <div className="ve2-quick-actions">
            <button className="btn btn-light" type="button" onClick={() => updateSection({ is_active: !selected.is_active })}>{selected.is_active ? <EyeOff size={16}/> : <Eye size={16}/>} {selected.is_active ? 'Приховати' : 'Показати'}</button>
            <button className="btn btn-light" type="button" onClick={() => duplicateSection(selected)}><Copy size={16}/> Дублювати</button>
            <button className="btn btn-light" type="button" onClick={() => saveSections()}><Save size={16}/> Зберегти зараз</button>
            <button className="btn admin-danger-btn" type="button" onClick={() => deleteSection(selected)}><Trash2 size={16}/> Видалити</button>
          </div>
        </section> : <section className="ve2-card ve2-empty-editor"><LayoutTemplate size={36}/><strong>Оберіть секцію</strong><p>Після вибору тут зʼявляться поля редагування.</p></section>}
      </main>

      {showPreview && <aside className="ve2-preview">
        <header>
          <div>
            <button className={device === 'desktop' ? 'active' : ''} type="button" onClick={() => setDevice('desktop')}><Monitor size={15}/> Desktop</button>
            <button className={device === 'tablet' ? 'active' : ''} type="button" onClick={() => setDevice('tablet')}><Tablet size={15}/> Tablet</button>
            <button className={device === 'mobile' ? 'active' : ''} type="button" onClick={() => setDevice('mobile')}><Smartphone size={15}/> Mobile</button>
          </div>
          <span>{widths[device]}px</span>
          <button type="button" onClick={() => setShowPreview(false)} aria-label="Сховати preview"><Maximize2 size={15}/></button>
        </header>
        <div className="ve2-preview-stage">
          <div className={`ve2-preview-document ${device}`} style={{ maxWidth: widths[device] }}>
            {(previewData?.sections || sections).filter((section) => section.is_active).map((section) => <section key={section.id} className={selected?.id === section.id ? 'is-highlighted' : ''} onClick={() => setSelectedId(section.id)}>
              <small>{section.title}</small>
              <h3>{section.settings?.heading || section.title}</h3>
              <p>{section.settings?.description || `Секція "${section.title}" підключена до сторінки "${pageMeta[1]}".`}</p>
              {section.settings?.image ? <img src={section.settings.image} alt=""/> : <div className="ve2-image-placeholder"><Image size={22}/><span>Місце для візуалу</span></div>}
              {section.settings?.cta && <button type="button">{section.settings.cta}</button>}
            </section>)}
            {!activeCount && <div className="ve2-preview-empty"><EyeOff size={24}/><strong>Немає активних секцій</strong><p>Увімкни хоча б одну секцію, щоб побачити preview.</p></div>}
          </div>
        </div>
      </aside>}
    </div>}

    <AdminSaveDock
      dirty={dirty}
      saving={saving}
      onSave={() => saveSections()}
      onCancel={cancelChanges}
      title="Є зміни у структурі сторінки"
      description="Автозбереження увімкнено, але можна зберегти вручну."
      saveLabel="Зберегти зараз"
    />
  </div>
}
