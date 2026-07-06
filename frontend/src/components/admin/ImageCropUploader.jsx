import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ImagePlus, Move, Pencil, RotateCcw, Trash2, Upload, X, ZoomIn } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { useAdminUI } from './AdminUI'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const defaultCrop = { zoom: 1.12, position: { x: 0, y: 0 } }

function normalizeCrop(cropSettings) {
  const source = cropSettings && typeof cropSettings === 'object' ? cropSettings : {}
  const position = source.position && typeof source.position === 'object' ? source.position : {}
  return {
    zoom: clamp(Number(source.zoom) || defaultCrop.zoom, 1, 4),
    position: {
      x: clamp(Number(position.x) || 0, -100, 100),
      y: clamp(Number(position.y) || 0, -100, 100),
    },
  }
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.decoding = 'async'
    image.crossOrigin = 'anonymous'
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', () => reject(new Error('Не вдалося прочитати зображення.')), { once: true })
    image.src = url
  })
}

function outputSizeFor(image, aspect) {
  const naturalWidth = image.naturalWidth || image.width
  const naturalHeight = image.naturalHeight || image.height
  const imageAspect = naturalWidth / naturalHeight
  if (imageAspect > aspect) {
    return { width: Math.round(naturalHeight * aspect), height: naturalHeight }
  }
  return { width: naturalWidth, height: Math.round(naturalWidth / aspect) }
}

async function makeCroppedFile(imageSrc, crop, filename = 'portrait.jpg', preferredType = 'image/jpeg') {
  const image = await createImage(imageSrc)
  const { width: outputWidth, height: outputHeight } = outputSizeFor(image, crop.aspect)
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Браузер не зміг підготувати обрізувач фото.')

  context.fillStyle = '#f4f4ef'
  context.fillRect(0, 0, outputWidth, outputHeight)

  const baseScale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight)
  const finalScale = baseScale * crop.zoom
  const drawWidth = image.naturalWidth * finalScale
  const drawHeight = image.naturalHeight * finalScale
  const maxOffsetX = Math.max(0, (drawWidth - outputWidth) / 2)
  const maxOffsetY = Math.max(0, (drawHeight - outputHeight) / 2)
  const offsetX = (crop.position.x / 100) * maxOffsetX
  const offsetY = (crop.position.y / 100) * maxOffsetY
  const drawX = outputWidth / 2 - drawWidth / 2 + offsetX
  const drawY = outputHeight / 2 - drawHeight / 2 + offsetY

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  const outputType = preferredType === 'image/png' ? 'image/png' : 'image/jpeg'
  const quality = outputType === 'image/jpeg' ? .98 : undefined
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality))
  if (!blob) throw new Error('Не вдалося створити обрізане фото.')
  return new File([blob], filename, { type: outputType })
}

export default function ImageCropUploader({
  title,
  hint,
  currentUrl,
  originalUrl = '',
  cropSettings = {},
  uploadUrl,
  removeUrl,
  field,
  aspect = 4 / 5,
  onUploaded,
}) {
  const { confirm, notify } = useAdminUI()
  const initialCrop = useMemo(() => normalizeCrop(cropSettings), [cropSettings])
  const [source, setSource] = useState('')
  const [sourceKind, setSourceKind] = useState('')
  const [originalFile, setOriginalFile] = useState(null)
  const [sourceType, setSourceType] = useState('image/jpeg')
  const [zoom, setZoom] = useState(initialCrop.zoom)
  const [position, setPosition] = useState(initialCrop.position)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [drag, setDrag] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [fileLabel, setFileLabel] = useState('')
  const stageRef = useRef(null)
  const fileName = useMemo(() => field === 'hero_photo' ? 'dmytro-portrait.jpg' : 'project-cover.jpg', [field])
  const formatLabel = useMemo(() => {
    if (Math.abs(aspect - 4 / 5) < .01) return '4:5'
    if (Math.abs(aspect - 16 / 10) < .01) return '16:10'
    return `${aspect.toFixed(2)}:1`
  }, [aspect])

  useEffect(() => {
    if (source) return
    const next = normalizeCrop(cropSettings)
    setZoom(next.zoom)
    setPosition(next.position)
  }, [cropSettings, source])

  useEffect(() => {
    const measure = () => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (rect?.width && rect?.height) setStageSize({ width: rect.width, height: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [source])

  useEffect(() => {
    if (!source) return undefined
    return () => {
      if (source.startsWith('blob:')) URL.revokeObjectURL(source)
    }
  }, [source])

  const resetCrop = () => {
    setZoom(1.12)
    setPosition({ x: 0, y: 0 })
  }

  const openEditor = (nextSource, options = {}) => {
    setSource((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return nextSource
    })
    setSourceKind(options.kind || 'new')
    setOriginalFile(options.file || null)
    setSourceType(options.type || 'image/jpeg')
    setFileLabel(options.label || '')
    const nextCrop = options.crop || defaultCrop
    setZoom(nextCrop.zoom)
    setPosition(nextCrop.position)
    setMessage('')
  }

  const closeEditor = () => {
    setSource((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return ''
    })
    setSourceKind('')
    setOriginalFile(null)
    setFileLabel('')
    setMessage('')
    setNaturalSize({ width: 0, height: 0 })
  }

  const choose = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Оберіть зображення JPG, PNG або WEBP.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    openEditor(objectUrl, {
      kind: 'new',
      file,
      type: file.type,
      label: `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB · оригінал буде збережено без стискання`,
      crop: defaultCrop,
    })
  }

  const editOriginal = () => {
    const sourceUrl = originalUrl || currentUrl
    if (!sourceUrl) return
    openEditor(sourceUrl, {
      kind: originalUrl ? 'stored-original' : 'stored-cropped',
      type: 'image/jpeg',
      label: originalUrl ? 'Редагується збережений оригінал. Нове фото завантажувати не потрібно.' : 'Оригіналу ще немає, редагується поточний кадр.',
      crop: normalizeCrop(cropSettings),
    })
  }

  const onImageLoad = (event) => {
    const image = event.currentTarget
    setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight })
    const rect = stageRef.current?.getBoundingClientRect()
    if (rect?.width && rect?.height) setStageSize({ width: rect.width, height: rect.height })
  }

  const imageStyle = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !stageSize.width || !stageSize.height) {
      return { opacity: 0 }
    }
    const baseScale = Math.max(stageSize.width / naturalSize.width, stageSize.height / naturalSize.height)
    const finalScale = baseScale * zoom
    const renderWidth = naturalSize.width * finalScale
    const renderHeight = naturalSize.height * finalScale
    const maxOffsetX = Math.max(0, (renderWidth - stageSize.width) / 2)
    const maxOffsetY = Math.max(0, (renderHeight - stageSize.height) / 2)
    const offsetX = (position.x / 100) * maxOffsetX
    const offsetY = (position.y / 100) * maxOffsetY
    return {
      width: `${renderWidth}px`,
      height: `${renderHeight}px`,
      left: `${stageSize.width / 2 - renderWidth / 2 + offsetX}px`,
      top: `${stageSize.height / 2 - renderHeight / 2 + offsetY}px`,
      opacity: 1,
    }
  }, [naturalSize, position, stageSize, zoom])

  const startDrag = (event) => {
    if (!source) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: position })
  }

  const moveDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = ((event.clientX - drag.x) / rect.width) * 120
    const dy = ((event.clientY - drag.y) / rect.height) * 120
    setPosition({
      x: clamp(drag.start.x + dx, -100, 100),
      y: clamp(drag.start.y + dy, -100, 100),
    })
  }

  const stopDrag = (event) => {
    if (drag?.pointerId === event.pointerId) setDrag(null)
  }

  const upload = async () => {
    if (!source) return
    setBusy(true)
    setMessage('')
    try {
      const crop = { aspect, zoom, position, format: formatLabel }
      const file = await makeCroppedFile(source, crop, fileName, sourceType)
      const data = new FormData()
      data.append('file', file)
      data.append('crop', JSON.stringify({ ...crop, savedAt: new Date().toISOString() }))
      if (originalFile) data.append('original', originalFile)
      if (field) data.append('field', field)
      const response = await api.post(uploadUrl, data)
      onUploaded?.(unwrap(response))
      closeEditor()
      notify(originalFile ? 'Фото збережено: оригінал окремо, кадр окремо.' : 'Кадрування оновлено з оригіналу.')
    } catch (error) {
      const text = error.response?.data?.detail || error.message || 'Помилка завантаження.'
      setMessage(text)
      notify(text, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!removeUrl) return
    const accepted = await confirm({
      title: 'Видалити поточне зображення?',
      description: field === 'hero_photo'
        ? 'Буде видалено і публічний кадр, і збережений оригінал.'
        : 'Зображення зникне з публічної сторінки.',
      confirmLabel: 'Видалити',
      tone: 'danger',
    })
    if (!accepted) return
    setBusy(true)
    try {
      const response = await api.post(removeUrl, field ? { field } : {})
      onUploaded?.(unwrap(response))
      closeEditor()
      notify('Зображення видалено.', { type: 'warning' })
    } catch (error) {
      const text = error.response?.data?.detail || 'Не вдалося видалити.'
      setMessage(text)
      notify(text, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return <section className="admin-media-card crop-uploader-v2">
    <div className="admin-media-head">
      <div>
        <h3>{title}</h3>
        <p>{hint}</p>
      </div>
      <span className="crop-format-pill"><ImagePlus size={16}/>{formatLabel}</span>
    </div>

    {currentUrl && !source && <div className="admin-current-image crop-current-image" style={{ aspectRatio: aspect }}>
      <img src={currentUrl} alt="Поточне зображення" />
      <span><CheckCircle2 size={15}/> Фото підключено</span>
    </div>}

    {!currentUrl && !source && <div className="crop-empty-state" style={{ aspectRatio: aspect }}>
      <ImagePlus size={30}/>
      <strong>Фото ще не завантажено</strong>
      <p>Оберіть файл, після цього відкриється вбудований обрізувач у потрібному форматі.</p>
    </div>}

    {source && <div className="admin-crop-workspace crop-workspace-v2">
      <div
        ref={stageRef}
        className={`admin-crop-stage crop-stage-v2 ${drag ? 'is-dragging' : ''}`}
        style={{ aspectRatio: aspect }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <img src={source} alt="" draggable="false" style={imageStyle} onLoad={onImageLoad}/>
        <div className="crop-safe-frame" />
        <div className="crop-drag-hint"><Move size={15}/> Перетягни фото в рамці</div>
      </div>

      <div className="admin-crop-controls crop-controls-v2">
        <label>
          <span><ZoomIn size={14}/> Масштаб</span>
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}/>
          <b>{zoom.toFixed(2)}x</b>
        </label>
        <label>
          <span>Горизонталь</span>
          <input type="range" min="-100" max="100" step="1" value={position.x} onChange={(event) => setPosition((current) => ({ ...current, x: Number(event.target.value) }))}/>
          <b>{Math.round(position.x)}</b>
        </label>
        <label>
          <span>Вертикаль</span>
          <input type="range" min="-100" max="100" step="1" value={position.y} onChange={(event) => setPosition((current) => ({ ...current, y: Number(event.target.value) }))}/>
          <b>{Math.round(position.y)}</b>
        </label>
      </div>

      <p className="admin-crop-tip">
        {fileLabel || 'Фото готове до кадрування.'} Публічний кадр збережеться у повній доступній роздільності без зменшення до фіксованого малого розміру.
      </p>
    </div>}

    <div className="admin-media-actions crop-action-row">
      <label className="btn btn-light">
        <Upload size={17}/>
        {source ? 'Обрати інше фото' : 'Обрати фото'}
        <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}/>
      </label>
      {(currentUrl || originalUrl) && !source && <button className="btn btn-light" type="button" onClick={editOriginal} disabled={busy}>
        <Pencil size={16}/>
        Змінити кадрування
      </button>}
      {source && <button className="btn btn-dark" type="button" onClick={upload} disabled={busy}>
        <ImagePlus size={17}/>
        {busy ? 'Збереження...' : sourceKind === 'new' ? 'Обрізати й зберегти' : 'Оновити кадрування'}
      </button>}
      {source && <button className="icon-btn" type="button" title="Скинути кадрування" onClick={resetCrop}><RotateCcw size={17}/></button>}
      {source && <button className="icon-btn" type="button" title="Закрити обрізувач" onClick={closeEditor}><X size={17}/></button>}
      {currentUrl && removeUrl && !source && <button className="btn admin-danger-btn" type="button" onClick={remove} disabled={busy}><Trash2 size={16}/> Видалити</button>}
    </div>

    {field === 'hero_photo' && <p className="crop-original-note">
      {originalUrl ? 'Оригінал збережений: можна міняти кадрування в будь-який момент.' : 'Після нового завантаження система збереже оригінал окремо від обрізаного кадру.'}
    </p>}
    {message && <p className="admin-inline-message">{message}</p>}
  </section>
}
