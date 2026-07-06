import { AdminSelect } from './AdminUI'
export default function AdminField({ spec, value, onChange }) {
  const [key, label, type, options] = spec
  const safeValue = type === 'json' ? (typeof value === 'string' ? value : JSON.stringify(value ?? [], null, 2)) : value ?? ''
  if (type === 'tags') return <TagListField fieldKey={key} label={label} value={value} onChange={onChange}/>
  if (type === 'items') return <StructuredListField fieldKey={key} label={label} value={value} onChange={onChange} fields={options}/>
  if (type === 'gallery') return <GalleryField fieldKey={key} label={label} value={value} onChange={onChange}/>
  if (type === 'checkbox') return <label className="admin-check"><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(key, e.target.checked)} /><span>{label}</span></label>
  if (type === 'textarea' || type === 'json') return <div className="field wide"><label>{label}</label><textarea className={type === 'json' ? 'admin-json' : ''} value={safeValue} onChange={(e) => onChange(key, e.target.value)} /></div>
  if (type === 'select') return <div className="field"><label>{label}</label><AdminSelect value={safeValue} onChange={(next) => onChange(key, next)} options={options}/></div>
  return <div className="field"><label>{label}</label><input type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'datetime' ? 'datetime-local' : 'text'} value={safeValue} onChange={(e) => onChange(key, type === 'number' ? Number(e.target.value) : e.target.value)} /></div>
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function move(array, index, direction) {
  const next = [...array]
  const target = index + direction
  if (target < 0 || target >= next.length) return next
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

function TagListField({ fieldKey, label, value, onChange }) {
  const items = normalizeArray(value)
  const add = (raw) => {
    const item = raw.trim()
    if (!item || items.some((entry) => String(entry).toLowerCase() === item.toLowerCase())) return
    onChange(fieldKey, [...items, item])
  }
  return <div className="field wide builder-field"><label>{label}</label><div className="tag-builder">{items.map((item, index) => <span key={`${item}-${index}`}><input value={item} onChange={(e) => onChange(fieldKey, items.map((entry, i) => i === index ? e.target.value : entry))}/><button type="button" onClick={() => onChange(fieldKey, move(items, index, -1))}>↑</button><button type="button" onClick={() => onChange(fieldKey, move(items, index, 1))}>↓</button><button type="button" onClick={() => onChange(fieldKey, items.filter((_, i) => i !== index))}>×</button></span>)}<input placeholder="Додати і натиснути Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(e.currentTarget.value); e.currentTarget.value = '' } }}/></div></div>
}

function StructuredListField({ fieldKey, label, value, onChange, fields }) {
  const items = normalizeArray(value)
  const fieldList = fields?.length ? fields : [['title', 'Назва'], ['text', 'Опис']]
  const empty = Object.fromEntries(fieldList.map(([name]) => [name, '']))
  const updateItem = (index, key, fieldValue) => onChange(fieldKey, items.map((item, i) => i === index ? { ...item, [key]: fieldValue } : item))
  return <div className="field wide builder-field"><label>{label}</label><div className="structured-builder">{items.map((item, index) => <article key={index}>{fieldList.map(([name, fieldLabel]) => { const multiline = ['text', 'description', 'meta'].includes(name); return <label key={name} className={multiline ? 'is-multiline' : ''}>{fieldLabel}{multiline ? <textarea value={item?.[name] || ''} onChange={(e) => updateItem(index, name, e.target.value)}/> : <input value={item?.[name] || ''} onChange={(e) => updateItem(index, name, e.target.value)}/>}</label> })}<div><button type="button" onClick={() => onChange(fieldKey, move(items, index, -1))}>Вище</button><button type="button" onClick={() => onChange(fieldKey, move(items, index, 1))}>Нижче</button><button type="button" onClick={() => onChange(fieldKey, [...items.slice(0, index + 1), { ...item }, ...items.slice(index + 1)])}>Дублювати</button><button type="button" onClick={() => onChange(fieldKey, items.filter((_, i) => i !== index))}>Видалити</button></div></article>)}<button type="button" className="builder-add" onClick={() => onChange(fieldKey, [...items, empty])}>Додати пункт</button></div></div>
}

function GalleryField({ fieldKey, label, value, onChange }) {
  const items = normalizeArray(value)
  const normalized = items.map((item) => typeof item === 'string' ? { url: item, alt: '', is_main: false } : item)
  const updateItem = (index, patch) => onChange(fieldKey, normalized.map((item, i) => i === index ? { ...item, ...patch } : item))
  return <div className="field wide builder-field"><label>{label}</label><div className="gallery-builder">{normalized.map((item, index) => <article key={index}><div>{item.url && <img src={item.url} alt={item.alt || ''}/>}</div><label>URL<input value={item.url || ''} onChange={(e) => updateItem(index, { url: e.target.value })}/></label><label>Alt<input value={item.alt || ''} onChange={(e) => updateItem(index, { alt: e.target.value })}/></label><label className="admin-check"><input type="checkbox" checked={Boolean(item.is_main)} onChange={() => onChange(fieldKey, normalized.map((entry, i) => ({ ...entry, is_main: i === index })))}/><span>Головне</span></label><p><button type="button" onClick={() => onChange(fieldKey, move(normalized, index, -1))}>↑</button><button type="button" onClick={() => onChange(fieldKey, move(normalized, index, 1))}>↓</button><button type="button" onClick={() => onChange(fieldKey, normalized.filter((_, i) => i !== index))}>Видалити</button></p></article>)}<button type="button" className="builder-add" onClick={() => onChange(fieldKey, [...normalized, { url: '', alt: '', is_main: !normalized.length }])}>Додати зображення</button></div></div>
}
