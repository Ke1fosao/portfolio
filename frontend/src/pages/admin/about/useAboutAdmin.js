import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { unwrap } from '../../../lib/api'
import { fallbackAboutPage, fallbackProjects, fallbackSettings } from '../../../data/fallbackData'
import { useAdminUI } from '../../../components/admin/AdminUI'
import { parsePayload } from '../resources'

export default function useAboutAdmin(fields = []) {
  const { notify } = useAdminUI()
  const [form, setForm] = useState(fallbackAboutPage)
  const [baseline, setBaseline] = useState(fallbackAboutPage)
  const [settings, setSettings] = useState(fallbackSettings)
  const [babyland, setBabyland] = useState(fallbackProjects[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])
  const telegram = useMemo(() => settings.socials?.telegram || `https://t.me/${String(settings.telegram || '').replace('@', '')}`, [settings])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aboutResponse, projectResponse, settingsResponse] = await Promise.all([
        api.get('/about-page/'),
        api.get('/projects/baby-land/'),
        api.get('/settings/'),
      ])
      const about = { ...fallbackAboutPage, ...unwrap(aboutResponse) }
      setForm(about)
      setBaseline(about)
      setBabyland({ ...fallbackProjects[0], ...unwrap(projectResponse) })
      setSettings({ ...fallbackSettings, ...unwrap(settingsResponse) })
    } catch {
      notify('Не вдалося завантажити дані. Перевір, чи запущений Django.', { type: 'error', duration: 5200 })
    } finally { setLoading(false) }
  }, [notify])

  useEffect(() => { load() }, [load])
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  const reset = () => setForm({ ...baseline })
  const applySavedData = (data) => {
    setForm((previous) => {
      const next = { ...previous, ...data }
      setBaseline((current) => ({ ...current, ...data }))
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = parsePayload(form, fields)
      const response = await api.patch(`/about-page/${form.id || 1}/`, payload)
      const saved = { ...fallbackAboutPage, ...unwrap(response) }
      setForm(saved)
      setBaseline(saved)
      notify('Розділ сторінки «Про мене» збережено.')
      return true
    } catch (error) {
      notify(error.message || JSON.stringify(error.response?.data || 'Помилка збереження.'), { type: 'error' })
      return false
    } finally { setSaving(false) }
  }

  return {
    form, setForm, baseline, setBaseline,
    settings, setSettings, telegram,
    babyland, setBabyland,
    loading, saving, dirty,
    update, save, reset, reload: load, applySavedData,
  }
}
