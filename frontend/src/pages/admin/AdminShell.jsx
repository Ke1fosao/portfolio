import { BarChart3, BellRing, DatabaseBackup, ExternalLink, FileBadge2, History, HelpCircle, Home, Image, LayoutDashboard, ListChecks, LogOut, MessageSquareText, Newspaper, PanelsTopLeft, SearchCheck, Settings2, ShieldCheck, Star, Trash2, UserRound, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import api, { unwrap } from '../../lib/api'
import { AdminUIProvider } from '../../components/admin/AdminUI'

const pageLinks = [
  ['/admin/overview', 'Огляд', LayoutDashboard],
  ['/admin/home', 'Головна сторінка', Home],
  ['/admin/projects', 'Сторінка робіт', PanelsTopLeft],
  ['/admin/services', 'Сторінка послуг', Settings2],
  ['/admin/about/hero', 'Про мене', UserRound],
  ['/admin/blog', 'Блог', Newspaper],
  ['/admin/contact', 'Контакти та заявки', MessageSquareText],
  ['/admin/notifications', 'Telegram сповіщення', BellRing],
  ['/admin/editor', 'Візуальний редактор', Wand2],
  ['/admin/media', 'Медіа', Image],
  ['/admin/seo', 'SEO', SearchCheck],
]

const contentLinks = [
  ['/admin/pricing', 'Ціни', Star],
  ['/admin/testimonials', 'Відгуки', MessageSquareText],
  ['/admin/faqs', 'FAQ', HelpCircle],
  ['/admin/certificates', 'Документи', FileBadge2],
]

const systemLinks = [
  ['/admin/analytics', 'Аналітика', BarChart3],
  ['/admin/versions', 'Історія версій', History],
  ['/admin/trash', 'Кошик', Trash2],
  ['/admin/backups', 'Backup', DatabaseBackup],
  ['/admin/audit-log', 'Журнал дій', ListChecks],
  ['/admin/security', 'Безпека', ShieldCheck],
]

function NavigationGroup({ title, links, unread }) {
  const location = useLocation()
  const badge = unread > 99 ? '99+' : unread
  const isParentSectionActive = (path, routerActive) => {
    if (path === '/admin/about/hero') return location.pathname === '/admin/about' || location.pathname.startsWith('/admin/about/')
    return routerActive
  }

  return <div className="admin-nav-group"><small>{title}</small><nav>{links.map(([path, label, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => isParentSectionActive(path, isActive) ? 'active' : undefined}><Icon size={16}/><span>{label}</span>{path === '/admin/contact' && unread > 0 && <b className="admin-nav-badge">{badge}</b>}</NavLink>)}</nav></div>
}

export default function AdminShell({ children }) {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = () => api.get('/dashboard-stats/').then((r) => {
      if (active) setUnread(Number(unwrap(r)?.unread_leads || 0))
    }).catch(() => {})
    load()
    const timer = setInterval(load, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  const logout = () => {
    localStorage.removeItem('portfolio_access_token')
    localStorage.removeItem('portfolio_refresh_token')
    navigate('/admin/login')
  }

  return <AdminUIProvider><div className="admin-shell"><div className="admin-layout">
    <aside className="admin-sidebar">
      <div className="admin-brand"><strong>DK.</strong><span>Portfolio control</span></div>
      <NavigationGroup title="Сторінки сайту" links={pageLinks} unread={unread}/>
      <NavigationGroup title="Додатковий контент" links={contentLinks}/>
      <NavigationGroup title="Система" links={systemLinks}/>
      <div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer">Відкрити сайт <ExternalLink size={15}/></a><button onClick={logout}><LogOut size={16}/> Вийти</button></div>
    </aside>
    <main className="admin-main">{children}</main>
  </div></div></AdminUIProvider>
}
