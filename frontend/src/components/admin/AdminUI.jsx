import { AlertTriangle, Check, ChevronDown, CircleAlert, Info, Loader2, Save, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const AdminUIContext = createContext(null)

const normalizeOptions = (options = []) => options.map((option) => {
  if (Array.isArray(option)) return { value: option[0], label: option[1], hint: option[2] || '' }
  return { value: option.value, label: option.label, hint: option.hint || '', disabled: option.disabled }
})

export function AdminUIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const notify = useCallback((message, options = {}) => {
    if (!message) return
    const id = `${Date.now()}-${Math.random()}`
    const toast = {
      id,
      message,
      title: options.title || '',
      type: options.type || 'success',
      duration: options.duration ?? 3600,
    }
    setToasts((current) => [...current.slice(-3), toast])
    if (toast.duration > 0) window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), toast.duration)
  }, [])

  const dismissToast = useCallback((id) => setToasts((current) => current.filter((item) => item.id !== id)), [])

  const openDialog = useCallback((config) => new Promise((resolve) => {
    resolver.current = resolve
    setDialog({
      mode: 'confirm',
      title: 'Підтвердити дію',
      description: '',
      confirmLabel: 'Підтвердити',
      cancelLabel: 'Скасувати',
      tone: 'default',
      inputLabel: 'Значення',
      inputType: 'text',
      inputPlaceholder: '',
      initialValue: '',
      ...config,
    })
  }), [])

  const confirm = useCallback((config = {}) => openDialog({ ...config, mode: 'confirm' }), [openDialog])
  const requestInput = useCallback((config = {}) => openDialog({ ...config, mode: 'prompt' }), [openDialog])

  const settleDialog = useCallback((value) => {
    resolver.current?.(value)
    resolver.current = null
    setDialog(null)
  }, [])

  const value = useMemo(() => ({ notify, confirm, requestInput }), [notify, confirm, requestInput])

  return <AdminUIContext.Provider value={value}>
    {children}
    {typeof document !== 'undefined' && createPortal(<>
      <AdminToastViewport toasts={toasts} onDismiss={dismissToast}/>
      {dialog && <AdminDialog dialog={dialog} onCancel={() => settleDialog(dialog.mode === 'prompt' ? null : false)} onConfirm={settleDialog}/>} 
    </>, document.body)}
  </AdminUIContext.Provider>
}

export function useAdminUI() {
  const context = useContext(AdminUIContext)
  if (!context) throw new Error('useAdminUI must be used inside AdminUIProvider')
  return context
}

function AdminToastViewport({ toasts, onDismiss }) {
  return <div className="admin-toast-viewport" aria-live="polite" aria-atomic="true">
    {toasts.map((toast) => {
      const Icon = toast.type === 'error' ? CircleAlert : toast.type === 'warning' ? AlertTriangle : toast.type === 'info' ? Info : Check
      return <article key={toast.id} className={`admin-toast-v3 is-${toast.type}`}>
        <span className="admin-toast-icon"><Icon size={18}/></span>
        <div>{toast.title && <strong>{toast.title}</strong>}<p>{toast.message}</p></div>
        <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Закрити повідомлення"><X size={16}/></button>
      </article>
    })}
  </div>
}

function AdminDialog({ dialog, onCancel, onConfirm }) {
  const [value, setValue] = useState(dialog.initialValue || '')
  const inputRef = useRef(null)

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === 'Escape') onCancel()
      if (event.key === 'Enter' && dialog.mode === 'confirm') onConfirm(true)
    }
    document.addEventListener('keydown', keydown)
    document.body.classList.add('admin-dialog-open')
    if (dialog.mode === 'prompt') window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => { document.removeEventListener('keydown', keydown); document.body.classList.remove('admin-dialog-open') }
  }, [dialog.mode, onCancel, onConfirm])

  const submit = (event) => {
    event.preventDefault()
    onConfirm(dialog.mode === 'prompt' ? value : true)
  }

  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <form className={`admin-dialog-v3 is-${dialog.tone}`} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" onSubmit={submit}>
      <div className="admin-dialog-symbol">{dialog.tone === 'danger' ? <AlertTriangle size={24}/> : <Check size={24}/>}</div>
      <button className="admin-dialog-close" type="button" onClick={onCancel} aria-label="Закрити"><X size={18}/></button>
      <small>{dialog.eyebrow || (dialog.tone === 'danger' ? 'Небезпечна дія' : 'Підтвердження')}</small>
      <h2 id="admin-dialog-title">{dialog.title}</h2>
      {dialog.description && <p>{dialog.description}</p>}
      {dialog.mode === 'prompt' && <label className="admin-dialog-input">
        <span>{dialog.inputLabel}</span>
        <input ref={inputRef} type={dialog.inputType} value={value} placeholder={dialog.inputPlaceholder} onChange={(event) => setValue(event.target.value)} autoComplete="off"/>
      </label>}
      <div className="admin-dialog-actions">
        <button className="btn btn-light" type="button" onClick={onCancel}>{dialog.cancelLabel}</button>
        <button className={`btn ${dialog.tone === 'danger' ? 'btn-danger' : 'btn-dark'}`} type="submit" disabled={dialog.mode === 'prompt' && dialog.required !== false && !String(value).trim()}>{dialog.confirmLabel}</button>
      </div>
    </form>
  </div>
}

export function AdminSelect({ value, onChange, options, placeholder = 'Оберіть значення', className = '', disabled = false, ariaLabel, compact = false }) {
  const id = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 220, maxHeight: 310 })
  const normalized = useMemo(() => normalizeOptions(options), [options])
  const selected = normalized.find((option) => String(option.value) === String(value))

  const updatePosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom - 16
    const spaceAbove = rect.top - 16
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow
    const maxHeight = Math.max(140, Math.min(310, openAbove ? spaceAbove - 8 : spaceBelow - 8))
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 190) - 8)),
      top: openAbove ? Math.max(8, rect.top - maxHeight - 7) : rect.bottom + 7,
      width: Math.max(rect.width, 190),
      maxHeight,
    })
  }, [])

  useEffect(() => {
    const outside = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event) => { if (event.key === 'Escape') setOpen(false) }
    const reposition = () => { if (open) updatePosition() }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('mousedown', outside)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, updatePosition])

  useEffect(() => { if (open) updatePosition() }, [open, updatePosition])

  const choose = (option) => {
    if (option.disabled) return
    onChange?.(option.value)
    setOpen(false)
  }

  const menu = open && typeof document !== 'undefined' ? createPortal(<div ref={menuRef} className="admin-select-menu is-portal" role="listbox" aria-labelledby={id} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}>
    {normalized.map((option) => <button key={String(option.value)} type="button" role="option" aria-selected={String(option.value) === String(value)} disabled={option.disabled} onClick={() => choose(option)}>
      <span><strong>{option.label}</strong>{option.hint && <small>{option.hint}</small>}</span>{String(option.value) === String(value) && <Check size={16}/>}
    </button>)}
  </div>, document.body) : null

  return <div ref={rootRef} className={`admin-select ${compact ? 'is-compact' : ''} ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}>
    <button id={id} type="button" className="admin-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} disabled={disabled} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.label || placeholder}</span><ChevronDown size={16}/>
    </button>
    {menu}
  </div>
}

export function AdminSaveDock({ visible, dirty = true, saving = false, onSave, onCancel, title = 'Є незбережені зміни', description = 'Збережи зміни або поверни попередні значення.', saveLabel = 'Зберегти', cancelLabel = 'Скасувати', placement = 'center' }) {
  if (!visible && !dirty) return null
  return <div className={`admin-save-dock is-${placement}`} role="status">
    <div className="admin-save-dock-status"><i/><span><strong>{saving ? 'Зберігаємо зміни…' : title}</strong><small>{description}</small></span></div>
    <div className="admin-save-dock-actions">
      <button type="button" className="btn btn-light" disabled={saving} onClick={onCancel}><X size={16}/>{cancelLabel}</button>
      <button type="button" className="btn btn-dark" disabled={saving} onClick={onSave}>{saving ? <Loader2 className="admin-spin" size={16}/> : <Save size={16}/>} {saving ? 'Збереження…' : saveLabel}</button>
    </div>
  </div>
}
