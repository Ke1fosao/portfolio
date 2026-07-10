import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, BellRing, BriefcaseBusiness, Check, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, ExternalLink, Inbox, Mail, MessageCircle, Phone,
  RefreshCw, Search, Send, ShieldCheck, Sparkles, UserRound, X,
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../lib/api'
import '../styles/telegram-mini-app.css'

const statusTone = {
  new: 'lime', viewed: 'blue', in_progress: 'amber', waiting_client: 'violet',
  completed: 'green', rejected: 'red', spam: 'red',
}

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—'

function getTelegram() {
  return window.Telegram?.WebApp || null
}

function haptic(type = 'selection') {
  const tg = getTelegram()
  if (!tg?.HapticFeedback) return
  if (type === 'success' || type === 'error' || type === 'warning') tg.HapticFeedback.notificationOccurred(type)
  else tg.HapticFeedback.selectionChanged()
}

function StatusPill({ status, label }) {
  return <span className={`tgapp-status tone-${statusTone[status] || 'gray'}`}>{label}</span>
}

function LeadCard({ lead, onOpen }) {
  return <button className={`tgapp-lead-card ${lead.is_read ? '' : 'is-unread'}`} onClick={() => onOpen(lead.id)}>
    <div className="tgapp-lead-avatar">{lead.name?.slice(0, 1)?.toUpperCase() || '?'}</div>
    <div className="tgapp-lead-copy">
      <div><strong>{lead.name}</strong>{!lead.is_read && <i>Нова</i>}</div>
      <p>{lead.service || lead.message || 'Без опису'}</p>
      <small>{lead.contact_method_label} · {formatDate(lead.created_at)}</small>
    </div>
    <div className="tgapp-lead-side"><StatusPill status={lead.status} label={lead.status_label}/><ChevronRight size={17}/></div>
  </button>
}

export default function TelegramMiniApp() {
  const tg = useMemo(getTelegram, [])
  const [tab, setTab] = useState('home')
  const [bootstrap, setBootstrap] = useState(null)
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const initData = tg?.initData || ''
  const headers = useMemo(() => ({ 'X-Telegram-Init-Data': initData }), [initData])

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
    tg.setHeaderColor?.('#111410')
    tg.setBackgroundColor?.('#f4f3ee')
    tg.enableClosingConfirmation?.()
  }, [tg])

  const loadBootstrap = useCallback(async () => {
    if (!initData) {
      setLoading(false)
      setError('Відкрий цей додаток через кнопку в Telegram-боті. У звичайному браузері захищений доступ недоступний.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get(`${API_URL}/telegram-mini-app/bootstrap/`, { headers, timeout: 10000 })
      setBootstrap(data)
      setLeads(data.recent || [])
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Не вдалося підключитися до CRM. Перевір бекенд і HTTPS-адресу.')
    } finally {
      setLoading(false)
    }
  }, [headers, initData])

  useEffect(() => { loadBootstrap() }, [loadBootstrap])

  const loadLeads = useCallback(async () => {
    if (!initData) return
    setListLoading(true)
    try {
      const { data } = await axios.get(`${API_URL}/telegram-mini-app/leads/`, {
        headers,
        params: { q: query || undefined, status: statusFilter || undefined, unread: unreadOnly ? 1 : undefined, limit: 60 },
        timeout: 10000,
      })
      setLeads(data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Не вдалося завантажити заявки.')
    } finally {
      setListLoading(false)
    }
  }, [headers, initData, query, statusFilter, unreadOnly])

  useEffect(() => {
    if (tab !== 'leads') return
    const timer = setTimeout(loadLeads, 250)
    return () => clearTimeout(timer)
  }, [loadLeads, tab])

  const openLead = async (id) => {
    haptic()
    setSaving(true)
    try {
      const { data } = await axios.get(`${API_URL}/telegram-mini-app/leads/${id}/`, { headers })
      setSelected(data)
      if (!data.is_read) await patchLead(id, { is_read: true }, false)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Не вдалося відкрити заявку.')
    } finally {
      setSaving(false)
    }
  }

  const patchLead = async (id, patch, refreshBootstrap = true) => {
    setSaving(true)
    try {
      const { data } = await axios.patch(`${API_URL}/telegram-mini-app/leads/${id}/`, patch, { headers })
      setSelected(data)
      setLeads((current) => current.map((lead) => lead.id === data.id ? { ...lead, ...data } : lead))
      haptic('success')
      if (refreshBootstrap) {
        const response = await axios.get(`${API_URL}/telegram-mini-app/bootstrap/`, { headers })
        setBootstrap(response.data)
      }
      return data
    } catch (requestError) {
      haptic('error')
      setError(requestError.response?.data?.detail || 'Не вдалося зберегти зміни.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const contactLead = (lead) => {
    const value = lead.contact_value || ''
    if (lead.contact_method === 'telegram') {
      const username = value.replace(/^@/, '')
      tg?.openTelegramLink?.(`https://t.me/${username}`)
    } else if (lead.contact_method === 'phone') {
      tg?.openLink?.(`tel:${value.replace(/\s/g, '')}`)
    } else if (lead.contact_method === 'email') {
      tg?.openLink?.(`mailto:${value}`)
    }
    haptic()
  }

  const userName = bootstrap?.user?.first_name || 'Дмитро'
  const stats = bootstrap?.stats || {}
  const statuses = bootstrap?.status_options || []

  if (loading) return <div className="tgapp-root tgapp-center"><div className="tgapp-loader"><span/><b>Підключаю CRM</b><small>Перевіряю захищену Telegram-сесію</small></div></div>

  if (error && !bootstrap) return <div className="tgapp-root tgapp-center"><div className="tgapp-access-card"><div><ShieldCheck size={30}/></div><h1>Захищений доступ</h1><p>{error}</p><button onClick={loadBootstrap}><RefreshCw size={17}/> Повторити</button></div></div>

  return <div className="tgapp-root">
    <header className="tgapp-topbar">
      <div className="tgapp-brand"><span>DK</span><div><strong>Portfolio CRM</strong><small>Приватний Telegram-додаток</small></div></div>
      <button className="tgapp-icon-button" onClick={() => { loadBootstrap(); if (tab === 'leads') loadLeads() }} aria-label="Оновити"><RefreshCw size={18} className={listLoading ? 'is-spinning' : ''}/></button>
    </header>

    {error && <button className="tgapp-error" onClick={() => setError('')}><CircleAlert size={17}/><span>{error}</span><X size={16}/></button>}

    <main className="tgapp-main">
      {tab === 'home' && <>
        <section className="tgapp-hero">
          <div><small><Sparkles size={14}/> CRM на зв’язку</small><h1>Привіт, {userName}</h1><p>Заявки, статуси та швидкий контакт з клієнтами — прямо всередині Telegram.</p></div>
          <div className="tgapp-hero-orb"><BellRing size={34}/><b>{stats.unread || 0}</b><span>непрочитаних</span></div>
        </section>

        <section className="tgapp-stats">
          <article><span><Inbox size={18}/></span><strong>{stats.today || 0}</strong><small>Сьогодні</small></article>
          <article><span><BellRing size={18}/></span><strong>{stats.new || 0}</strong><small>Нові</small></article>
          <article><span><BriefcaseBusiness size={18}/></span><strong>{stats.in_progress || 0}</strong><small>У роботі</small></article>
          <article><span><CheckCircle2 size={18}/></span><strong>{stats.completed || 0}</strong><small>Завершені</small></article>
        </section>

        <section className="tgapp-section">
          <div className="tgapp-section-head"><div><small>Остання активність</small><h2>Нові заявки</h2></div><button onClick={() => setTab('leads')}>Усі <ChevronRight size={16}/></button></div>
          <div className="tgapp-lead-list">{(bootstrap?.recent || []).length ? bootstrap.recent.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={openLead}/>) : <div className="tgapp-empty"><Inbox size={28}/><b>Заявок ще немає</b><p>Нові звернення з сайту з’являться тут автоматично.</p></div>}</div>
        </section>
      </>}

      {tab === 'leads' && <section className="tgapp-section tgapp-leads-page">
        <div className="tgapp-page-title"><div><small>CRM</small><h1>Заявки</h1></div><span>{leads.length}</span></div>
        <label className="tgapp-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ім’я, контакт, послуга..."/>{query && <button onClick={() => setQuery('')}><X size={16}/></button>}</label>
        <div className="tgapp-filters">
          <button className={statusFilter === '' ? 'active' : ''} onClick={() => setStatusFilter('')}>Усі</button>
          <button className={unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly((value) => !value)}>Непрочитані</button>
          {statuses.slice(0, 5).map((item) => <button key={item.value} className={statusFilter === item.value ? 'active' : ''} onClick={() => setStatusFilter(item.value)}>{item.label}</button>)}
        </div>
        <div className={`tgapp-lead-list ${listLoading ? 'is-loading' : ''}`}>{leads.length ? leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={openLead}/>) : <div className="tgapp-empty"><Search size={28}/><b>Нічого не знайдено</b><p>Зміни фільтр або пошуковий запит.</p></div>}</div>
      </section>}

      {tab === 'settings' && <section className="tgapp-section tgapp-settings">
        <div className="tgapp-page-title"><div><small>Система</small><h1>Додаток</h1></div><ShieldCheck size={26}/></div>
        <article className="tgapp-owner-card"><div className="tgapp-owner-avatar">{bootstrap?.user?.photo_url ? <img src={bootstrap.user.photo_url} alt=""/> : <UserRound size={24}/>}</div><div><small>Авторизований власник</small><strong>{[bootstrap?.user?.first_name, bootstrap?.user?.last_name].filter(Boolean).join(' ')}</strong><span>{bootstrap?.user?.username ? `@${bootstrap.user.username}` : `ID ${bootstrap?.user?.id}`}</span></div><Check size={20}/></article>
        <div className="tgapp-info-list">
          <article><span><ShieldCheck size={18}/></span><div><strong>Доступ тільки для тебе</strong><p>Бекенд перевіряє цифровий підпис Telegram та дозволений ID при кожному запиті.</p></div></article>
          <article><span><Send size={18}/></span><div><strong>Працює всередині Telegram</strong><p>Додаток використовує Telegram Mini Apps API, тему, вібровідгук і безпечну сесію.</p></div></article>
          <article><span><Clock3 size={18}/></span><div><strong>Дані в реальному часі</strong><p>Оновлюй статуси заявок без входу в повну адмінпанель.</p></div></article>
        </div>
        <button className="tgapp-wide-button" onClick={loadBootstrap}><RefreshCw size={18}/> Оновити дані</button>
      </section>}
    </main>

    <nav className="tgapp-bottom-nav">
      <button className={tab === 'home' ? 'active' : ''} onClick={() => { setTab('home'); haptic() }}><Sparkles size={20}/><span>Огляд</span></button>
      <button className={tab === 'leads' ? 'active' : ''} onClick={() => { setTab('leads'); haptic() }}><Inbox size={20}/><span>Заявки</span>{stats.unread > 0 && <b>{stats.unread > 99 ? '99+' : stats.unread}</b>}</button>
      <button className={tab === 'settings' ? 'active' : ''} onClick={() => { setTab('settings'); haptic() }}><ShieldCheck size={20}/><span>Додаток</span></button>
    </nav>

    {selected && <div className="tgapp-sheet-backdrop" onClick={() => setSelected(null)}>
      <section className="tgapp-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="tgapp-sheet-handle"/>
        <header><button onClick={() => setSelected(null)}><ArrowLeft size={19}/></button><div><small>Заявка #{selected.id}</small><h2>{selected.name}</h2></div><StatusPill status={selected.status} label={selected.status_label}/></header>
        <div className="tgapp-sheet-content">
          <div className="tgapp-contact-card"><span><UserRound size={20}/></span><div><small>{selected.contact_method_label}</small><strong>{selected.contact_value}</strong></div><button onClick={() => contactLead(selected)}>{selected.contact_method === 'phone' ? <Phone size={18}/> : selected.contact_method === 'email' ? <Mail size={18}/> : <MessageCircle size={18}/>} Зв’язатись</button></div>
          <dl>
            <div><dt>Послуга</dt><dd>{selected.service || 'Не вказано'}</dd></div>
            <div><dt>Бюджет</dt><dd>{selected.budget || 'Не вказано'}</dd></div>
            <div><dt>Створено</dt><dd>{formatDate(selected.created_at)}</dd></div>
          </dl>
          <article className="tgapp-message"><small>Повідомлення клієнта</small><p>{selected.message || 'Повідомлення не залишено.'}</p></article>
          <label className="tgapp-status-select"><span>Статус заявки</span><select value={selected.status} onChange={(event) => patchLead(selected.id, { status: event.target.value })} disabled={saving}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="tgapp-notes"><span>Внутрішня нотатка</span><textarea value={selected.internal_notes || ''} onChange={(event) => setSelected((current) => ({ ...current, internal_notes: event.target.value }))} placeholder="Наприклад: передзвонити завтра о 16:00"/><button disabled={saving} onClick={() => patchLead(selected.id, { internal_notes: selected.internal_notes || '' })}>{saving ? <RefreshCw size={17} className="is-spinning"/> : <Check size={17}/>} Зберегти нотатку</button></label>
          {selected.page_url && <button className="tgapp-source-link" onClick={() => tg?.openLink?.(selected.page_url)}><ExternalLink size={17}/> Відкрити сторінку-джерело</button>}
        </div>
      </section>
    </div>}
  </div>
}
