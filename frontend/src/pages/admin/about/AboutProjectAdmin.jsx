import { useMemo, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Check, CheckCircle2, CircleAlert,
  Eye, FileText, Gauge, Globe2, Image as ImageIcon, Layers3, Link2, Plus,
  RefreshCw, Rocket, Sparkles, Trash2, WandSparkles,
} from 'lucide-react'
import AboutAdminLayout from './AboutAdminLayout'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
import ImageCropUploader from '../../../components/admin/ImageCropUploader'
import ProjectMedia, { projectImage } from '../../../components/ProjectMedia'
import AdminField from '../../../components/admin/AdminField'
import { useAdminUI } from '../../../components/admin/AdminUI'

const tabs = [
  { key: 'content', label: 'Контент', description: 'Заголовок і головна історія кейсу', icon: FileText },
  { key: 'facts', label: 'Факти', description: 'Ключові цифри без ручного JSON', icon: Gauge },
  { key: 'media', label: 'Медіа', description: 'Обкладинка та подача продукту', icon: ImageIcon },
  { key: 'preview', label: 'Preview', description: 'Фінальний вигляд секції', icon: Eye },
]

function normalizeFacts(value) {
  if (Array.isArray(value)) return value.map((item) => ({ value: String(item?.value || ''), label: String(item?.label || '') }))
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? normalizeFacts(parsed) : []
  } catch { return [] }
}

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length
}

function ProjectFactEditor({ facts, onChange }) {
  const update = (index, key, value) => onChange(facts.map((fact, current) => current === index ? { ...fact, [key]: value } : fact))
  const remove = (index) => onChange(facts.filter((_, current) => current !== index))
  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= facts.length) return
    const next = [...facts]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const add = () => onChange([...facts, { value: '', label: '' }])

  return <section className="about-project-editor-card about-project-facts-card">
    <header className="about-project-card-head">
      <div><span>КЛЮЧОВІ ПОКАЗНИКИ</span><h3>Факти, які швидко пояснюють результат</h3><p>Додай короткі цифри або маркери. Вони відображаються під текстом кейсу на публічній сторінці.</p></div>
      <button type="button" className="about-project-add-fact" onClick={add}><Plus size={16}/> Додати факт</button>
    </header>
    <div className="about-project-fact-list">
      {facts.map((fact, index) => <article key={index} className="about-project-fact-row">
        <div className="about-project-fact-index">{String(index + 1).padStart(2, '0')}</div>
        <label><span>Значення</span><input value={fact.value} maxLength={18} placeholder="02" onChange={(event) => update(index, 'value', event.target.value)}/><small>{fact.value.length}/18</small></label>
        <label className="is-wide"><span>Підпис</span><input value={fact.label} maxLength={80} placeholder="тижні до запуску" onChange={(event) => update(index, 'label', event.target.value)}/><small>{fact.label.length}/80</small></label>
        <div className="about-project-fact-actions">
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Перемістити вище"><ArrowUp size={15}/></button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === facts.length - 1} aria-label="Перемістити нижче"><ArrowDown size={15}/></button>
          <button type="button" className="danger" onClick={() => remove(index)} aria-label="Видалити факт"><Trash2 size={15}/></button>
        </div>
      </article>)}
      {!facts.length && <div className="about-project-facts-empty"><Gauge size={30}/><h4>Фактів ще немає</h4><p>Додай щонайменше три короткі показники, щоб секція виглядала переконливо.</p><button type="button" onClick={add}><Plus size={15}/> Додати перший факт</button></div>}
    </div>
  </section>
}

export default function AboutProjectAdmin() {
  const fields = fieldsBySection.project
  const editor = useAboutAdmin(fields)
  const { confirm } = useAdminUI()
  const [activeTab, setActiveTab] = useState('content')

  const titleField = fields.find((field) => field[0] === 'babyland_title')
  const textField = fields.find((field) => field[0] === 'babyland_text')
  const facts = useMemo(() => normalizeFacts(editor.form.project_facts), [editor.form.project_facts])
  const titleWords = wordCount(editor.form.babyland_title)
  const textWords = wordCount(editor.form.babyland_text)
  const imageReady = Boolean(projectImage(editor.babyland))
  const checks = [
    { label: 'Сильний заголовок', done: titleWords >= 7 },
    { label: 'Опис пояснює результат', done: textWords >= 22 },
    { label: 'Не менше трьох фактів', done: facts.filter((fact) => fact.value && fact.label).length >= 3 },
    { label: 'Додана обкладинка', done: imageReady },
  ]
  const completion = Math.round((checks.filter((item) => item.done).length / checks.length) * 100)
  const liveUrl = editor.babyland?.live_url || 'https://babyland.com.ua/'

  const reset = async () => {
    if (!editor.dirty) return editor.reset()
    const approved = await confirm({
      title: 'Скасувати зміни в кейсі?',
      description: 'Текст і факти повернуться до останньої збереженої версії.',
      confirmLabel: 'Скасувати зміни',
      tone: 'danger',
    })
    if (approved) editor.reset()
  }

  if (editor.loading) return <div className="about-project-loading"><RefreshCw className="admin-spin"/><strong>Завантажуємо кейс BABY LAND…</strong><p>Готуємо контент, факти та медіа.</p></div>

  return <AboutAdminLayout
    sectionKey="project"
    title="Кейс BABY LAND"
    description="Керуй історією першого великого продукту як окремою презентацією, а не набором JSON-полів."
    onSave={editor.save}
    onCancel={reset}
    dirty={editor.dirty}
    saving={editor.saving}
    savingLabel="Зберегти кейс"
  >
    <div className="about-project-admin-v2">
      <section className="about-project-v3-summary">
        <div className="about-project-v3-thumb"><ProjectMedia project={editor.babyland} compact/></div>
        <div className="about-project-v3-copy"><small>КЕЙС BABY LAND</small><strong>{editor.form.babyland_title || 'Додай заголовок кейсу'}</strong><p>{titleWords + textWords} слів · {facts.length} фактів · {imageReady ? 'обкладинка додана' : 'без обкладинки'}</p></div>
        <div className="about-project-v3-health"><span><b>{completion}%</b><i style={{ width: `${completion}%` }}/></span><small>{checks.filter((item) => item.done).length} з {checks.length} перевірок</small></div>
        <div className="about-project-v3-links"><a href={liveUrl} target="_blank" rel="noreferrer"><Globe2 size={15}/> Сайт <ArrowUpRight size={14}/></a><a href="/about" target="_blank" rel="noreferrer"><Eye size={15}/> Preview</a></div>
      </section>

      <section className="about-project-workspace-v2">
        <nav className="about-project-tabs" aria-label="Розділи редактора">
          {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}><span><Icon size={18}/></span><div><strong>{tab.label}</strong><small>{tab.description}</small></div>{activeTab === tab.key && <ArrowRight size={16}/>}</button> })}
        </nav>

        <div className="about-project-workspace-grid">
          <main className="about-project-main-editor">
            {activeTab === 'content' && <section className="about-project-editor-card">
              <header className="about-project-card-head"><div><span>ІСТОРІЯ ПРОДУКТУ</span><h3>Сформулюй головну цінність кейсу</h3><p>Заголовок має зачепити, а опис — пояснити задачу, твою роль і реальний результат для бізнесу.</p></div><WandSparkles size={28}/></header>
              <div className="about-project-content-form">
                <AdminField spec={titleField} value={editor.form.babyland_title} onChange={editor.update}/>
                <div className="about-project-writing-hint"><span><Check size={15}/></span><div><strong>Формула сильного заголовка</strong><p>Контекст або проблема → переломний момент → результат. Оптимально 9–20 слів.</p></div><em className={titleWords >= 7 ? 'done' : ''}>{titleWords} слів</em></div>
                <AdminField spec={textField} value={editor.form.babyland_text} onChange={editor.update}/>
                <div className="about-project-writing-hint"><span><Layers3 size={15}/></span><div><strong>Що варто згадати</strong><p>Задача клієнта, твоя відповідальність, frontend, backend, база даних, заявки та адмінпанель.</p></div><em className={textWords >= 22 ? 'done' : ''}>{textWords} слів</em></div>
              </div>
            </section>}

            {activeTab === 'facts' && <ProjectFactEditor facts={facts} onChange={(next) => editor.update('project_facts', next)}/>} 

            {activeTab === 'media' && <div className="about-project-media-workspace">
              <ImageCropUploader
                title="Обкладинка публічного сайту"
                hint="Завантаж реальний скриншот головної BABY LAND. Він замінить демонстраційний макет тільки в частині публічного сайту — сцена адмінпанелі залишиться окремою."
                currentUrl={editor.babyland.uploaded_cover_url}
                uploadUrl={`/projects/${editor.babyland.slug || 'baby-land'}/upload_cover/`}
                removeUrl={`/projects/${editor.babyland.slug || 'baby-land'}/remove_cover/`}
                aspect={16 / 10}
                onUploaded={editor.setBabyland}
              />
              <section className="about-project-media-guide">
                <span><ImageIcon size={18}/></span><div><small>РЕКОМЕНДОВАНИЙ ФОРМАТ</small><h3>Чистий скриншот першого екрана</h3><p>Оптимально 1600×1000 px або більше, без браузерної рамки й зайвих вкладок. Інтерфейс сам додасть професійну презентацію.</p><ul><li><Check size={13}/>Формат JPG, PNG або WebP</li><li><Check size={13}/>Співвідношення 16:10</li><li><Check size={13}/>Головні елементи ближче до центру</li></ul></div>
              </section>
            </div>}

            {activeTab === 'preview' && <section className="about-project-preview-stage is-exact"><header><div><span>LIVE SECTION PREVIEW</span><h3>Точний вигляд секції на публічному сайті</h3><p>Тут рендериться той самий компонент AboutProject і ті самі стилі, а значення оновлюються ще до збереження.</p></div><a href="/about" target="_blank" rel="noreferrer">Відкрити сторінку <ArrowUpRight size={15}/></a></header><AboutSectionPreview sectionKey="project" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></section>}
          </main>

          <aside className="about-project-side-panel">
            <AboutSectionPreview sectionKey="project" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/>

            <section className="about-project-checklist">
              <header><div><small>ПЕРЕВІРКА КОНТЕНТУ</small><h3>{completion}% готовності</h3></div><span className={completion === 100 ? 'ready' : ''}>{completion === 100 ? <CheckCircle2/> : <CircleAlert/>}</span></header>
              <div className="about-project-progress"><i style={{ width: `${completion}%` }}/></div>
              <div className="about-project-check-items">{checks.map((item) => <button key={item.label} type="button" className={item.done ? 'done' : ''} onClick={() => setActiveTab(item.label.includes('обкладинка') ? 'media' : item.label.includes('факт') ? 'facts' : 'content')}><span>{item.done ? <Check size={13}/> : <CircleAlert size={13}/>}</span><strong>{item.label}</strong><ArrowRight size={14}/></button>)}</div>
            </section>

            <section className="about-project-link-card"><span><Link2 size={18}/></span><div><small>ПУБЛІЧНИЙ КЕЙС</small><strong>/projects/baby-land</strong><p>Окрема детальна сторінка проєкту використовує дані з менеджера портфоліо.</p></div><a href="/admin/projects" className="about-project-manage-link">Керувати проєктом <ArrowRight size={14}/></a></section>
          </aside>
        </div>
      </section>
    </div>
  </AboutAdminLayout>
}
