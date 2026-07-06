import { useEffect, useMemo, useState } from 'react'
import api, { unwrap } from '../../../lib/api'
import { fallbackAboutPage, fallbackProjects, fallbackSettings } from '../../../data/fallbackData'

export default function useAboutData() {
  const [settings, setSettings] = useState(fallbackSettings)
  const [about, setAbout] = useState(fallbackAboutPage)
  const [babyland, setBabyland] = useState(fallbackProjects[0])

  useEffect(() => {
    api.get('/settings/').then((response) => {
      const data = unwrap(response)
      if (data?.full_name) setSettings(data)
    }).catch(() => {})
    api.get('/about-page/').then((response) => {
      const data = unwrap(response)
      if (data?.id) setAbout({ ...fallbackAboutPage, ...data })
    }).catch(() => {})
    api.get('/projects/baby-land/').then((response) => {
      const data = unwrap(response)
      if (data?.id) setBabyland(data)
    }).catch(() => {})
  }, [])

  const telegram = useMemo(() => settings.socials?.telegram || `https://t.me/${settings.telegram?.replace('@', '')}`, [settings])
  return { settings, about, babyland, telegram }
}
