import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import api, { unwrap } from '../../lib/api'
import { useAdminUI } from './AdminUI'

export default function FileUploader({ title, hint, currentUrl, field, onUploaded }) {
  const { confirm, notify } = useAdminUI()
  const [busy, setBusy] = useState(false)

  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const data = new FormData(); data.append('field', field); data.append('file', file)
      const response = await api.post('/about-page/upload/', data)
      onUploaded?.(unwrap(response))
      notify(`Файл «${file.name}» завантажено.`)
    } catch (error) { notify(error.response?.data?.detail || 'Помилка завантаження.', { type: 'error' }) }
    finally { setBusy(false); event.target.value = '' }
  }

  const remove = async () => {
    const accepted = await confirm({ title: `Видалити файл «${title}»?`, description: 'Посилання на файл зникне з публічної сторінки.', confirmLabel: 'Видалити файл', tone: 'danger' })
    if (!accepted) return
    setBusy(true)
    try {
      const response = await api.post('/about-page/remove_file/', { field })
      onUploaded?.(unwrap(response))
      notify('Файл видалено.', { type: 'warning' })
    } catch { notify('Не вдалося видалити файл.', { type: 'error' }) }
    finally { setBusy(false) }
  }

  return <section className="admin-file-card">
    <div><FileText size={24}/><h3>{title}</h3><p>{hint}</p></div>
    {currentUrl && <a href={currentUrl} target="_blank" rel="noreferrer">Відкрити поточний файл ↗</a>}
    <div className="admin-media-actions"><label className="btn btn-light">{busy ? <Loader2 className="admin-spin" size={17}/> : <Upload size={17}/>} {busy ? 'Завантаження…' : 'Завантажити файл'}<input hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={upload}/></label>{currentUrl && <button className="btn admin-danger-btn" onClick={remove} disabled={busy}><Trash2 size={16}/> Видалити</button>}</div>
  </section>
}
