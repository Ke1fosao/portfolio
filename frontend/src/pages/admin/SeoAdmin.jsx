import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clipboard,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  FileSearch,
  Globe2,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { AdminSaveDock, AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const seoFilters = [
  ['', 'Усі сторінки'],
  ['ready', 'Готові'],
  ['issues', 'Потребують уваги'],
  ['missing_title', 'Без title'],
  ['missing_description', 'Без description'],
  ['missing_og', 'Без OG-зображення'],
  ['noindex', 'Noindex'],
]

const pageLabels = {
  home: 'Головна',
  about: 'Про мене',
  projects: 'Проєкти',
  services: 'Послуги',
  pricing: 'Ціни',
  blog: 'Блог',
  contact: 'Контакти',
  'work-terms': 'Умови роботи',
  privacy: 'Конфіденційність',
  terms: 'Умови використання',
}

const editorTabs = [
  ['main', 'Основне', SearchCheck],
  ['social', 'Соцмережі', MessageSquareText],
  ['indexing', 'Індексація', ShieldCheck],
  ['diagnostics', 'Перевірка', FileSearch],
]

const editableFields = [
  'page_key', 'content_type', 'object_id', 'path', 'seo_title', 'seo_description', 'slug',
  'canonical_url', 'og_title', 'og_description', 'og_image', 'og_image_url', 'index', 'follow',
  'focus_keyword', 'structured_data',
]

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function getErrorMessage(error) {
  if (error?.response?.status === 403) return 'Для цього акаунта немає доступу до SEO-налаштувань.'
  if (error?.response?.status === 401) return 'Сесія завершилась. Увійди в адмінку повторно.'
  if (error?.response?.status >= 500) return 'Backend не зміг прочитати SEO-таблицю. Перезапусти backend — міграції тепер застосовуються автоматично.'
  if (error?.code === 'ECONNABORTED') return 'Backend відповідає надто довго. Перевір, чи запущений Django-сервер.'
  return error?.response?.data?.detail || 'Не вдалося отримати SEO-дані з backend.'
}

function displayName(item) {
  return pageLabels[item?.page_key] || item?.page_key || item?.path || 'Сторінка'
}

function isReady(item) {
  return !item?.issues?.length
}

function matchesFilter(item, filter) {
  if (!filter) return true
  if (filter === 'ready') return isReady(item)
  if (filter === 'issues') return Boolean(item?.issues?.length)
  if (filter === 'missing_title') return !item?.seo_title
  if (filter === 'missing_description') return !item?.seo_description
  if (filter === 'missing_og') return !item?.og_image_url_resolved && !item?.og_image_url
  if (filter === 'noindex') return !item?.index
  return true
}

function fieldScore(item) {
  if (!item) return 0
  const checks = [
    Boolean(item.seo_title),
    Boolean(item.seo_description),
    Boolean(item.canonical_url),
    Boolean(item.og_title || item.seo_title),
    Boolean(item.og_description || item.seo_description),
    Boolean(item.og_image_url_resolved || item.og_image_url),
    Boolean(item.focus_keyword),
    Boolean(item.index),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function lengthTone(value, min, max) {
  const length = String(value || '').trim().length
  if (!length) return 'empty'
  if (length < min || length > max) return 'warn'
  return 'good'
}

function cleanPayload(item) {
  return editableFields.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(item, key)) result[key] = item[key]
    return result
  }, {})
}

function SeoSkeleton() {
  return <div className="seo2-skeleton">
    {Array.from({ length: 6 }).map((_, index) => <div key={index}><span/><strong/><small/></div>)}
  </div>
}

export default function SeoAdmin() {
  const { confirm, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [schemaText, setSchemaText] = useState('{}')
  const [schemaError, setSchemaError] = useState('')

  const dirty = useMemo(
    () => Boolean(selected && baseline && JSON.stringify(selected) !== JSON.stringify(baseline)),
    [selected, baseline],
  )

  const load = async ({ selectId, silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await api.get('/seo-metadata/')
      let data = unwrap(response)
      if (!Array.isArray(data)) data = []

      if (!data.length) {
        const seeded = await api.post('/seo-metadata/seed_defaults/')
        data = unwrap(seeded)
        if (!Array.isArray(data)) data = []
      }

      setItems(data)
      const targetId = selectId || selected?.id
      const next = data.find((item) => item.id === targetId) || data[0] || null
      if (!dirty || !selected) {
        setSelected(clone(next))
        setBaseline(clone(next))
        setSchemaText(JSON.stringify(next?.structured_data || {}, null, 2))
        setSchemaError('')
      }
    } catch (loadError) {
      setItems([])
      setSelected(null)
      setBaseline(null)
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false
      if (!needle) return true
      return [displayName(item), item.page_key, item.path, item.seo_title, item.seo_description, item.focus_keyword]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    })
  }, [items, query, filter])

  const stats = useMemo(() => ({
    total: items.length,
    ready: items.filter(isReady).length,
    issues: items.reduce((sum, item) => sum + (item.issues?.length || 0), 0),
    noindex: items.filter((item) => !item.index).length,
  }), [items])

  const update = (field, value) => setSelected((current) => ({ ...current, [field]: value }))

  const choose = async (item) => {
    if (selected?.id === item.id) return
    if (dirty) {
      const accepted = await confirm({
        title: 'Перейти до іншої сторінки?',
        description: 'Незбережені SEO-зміни поточної сторінки буде втрачено.',
        confirmLabel: 'Перейти без збереження',
        tone: 'danger',
      })
      if (!accepted) return
    }
    const next = clone(item)
    setSelected(next)
    setBaseline(clone(item))
    setSchemaText(JSON.stringify(item.structured_data || {}, null, 2))
    setSchemaError('')
    setTab('main')
  }

  const saveSelected = async () => {
    if (!selected || schemaError) return
    setSaving(true)
    try {
      const response = await api.patch(`/seo-metadata/${selected.id}/`, cleanPayload(selected))
      const saved = response.data
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setSelected(clone(saved))
      setBaseline(clone(saved))
      setSchemaText(JSON.stringify(saved.structured_data || {}, null, 2))
      notify('SEO-налаштування сторінки збережено.')
    } catch (saveError) {
      notify(saveError?.response?.data?.detail || 'Не вдалося зберегти SEO.', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const seed = async () => {
    setSeeding(true)
    try {
      const response = await api.post('/seo-metadata/seed_defaults/')
      const data = unwrap(response)
      const list = Array.isArray(data) ? data : []
      setItems(list)
      const next = list.find((item) => item.id === selected?.id) || list[0] || null
      setSelected(clone(next))
      setBaseline(clone(next))
      setSchemaText(JSON.stringify(next?.structured_data || {}, null, 2))
      setError('')
      notify('Базові SEO-записи синхронізовано.')
    } catch (seedError) {
      setError(getErrorMessage(seedError))
      notify('Не вдалося синхронізувати SEO-записи.', { type: 'error' })
    } finally {
      setSeeding(false)
    }
  }

  const resetSelected = () => {
    const next = clone(baseline)
    setSelected(next)
    setSchemaText(JSON.stringify(next?.structured_data || {}, null, 2))
    setSchemaError('')
  }

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value || '')
      notify(`${label} скопійовано.`)
    } catch {
      notify('Не вдалося скопіювати значення.', { type: 'error' })
    }
  }

  const handleSchema = (value) => {
    setSchemaText(value)
    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      setSchemaError('')
      update('structured_data', parsed)
    } catch {
      setSchemaError('JSON має синтаксичну помилку.')
    }
  }

  const fillSocialFromSeo = () => {
    setSelected((current) => ({
      ...current,
      og_title: current.og_title || current.seo_title || '',
      og_description: current.og_description || current.seo_description || '',
    }))
    notify('OG title та description заповнено з SEO-полів.')
  }

  return <div className="seo2-page">
    <header className="seo2-topbar">
      <div className="seo2-title">
        <span><SearchCheck size={18}/></span>
        <div><h1>SEO-контроль</h1><p>Метадані, індексація й вигляд сторінок у пошуку.</p></div>
      </div>
      <div className="seo2-top-actions">
        <button className="seo2-button ghost" onClick={() => load({ silent: true })} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/> Оновити</button>
        <button className="seo2-button primary" onClick={seed} disabled={seeding}><Sparkles size={16}/>{seeding ? 'Синхронізація…' : 'Синхронізувати сторінки'}</button>
      </div>
    </header>

    <section className="seo2-stats">
      <button onClick={() => setFilter('')} className={!filter ? 'active' : ''}><span className="blue"><Globe2 size={18}/></span><div><small>Сторінок</small><strong>{stats.total}</strong><p>У SEO-каталозі</p></div></button>
      <button onClick={() => setFilter('ready')} className={filter === 'ready' ? 'active' : ''}><span className="green"><CheckCircle2 size={18}/></span><div><small>Готові</small><strong>{stats.ready}</strong><p>Без базових проблем</p></div></button>
      <button onClick={() => setFilter('issues')} className={filter === 'issues' ? 'active' : ''}><span className="amber"><TriangleAlert size={18}/></span><div><small>Зауважень</small><strong>{stats.issues}</strong><p>Потребують виправлення</p></div></button>
      <button onClick={() => setFilter('noindex')} className={filter === 'noindex' ? 'active' : ''}><span className="violet"><EyeOff size={18}/></span><div><small>Noindex</small><strong>{stats.noindex}</strong><p>Не потрапляють у Google</p></div></button>
    </section>

    <section className="seo2-toolbar">
      <label className="seo2-search">
        <Search size={19}/>
        <span><small>Швидкий пошук</small><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва, URL, ключова фраза…"/></span>
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистити пошук"><X size={16}/></button>}
      </label>
      <div className="seo2-filter"><span>Показати</span><AdminSelect value={filter} onChange={setFilter} options={seoFilters}/></div>
      <div className="seo2-result-count"><strong>{visibleItems.length}</strong><span>із {items.length}</span></div>
    </section>

    {error && <section className="seo2-error">
      <span><AlertCircle size={22}/></span>
      <div><strong>SEO-дані не завантажилися</strong><p>{error}</p><small>Файл запуску backend тепер сам виконує міграції перед стартом сервера.</small></div>
      <button onClick={() => load()}><RefreshCw size={16}/> Спробувати ще раз</button>
    </section>}

    <section className="seo2-workspace">
      <aside className="seo2-library">
        <div className="seo2-library-head"><div><strong>Сторінки сайту</strong><small>Обери сторінку для редагування</small></div><span>{visibleItems.length}</span></div>
        {loading ? <SeoSkeleton/> : visibleItems.length ? <div className="seo2-list">{visibleItems.map((item) => {
          const active = selected?.id === item.id
          const score = fieldScore(item)
          return <button key={item.id} className={active ? 'active' : ''} onClick={() => choose(item)}>
            <span className={`seo2-page-icon ${isReady(item) ? 'ready' : item.index ? 'warning' : 'hidden'}`}>{isReady(item) ? <Check size={16}/> : item.index ? <TriangleAlert size={16}/> : <EyeOff size={16}/>}</span>
            <div className="seo2-list-copy"><strong>{displayName(item)}</strong><small>{item.path || `/${item.slug || ''}`}</small><div><i style={{ '--progress': `${score}%` }}/><span>{score}%</span></div></div>
            <span className={`seo2-issue-count ${isReady(item) ? 'ready' : ''}`}>{isReady(item) ? 'OK' : item.issues.length}</span>
            <ChevronRight size={16}/>
          </button>
        })}</div> : !error && <div className="seo2-empty"><FileSearch size={34}/><strong>Нічого не знайдено</strong><p>Зміни пошук або фільтр. Якщо записів немає зовсім — синхронізуй базові сторінки.</p><button onClick={seed}><Sparkles size={16}/> Створити SEO-записи</button></div>}
      </aside>

      <main className="seo2-editor">
        {!selected ? <div className="seo2-editor-empty"><SearchCheck size={42}/><strong>{loading ? 'Завантаження SEO…' : 'Обери сторінку'}</strong><p>Налаштування, preview та перевірка з’являться тут.</p></div> : <>
          <div className="seo2-editor-head">
            <div><span className={isReady(selected) ? 'ready' : 'warning'}>{isReady(selected) ? <CheckCircle2 size={15}/> : <TriangleAlert size={15}/>} {isReady(selected) ? 'SEO готове' : `${selected.issues?.length || 0} зауважень`}</span><h2>{displayName(selected)}</h2><p>{selected.path || `/${selected.slug || ''}`}</p></div>
            <div>
              <button onClick={() => copyValue(selected.canonical_url || selected.path, 'URL')} title="Скопіювати URL"><Clipboard size={16}/></button>
              <a href={selected.path || '/'} target="_blank" rel="noreferrer" title="Відкрити сторінку"><ExternalLink size={16}/></a>
            </div>
          </div>

          <nav className="seo2-tabs">{editorTabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={16}/><span>{label}</span>{key === 'diagnostics' && selected.issues?.length > 0 && <b>{selected.issues.length}</b>}</button>)}</nav>

          <div className="seo2-editor-scroll">
            {tab === 'main' && <div className="seo2-tab-content">
              <div className="seo2-section-heading"><div><span>ПОШУКОВА ВИДАЧА</span><h3>Як сторінка виглядатиме у Google</h3></div><a href="https://www.google.com/search" target="_blank" rel="noreferrer">Відкрити Google <ArrowUpRight size={14}/></a></div>
              <div className="seo2-google-preview">
                <div className="seo2-google-site"><i>DK</i><span><strong>{typeof window !== 'undefined' ? window.location.host : 'dmytro.dev'}</strong><small>{selected.canonical_url || selected.path || '/'}</small></span></div>
                <h4>{selected.seo_title || 'SEO title ще не задано'}</h4>
                <p>{selected.seo_description || 'Додай зрозумілий опис сторінки, щоб користувач одразу побачив її користь у пошуку.'}</p>
              </div>

              <div className="seo2-form-grid">
                <label className="wide"><span>SEO title <b className={lengthTone(selected.seo_title, 25, 70)}>{String(selected.seo_title || '').length}/70</b></span><input value={selected.seo_title || ''} onChange={(event) => update('seo_title', event.target.value)} placeholder="Назва сторінки для Google"/><small>Оптимально 25–70 символів. Головна фраза — ближче до початку.</small></label>
                <label className="wide"><span>SEO description <b className={lengthTone(selected.seo_description, 70, 170)}>{String(selected.seo_description || '').length}/170</b></span><textarea value={selected.seo_description || ''} onChange={(event) => update('seo_description', event.target.value)} placeholder="Коротко поясни, що отримає людина на сторінці"/><small>Оптимально 70–170 символів. Пиши природно, без переліку ключів через кому.</small></label>
                <label><span>Фокусна фраза</span><input value={selected.focus_keyword || ''} onChange={(event) => update('focus_keyword', event.target.value)} placeholder="Наприклад: розробка сайтів Рівне"/><small>Одна основна тема сторінки.</small></label>
                <label><span>Slug</span><div className="seo2-input-action"><input value={selected.slug || ''} onChange={(event) => update('slug', event.target.value)} placeholder="about"/><button type="button" onClick={() => copyValue(selected.slug, 'Slug')}><Clipboard size={14}/></button></div><small>Без пробілів, коротко й зрозуміло.</small></label>
                <label className="wide"><span>Canonical URL</span><div className="seo2-input-action"><Link2 size={16}/><input value={selected.canonical_url || ''} onChange={(event) => update('canonical_url', event.target.value)} placeholder="/about або https://site.com/about"/><button type="button" onClick={() => copyValue(selected.canonical_url, 'Canonical URL')}><Clipboard size={14}/></button></div><small>Основна адреса сторінки, яку повинен індексувати Google.</small></label>
              </div>
            </div>}

            {tab === 'social' && <div className="seo2-tab-content">
              <div className="seo2-section-heading"><div><span>OPEN GRAPH</span><h3>Preview у Telegram, Facebook та LinkedIn</h3></div><button onClick={fillSocialFromSeo}><RotateCcw size={14}/> Заповнити з SEO</button></div>
              <div className="seo2-social-preview">
                <div className="seo2-social-image">{selected.og_image_url_resolved || selected.og_image_url ? <img src={selected.og_image_url_resolved || selected.og_image_url} alt="Open Graph preview"/> : <div><ImageIcon size={28}/><strong>1200 × 630</strong><span>Додай OG-зображення</span></div>}</div>
                <div><small>{typeof window !== 'undefined' ? window.location.host.toUpperCase() : 'DMYTRO.DEV'}</small><strong>{selected.og_title || selected.seo_title || 'Заголовок для соцмереж'}</strong><p>{selected.og_description || selected.seo_description || 'Опис, який буде видно під посиланням.'}</p></div>
              </div>
              <div className="seo2-form-grid">
                <label className="wide"><span>OG title <b className={lengthTone(selected.og_title || selected.seo_title, 20, 80)}>{String(selected.og_title || '').length}/80</b></span><input value={selected.og_title || ''} onChange={(event) => update('og_title', event.target.value)} placeholder={selected.seo_title || 'Заголовок для соцмереж'}/><small>Може бути емоційнішим за SEO title.</small></label>
                <label className="wide"><span>OG description <b className={lengthTone(selected.og_description || selected.seo_description, 40, 200)}>{String(selected.og_description || '').length}/200</b></span><textarea value={selected.og_description || ''} onChange={(event) => update('og_description', event.target.value)} placeholder={selected.seo_description || 'Опис для прев’ю посилання'}/></label>
                <label className="wide"><span>OG image URL</span><div className="seo2-input-action"><ImageIcon size={16}/><input value={selected.og_image_url || ''} onChange={(event) => update('og_image_url', event.target.value)} placeholder="https://site.com/image.jpg або /assets/og-image.png"/>{selected.og_image_url && <button type="button" onClick={() => update('og_image_url', '')}><X size={14}/></button>}</div><small>Рекомендований формат — 1200×630 px, JPG або PNG.</small></label>
              </div>
            </div>}

            {tab === 'indexing' && <div className="seo2-tab-content">
              <div className="seo2-section-heading"><div><span>РОБОТИ ПОШУКОВИХ СИСТЕМ</span><h3>Індексація та технічні сигнали</h3></div></div>
              <div className="seo2-switch-grid">
                <button className={selected.index ? 'enabled' : 'disabled'} onClick={() => update('index', !selected.index)}><span>{selected.index ? <Eye size={20}/> : <EyeOff size={20}/>}</span><div><strong>{selected.index ? 'Index увімкнено' : 'Noindex увімкнено'}</strong><p>{selected.index ? 'Google може додати сторінку до пошуку.' : 'Сторінка прихована від пошукової видачі.'}</p></div><i>{selected.index ? 'INDEX' : 'NOINDEX'}</i></button>
                <button className={selected.follow ? 'enabled' : 'disabled'} onClick={() => update('follow', !selected.follow)}><span>{selected.follow ? <Link2 size={20}/> : <EyeOff size={20}/>}</span><div><strong>{selected.follow ? 'Follow увімкнено' : 'Nofollow увімкнено'}</strong><p>{selected.follow ? 'Пошуковик може переходити за посиланнями.' : 'Пошуковик не повинен передавати вагу посиланням.'}</p></div><i>{selected.follow ? 'FOLLOW' : 'NOFOLLOW'}</i></button>
              </div>
              <div className="seo2-robots-preview"><div><Code2 size={17}/><strong>robots meta</strong></div><code>&lt;meta name="robots" content="{selected.index ? 'index' : 'noindex'},{selected.follow ? 'follow' : 'nofollow'},max-image-preview:large" /&gt;</code></div>
              <div className="seo2-form-grid">
                <label><span>Шлях сторінки</span><input value={selected.path || ''} onChange={(event) => update('path', event.target.value)} placeholder="/about"/><small>Повинен збігатися з маршрутом сайту.</small></label>
                <label><span>Тип контенту</span><input value={selected.content_type || 'page'} onChange={(event) => update('content_type', event.target.value)} placeholder="page"/><small>Для звичайної сторінки залиш `page`.</small></label>
                <label className="wide"><span>Structured data (JSON-LD) {schemaError && <b className="warn">{schemaError}</b>}</span><textarea className="seo2-code-input" value={schemaText} onChange={(event) => handleSchema(event.target.value)} spellCheck="false"/><small>Додаткові структуровані дані. Порожній об’єкт {'{}'} — нормальний варіант.</small></label>
              </div>
            </div>}

            {tab === 'diagnostics' && <div className="seo2-tab-content">
              <div className="seo2-section-heading"><div><span>ДІАГНОСТИКА</span><h3>Що вже добре, а що варто виправити</h3></div><span className={`seo2-score ${fieldScore(selected) >= 75 ? 'good' : ''}`}>{fieldScore(selected)}%</span></div>
              <div className="seo2-progress"><i style={{ width: `${fieldScore(selected)}%` }}/></div>
              <div className="seo2-checklist">
                {[
                  ['SEO title', Boolean(selected.seo_title), 'Додай унікальний заголовок сторінки.'],
                  ['Довжина title', lengthTone(selected.seo_title, 25, 70) === 'good', 'Рекомендовано 25–70 символів.'],
                  ['SEO description', Boolean(selected.seo_description), 'Опиши користь сторінки для людини.'],
                  ['Довжина description', lengthTone(selected.seo_description, 70, 170) === 'good', 'Рекомендовано 70–170 символів.'],
                  ['Canonical URL', Boolean(selected.canonical_url), 'Вкажи основну адресу сторінки.'],
                  ['Open Graph зображення', Boolean(selected.og_image_url_resolved || selected.og_image_url), 'Додай зображення 1200×630.'],
                  ['Фокусна фраза', Boolean(selected.focus_keyword), 'Визнач одну головну тему.'],
                  ['Дозволена індексація', Boolean(selected.index), 'Noindex використовуй лише свідомо.'],
                ].map(([title, done, hint]) => <div key={title} className={done ? 'done' : ''}><span>{done ? <Check size={16}/> : <CircleDot size={16}/>}</span><div><strong>{title}</strong><p>{done ? 'Готово.' : hint}</p></div>{done ? <small>OK</small> : <small>ВИПРАВИТИ</small>}</div>)}
              </div>
              <div className="seo2-api-issues"><strong>Зауваження backend-аналізатора</strong>{selected.issues?.length ? selected.issues.map((issue) => <p key={issue}><TriangleAlert size={15}/>{issue}</p>) : <p className="good"><CheckCircle2 size={15}/> Базових SEO-проблем не знайдено.</p>}</div>
            </div>}
          </div>
        </>}
      </main>
    </section>

    <AdminSaveDock dirty={dirty} saving={saving} onSave={saveSelected} onCancel={resetSelected} title="SEO сторінки змінено" description={schemaError || 'Збережи метадані або поверни попередні значення.'}/>
  </div>
}
