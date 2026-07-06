import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  DatabaseBackup,
  ExternalLink,
  FileText,
  FolderKanban,
  Gauge,
  Layers3,
  MessageSquareText,
  Newspaper,
  Plus,
  RefreshCw,
  Rocket,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  TrendingUp,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../../lib/api'

const statusLabels = {
  new: 'Нові',
  viewed: 'Переглянуті',
  in_progress: 'У роботі',
  waiting_client: 'Очікують клієнта',
  completed: 'Завершені',
  rejected: 'Відхилені',
  spam: 'Спам',
}

const funnelOrder = ['new', 'viewed', 'in_progress', 'waiting_client', 'completed', 'rejected']

const responseTime = (seconds) => {
  if (seconds == null) return '—'
  if (seconds < 60) return '< 1 хв'
  if (seconds < 3600) return `${Math.round(seconds / 60)} хв`
  return `${(seconds / 3600).toFixed(1)} год`
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('uk-UA', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const formatRelativeTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'щойно'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} хв тому`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} год тому`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн тому`
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export default function OverviewAdmin() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/dashboard-stats/')
      .then((response) => {
        setStats(unwrap(response))
        setError('')
      })
      .catch(() => setError('Не вдалося завантажити дані панелі керування.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const primaryMetrics = useMemo(() => {
    const data = stats || {}
    return [
      {
        title: 'Нові заявки',
        value: data.new_leads || 0,
        note: data.unread_leads ? `${data.unread_leads} ще не переглянуто` : 'Усі вже переглянуті',
        to: '/admin/contact?status=new',
        icon: MessageSquareText,
        tone: 'lime',
      },
      {
        title: 'Потребують відповіді',
        value: data.pending_response || 0,
        note: 'Очікують першої реакції',
        to: '/admin/contact?read=unread',
        icon: BellRing,
        tone: 'amber',
      },
      {
        title: 'Конверсія за місяць',
        value: `${data.conversion_this_month || 0}%`,
        note: `${data.completed_this_month || 0} успішно завершено`,
        to: '/admin/analytics',
        icon: TrendingUp,
        tone: 'blue',
      },
      {
        title: 'Середня відповідь',
        value: responseTime(data.avg_response_seconds),
        note: 'Від заявки до першої реакції',
        to: '/admin/analytics',
        icon: TimerReset,
        tone: 'violet',
      },
    ]
  }, [stats])

  const secondaryMetrics = useMemo(() => {
    const data = stats || {}
    return [
      ['У роботі', data.in_progress_leads || 0, 'Активні діалоги', '/admin/contact?status=in_progress', BriefcaseBusiness, 'green'],
      ['Очікують клієнта', data.waiting_client_leads || 0, 'Потрібна відповідь клієнта', '/admin/contact?status=waiting_client', Clock3, 'purple'],
      ['Активні проєкти', data.active_projects || 0, 'Опубліковані кейси', '/admin/projects', FolderKanban, 'blue'],
      ['Чернетки', data.draft_posts || 0, 'Ще не опубліковано', '/admin/blog?status=draft', FileText, 'slate'],
      ['SEO-проблеми', data.seo_issue_count || 0, 'Потрібна оптимізація', '/admin/seo', SearchCheck, 'amber'],
      ['Безпека', data.critical_security_events_7d || 0, 'Критичні події за 7 днів', '/admin/security', ShieldCheck, 'red'],
    ]
  }, [stats])

  const funnel = useMemo(() => {
    const entries = new Map((stats?.lead_statuses || []).map((entry) => [entry.status, entry.total]))
    const data = funnelOrder.map((status) => ({ status, total: entries.get(status) || 0 }))
    const max = Math.max(1, ...data.map((entry) => entry.total))
    return data.map((entry) => ({ ...entry, percent: Math.max(entry.total ? 9 : 2, Math.round((entry.total / max) * 100)) }))
  }, [stats])

  const totalFunnelLeads = funnel.reduce((sum, entry) => sum + entry.total, 0)
  const attentionCount = (stats?.attention || []).reduce((sum, item) => sum + Number(item.count || 0), 0)

  if (loading && !stats) {
    return <div className="overview-loading-shell" aria-live="polite">
      <div className="overview-loading-orb"><RefreshCw size={24}/></div>
      <strong>Готуємо панель керування</strong>
      <span>Збираємо заявки, контент і стан системи…</span>
    </div>
  }

  return <main className="overview-v4">
    <section className="overview-command-hero">
      <div className="overview-command-copy">
        <div className="overview-live-label"><span/> ADMIN COMMAND CENTER</div>
        <p className="overview-date-label">{new Date().toLocaleDateString('uk-UA', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}</p>
        <h1>Тримай сайт і клієнтів<br/><em>під повним контролем.</em></h1>
        <p className="overview-command-subtitle">
          {stats?.pending_response
            ? `Є ${stats.pending_response} ${stats.pending_response === 1 ? 'заявка, що потребує' : 'заявок, що потребують'} твоєї реакції.`
            : 'Термінових заявок немає — можна зосередитися на розвитку контенту.'}
        </p>
        <div className="overview-command-actions">
          <Link className="overview-primary-action" to="/admin/contact?read=unread">
            <MessageSquareText size={18}/> Відкрити CRM <ArrowRight size={17}/>
          </Link>
          <Link className="overview-ghost-action" to="/admin/projects">
            <Plus size={17}/> Додати контент
          </Link>
          <a className="overview-icon-action" href="/" target="_blank" rel="noreferrer" aria-label="Відкрити сайт">
            <ExternalLink size={18}/>
          </a>
          <button className="overview-icon-action" onClick={load} disabled={loading} aria-label="Оновити дані">
            <RefreshCw className={loading ? 'admin-spin' : ''} size={18}/>
          </button>
        </div>
      </div>

      <div className="overview-command-visual" aria-hidden="true">
        <div className="overview-orbit overview-orbit-one"/>
        <div className="overview-orbit overview-orbit-two"/>
        <div className="overview-health-core">
          <div className="overview-health-ring" style={{ '--overview-progress': `${Math.min(100, Number(stats?.conversion_this_month || 0)) * 3.6}deg` }}>
            <span><Gauge size={22}/><strong>{stats?.conversion_this_month || 0}%</strong><small>конверсія</small></span>
          </div>
        </div>
        <div className="overview-float-chip chip-leads"><MessageSquareText size={15}/><span><strong>{stats?.new_leads || 0}</strong> нових</span></div>
        <div className="overview-float-chip chip-projects"><Rocket size={15}/><span><strong>{stats?.active_projects || 0}</strong> проєктів</span></div>
        <div className="overview-float-chip chip-health"><ShieldCheck size={15}/><span><strong>{attentionCount ? 'Увага' : 'OK'}</strong> система</span></div>
      </div>
    </section>

    {error && <div className="admin-toast is-error"><AlertTriangle size={17}/>{error}</div>}

    <section className="overview-primary-metrics" aria-label="Головні показники">
      {primaryMetrics.map(({ title, value, note, to, icon: Icon, tone }) => (
        <Link to={to} className={`overview-primary-card tone-${tone}`} key={title}>
          <header><span><Icon size={19}/></span><ArrowUpRight size={17}/></header>
          <strong>{value}</strong>
          <div><b>{title}</b><small>{note}</small></div>
        </Link>
      ))}
    </section>

    <section className="overview-section-heading">
      <div><span>Операційна картина</span><h2>Що відбувається прямо зараз</h2></div>
      <Link to="/admin/analytics">Детальна аналітика <ArrowUpRight size={15}/></Link>
    </section>

    <section className="overview-secondary-metrics">
      {secondaryMetrics.map(([title, value, note, to, Icon, tone]) => (
        <Link to={to} className={`overview-mini-metric tone-${tone}`} key={title}>
          <span className="overview-mini-icon"><Icon size={18}/></span>
          <div><small>{title}</small><strong>{value}</strong><p>{note}</p></div>
          <ChevronRight size={17}/>
        </Link>
      ))}
    </section>

    <section className="overview-bento-grid">
      <article className="overview-panel overview-attention-panel">
        <header className="overview-panel-head">
          <div className="overview-panel-title"><span className="overview-title-icon is-attention"><Zap size={18}/></span><div><small>ПРІОРИТЕТИ</small><h2>Потребує уваги</h2></div></div>
          <div className={`overview-counter ${attentionCount ? 'is-alert' : 'is-ok'}`}>{attentionCount || '0'}</div>
        </header>
        <p className="overview-panel-intro">Найважливіші речі, які варто перевірити першими.</p>
        <div className="overview-attention-list">
          {stats?.attention?.length ? stats.attention.slice(0, 6).map((item, index) => (
            <Link to={item.url} className="overview-attention-row" key={item.key}>
              <span className="overview-attention-index">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{item.title}</strong><p>{item.description}</p></div>
              <b>{item.count}</b>
              <ChevronRight size={17}/>
            </Link>
          )) : <div className="overview-perfect-state">
            <span><CheckCircle2 size={26}/></span>
            <div><strong>Усе під контролем</strong><p>Критичних задач або проблем зараз немає.</p></div>
          </div>}
        </div>
      </article>

      <article className="overview-panel overview-funnel-panel">
        <header className="overview-panel-head">
          <div className="overview-panel-title"><span className="overview-title-icon is-funnel"><Target size={18}/></span><div><small>CRM PIPELINE</small><h2>Воронка заявок</h2></div></div>
          <Link to="/admin/contact">CRM <ArrowUpRight size={14}/></Link>
        </header>
        <div className="overview-funnel-total"><strong>{totalFunnelLeads}</strong><span>заявок у всіх активних етапах</span></div>
        <div className="overview-funnel-bars">
          {funnel.map((entry) => (
            <Link key={entry.status} to={`/admin/contact?status=${entry.status}`} className={`overview-funnel-row status-${entry.status}`}>
              <div><span>{statusLabels[entry.status] || entry.status}</span><strong>{entry.total}</strong></div>
              <i><b style={{ width: `${entry.percent}%` }}/></i>
            </Link>
          ))}
        </div>
      </article>

      <article className="overview-panel overview-system-panel">
        <header className="overview-panel-head">
          <div className="overview-panel-title"><span className="overview-title-icon is-system"><CircleGauge size={18}/></span><div><small>SYSTEM HEALTH</small><h2>Стан системи</h2></div></div>
        </header>
        <div className="overview-system-score">
          <div className={`overview-system-indicator ${attentionCount ? 'has-warnings' : 'is-healthy'}`}>
            <span>{attentionCount ? Math.max(45, 100 - attentionCount * 6) : 100}</span><small>/ 100</small>
          </div>
          <div><strong>{attentionCount ? 'Є рекомендації' : 'Працює стабільно'}</strong><p>{attentionCount ? 'Перевір пріоритетні задачі на цій сторінці.' : 'Критичних проблем не виявлено.'}</p></div>
        </div>
        <div className="overview-system-list">
          <Link to="/admin/backups"><DatabaseBackup size={17}/><span><strong>Резервна копія</strong><small>{stats?.latest_backup_at ? formatRelativeTime(stats.latest_backup_at) : 'Ще не створена'}</small></span><i className={stats?.latest_backup_at ? 'ok' : 'warn'}/></Link>
          <Link to="/admin/security"><ShieldCheck size={17}/><span><strong>Безпека</strong><small>{stats?.critical_security_events_7d || 0} критичних подій</small></span><i className={stats?.critical_security_events_7d ? 'warn' : 'ok'}/></Link>
          <Link to="/admin/seo"><SearchCheck size={17}/><span><strong>SEO-контроль</strong><small>{stats?.seo_issue_count || 0} сторінок із проблемами</small></span><i className={stats?.seo_issue_count ? 'warn' : 'ok'}/></Link>
          <Link to="/admin/trash"><Trash2 size={17}/><span><strong>Кошик</strong><small>{stats?.trash_count || 0} видалених записів</small></span><i className={stats?.trash_count ? 'neutral' : 'ok'}/></Link>
        </div>
      </article>
    </section>

    <section className="overview-leads-section">
      <header className="overview-section-heading">
        <div><span>ЖИВА СТРІЧКА CRM</span><h2>Останні заявки</h2></div>
        <Link to="/admin/contact">Переглянути всі <ArrowRight size={15}/></Link>
      </header>

      <div className="overview-leads-card">
        {!stats?.recent_leads?.length ? <div className="overview-empty-state"><MessageSquareText size={26}/><strong>Заявок поки немає</strong><span>Нові звернення з сайту з’являться тут автоматично.</span></div> : (
          <div className="overview-leads-table-wrap">
            <table className="overview-leads-table">
              <thead><tr><th>Клієнт</th><th>Контакт</th><th>Запит</th><th>Отримано</th><th>Статус</th><th/></tr></thead>
              <tbody>{stats.recent_leads.map((lead) => (
                <tr key={lead.id} className={lead.is_read ? '' : 'is-unread'}>
                  <td><div className="overview-client-cell"><span>{String(lead.name || '?').charAt(0).toUpperCase()}</span><div><strong>{lead.name || 'Без імені'}</strong><small>{lead.source || 'Сайт'}</small></div></div></td>
                  <td><strong className="overview-contact-value">{lead.contact_value || '—'}</strong></td>
                  <td><p className="overview-message-preview">{lead.message || 'Повідомлення не вказано'}</p></td>
                  <td><span className="overview-date-cell">{formatRelativeTime(lead.created_at)}<small>{formatDateTime(lead.created_at)}</small></span></td>
                  <td><span className={`status-chip status-${lead.status}`}>{statusLabels[lead.status] || lead.status}</span></td>
                  <td><Link className="overview-open-lead" to={`/admin/contact?lead=${lead.id}`} aria-label={`Відкрити заявку ${lead.name}`}><ArrowUpRight size={17}/></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>

    <section className="overview-bottom-grid">
      <article className="overview-panel overview-actions-panel">
        <header className="overview-panel-head">
          <div className="overview-panel-title"><span className="overview-title-icon is-action"><WandSparkles size={18}/></span><div><small>ШВИДКИЙ СТАРТ</small><h2>Створити нове</h2></div></div>
        </header>
        <div className="overview-action-grid">
          <Link to="/admin/projects"><span><FolderKanban size={21}/></span><div><strong>Новий проєкт</strong><small>Додати кейс у портфоліо</small></div><Plus size={17}/></Link>
          <Link to="/admin/blog"><span><Newspaper size={21}/></span><div><strong>Нова стаття</strong><small>Опублікувати матеріал</small></div><Plus size={17}/></Link>
          <Link to="/admin/services"><span><Layers3 size={21}/></span><div><strong>Нова послуга</strong><small>Розширити пропозицію</small></div><Plus size={17}/></Link>
          <Link to="/admin/testimonials"><span><UsersRound size={21}/></span><div><strong>Новий відгук</strong><small>Додати соціальний доказ</small></div><Plus size={17}/></Link>
        </div>
      </article>

      <article className="overview-panel overview-activity-panel">
        <header className="overview-panel-head">
          <div className="overview-panel-title"><span className="overview-title-icon is-activity"><Activity size={18}/></span><div><small>ACTIVITY FEED</small><h2>Останні зміни</h2></div></div>
        </header>
        <div className="overview-activity-list">
          {stats?.activity?.length ? stats.activity.slice(0, 6).map((item, index) => (
            <div className="overview-activity-row" key={`${item.type}-${index}`}>
              <i/>
              <div><strong>{item.title}</strong><small>{formatRelativeTime(item.created_at)}</small></div>
              <span>{item.type === 'lead_created' ? <MessageSquareText size={15}/> : <FileText size={15}/>}</span>
            </div>
          )) : <div className="overview-empty-activity"><Sparkles size={20}/> Активності поки немає.</div>}
        </div>
      </article>
    </section>
  </main>
}
