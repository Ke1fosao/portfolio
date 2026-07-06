import { useCallback, useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { ImagePlus, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { useAdminUI } from './AdminUI'

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.src = url
  })
}

async function makeCroppedFile(imageSrc, crop, rotation = 0, filename = 'portrait.jpg') {
  const image = await createImage(imageSrc)
  const radians = rotation * Math.PI / 180
  const sin = Math.abs(Math.sin(radians)); const cos = Math.abs(Math.cos(radians))
  const boundW = image.width * cos + image.height * sin
  const boundH = image.width * sin + image.height * cos
  const temp = document.createElement('canvas')
  temp.width = boundW; temp.height = boundH
  const ctx = temp.getContext('2d')
  ctx.translate(boundW / 2, boundH / 2)
  ctx.rotate(radians)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)

  const output = document.createElement('canvas')
  output.width = Math.max(1, Math.round(crop.width))
  output.height = Math.max(1, Math.round(crop.height))
  output.getContext('2d').drawImage(temp, crop.x, crop.y, crop.width, crop.height, 0, 0, output.width, output.height)
  const blob = await new Promise((resolve) => output.toBlob(resolve, 'image/jpeg', .92))
  if (!blob) throw new Error('Не вдалося створити обрізане фото.')
  return new File([blob], filename, { type: 'image/jpeg' })
}

export default function ImageCropUploader({ title, hint, currentUrl, uploadUrl, removeUrl, field, aspect = 4 / 5, onUploaded }) {
  const { confirm, notify } = useAdminUI()
  const [source, setSource] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pixels, setPixels] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const fileName = useMemo(() => field === 'hero_photo' ? 'dmytro-portrait.jpg' : 'project-cover.jpg', [field])
  const onCropComplete = useCallback((_, croppedAreaPixels) => setPixels(croppedAreaPixels), [])

  const choose = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage('Оберіть зображення JPG, PNG або WEBP.'); return }
    const reader = new FileReader()
    reader.onload = () => { setSource(reader.result); setCrop({ x:0, y:0 }); setZoom(1); setRotation(0); setMessage('') }
    reader.readAsDataURL(file)
  }

  const upload = async () => {
    if (!source || !pixels) return
    setBusy(true); setMessage('')
    try {
      const file = await makeCroppedFile(source, pixels, rotation, fileName)
      const data = new FormData()
      data.append('file', file)
      if (field) data.append('field', field)
      const response = await api.post(uploadUrl, data)
      onUploaded?.(unwrap(response))
      setSource(''); setMessage(''); notify('Фото обрізано та збережено.')
    } catch (error) {
      const text = error.response?.data?.detail || error.message || 'Помилка завантаження.'; setMessage(text); notify(text, { type: 'error' })
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!removeUrl) return
    const accepted = await confirm({ title: 'Видалити поточне зображення?', description: 'Зображення зникне з публічної сторінки.', confirmLabel: 'Видалити', tone: 'danger' })
    if (!accepted) return
    setBusy(true)
    try {
      const response = await api.post(removeUrl, field ? { field } : {})
      onUploaded?.(unwrap(response)); setMessage(''); notify('Зображення видалено.', { type: 'warning' })
    } catch (error) { const text = error.response?.data?.detail || 'Не вдалося видалити.'; setMessage(text); notify(text, { type: 'error' }) }
    finally { setBusy(false) }
  }

  return <section className="admin-media-card">
    <div className="admin-media-head"><div><h3>{title}</h3><p>{hint}</p></div><ImagePlus size={24}/></div>
    {currentUrl && !source && <div className="admin-current-image" style={{ aspectRatio }}><img src={currentUrl} alt="Поточне зображення" /></div>}
    {source && <div className="admin-crop-workspace">
      <div className="admin-crop-stage" style={{ aspectRatio }}>
        <Cropper image={source} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} cropShape="rect" showGrid onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onCropComplete} />
      </div>
      <div className="admin-crop-controls">
        <label><span>Масштаб</span><input type="range" min="1" max="3.5" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}/><b>{zoom.toFixed(2)}×</b></label>
        <label><span>Поворот</span><input type="range" min="-20" max="20" step="1" value={rotation} onChange={(e) => setRotation(Number(e.target.value))}/><b>{rotation}°</b></label>
      </div>
      <p className="admin-crop-tip">Перетягуй фото мишкою, збільшуй повзунком. Збережеться лише область усередині рамки.</p>
    </div>}
    <div className="admin-media-actions">
      <label className="btn btn-light"><Upload size={17}/>{source ? 'Обрати інше фото' : 'Обрати фото'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}/></label>
      {source && <button className="btn btn-dark" onClick={upload} disabled={busy}><ImagePlus size={17}/>{busy ? 'Збереження…' : 'Обрізати й зберегти'}</button>}
      {source && <button className="icon-btn" title="Скинути" onClick={() => { setCrop({x:0,y:0}); setZoom(1); setRotation(0) }}><RotateCcw size={17}/></button>}
      {source && <button className="icon-btn" title="Закрити" onClick={() => setSource('')}><X size={17}/></button>}
      {currentUrl && removeUrl && !source && <button className="btn admin-danger-btn" onClick={remove} disabled={busy}><Trash2 size={16}/> Видалити</button>}
    </div>
    {message && <p className="admin-inline-message">{message}</p>}
  </section>
}
