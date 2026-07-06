import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, BriefcaseBusiness, Home, LayoutGrid, Menu, Newspaper, Search, Wrench, X } from 'lucide-react'
import SearchModal from './SearchModal'
import RouteSEO from './RouteSEO'
import './layout.css'
import { fallbackSettings } from '../data/fallbackData'
import api, { unwrap } from '../lib/api'

const links = [
  ['/', 'Головна'],
  ['/projects', 'Роботи'],
  ['/services', 'Послуги'],
  ['/about', 'Про мене'],
  ['/blog', 'Блог'],
  ['/contact', 'Контакти'],
]

const mobilePrimaryLinks = links.filter(([to]) => ['/', '/contact'].includes(to))
const mobileSecondaryLinks = links.filter(([to]) => !['/', '/contact'].includes(to))

export default function Layout({ children }) {
  const [settings, setSettings] = useState(fallbackSettings)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()

  useEffect(() => {
    api.get('/settings/').then((response) => {
      const data = unwrap(response)
      if (data?.full_name) setSettings(data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', menuOpen)
    return () => document.body.classList.remove('mobile-menu-open')
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const telegram = settings.socials?.telegram || `https://t.me/${settings.telegram?.replace('@', '')}`

  return (
    <div className="site-shell">
      <RouteSEO settings={settings} />
      <header className="header">
        <div className="container-shell header-inner">
          <Link to="/" className="logo" aria-label="На головну">
            {settings.logo_text || 'DK.'}
          </Link>

          <nav className="nav" aria-label="Головна навігація">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>

          <div className="nav header-actions">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Пошук">
              <Search size={19} />
            </button>
            <a className="btn btn-dark" href={telegram} target="_blank" rel="noreferrer">
              Написати мені <ArrowUpRight size={17} />
            </a>
          </div>

          <div className="mobile-nav">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Пошук">
              <Search size={18} />
            </button>
            <button className="icon-btn mobile-menu-trigger" onClick={() => setMenuOpen((value) => !value)} aria-label="Меню" aria-expanded={menuOpen} aria-controls="mobile-site-menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className={`mobile-menu-overlay ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen}>
          <div className="mobile-menu-sheet" id="mobile-site-menu" role="dialog" aria-modal="true" aria-label="Мобільне меню" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head"><div><small>Навігація</small><strong>Куди перейдемо?</strong></div><button onClick={() => setMenuOpen(false)} aria-label="Закрити меню"><X size={20} /></button></div>
            <div className="mobile-menu-primary">
              {mobilePrimaryLinks.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}><strong>{label}</strong><ArrowUpRight size={18} /></NavLink>
              ))}
            </div>
            <nav>
              {mobileSecondaryLinks.map(([to, label], index) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span><strong>{label}</strong><ArrowUpRight size={18} /></NavLink>
              ))}
              <NavLink to="/work-terms" onClick={() => setMenuOpen(false)}><span>05</span><strong>Умови роботи</strong><ArrowUpRight size={18} /></NavLink>
            </nav>
            <a className="mobile-menu-contact" href={telegram} target="_blank" rel="noreferrer">Написати в Telegram <ArrowUpRight size={18} /></a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container-shell footer-grid">
          <div>
            <div className="logo">{settings.logo_text || 'DK.'}</div>
            <p className="muted">© {new Date().getFullYear()} {settings.full_name}. Дизайн і розробка — Ковтунович Дмитро.</p>
          </div>
          <div className="footer-links">
            <a href={settings.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={settings.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <Link to="/privacy">Конфіденційність</Link>
            <Link to="/terms">Умови сайту</Link>
            <Link to="/work-terms">Умови роботи</Link>
            <button type="button" className="footer-cookie-button" onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>Cookies</button>
            <Link to="/admin/login">Вхід</Link>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-dock" aria-label="Мобільна навігація">
        <NavLink to="/" end><Home size={19} /><span>Головна</span></NavLink>
        <NavLink to="/projects"><BriefcaseBusiness size={19} /><span>Роботи</span></NavLink>
        <NavLink to="/services"><Wrench size={19} /><span>Послуги</span></NavLink>
        <NavLink to="/blog"><Newspaper size={19} /><span>Блог</span></NavLink>
        <button type="button" className={menuOpen ? 'is-active' : ''} onClick={() => setMenuOpen((value) => !value)}><LayoutGrid size={19} /><span>Меню</span></button>
      </nav>

      <button
        type="button"
        className={`scroll-top-button ${showScrollTop ? 'is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Повернутися вгору"
        title="Повернутися вгору"
      >
        <ArrowUp size={20} />
        <span>Вгору</span>
      </button>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
