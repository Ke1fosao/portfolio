import { useEffect, useState } from 'react'
import { Eye, Save } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import AdminField from '../../components/admin/AdminField'
import FileUploader from '../../components/admin/FileUploader'
import ImageCropUploader from '../../components/admin/ImageCropUploader'
import { fallbackAboutPage, fallbackProjects } from '../../data/fallbackData'
import { parsePayload } from './resources'

const sections = [
  {
    title: 'Перший екран', text: 'Заголовок, вступ і опис фотографії.',
    fields: [['hero_kicker','Надзаголовок','text'],['hero_title','Головний заголовок','textarea'],['hero_text','Вступний текст','textarea'],['hero_photo_alt','Опис фото для доступності','text']],
  },
  {
    title: 'Історія та цифри', text: 'Основна розповідь, етапи шляху та короткі показники.',
    fields: [['story_title','Заголовок історії','textarea'],['story_text','Вступ до історії','textarea'],['story_support_text','Другий абзац історії','textarea'],['journey_heading','Заголовок хронології','textarea'],['journey_intro','Вступ до хронології','textarea'],['journey','Етапи шляху (JSON)','json'],['stats','Цифри (JSON)','json']],
  },
  {
    title: 'BABY LAND', text: 'Текст першого клієнтського кейсу на сторінці «Про мене».',
    fields: [['babyland_title','Заголовок кейсу','textarea'],['babyland_text','Опис кейсу','textarea'],['project_facts','Факти кейсу (JSON)','json']],
  },
  {
    title: 'AI-напрям', text: 'Велика інтерактивна схема автоматизації.',
    fields: [['ai_title','Заголовок AI-блоку','textarea'],['ai_text','Опис AI-блоку','textarea'],['ai_items','Вузли AI-схеми (JSON)','json'],['principles_title','Заголовок принципів','textarea'],['principles','Принципи роботи (JSON)','json']],
  },
  {
    title: 'Освіта й диплом', text: 'Інформація про навчання та підпис до диплома.',
    fields: [['education_title','Заголовок освіти','textarea'],['education_text','Текст освіти','textarea'],['college_name','Навчальний заклад','text'],['diploma_title','Статус диплома','text'],['diploma_description','Опис диплома','textarea']],
  },
  {
    title: 'Фінальний заклик', text: 'Останній екран сторінки перед контактами.',
    fields: [['final_kicker','Фінальний надзаголовок','text'],['final_title','Фінальний заголовок','textarea'],['final_text','Фінальний текст','textarea']],
  },
]
const allFields = sections.flatMap((section) => section.fields)

export default function AboutAdmin() {
  const [form, setForm] = useState(fallbackAboutPage)
  const [babyland, setBabyland] = useState(fallbackProjects[0])
  const [message, setMessage] = useState('')
  const load = () => {
    api.get('/about-page/').then((r) => setForm({ ...fallbackAboutPage, ...unwrap(r) })).catch(() => {})
    api.get('/projects/baby-land/').then((r) => setBabyland(unwrap(r))).catch(() => {})
  }
  useEffect(load, [])
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const save = async () => {
    setMessage('')
    try {
      const payload = parsePayload(form, allFields)
      const response = await api.patch(`/about-page/${form.id || 1}/`, payload)
      setForm({ ...fallbackAboutPage, ...unwrap(response) })
      setMessage('Сторінку «Про мене» збережено.')
    } catch (error) { setMessage(error.message || JSON.stringify(error.response?.data || 'Помилка збереження.')) }
  }
  return <>
    <div className="admin-page-head"><div><span>/admin/about</span><h1>Сторінка «Про мене»</h1><p>Повний редактор історії, фотографії, кейсу, AI-схеми та документів.</p></div><a className="btn btn-light" href="/about" target="_blank" rel="noreferrer"><Eye size={17}/> Переглянути сторінку</a></div>

    <div className="admin-about-layout">
      <div className="admin-about-content">
        {sections.map((section) => <section className="admin-card admin-editor-section" key={section.title}><div className="admin-section-title"><div><h2>{section.title}</h2><p>{section.text}</p></div></div><div className="admin-form-grid">{section.fields.map((field) => <AdminField key={field[0]} spec={field} value={form[field[0]]} onChange={update}/>)}</div></section>)}
        <button className="btn btn-dark admin-save admin-save-sticky" onClick={save}><Save size={17}/> Зберегти всі тексти</button>
        {message && <p className="admin-inline-message admin-message-large">{message}</p>}
      </div>

      <aside className="admin-about-media">
        <ImageCropUploader title="Головне фото" hint="Формат 4:5. Перетягни фото, відрегулюй масштаб і за потреби трохи поверни." currentUrl={form.hero_photo_url} uploadUrl="/about-page/upload/" removeUrl="/about-page/remove_file/" field="hero_photo" aspect={4/5} onUploaded={(data) => setForm({ ...fallbackAboutPage, ...data })}/>
        <ImageCropUploader title="Обкладинка BABY LAND" hint="Завантажений кадр автоматично замінить кодову презентацію проєкту по всьому сайту." currentUrl={babyland.uploaded_cover_url} uploadUrl={`/projects/${babyland.slug || 'baby-land'}/upload_cover/`} removeUrl={`/projects/${babyland.slug || 'baby-land'}/remove_cover/`} aspect={16/10} onUploaded={setBabyland}/>
        <FileUploader title="Резюме" hint="Рекомендовано PDF. Посилання з’явиться на сторінці автоматично." currentUrl={form.resume_file_url} field="resume_file" onUploaded={(data) => setForm({ ...fallbackAboutPage, ...data })}/>
        <FileUploader title="Диплом" hint="PDF або зображення диплома. До завантаження показується акуратний статус очікування." currentUrl={form.diploma_file_url} field="diploma_file" onUploaded={(data) => setForm({ ...fallbackAboutPage, ...data })}/>
      </aside>
    </div>
  </>
}
