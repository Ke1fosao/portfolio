import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminShell from './admin/AdminShell'
import OverviewAdmin from './admin/OverviewAdmin'
import ResourceAdmin from './admin/ResourceAdmin'
import ProjectsAdmin from './admin/ProjectsAdmin'
import ServicesAdmin from './admin/ServicesAdmin'
import SiteAdmin from './admin/SiteAdmin'
import AboutAdminRouter from './admin/about/AboutAdminRouter'
import LeadCrmAdmin from './admin/LeadCrmAdmin'
import NotificationAdmin from './admin/NotificationAdmin'
import VisualEditorAdmin from './admin/VisualEditorAdmin'
import MediaAdmin from './admin/MediaAdmin'
import SeoAdmin from './admin/SeoAdmin'
import { AnalyticsAdmin, AuditLogAdmin, BackupsAdmin, SecurityAdmin, TrashAdmin, VersionsAdmin } from './admin/AdminSystems'
import { resources } from './admin/resources'

const pageResources = { projects: 'projects', services: 'services', blog: 'posts', contact: 'leads' }

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const loggedIn = useMemo(() => Boolean(localStorage.getItem('portfolio_access_token')), [])
  const parts = location.pathname.split('/').filter(Boolean)
  const section = parts[1] || 'overview'
  const subsection = parts[2] || 'hero'

  useEffect(() => {
    if (!loggedIn) navigate('/admin/login')
    else if (location.pathname === '/admin' || location.pathname === '/admin/') navigate('/admin/overview', { replace: true })
    else if (location.pathname === '/admin/about' || location.pathname === '/admin/about/') navigate('/admin/about/hero', { replace: true })
  }, [loggedIn, location.pathname, navigate])

  if (!loggedIn) return null
  let content = <OverviewAdmin />
  if (section === 'home' || section === 'site') content = <SiteAdmin />
  else if (section === 'projects') content = <ProjectsAdmin />
  else if (section === 'services') content = <ServicesAdmin />
  else if (section === 'about') content = <AboutAdminRouter subsection={subsection} />
  else if (section === 'contact') content = <LeadCrmAdmin />
  else if (section === 'notifications') content = <NotificationAdmin />
  else if (section === 'editor') content = <VisualEditorAdmin />
  else if (section === 'media') content = <MediaAdmin />
  else if (section === 'seo') content = <SeoAdmin />
  else if (section === 'analytics') content = <AnalyticsAdmin />
  else if (section === 'versions') content = <VersionsAdmin />
  else if (section === 'trash') content = <TrashAdmin />
  else if (section === 'backups') content = <BackupsAdmin />
  else if (section === 'audit-log') content = <AuditLogAdmin />
  else if (section === 'security') content = <SecurityAdmin />
  else if (pageResources[section]) content = <ResourceAdmin resourceKey={pageResources[section]} />
  else if (resources[section]) content = <ResourceAdmin resourceKey={section} />
  return <AdminShell>{content}</AdminShell>
}
