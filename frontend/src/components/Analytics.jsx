import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, Settings2, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const STORAGE_KEY = 'dk-cookie-consent-v1'
function loadAnalytics(id) { if (!id || document.querySelector(`script[data-ga-id="${id}"]`)) return; const script = document.createElement('script'); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; script.dataset.gaId = id; document.head.appendChild(script); window.dataLayer = window.dataLayer || []; window.gtag = function gtag(){ window.dataLayer.push(arguments) }; window.gtag('js', new Date()); window.gtag('config', id, { anonymize_ip: true }) }

export default function Analytics() {
  const { language } = useLanguage()
  const copy = language === 'en' ? { close: 'Close cookie settings', title: 'Cookie settings', text: 'Essential storage is required for the website to work. Analytics will only be enabled with your consent. Details are available in the', policy: 'privacy policy', essential: 'Essential only', allow: 'Allow analytics' } : { close: 'Закрити налаштування cookies', title: 'Налаштування cookies', text: 'Необхідні дані потрібні для роботи сайту. Аналітику буде підключено лише після вашої згоди. Деталі — у', policy: 'політиці конфіденційності', essential: 'Лише необхідні', allow: 'Дозволити аналітику' }
  const [choice, setChoice] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY))
  const analyticsId = import.meta.env.VITE_GA_ID
  useEffect(() => { if (choice === 'analytics') loadAnalytics(analyticsId) }, [choice, analyticsId])
  useEffect(() => { const reopen = () => setOpen(true); window.addEventListener('open-cookie-settings', reopen); return () => window.removeEventListener('open-cookie-settings', reopen) }, [])
  const save = (value) => { localStorage.setItem(STORAGE_KEY, value); setChoice(value); setOpen(false) }
  if (!open) return null
  return <div className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><button type="button" className="cookie-close" onClick={() => choice && setOpen(false)} aria-label={copy.close}><X size={18} /></button><div className="cookie-icon"><Cookie size={24} /></div><div className="cookie-copy"><strong id="cookie-title">{copy.title}</strong><p>{copy.text} <Link to="/privacy">{copy.policy}</Link>.</p></div><div className="cookie-actions"><button type="button" className="cookie-secondary" onClick={() => save('essential')}><Settings2 size={16} /> {copy.essential}</button><button type="button" className="cookie-primary" onClick={() => save('analytics')}>{copy.allow}</button></div></div>
}
