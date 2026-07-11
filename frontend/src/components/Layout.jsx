import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, BriefcaseBusiness, Home, LayoutGrid, Menu, Newspaper, Search, Wrench, X } from 'lucide-react'
import SearchModal from './SearchModal'
import RouteSEO from './RouteSEO'
import './layout.css'
import { fallbackSettings } from '../data/fallbackData'
import api, { unwrap } from '../lib/api'
import { LanguageSwitcher, useLanguage } from '../i18n/LanguageContext'
import { localizeSettings } from '../i18n/localizedData'

const COPY = {
  uk: {
    links: [['/', 'Головна'], ['/projects', 'Роботи'], ['/services', 'Послуги'], ['/about', 'Про мене'], ['/blog', 'Блог'], ['/contact', 'Контакти']],
    homeAria: 'На головну', navAria: 'Головна навігація', search: 'Пошук', write: 'Написати мені', menu: 'Меню', mobileMenu: 'Мобільне меню', navigation: 'Навігація', where: 'Куди перейдемо?', close: 'Закрити меню', workTerms: 'Умови роботи', telegram: 'Написати в Telegram',
    footer: 'Дизайн і розробка — Ковтунович Дмитро.', privacy: 'Конфіденційність', siteTerms: 'Умови сайту', login: 'Вхід', mobileNav: 'Мобільна навігація', top: 'Вгору', topTitle: 'Повернутися вгору',
  },
  en: {
    links: [['/', 'Home'], ['/projects', 'Projects'], ['/services', 'Services'], ['/about', 'About'], ['/blog', 'Blog'], ['/contact', 'Contact']],
    homeAria: 'Go to homepage', navAria: 'Main navigation', search: 'Search', write: 'Message me', menu: 'Menu', mobileMenu: 'Mobile menu', navigation: 'Navigation', where: 'Where would you like to go?', close: 'Close menu', workTerms: 'Working terms', telegram: 'Message on Telegram',
    footer: 'Design and development — Dmytro Kovtunovych.', privacy: 'Privacy', siteTerms: 'Website terms', login: 'Sign in', mobileNav: 'Mobile navigation', top: 'Top', topTitle: 'Back to top',
  },
}

export default function Layout({ children }) {
  const { language, isLanguageTransitioning } = useLanguage()
  const copy = COPY[language]
  const links = copy.links
  const mobilePrimaryLinks = links.filter(([to]) => ['/', '/contact'].includes(to))
  const mobileSecondaryLinks = links.filter(([to]) => !['/', '/contact'].includes(to))
  const [rawSettings, setRawSettings] = useState(fallbackSettings)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()
  const settings = useMemo(() => localizeSettings(rawSettings, language), [rawSettings, language])

  useEffect(() => {
    api.get('/settings/').then((response) => {
      const data = unwrap(response)
      if (data?.full_name) setRawSettings(data)
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
    <div className={`site-shell ${isLanguageTransitioning ? 'is-language-transitioning' : ''}`}>
      <RouteSEO settings={settings} />
      <header className="header">
        <div className="container-shell header-inner">
          <Link to="/" className="logo" aria-label={copy.homeAria}>{settings.logo_text || 'DK.'}</Link>

          <nav className="nav" aria-label={copy.navAria}>
            {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          </nav>

          <div className="nav header-actions">
            <LanguageSwitcher />
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={copy.search}><Search size={19} /></button>
            <a className="btn btn-dark" href={telegram} target="_blank" rel="noreferrer">{copy.write} <ArrowUpRight size={17} /></a>
          </div>

          <div className="mobile-nav">
            <LanguageSwitcher compact />
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={copy.search}><Search size={18} /></button>
            <button className="icon-btn mobile-menu-trigger" onClick={() => setMenuOpen((value) => !value)} aria-label={copy.menu} aria-expanded={menuOpen} aria-controls="mobile-site-menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>

        <div className={`mobile-menu-overlay ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} inert={!menuOpen ? '' : undefined}>
          <div className="mobile-menu-sheet" id="mobile-site-menu" role="dialog" aria-modal="true" aria-label={copy.mobileMenu} onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head"><div><small>{copy.navigation}</small><strong>{copy.where}</strong></div><button onClick={() => setMenuOpen(false)} aria-label={copy.close}><X size={20} /></button></div>
            <LanguageSwitcher className="mobile-menu-language" />
            <div className="mobile-menu-primary">
              {mobilePrimaryLinks.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}><strong>{label}</strong><ArrowUpRight size={18} /></NavLink>)}
            </div>
            <nav>
              {mobileSecondaryLinks.map(([to, label], index) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span><strong>{label}</strong><ArrowUpRight size={18} /></NavLink>)}
              <NavLink to="/work-terms" onClick={() => setMenuOpen(false)}><span>05</span><strong>{copy.workTerms}</strong><ArrowUpRight size={18} /></NavLink>
            </nav>
            <a className="mobile-menu-contact" href={telegram} target="_blank" rel="noreferrer">{copy.telegram} <ArrowUpRight size={18} /></a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container-shell footer-grid">
          <div><div className="logo">{settings.logo_text || 'DK.'}</div><p className="muted">© {new Date().getFullYear()} {settings.full_name}. {copy.footer}</p></div>
          <div className="footer-links">
            <a href={settings.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={settings.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <Link to="/privacy">{copy.privacy}</Link>
            <Link to="/terms">{copy.siteTerms}</Link>
            <Link to="/work-terms">{copy.workTerms}</Link>
            <button type="button" className="footer-cookie-button" onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>Cookies</button>
            <Link to="/admin/login">{copy.login}</Link>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-dock" aria-label={copy.mobileNav}>
        <NavLink to="/" end><Home size={19} /><span>{links[0][1]}</span></NavLink>
        <NavLink to="/projects"><BriefcaseBusiness size={19} /><span>{links[1][1]}</span></NavLink>
        <NavLink to="/services"><Wrench size={19} /><span>{links[2][1]}</span></NavLink>
        <NavLink to="/blog"><Newspaper size={19} /><span>{links[4][1]}</span></NavLink>
        <button type="button" className={menuOpen ? 'is-active' : ''} onClick={() => setMenuOpen((value) => !value)}><LayoutGrid size={19} /><span>{copy.menu}</span></button>
      </nav>

      <button type="button" className={`scroll-top-button ${showScrollTop ? 'is-visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={copy.topTitle} title={copy.topTitle}>
        <ArrowUp size={20} /><span>{copy.top}</span>
      </button>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
