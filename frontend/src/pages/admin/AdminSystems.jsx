import { useEffect, useState } from 'react'
import { ArchiveRestore, BarChart3, CheckCircle2, Download, FileClock, LockKeyhole, RefreshCw, Search, ShieldCheck, Trash2, Undo2, XCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api, { unwrap, API_URL } from '../../lib/api'
import { AdminSelect, useAdminUI } from '../../components/admin/AdminUI'

const fmt = (value) => value ? new Date(value).toLocaleString('uk-UA') : '—'
const pct = (value) => `${Number(value || 0).toFixed(1)}%`
const seconds = (value) => value == null ? '—' : value < 3600 ? `${Math.round(value / 60)} хв` : `${(value / 3600).toFixed(1)} год`
const periodOptions = [['today', 'Сьогодні'], ['yesterday', 'Учора'], ['7d', '7 днів'], ['30d', '30 днів'], ['month', 'Поточний місяць'], ['previous_month', 'Попередній місяць']]

function PageHead({ path, title, text, actions }) {
  return <div className="admin-page-head"><div><span>{path}</span><h1>{title}</h1><p>{text}</p></div><div className="admin-head-actions">{actions}</div></div>
}

export function AnalyticsAdmin() {
  const { notify } = useAdminUI()
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    api.get(`/analytics/?period=${period}`).then((response) => setData(unwrap(response))).catch(() => notify('Не вдалося завантажити аналітику.', { type: 'error' })).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [period])
  const maxDay = Math.max(...(data?.by_day || []).map((item) => item.total), 1)
  const points = (data?.by_day || []).map((item, index, all) => {
    const x = all.length <= 1 ? 0 : (index / (all.length - 1)) * 100
    const y = 100 - (item.total / maxDay) * 92
    return `${x},${y}`
  }).join(' ')
  return <div className="ops-page">
    <PageHead path="/admin/analytics" title="Аналітика" text="Реальні KPI із CRM-заявок, без фейкових чисел." actions={<><AdminSelect value={period} onChange={setPeriod} options={periodOptions}/><a className="btn btn-light" href={`${API_URL}/analytics/export/?period=${period}`}><Download size={16}/> CSV</a><button className="btn btn-dark" onClick={load}><RefreshCw size={16}/> Оновити</button></>}/>
    {loading ? <div className="admin-card">Завантаження...</div> : data && <>
      <div className="ops-kpis">
        <article><BarChart3 size={18}/><span>Заявок</span><strong>{data.kpi.total}</strong><small>Попередній період: {data.kpi.previous_total}</small></article>
        <article><ShieldCheck size={18}/><span>Конверсія в роботу</span><strong>{pct(data.kpi.work_conversion)}</strong><small title={data.formulas.work_conversion}>{data.formulas.work_conversion}</small></article>
        <article><CheckCircle2 size={18}/><span>Конверсія в завершення</span><strong>{pct(data.kpi.completion_conversion)}</strong><small title={data.formulas.completion_conversion}>{data.formulas.completion_conversion}</small></article>
        <article><FileClock size={18}/><span>Перша відповідь</span><strong>{seconds(data.kpi.avg_first_response_seconds)}</strong><small title={data.formulas.avg_first_response}>{data.kpi.without_response} без відповіді</small></article>
      </div>
      <div className="ops-grid">
        <section className="admin-card ops-chart"><h2>Заявки за днями</h2>{data.by_day.length ? <svg viewBox="0 0 100 110" role="img" aria-label="Лінійний графік заявок"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3"/>{data.by_day.map((item, index, all) => <circle key={item.date} cx={all.length <= 1 ? 0 : (index / (all.length - 1)) * 100} cy={100 - (item.total / maxDay) * 92} r="2"><title>{item.date}: {item.total}</title></circle>)}</svg> : <p>Даних немає.</p>}</section>
        <section className="admin-card ops-funnel"><h2>Воронка</h2>{data.funnel.map((item) => <a key={item.key} href={`/admin/contact?status=${item.key === 'received' ? '' : item.key}`}><span>{item.label}</span><strong>{item.count}</strong><small>Перехід: {item.transition_percent == null ? '—' : pct(item.transition_percent)} · Втрати: {item.loss}</small><i style={{ width: `${Math.max(8, item.count ? item.count / Math.max(data.kpi.total, 1) * 100 : 0)}%` }}/></a>)}</section>
      </div>
      <div className="ops-grid">
        <section className="admin-card"><h2>Джерела</h2><div className="ops-bars">{data.sources.length ? data.sources.map((item) => <a href={`/admin/contact?source=${encodeURIComponent(item.source)}`} key={item.source}><span>{item.source}</span><strong>{item.total}</strong><i style={{ width: `${Math.max(8, item.total / Math.max(data.kpi.total, 1) * 100)}%` }}/></a>) : <p>Джерела не передавались.</p>}</div></section>
        <section className="admin-card"><h2>Послуги</h2><table className="admin-table"><thead><tr><th>Послуга</th><th>Заявок</th></tr></thead><tbody>{data.services.map((item) => <tr key={item.service}><td>{item.service}</td><td>{item.total}</td></tr>)}</tbody></table></section>
      </div>
    </>}
  </div>
}

export function VersionsAdmin() {
  const { confirm, notify } = useAdminUI()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const [filters, setFilters] = useState({ entity_type: query.get('entity_type') || '', entity_id: query.get('entity_id') || '' })
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [compare, setCompare] = useState(null)
  const load = async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    try { setItems(unwrap(await api.get(`/versions/?${params}`)) || []) }
    catch { notify('Не вдалося завантажити історію версій.', { type: 'error' }) }
  }
  useEffect(() => { load() }, [])
  const open = async (item) => { setSelected(item); setCompare((await api.get(`/versions/${item.id}/compare/`)).data) }
  const restore = async (item) => {
    const accepted = await confirm({ title: `Відновити версію v${item.version_number}?`, description: 'Перед відновленням система створить копію поточного стану.', confirmLabel: 'Відновити версію' })
    if (!accepted) return
    try { await api.post(`/versions/${item.id}/restore/`, { confirm: true }); await load(); notify('Версію успішно відновлено.') }
    catch { notify('Не вдалося відновити версію.', { type: 'error' }) }
  }
  return <div className="ops-page">
    <PageHead path="/admin/versions" title="Історія версій" text="Snapshots важливих сутностей після ручних змін, видалень і відновлень." actions={<><input placeholder="entity_type" value={filters.entity_type} onChange={(event) => setFilters({ ...filters, entity_type: event.target.value })}/><input placeholder="ID" value={filters.entity_id} onChange={(event) => setFilters({ ...filters, entity_id: event.target.value })}/><button className="btn btn-dark" onClick={load}><Search size={16}/> Пошук</button></>}/>
    <div className="ops-split">
      <section className="admin-card"><h2>Версії</h2><table className="admin-table"><thead><tr><th>Дата</th><th>Сутність</th><th>Версія</th><th>Дія</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{fmt(item.created_at)}</td><td>{item.entity_type} #{item.entity_id}</td><td>v{item.version_number}</td><td>{item.action}</td><td><div className="admin-actions"><button onClick={() => open(item)}>Diff</button><button onClick={() => restore(item)}><Undo2 size={14}/> Restore</button></div></td></tr>)}</tbody></table></section>
      <section className="admin-card ops-detail"><h2>{selected ? `Версія v${selected.version_number}` : 'Оберіть версію'}</h2>{compare ? <div className="version-diff">{compare.changes.length ? compare.changes.map((change) => <article key={change.field}><strong>{change.field}</strong><del>{JSON.stringify(change.old)}</del><ins>{JSON.stringify(change.new)}</ins></article>) : <p>Змін у diff немає.</p>}<pre>{JSON.stringify(selected.snapshot, null, 2)}</pre></div> : <p>Натисніть Diff у списку.</p>}</section>
    </div>
  </div>
}

export function TrashAdmin() {
  const { confirm, requestInput, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const load = async () => {
    try { setItems(unwrap(await api.get('/trash/')) || []) }
    catch { notify('Не вдалося завантажити кошик.', { type: 'error' }) }
  }
  useEffect(() => { load() }, [])
  const restore = async (item) => {
    try { await api.post('/trash/restore/', { type: item.type, id: item.id }); await load(); notify('Запис відновлено.') }
    catch { notify('Не вдалося відновити запис.', { type: 'error' }) }
  }
  const purge = async (item) => {
    const accepted = await confirm({ title: `Видалити «${item.title}» назавжди?`, description: 'Після цієї дії запис неможливо буде відновити.', confirmLabel: 'Продовжити', tone: 'danger' })
    if (!accepted) return
    const password = await requestInput({ title: 'Підтвердження паролем', description: 'Введи пароль адміністратора для остаточного видалення.', inputLabel: 'Пароль адміністратора', inputType: 'password', confirmLabel: 'Видалити назавжди', tone: 'danger' })
    if (!password) return
    try {
      await api.post('/trash/purge/', { type: item.type, id: item.id, password, force: false })
    } catch (error) {
      if (error.response?.status === 409) {
        const dependencies = error.response.data.dependencies || []
        const force = await confirm({ title: 'Запис має залежності', description: `Залежності: ${dependencies.join(', ')}. Видалити примусово?`, confirmLabel: 'Видалити примусово', tone: 'danger' })
        if (!force) return
        await api.post('/trash/purge/', { type: item.type, id: item.id, password, force: true })
      } else { notify('Не вдалося остаточно видалити запис.', { type: 'error' }); return }
    }
    await load(); notify('Запис видалено назавжди.', { type: 'warning' })
  }
  return <div className="ops-page">
    <PageHead path="/admin/trash" title="Кошик" text="Soft delete для важливих записів. Звідси можна відновити або остаточно видалити після підтвердження." actions={<button className="btn btn-dark" onClick={load}><RefreshCw size={16}/> Оновити</button>}/>
    <section className="admin-card"><table className="admin-table"><thead><tr><th>Назва</th><th>Тип</th><th>Видалено</th><th>Очистка</th><th>Залежності</th><th>Дії</th></tr></thead><tbody>{items.map((item) => <tr key={`${item.type}-${item.id}`}><td>{item.title}</td><td>{item.type}</td><td>{fmt(item.deleted_at)}<small>{item.deleted_by}</small></td><td>{item.days_left} дн.</td><td>{item.dependencies.length ? item.dependencies.join(', ') : '—'}</td><td><div className="admin-actions"><button onClick={() => restore(item)}><ArchiveRestore size={14}/> Відновити</button><button onClick={() => purge(item)}><Trash2 size={14}/> Назавжди</button></div></td></tr>)}</tbody></table>{!items.length && <div className="crm-empty">Кошик порожній.</div>}</section>
  </div>
}

export function BackupsAdmin() {
  const { confirm, requestInput, notify } = useAdminUI()
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const load = async () => {
    try { setItems(unwrap(await api.get('/backups/')) || []) }
    catch { notify('Не вдалося завантажити резервні копії.', { type: 'error' }) }
  }
  useEffect(() => { load() }, [])
  const create = async () => {
    setBusy(true)
    try { await api.post('/backups/'); await load(); notify('Резервну копію створено.') }
    catch { notify('Не вдалося створити резервну копію.', { type: 'error' }) }
    finally { setBusy(false) }
  }
  const verify = async (item) => {
    try { await api.post(`/backups/${item.id}/verify/`); await load(); notify('Checksum резервної копії перевірено.') }
    catch { notify('Перевірка резервної копії не пройшла.', { type: 'error' }) }
  }
  const restore = async (item) => {
    const accepted = await confirm({ title: `Відновити backup ${item.file_name}?`, description: 'Поточні дані буде замінено вмістом резервної копії.', confirmLabel: 'Продовжити відновлення', tone: 'danger' })
    if (!accepted) return
    const password = await requestInput({ title: 'Підтвердження відновлення', description: 'Введи пароль адміністратора.', inputLabel: 'Пароль адміністратора', inputType: 'password', confirmLabel: 'Відновити backup', tone: 'danger' })
    if (!password) return
    try { await api.post(`/backups/${item.id}/restore/`, { password }); await load(); notify('Резервну копію відновлено.') }
    catch { notify('Не вдалося відновити резервну копію.', { type: 'error' }) }
  }
  return <div className="ops-page">
    <PageHead path="/admin/backups" title="Резервні копії" text="Архів бази даних і media без .env, токенів і паролів." actions={<><button className="btn btn-dark" disabled={busy} onClick={create}>{busy ? 'Створення...' : 'Створити backup'}</button><button className="btn btn-light" onClick={load}><RefreshCw size={16}/> Оновити</button></>}/>
    <section className="admin-card"><table className="admin-table"><thead><tr><th>Дата</th><th>Файл</th><th>Розмір</th><th>Статус</th><th>Checksum</th><th>Дії</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{fmt(item.created_at)}</td><td>{item.file_name || '—'}<small>{item.backup_type}</small></td><td>{Math.round((item.size || 0) / 1024)} KB</td><td>{item.status}</td><td>{item.checksum_sha256 ? `${item.checksum_sha256.slice(0, 12)}...` : '—'}</td><td><div className="admin-actions"><button onClick={() => verify(item)}>Перевірити</button><a className="btn btn-light" href={`${API_URL}/backups/${item.id}/download/`}><Download size={14}/> Завантажити</a><button onClick={() => restore(item)}>Відновити</button></div></td></tr>)}</tbody></table></section>
    <section className="admin-card"><h2>Автоматичні backup</h2><p>Для Windows Task Scheduler запускай команду з каталогу backend:</p><code>.\venv\Scripts\python.exe manage.py create_portfolio_backup --type scheduled</code></section>
  </div>
}

export function AuditLogAdmin() {
  const { notify } = useAdminUI()
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const load = async () => {
    try { setItems(unwrap(await api.get(`/audit-log/?q=${encodeURIComponent(q)}`)) || []) }
    catch { notify('Не вдалося завантажити журнал дій.', { type: 'error' }) }
  }
  useEffect(() => { load() }, [])
  return <div className="ops-page">
    <PageHead path="/admin/audit-log" title="Журнал дій" text="Нередагований audit log критичних операцій без паролів, токенів і повних IP." actions={<><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Пошук" onKeyDown={(event) => { if (event.key === 'Enter') load() }}/><button className="btn btn-dark" onClick={load}><Search size={16}/> Пошук</button></>}/>
    <section className="admin-card"><table className="admin-table"><thead><tr><th>Дата</th><th>Користувач</th><th>Дія</th><th>Сутність</th><th>Результат</th><th>Опис</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{fmt(item.created_at)}</td><td>{item.user_name || 'system'}</td><td>{item.action}</td><td>{item.entity_type} {item.entity_id}</td><td>{item.result}</td><td>{item.description}</td></tr>)}</tbody></table></section>
  </div>
}

export function SecurityAdmin() {
  const { confirm, requestInput, notify } = useAdminUI()
  const [data, setData] = useState(null)
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState(null)
  const load = async () => {
    try { setData(unwrap(await api.get('/security/'))) }
    catch { notify('Не вдалося завантажити налаштування безпеки.', { type: 'error' }) }
  }
  useEffect(() => { load() }, [])
  const setup2fa = async () => {
    try { setSetup((await api.post('/security/setup_2fa/')).data) }
    catch { notify('Не вдалося розпочати налаштування 2FA.', { type: 'error' }) }
  }
  const confirm2fa = async () => {
    try {
      const response = await api.post('/security/confirm_2fa/', { code })
      const codes = response.data.backup_codes.join(', ')
      notify(`2FA увімкнено. Збережи резервні коди: ${codes}`, { type: 'success', duration: 12000 })
      setSetup(null); setCode(''); load()
    } catch { notify('Код 2FA неправильний або прострочений.', { type: 'error' }) }
  }
  const disable2fa = async () => {
    const accepted = await confirm({ title: 'Вимкнути двофакторну автентифікацію?', description: 'Після цього вхід буде захищений лише паролем.', confirmLabel: 'Вимкнути 2FA', tone: 'danger' })
    if (!accepted) return
    const password = await requestInput({ title: 'Підтвердження паролем', description: 'Введи пароль адміністратора.', inputLabel: 'Пароль', inputType: 'password', confirmLabel: 'Вимкнути 2FA', tone: 'danger' })
    if (!password) return
    try { await api.post('/security/disable_2fa/', { password }); await load(); notify('2FA вимкнено.', { type: 'warning' }) }
    catch { notify('Не вдалося вимкнути 2FA.', { type: 'error' }) }
  }
  return <div className="ops-page">
    <PageHead path="/admin/security" title="Безпека" text="Ролі, 2FA, lockout входу, останні критичні дії та політики." actions={<button className="btn btn-dark" onClick={load}><RefreshCw size={16}/> Оновити</button>}/>
    {data && <><div className="ops-kpis">
      <article><LockKeyhole size={18}/><span>2FA</span><strong>{data.profile.two_factor_enabled ? 'Увімкнено' : 'Вимкнено'}</strong><small>{data.profile.role}</small></article>
      <article><XCircle size={18}/><span>Невдалі входи</span><strong>{data.failed_logins}</strong><small>Логуються у audit</small></article>
      <article><ShieldCheck size={18}/><span>Активні сесії</span><strong>{data.active_sessions}</strong><small>JWT session у браузері</small></article>
    </div>
    <div className="ops-grid">
      <section className="admin-card"><h2>2FA TOTP</h2>{setup ? <div className="security-2fa"><p>Додай цей otpauth URI у застосунок-автентифікатор:</p><code>{setup.otpauth_uri}</code><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-значний код"/><button className="btn btn-dark" onClick={confirm2fa}>Підтвердити</button></div> : data.profile.two_factor_enabled ? <button className="btn btn-light" onClick={disable2fa}>Вимкнути 2FA</button> : <button className="btn btn-dark" onClick={setup2fa}>Підключити 2FA</button>}</section>
      <section className="admin-card"><h2>Політика</h2><p>{data.password_policy}</p><p>Lockout: {data.settings.login_lockout_attempts} спроб / {data.settings.login_lockout_minutes} хв.</p><p>Кошик: {data.settings.trash_retention_days} днів.</p></section>
    </div>
    <section className="admin-card"><h2>Критичні дії</h2><table className="admin-table"><tbody>{data.recent_critical_actions.map((item) => <tr key={item.id}><td>{fmt(item.created_at)}</td><td>{item.action}</td><td>{item.description}</td></tr>)}</tbody></table></section></>}
  </div>
}
