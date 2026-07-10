import { useEffect, useMemo, useState } from 'react'
import api, { unwrap } from '../../../lib/api'
import { fallbackAboutPage, fallbackProjects, fallbackSettings } from '../../../data/fallbackData'
import { useLanguage } from '../../../i18n/LanguageContext'
import { localizeAbout, localizeProject, localizeSettings } from '../../../i18n/localizedData'

export default function useAboutData() {
  const { language } = useLanguage()
  const [rawSettings, setRawSettings] = useState(fallbackSettings)
  const [rawAbout, setRawAbout] = useState(fallbackAboutPage)
  const [rawBabyland, setRawBabyland] = useState(fallbackProjects[0])
  useEffect(() => {
    api.get('/settings/').then((response) => { const data = unwrap(response); if (data?.full_name) setRawSettings(data) }).catch(() => {})
    api.get('/about-page/').then((response) => { const data = unwrap(response); if (data?.id) setRawAbout({ ...fallbackAboutPage, ...data }) }).catch(() => {})
    api.get('/projects/baby-land/').then((response) => { const data = unwrap(response); if (data?.id) setRawBabyland(data) }).catch(() => {})
  }, [])
  const settings = useMemo(() => localizeSettings(rawSettings, language), [rawSettings, language])
  const about = useMemo(() => localizeAbout(rawAbout, language), [rawAbout, language])
  const babyland = useMemo(() => localizeProject(rawBabyland, language), [rawBabyland, language])
  const telegram = useMemo(() => settings.socials?.telegram || `https://t.me/${settings.telegram?.replace('@', '')}`, [settings])
  return { settings, about, babyland, telegram }
}
