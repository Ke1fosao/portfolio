import { useEffect, useState } from 'react'
import { BellRing, RefreshCw, Send, Smartphone } from 'lucide-react'
import api, { unwrap } from '../../lib/api'
import { useAdminUI } from '../../components/admin/AdminUI'

export default function NotificationAdmin() {
  const { notify } = useAdminUI()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState({ users: 0, recipients: 0, has_token: false })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [usersResponse, statusResponse] = await Promise.all([
        api.get('/telegram-users/'),
        api.get('/telegram-users/status/'),
      ])
      setUsers(unwrap(usersResponse) || [])
      setStatus(statusResponse.data || {})
    } catch {
      notify('Не вдалося завантажити Telegram-користувачів.', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateUser = async (user, patch) => {
    const response = await api.patch(`/telegram-users/${user.id}/`, patch)
    const saved = response.data
    setUsers((current) => current.map((item) => item.id === saved.id ? saved : item))
    notify('Налаштування отримувача збережено.')
    load()
  }

  const testMessage = async (user) => {
    const response = await api.post(`/telegram-users/${user.id}/test_message/`)
    notify(response.data.sent ? 'Тестове повідомлення відправлено.' : `Telegram помилка: ${response.data.error}`, { type: response.data.sent ? 'success' : 'error' })
  }

  return <div className="notification-admin">
    <div className="admin-page-head">
      <div>
        <span>/admin/notifications</span>
        <h1>Telegram сповіщення</h1>
        <p>Користувачі з’являються тут після того, як напишуть боту команду /start. Потім можна вибрати, кому надсилати заявки.</p>
      </div>
      <button className="btn btn-light" onClick={load}><RefreshCw size={17}/> Оновити</button>
    </div>

    <div className="admin-grid notification-stats">
      <div className="admin-stat"><span>Bot token</span><strong>{status.has_token ? 'OK' : '—'}</strong><small>{status.has_token ? 'Token підключено' : 'Додайте TELEGRAM_BOT_TOKEN'}</small></div>
      <div className="admin-stat"><span>Користувачі бота</span><strong>{status.users}</strong><small>Після /start або будь-якої команди</small></div>
      <div className="admin-stat"><span>Отримувачі</span><strong>{status.recipients}</strong><small>Активні адресати заявок</small></div>
      <div className="admin-stat"><span>Polling</span><strong>Local</strong><small>Команда: python manage.py run_telegram_bot</small></div>
    </div>

    <div className="admin-card bot-commands">
      <h2>Команди бота</h2>
      <div><code>/start</code><span>зареєструвати Telegram у системі</span></div>
      <div><code>/help</code><span>показати доступні команди</span></div>
      <div><code>/status</code><span>короткий стан CRM</span></div>
      <div><code>/leads</code><span>останні 5 заявок</span></div>
      <div><code>/notify_on</code><span>увімкнути себе як отримувача</span></div>
      <div><code>/notify_off</code><span>вимкнути себе як отримувача</span></div>
    </div>


    <div className="admin-card">
      <div className="admin-list-head"><h2>Користувачі бота</h2><button className="icon-btn" onClick={load} aria-label="Оновити"><RefreshCw size={17}/></button></div>
      {loading ? <p>Завантаження...</p> : !users.length ? <div className="crm-empty"><Smartphone size={24}/><p>Список порожній. Напиши боту /start і натисни «Оновити».</p></div> : <div className="telegram-user-list">{users.map((user) => <article key={user.id}>
        <div><BellRing size={18}/><span><strong>{user.display_name}</strong><small>chat id: {user.chat_id}</small>{user.last_seen_at && <small>Остання активність: {new Date(user.last_seen_at).toLocaleString('uk-UA')}</small>}</span></div>
        <label className="admin-check"><input type="checkbox" checked={Boolean(user.is_notification_recipient)} onChange={(e) => updateUser(user, { is_notification_recipient: e.target.checked })}/><span>Отримувати заявки</span></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(user.is_blocked)} onChange={(e) => updateUser(user, { is_blocked: e.target.checked })}/><span>Заблокований</span></label>
        <button className="btn btn-light" onClick={() => testMessage(user)}><Send size={16}/> Тест</button>
      </article>)}</div>}
    </div>
  </div>
}
