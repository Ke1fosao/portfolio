import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BellRing, Bot, Check, CheckCircle2, ChevronRight,
  CircleOff, Clock3, Cloud, Code2, Copy, ExternalLink, History, Inbox,
  Link2, LoaderCircle, MessageSquareText, RefreshCw, Rocket, Send,
  Settings2, ShieldCheck, Smartphone, Trash2, UserRound, Wifi, WifiOff,
} from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { useAdminUI } from '../../components/admin/AdminUI'
import '../../styles/notification-admin-v2.css'

const emptyStatus = {
  users: 0, recipients: 0, has_token: false, database_ready: true,
  allowed_count: 0, allowed_chat_ids: [], app_url: '', app_url_https: false,
  mini_app_enabled: false, bot_reachable: false, bot: {}, webhook: {},
  commands_count: 0, menu_button_configured: false, deliveries_24h: 0,
  sent_24h: 0, failed_24h: 0, issues: [], notices: [],
}

const tabs = [
  ['overview', 'Огляд', Activity],
  ['recipients', 'Отримувачі', UserRound],
  ['history', 'Історія', History],
  ['setup', 'Mini App і команди', Smartphone],
]

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Ще не було'

const maskId = (value) => {
  const text = String(value || '')
  if (text.length <= 5) return text
  return `${text.slice(0, 3)}•••${text.slice(-3)}`
}

const apiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data
  if (typeof payload?.detail === 'string') return payload.detail
  if (Array.isArray(payload?.errors) && payload.errors.length) return payload.errors.join(' · ')
  if (typeof payload === 'string' && payload.trim()) return payload
  if (error?.code === 'ECONNABORTED') return 'Backend відповідає надто довго. Перевір, чи запущений Django.'
  if (!error?.response && error?.message) return `Немає з’єднання з backend: ${error.message}`
  return fallback
}

function HealthRow({ ok, tone = '', icon: Icon, title, description, action }) {
  const state = tone === 'neutral' ? 'is-neutral' : ok ? 'is-ok' : 'is-warning'
  return <article className={`notification-health-row ${state}`}>
    <span><Icon size={19}/></span>
    <div><strong>{title}</strong><p>{description}</p></div>
    <b>{tone === 'neutral' ? <><CircleOff size={14}/> Необов’язково</> : ok ? <><Check size={14}/> Готово</> : <><AlertTriangle size={14}/> Увага</>}</b>
    {action}
  </article>
}

function DeliveryIcon({ channel }) {
  return channel === 'email' ? <Inbox size={17}/> : <Send size={17}/>
}

export default function NotificationAdmin() {
  const { notify } = useAdminUI()
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [status, setStatus] = useState(emptyStatus)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true)
    const failures = []
    try {
      // Status first: backend also synchronizes the allowed private Telegram user.
      const [statusResult, activityResult] = await Promise.allSettled([
        api.get('/telegram-users/status/'),
        api.get('/telegram-users/activity/?limit=60'),
      ])

      if (statusResult.status === 'fulfilled') {
        setStatus({ ...emptyStatus, ...(statusResult.value.data || {}) })
      } else {
        failures.push(apiErrorMessage(statusResult.reason, 'Не вдалося перевірити стан Telegram.'))
      }

      if (activityResult.status === 'fulfilled') {
        setActivity(activityResult.value.data || [])
      } else {
        failures.push(apiErrorMessage(activityResult.reason, 'Не вдалося завантажити історію доставок.'))
      }

      // Load users after status so the owner created from TELEGRAM_ALLOWED_CHAT_IDS is already visible.
      try {
        const usersResponse = await api.get('/telegram-users/')
        setUsers(unwrap(usersResponse) || [])
      } catch (error) {
        failures.push(apiErrorMessage(error, 'Не вдалося завантажити користувачів бота.'))
      }

      if (failures.length && !quiet) {
        notify(failures.join(' '), { type: failures.length >= 3 ? 'error' : 'warning', duration: 6500 })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const runAction = async (name, callback, successMessage) => {
    setAction(name)
    try {
      const response = await callback()
      if (successMessage) {
        const result = typeof successMessage === 'function' ? successMessage(response.data) : successMessage
        if (typeof result === 'string') notify(result)
        else if (result?.message) notify(result.message, { type: result.type || 'success', duration: result.duration })
      }
      await load(true)
      return response
    } catch (error) {
      notify(apiErrorMessage(error, 'Дію не виконано. Перевір, чи запущений backend і застосовані міграції.'), { type: 'error', duration: 6500 })
      return null
    } finally {
      setAction('')
    }
  }

  const updateUser = async (user, patch) => {
    await runAction(`user-${user.id}`, () => api.patch(`/telegram-users/${user.id}/`, patch), 'Налаштування отримувача збережено.')
  }

  const testMessage = async (user) => {
    await runAction(
      `test-${user.id}`,
      () => api.post(`/telegram-users/${user.id}/test_message/`),
      (data) => ({
        message: data.sent ? 'Тестове повідомлення доставлено.' : `Telegram: ${data.error || 'повідомлення не прийнято'}`,
        type: data.sent ? 'success' : 'error',
      }),
    )
  }

  const copy = async (text, message = 'Скопійовано.') => {
    try {
      await navigator.clipboard.writeText(text)
      notify(message)
    } catch {
      notify('Не вдалося скопіювати.', { type: 'error' })
    }
  }

  const filteredActivity = useMemo(() => activity.filter((item) => activityFilter === 'all' || item.status === activityFilter), [activity, activityFilter])
  const deliveryRate = status.deliveries_24h ? Math.round((status.sent_24h / status.deliveries_24h) * 100) : 100
  const botUrl = status.bot?.username ? `https://t.me/${status.bot.username}` : ''

  return <div className="notification-center-v2">
    <div className="admin-page-head notification-page-head">
      <div>
        <span>/admin/notifications</span>
        <h1>Центр сповіщень</h1>
        <p>Керування Telegram-ботом, приватним Mini App, отримувачами, командами та історією доставки заявок в одному місці.</p>
      </div>
      <div className="admin-head-actions">
        {botUrl && <a className="btn btn-light" href={botUrl} target="_blank" rel="noreferrer"><Bot size={17}/> Відкрити бота <ExternalLink size={14}/></a>}
        <button className="btn btn-light" onClick={() => load()} disabled={loading}><RefreshCw size={17} className={loading ? 'notification-spin' : ''}/> Оновити</button>
        <button className="btn btn-dark" onClick={() => runAction('broadcast', () => api.post('/telegram-users/broadcast_test/'), (data) => ({ message: `Доставлено: ${data.sent}. Помилок: ${data.failed}.`, type: data.failed ? 'warning' : 'success' }))} disabled={Boolean(action)}>{action === 'broadcast' ? <LoaderCircle size={17} className="notification-spin"/> : <Send size={17}/>} Надіслати тест</button>
      </div>
    </div>

    <section className={`notification-command-bar ${status.bot_reachable ? 'is-online' : 'is-offline'}`}>
      <div className="notification-bot-identity">
        <span>{status.bot_reachable ? <Bot size={26}/> : <WifiOff size={26}/>}</span>
        <div><small>{status.bot_reachable ? 'BOT ONLINE' : 'BOT NEEDS ATTENTION'}</small><strong>{status.bot?.first_name || 'Telegram Bot'}</strong><p>{status.bot?.username ? `@${status.bot.username}` : 'Перевір токен і підключення до Telegram API'}</p></div>
      </div>
      <div className="notification-command-metrics">
        <p><span>Доставка за 24 год</span><strong>{deliveryRate}%</strong></p>
        <p><span>Одержувачі</span><strong>{status.recipients}</strong></p>
        <p><span>Mini App</span><strong>{status.app_url_https ? 'HTTPS' : 'ВИМК.'}</strong></p>
      </div>
      <button onClick={() => setTab(status.issues?.length ? 'setup' : 'overview')}><Settings2 size={17}/>{status.issues?.length ? `${status.issues.length} проблем` : 'Все налаштовано'}<ChevronRight size={16}/></button>
    </section>

    <div className="notification-kpis">
      <article><span className="tone-green"><CheckCircle2 size={20}/></span><div><small>Успішно за 24 год</small><strong>{status.sent_24h}</strong><p>Telegram та email доставки</p></div></article>
      <article><span className={status.failed_24h ? 'tone-red' : 'tone-neutral'}><AlertTriangle size={20}/></span><div><small>Помилки за 24 год</small><strong>{status.failed_24h}</strong><p>{status.failed_24h ? 'Потрібна перевірка журналу' : 'Критичних проблем немає'}</p></div></article>
      <article><span className="tone-blue"><UserRound size={20}/></span><div><small>Користувачі бота</small><strong>{status.users}</strong><p>{status.allowed_count} дозволено через .env</p></div></article>
      <article><span className={status.menu_button_configured ? 'tone-violet' : 'tone-neutral'}><Smartphone size={20}/></span><div><small>Telegram Mini App</small><strong>{status.menu_button_configured ? 'ON' : 'OFF'}</strong><p>{status.menu_button_configured ? 'Кнопка меню активна' : 'Вимкнений до появи HTTPS-домену'}</p></div></article>
    </div>

    <nav className="notification-tabs" aria-label="Розділи центру сповіщень">
      {tabs.map(([value, label, Icon]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}><Icon size={17}/><span>{label}</span>{value === 'history' && status.failed_24h > 0 && <b>{status.failed_24h}</b>}</button>)}
    </nav>

    {loading ? <div className="notification-loading"><LoaderCircle size={28} className="notification-spin"/><strong>Перевіряю Telegram-інтеграцію</strong><p>Завантажую стан бота, Mini App та журнал доставок.</p></div> : <>
      {tab === 'overview' && <div className="notification-overview-grid">
        <section className="admin-card notification-panel">
          <div className="notification-panel-head"><div><small>LIVE DIAGNOSTICS</small><h2>Стан інтеграції</h2><p>Перевірка критичних частин, від яких залежить доставка заявок.</p></div><span className={status.issues?.length ? 'is-warning' : 'is-ok'}>{status.issues?.length ? <AlertTriangle size={19}/> : <ShieldCheck size={19}/>}</span></div>
          <div className="notification-health-list">
            <HealthRow ok={status.has_token} icon={Code2} title="Bot token" description={status.has_token ? 'Токен завантажено з backend/.env і не передається у frontend.' : 'TELEGRAM_BOT_TOKEN не знайдено.'}/>
            <HealthRow ok={status.bot_reachable} icon={Wifi} title="Telegram API" description={status.bot_reachable ? `Бот @${status.bot?.username || 'підключений'} відповідає на getMe.` : 'Telegram API не підтвердив підключення бота.'}/>
            <HealthRow ok={status.allowed_count === 1} icon={ShieldCheck} title="Приватний доступ" description={status.allowed_count === 1 ? `Дозволений тільки ID ${maskId(status.allowed_chat_ids?.[0])}.` : `Дозволених ID: ${status.allowed_count}. Для приватного режиму залиш один.`}/>
            <HealthRow ok={status.database_ready} icon={History} title="Журнал доставок" description={status.database_ready ? 'Таблиця історії сповіщень готова.' : 'Потрібно один раз запустити FIX_TELEGRAM_LOCAL.bat або python manage.py migrate.'}/>
            <HealthRow ok={status.app_url_https} tone={status.app_url_https ? '' : 'neutral'} icon={Cloud} title="Публічна HTTPS-адреса" description={status.app_url_https ? status.app_url : 'Зараз Mini App вимкнений. Звичайний Telegram-бот повністю працює локально без домену.'}/>
            <HealthRow ok={status.menu_button_configured} tone={status.app_url_https ? '' : 'neutral'} icon={Smartphone} title="Кнопка Mini App" description={status.menu_button_configured ? 'Кнопка «Відкрити CRM» активна.' : 'Підключиш пізніше після появи HTTPS-домену.'}/>
            <HealthRow ok={!status.webhook?.active} icon={Link2} title="Режим отримання команд" description={status.webhook?.active ? `Активний webhook: ${status.webhook.url}` : 'Webhook вимкнено — локальний long polling може працювати.'}/>
          </div>
        </section>

        <aside className="notification-side-stack">
          <section className="admin-card notification-quick-card">
            <div className="notification-panel-head compact"><div><small>QUICK ACTIONS</small><h2>Швидкі дії</h2></div><Rocket size={22}/></div>
            <button onClick={() => runAction('setup', () => api.post('/telegram-users/setup/'), (data) => ({ message: data.mode === 'local' && data.configured ? 'Локального бота, команди й приватного отримувача налаштовано.' : data.configured ? 'Бот і Mini App налаштовані.' : 'Налаштування завершено частково. Перевір діагностику.', type: data.configured ? 'success' : 'warning' })) } disabled={Boolean(action)}><span><Rocket size={18}/></span><div><strong>Налаштувати автоматично</strong><small>Команди, menu button і тестове повідомлення</small></div><ChevronRight size={17}/></button>
            <button onClick={() => runAction('broadcast', () => api.post('/telegram-users/broadcast_test/'), (data) => ({ message: data.sent ? 'Тестове повідомлення надіслано.' : 'Telegram не підтвердив доставку.', type: data.sent ? 'success' : 'error' }))} disabled={Boolean(action)}><span><Send size={18}/></span><div><strong>Перевірити доставку</strong><small>Тест усім активним отримувачам</small></div><ChevronRight size={17}/></button>
            <button onClick={() => copy(status.app_url || '')} disabled={!status.app_url}><span><Copy size={18}/></span><div><strong>Скопіювати Mini App URL</strong><small>{status.app_url || 'URL не налаштовано'}</small></div><ChevronRight size={17}/></button>
          </section>

          <section className="admin-card notification-activity-preview">
            <div className="notification-panel-head compact"><div><small>RECENT</small><h2>Останні доставки</h2></div><button onClick={() => setTab('history')}>Усі <ChevronRight size={15}/></button></div>
            <div>{activity.slice(0, 5).map((item) => <article key={item.id}><span className={`delivery-${item.status}`}><DeliveryIcon channel={item.channel}/></span><div><strong>{item.channel_label || item.channel}</strong><p>{item.lead_name || item.message_preview || item.event}</p></div><small>{formatDate(item.created_at)}</small></article>)}</div>
            {!activity.length && <div className="notification-empty-mini"><History size={22}/><p>Історія ще порожня. Надішли тест або створи заявку.</p></div>}
          </section>
        </aside>
      </div>}

      {tab === 'recipients' && <section className="admin-card notification-panel">
        <div className="notification-panel-head"><div><small>PRIVATE RECIPIENTS</small><h2>Кому надсилати заявки</h2><p>Для максимально приватного режиму тут має бути лише твій Telegram, а в TELEGRAM_ALLOWED_CHAT_IDS — один ID.</p></div><span className="is-ok"><ShieldCheck size={19}/></span></div>
        {!users.length ? <div className="notification-empty"><Smartphone size={31}/><h3>Telegram-користувач ще не зареєстрований</h3><p>Запусти polling, напиши боту <code>/start</code>, після цього натисни «Оновити».</p><button className="btn btn-dark" onClick={() => load()}><RefreshCw size={16}/> Перевірити ще раз</button></div> : <div className="notification-user-grid">
          {users.map((user) => <article key={user.id} className={`${user.is_notification_recipient ? 'is-recipient' : ''} ${user.is_blocked ? 'is-blocked' : ''}`}>
            <header><span><UserRound size={22}/></span><div><small>{user.username ? `@${user.username}` : 'Telegram user'}</small><h3>{user.display_name}</h3><p>ID: {user.chat_id}</p></div><b>{user.is_blocked ? <><CircleOff size={14}/> Заблокований</> : <><Check size={14}/> Дозволений</>}</b></header>
            <div className="notification-user-meta"><p><Clock3 size={15}/><span>Остання активність<strong>{formatDate(user.last_seen_at)}</strong></span></p><p><MessageSquareText size={15}/><span>Остання команда<strong>{user.last_command || '—'}</strong></span></p></div>
            <div className="notification-user-toggles">
              <label><input type="checkbox" checked={Boolean(user.is_notification_recipient)} onChange={(event) => updateUser(user, { is_notification_recipient: event.target.checked })}/><span><strong>Отримувати заявки</strong><small>Нові ліди приходитимуть у цей чат</small></span></label>
              <label><input type="checkbox" checked={Boolean(user.is_blocked)} onChange={(event) => updateUser(user, { is_blocked: event.target.checked })}/><span><strong>Заблокувати</strong><small>Бот перестане надсилати повідомлення</small></span></label>
            </div>
            <footer><button onClick={() => copy(user.chat_id, 'Chat ID скопійовано.')}><Copy size={15}/> Копіювати ID</button><button onClick={() => testMessage(user)} disabled={action === `test-${user.id}`}>{action === `test-${user.id}` ? <LoaderCircle size={15} className="notification-spin"/> : <Send size={15}/>} Тест</button></footer>
          </article>)}
        </div>}
      </section>}

      {tab === 'history' && <section className="admin-card notification-panel notification-history-panel">
        <div className="notification-panel-head"><div><small>DELIVERY LOG</small><h2>Історія сповіщень</h2><p>Кожна спроба Telegram або email доставки з результатом і текстом помилки.</p></div><button className="notification-danger-link" onClick={() => { if (window.confirm('Очистити всю історію доставок?')) runAction('clear', () => api.delete('/telegram-users/clear_activity/'), 'Історію очищено.') }}><Trash2 size={16}/> Очистити</button></div>
        <div className="notification-history-filters"><button className={activityFilter === 'all' ? 'active' : ''} onClick={() => setActivityFilter('all')}>Усі <b>{activity.length}</b></button><button className={activityFilter === 'sent' ? 'active' : ''} onClick={() => setActivityFilter('sent')}>Надіслані <b>{activity.filter((item) => item.status === 'sent').length}</b></button><button className={activityFilter === 'failed' ? 'active' : ''} onClick={() => setActivityFilter('failed')}>Помилки <b>{activity.filter((item) => item.status === 'failed').length}</b></button></div>
        <div className="notification-history-list">
          {filteredActivity.map((item) => <article key={item.id} className={`is-${item.status}`}>
            <span><DeliveryIcon channel={item.channel}/></span>
            <div className="notification-history-main"><header><strong>{item.channel_label || item.channel}</strong><b>{item.status_label || item.status}</b><small>{formatDate(item.created_at)}</small></header><p>{item.lead_name ? `Заявка: ${item.lead_name}` : item.message_preview || item.event}</p>{item.error && <pre>{item.error}</pre>}</div>
            <div className="notification-history-recipient"><small>Отримувач</small><strong>{item.channel === 'telegram' ? maskId(item.recipient) : item.recipient || '—'}</strong>{item.lead && <button onClick={() => window.location.assign(`/admin/contact?lead=${item.lead}`)}>Заявка #{item.lead}<ChevronRight size={14}/></button>}</div>
          </article>)}
          {!filteredActivity.length && <div className="notification-empty"><History size={31}/><h3>Записів немає</h3><p>Для цього фільтра історія порожня.</p></div>}
        </div>
      </section>}

      {tab === 'setup' && <div className="notification-setup-grid">
        <section className="admin-card notification-panel">
          <div className="notification-panel-head"><div><small>TELEGRAM MINI APP</small><h2>Приватний CRM-додаток</h2><p>Повноцінна мобільна CRM всередині Telegram: огляд, заявки, пошук, статуси, нотатки та швидкий контакт.</p></div><span className={status.app_url_https ? 'is-ok' : 'is-warning'}><Smartphone size={20}/></span></div>
          <div className="notification-url-box"><div><Cloud size={18}/><span><small>TELEGRAM_WEBAPP_URL</small><strong>{status.app_url || 'Не вказано'}</strong></span></div><button onClick={() => copy(status.app_url || '')} disabled={!status.app_url}><Copy size={16}/></button></div>
          <div className="notification-security-note"><ShieldCheck size={20}/><div><strong>Чому ним користуватимешся тільки ти</strong><p>Mini App перевіряє підпис <code>initData</code> від Telegram на бекенді та порівнює Telegram user ID зі списком <code>TELEGRAM_ALLOWED_CHAT_IDS</code>. Просте відкриття URL у браузері доступу до CRM не дає.</p></div></div>
          <div className="notification-setup-steps">
            <article className={status.app_url_https ? 'done' : ''}><b>01</b><div><strong>Опублікуй сайт і API через HTTPS</strong><p>Наприклад: frontend на Vercel/Netlify, Django API на Render/Railway/VPS.</p></div>{status.app_url_https && <CheckCircle2 size={20}/>}</article>
            <article className={status.app_url_https ? 'done' : ''}><b>02</b><div><strong>Вкажи URL у backend/.env</strong><code>TELEGRAM_WEBAPP_URL=https://твій-домен/telegram-app</code></div>{status.app_url_https && <CheckCircle2 size={20}/>}</article>
            <article className={status.menu_button_configured ? 'done' : ''}><b>03</b><div><strong>Налаштуй бота однією кнопкою</strong><p>Команди та кнопка меню встановляться тільки для дозволеного chat ID.</p></div>{status.menu_button_configured && <CheckCircle2 size={20}/>}</article>
            <article><b>04</b><div><strong>Запусти обробку команд</strong><code>python manage.py run_telegram_bot</code></div></article>
          </div>
          <button className="btn btn-dark notification-setup-primary" onClick={() => runAction('setup', () => api.post('/telegram-users/setup/'), (data) => ({ message: data.mode === 'local' && data.configured ? 'Локального Telegram-бота налаштовано. Mini App залишено вимкненим.' : data.configured ? 'Бота й Mini App налаштовано.' : 'Частину операцій не виконано. Перевір діагностику.', type: data.configured ? 'success' : 'warning' }))} disabled={Boolean(action)}>{action === 'setup' ? <LoaderCircle size={17} className="notification-spin"/> : <Rocket size={17}/>} {status.app_url_https ? 'Налаштувати бота й Mini App' : 'Налаштувати локального бота'}</button>
        </section>

        <aside className="notification-side-stack">
          <section className="admin-card notification-panel notification-command-list">
            <div className="notification-panel-head compact"><div><small>BOT COMMANDS</small><h2>Команди бота</h2></div><Code2 size={21}/></div>
            {[['/app','Відкрити приватний CRM-додаток'],['/status','Короткий стан CRM'],['/today','Заявки за сьогодні'],['/new','Нові непрочитані'],['/leads','Останні 5 заявок'],['/lead ID','Деталі заявки'],['/take ID','Взяти в роботу'],['/done ID','Завершити'],['/spam ID','Позначити спамом'],['/search текст','Пошук по CRM']].map(([command, description]) => <article key={command}><code>{command}</code><span>{description}</span></article>)}
          </section>
          <section className="admin-card notification-panel notification-local-card">
            <div className="notification-panel-head compact"><div><small>LOCAL MODE</small><h2>Що працює локально</h2></div><Cloud size={21}/></div>
            <p><Check size={15}/> Сповіщення про заявки</p><p><Check size={15}/> Команди через long polling</p><p className={!status.app_url_https ? 'warning' : ''}>{status.app_url_https ? <Check size={15}/> : <AlertTriangle size={15}/>} Mini App потребує HTTPS</p>
            <code>python manage.py run_telegram_bot</code>
          </section>
        </aside>
      </div>}
    </>}
  </div>
}
