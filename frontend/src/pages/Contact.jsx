import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackSettings } from '../data/fallbackData'
import '../styles/secondary-base.css'
import '../styles/contact.css'
import '../styles/secondary-responsive.css'

const methodMeta = {
  telegram: { label: 'Telegram', Icon: MessageCircle, hint: '@username', description: 'Найшвидший варіант для переписки' },
  phone: { label: 'Телефон', Icon: Phone, hint: '+380…', description: 'Для дзвінка або повідомлення' },
  email: { label: 'Email', Icon: Mail, hint: 'name@email.com', description: 'Зручно для детального брифу' },
}

export default function Contact() {
  const [settings, setSettings] = useState(fallbackSettings)
  const formStartedAt = useRef(Date.now())
  const [form, setForm] = useState({ name: '', contact_method: 'telegram', contact_value: '', message: '', website: '' })
  const [state, setState] = useState({ loading: false, message: '', error: false })

  useEffect(() => {
    api.get('/settings/').then((response) => {
      const data = unwrap(response)
      if (data?.full_name) setSettings(data)
    }).catch(() => {})
  }, [])

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  const selectedMethod = useMemo(() => methodMeta[form.contact_method] || methodMeta.telegram, [form.contact_method])

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, message: '', error: false })
    try {
      const payload = { ...form, website: form.website || '', form_elapsed_ms: Date.now() - formStartedAt.current }
      await api.post('/leads/', payload)
      setState({ loading: false, message: 'Дякую! Заявку прийнято, збережено в системі та передано мені для відповіді.', error: false })
      setForm({ name: '', contact_method: 'telegram', contact_value: '', message: '', website: '' })
      formStartedAt.current = Date.now()
    } catch (error) {
      const data = error.response?.data
      const firstError = data?.detail || data?.contact_value?.[0] || data?.name?.[0] || data?.message?.[0]
      setState({ loading: false, message: firstError || 'Не вдалося надіслати форму. Напишіть мені напряму в Telegram або на email.', error: true })
    }
  }

  const telegram = `https://t.me/${String(settings.telegram || '').replace('@', '')}`
  const phoneHref = `tel:${String(settings.phone || '').replace(/\s/g, '')}`
  const emailHref = `mailto:${settings.email}`

  return (
    <div className="contact-page modern-page">
      <section className="modern-section contact-main-section direct-start-section">
        <div className="container-shell contact-modern-grid">
          <aside className="contact-direct-panel">
            <span className="contact-section-label">Прямий зв’язок</span>
            <h1>Оберіть зручний канал.</h1>
            <p>Для швидкої розмови найкраще підійде Telegram. Детальне технічне завдання можна надіслати поштою.</p>
            <div className="contact-channel-list">
              <a href={telegram} target="_blank" rel="noreferrer"><i><MessageCircle size={20} /></i><span><small>Telegram</small><strong>{settings.telegram}</strong></span><ArrowUpRight size={18} /></a>
              <a href={phoneHref}><i><Phone size={20} /></i><span><small>Телефон</small><strong>{settings.phone}</strong></span><ArrowUpRight size={18} /></a>
              <a href={emailHref}><i><Mail size={20} /></i><span><small>Email</small><strong>{settings.email}</strong></span><ArrowUpRight size={18} /></a>
            </div>
            <div className="contact-mini-note"><Check size={16} /><span>Після першого повідомлення уточню задачу, строки та потрібний функціонал.</span></div>
          </aside>

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <span>Короткий бриф</span>
              <h2>Залиште контакт — я повернуся з наступним кроком.</h2>
            </div>

            <form className="contact-modern-form" onSubmit={submit} noValidate>
              <div className="contact-honeypot" aria-hidden="true"><label htmlFor="contact-website">Ваш сайт</label><input id="contact-website" tabIndex="-1" autoComplete="off" value={form.website} onChange={(event) => update('website', event.target.value)} /></div>
              <div className="field modern-field">
                <label htmlFor="contact-name">Ваше ім’я</label>
                <input id="contact-name" required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Як до вас звертатися?" autoComplete="name" minLength={2} maxLength={80} />
              </div>

              <fieldset className="contact-method-fieldset">
                <legend>Куди краще відповісти?</legend>
                <div className="contact-method-grid">
                  {Object.entries(methodMeta).map(([value, meta]) => {
                    const Icon = meta.Icon
                    const isActive = form.contact_method === value
                    return (
                      <button
                        key={value}
                        type="button"
                        className={isActive ? 'is-active' : ''}
                        onClick={() => update('contact_method', value)}
                        aria-pressed={isActive}
                      >
                        <i><Icon size={20} /></i>
                        <span><strong>{meta.label}</strong><small>{meta.description}</small></span>
                        <b>{isActive && <Check size={15} />}</b>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="field modern-field contact-value-field" key={form.contact_method}>
                <label htmlFor="contact-value">Ваш {selectedMethod.label}</label>
                <div><selectedMethod.Icon size={18} /><input id="contact-value" required value={form.contact_value} onChange={(event) => update('contact_value', event.target.value)} placeholder={selectedMethod.hint} autoComplete={form.contact_method === 'email' ? 'email' : form.contact_method === 'phone' ? 'tel' : 'off'} inputMode={form.contact_method === 'email' ? 'email' : form.contact_method === 'phone' ? 'tel' : 'text'} /></div>
              </div>

              <div className="field modern-field">
                <label htmlFor="contact-message">Коротко про задачу</label>
                <textarea id="contact-message" value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Що потрібно створити, покращити або автоматизувати? Який у вас бізнес і бажаний результат?" rows={6} maxLength={3000} />
              </div>

              <div className="contact-form-footer">
                <button className="modern-submit" disabled={state.loading}>{state.loading ? 'Надсилання…' : <>Надіслати заявку <Send size={18} /></>}</button>
                <p>Надсилаючи форму, ви погоджуєтеся з <Link to="/privacy">обробкою контактних даних</Link> для відповіді на звернення.</p>
              </div>
              {state.message && <div className={`form-message contact-state-message ${state.error ? 'form-error' : ''}`}>{state.message}</div>}
            </form>
          </div>
        </div>
      </section>

      <section className="modern-section contact-next-section">
        <div className="container-shell">
          <div className="contact-next-grid">
            <div><span>Що буде далі</span><h2>Без довгої анкети на старті.</h2></div>
            {[
              ['01', 'Уточню задачу', 'Поставлю кілька конкретних запитань про бізнес, ціль і функціонал.'],
              ['02', 'Запропоную формат', 'Поясню, що варто робити зараз, а що можна залишити на наступний етап.'],
              ['03', 'Оцінимо проєкт', 'Зафіксуємо орієнтовні строки, бюджет та порядок роботи.'],
            ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="contact-bottom-action"><p>Вже маєте готовий опис або файл із вимогами?</p><a href={emailHref}>Надіслати на email <ArrowRight size={17} /></a></div>
        </div>
      </section>
    </div>
  )
}
