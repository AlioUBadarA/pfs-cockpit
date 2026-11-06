import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  getBreadcrumb,
  getSearchEntries,
  resolveRoleKey,
} from '../config/navigation'
import NavIcon from './NavIcon'
import RoleBadge from './RoleBadge'

const ROLE_TEXT = {
  superadmin: 'Super-admin',
  support: 'Support',
  manager: 'Manager',
  directeur: 'Directeur',
  rizier: 'Rizier',
  vendeur: 'Commercial',
  comptable: 'Comptable',
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default function Topbar({ collapsed, onToggleCollapse, onOpenMobileNav, onLogout }) {
  const { user, isAdmin, isComptable, isVendeur } = useAuth()
  const role = resolveRoleKey({ isAdmin, isComptable, isVendeur })
  const location = useLocation()
  const navigate = useNavigate()

  const [activeMenu, setActiveMenu] = useState(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const searchButtonRef = useRef(null)
  const searchPanelRef = useRef(null)
  const searchInputRef = useRef(null)
  const notificationsButtonRef = useRef(null)
  const notificationsPanelRef = useRef(null)
  const profileButtonRef = useRef(null)
  const profilePanelRef = useRef(null)

  // Les alertes concernent les rôles métier ; admin et comptable n'ont pas cette page dans leur menu.
  const hasAlerts = role === 'manager' || role === 'vendeur'
  const [alerts, setAlerts] = useState({ status: 'idle', items: [], count: 0 })
  const alertCount = alerts.count

  const loadAlerts = useCallback(() => {
    if (!hasAlerts) return
    setAlerts((prev) => ({ ...prev, status: 'loading' }))
    api.get('/api/actions')
      .then((r) => {
        const items = (r.data?.alertes || []).filter((a) => !a.traitee)
        setAlerts({ status: 'ready', items, count: r.data?.stats?.a_traiter ?? items.length })
      })
      .catch(() => setAlerts((prev) => ({ ...prev, status: 'error' })))
  }, [hasAlerts])

  // Chargement à l'ouverture de session, puis à chaque ouverture du panneau.
  useEffect(() => { loadAlerts() }, [loadAlerts])
  useEffect(() => {
    if (activeMenu === 'notifications') loadAlerts()
  }, [activeMenu, loadAlerts])

  const crumbs = useMemo(() => getBreadcrumb(location.pathname, role), [location.pathname, role])
  const currentPage = crumbs[crumbs.length - 1]?.label || 'Sales Cockpit'

  const entries = useMemo(() => getSearchEntries(role), [role])
  const normalizedQuery = normalize(query.trim())
  const results = useMemo(() => {
    if (!normalizedQuery) return entries.slice(0, 6)
    return entries
      .filter((entry) => normalize(`${entry.label} ${entry.section} ${entry.parent || ''}`).includes(normalizedQuery))
      .slice(0, 8)
  }, [entries, normalizedQuery])

  const initials = user?.nom
    ? user.nom.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : 'CC'

  const userSubtitle = user?.rizerie || ROLE_TEXT[user?.role] || 'Utilisateur'

  // Ferme les menus au changement de page.
  useEffect(() => {
    setActiveMenu(null)
    setQuery('')
  }, [location.pathname])

  // Fermeture au clic extérieur (déclencheur et panneau exclus).
  useEffect(() => {
    if (!activeMenu) return
    const refs = {
      search: [searchButtonRef, searchPanelRef],
      notifications: [notificationsButtonRef, notificationsPanelRef],
      profile: [profileButtonRef, profilePanelRef],
    }[activeMenu]
    const handlePointerDown = (event) => {
      if (refs.some((ref) => ref.current?.contains(event.target))) return
      setActiveMenu(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [activeMenu])

  // Raccourcis clavier : Ctrl/Cmd+K ouvre la recherche, Échap ferme.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setActiveMenu((current) => (current === 'search' ? null : 'search'))
        setQuery('')
        return
      }
      if (event.key === 'Escape') {
        setActiveMenu(null)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (activeMenu === 'search') searchInputRef.current?.focus()
  }, [activeMenu])

  useEffect(() => {
    setActiveIndex(0)
  }, [normalizedQuery, activeMenu])

  const toggleMenu = (menu) => {
    setActiveMenu((current) => (current === menu ? null : menu))
    if (menu !== 'search') setQuery('')
  }

  const closeMenus = () => setActiveMenu(null)

  const openResult = (entry) => {
    if (!entry) return
    closeMenus()
    setQuery('')
    navigate(entry.to)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      openResult(results[activeIndex] || results[0])
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-none items-center gap-1.5 border-b border-[#e6ebef] bg-white/85 px-3 backdrop-blur-md sm:gap-2 sm:px-5">
      {/* Navigation mobile */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-[#5b6b77] transition-colors hover:bg-[#f3f6f8] hover:text-[#102536] md:hidden"
      >
        <NavIcon name="menu" />
      </button>

      {/* Réduction du Sidebar */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        aria-expanded={!collapsed}
        className="hidden h-9 w-9 flex-none items-center justify-center rounded-lg text-[#5b6b77] transition-colors hover:bg-[#f3f6f8] hover:text-[#102536] md:flex"
      >
        <NavIcon name="panelLeft" />
      </button>

      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="ml-1 hidden min-w-0 items-center sm:flex">
        <Link
          to="/"
          aria-label="Accueil"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-[#8a99a4] transition-colors hover:bg-[#f3f6f8] hover:text-[#1b75bc]"
        >
          <NavIcon name="home" className="h-4 w-4" />
        </Link>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center">
              <NavIcon name="chevronRight" className="mx-1 h-3 w-3 flex-none text-[#c1ccd4]" />
              {!isLast && crumb.to ? (
                <Link
                  to={crumb.to}
                  className="truncate rounded px-1 text-[12.5px] text-[#7a8b97] transition-colors hover:text-[#1b75bc]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate px-1 text-[12.5px] ${
                    isLast ? 'font-semibold text-[#102536]' : 'text-[#7a8b97]'
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>

      {/* Titre courant sur mobile */}
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#102536] sm:hidden">
        {currentPage}
      </span>

      <div className="hidden flex-1 sm:block" />

      {/* Recherche de navigation */}
      <button
        ref={searchButtonRef}
        type="button"
        onClick={() => toggleMenu('search')}
        aria-label="Rechercher dans la navigation"
        aria-haspopup="dialog"
        aria-expanded={activeMenu === 'search'}
        className={`flex h-9 flex-none items-center gap-2 rounded-lg border px-2 text-[#7a8b97] transition-colors sm:px-2.5 ${
          activeMenu === 'search'
            ? 'border-[#bcd8ee] bg-[#eef6fc] text-[#1b75bc]'
            : 'border-transparent hover:border-[#e6ebef] hover:bg-[#f6f8fa] hover:text-[#102536]'
        }`}
      >
        <NavIcon name="search" className="h-[18px] w-[18px]" />
        <span className="hidden text-[12.5px] lg:inline">Rechercher</span>
        <kbd className="hidden rounded border border-[#e2e8ed] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#9aa8b2] xl:inline">
          Ctrl K
        </kbd>
      </button>

      {activeMenu === 'search' && (
        <div
          ref={searchPanelRef}
          role="dialog"
          aria-label="Recherche dans la navigation"
          className="cc-pop absolute left-3 right-3 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[#e3e9ee] bg-white shadow-[0_20px_50px_-20px_rgba(16,37,54,.4)] sm:left-auto sm:right-5 sm:w-[400px]"
        >
          <div className="flex items-center gap-2 border-b border-[#eef1f4] px-3">
            <NavIcon name="search" className="h-4 w-4 flex-none text-[#93a1ab]" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher une page..."
              aria-label="Rechercher une page"
              className="h-11 w-full min-w-0 bg-transparent text-[13px] text-[#102536] outline-none placeholder:text-[#a3b0ba]"
            />
            <kbd className="hidden flex-none rounded border border-[#e2e8ed] bg-[#f8fafb] px-1.5 py-0.5 text-[10px] font-medium text-[#9aa8b2] sm:inline">
              Échap
            </kbd>
          </div>

          <ul className="max-h-[320px] overflow-y-auto py-1.5" role="listbox" aria-label="Pages disponibles">
            {results.length === 0 && (
              <li className="px-3 py-8 text-center">
                <p className="text-[12.5px] font-medium text-[#4b5c68]">Aucun résultat</p>
                <p className="mt-1 text-[11.5px] text-[#93a1ab]">Essayez « ventes », « clients » ou « audit ».</p>
              </li>
            )}
            {results.map((entry, index) => (
              <li key={`${entry.to}-${entry.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => openResult(entry)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    index === activeIndex ? 'bg-[#eef6fc]' : 'hover:bg-[#f6f8fa]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${
                      index === activeIndex ? 'bg-[#dcecf9] text-[#1b75bc]' : 'bg-[#f2f5f7] text-[#8a99a4]'
                    }`}
                  >
                    <NavIcon name="chevronRight" className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-[#1f2d38]">{entry.label}</span>
                    <span className="block truncate text-[10.5px] text-[#93a1ab]">
                      {entry.section}
                      {entry.parent ? ` · ${entry.parent}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden items-center justify-between border-t border-[#eef1f4] bg-[#fafbfc] px-3 py-2 text-[10.5px] text-[#93a1ab] sm:flex">
            <span>↑ ↓ pour naviguer · Entrée pour ouvrir</span>
            <span className="font-semibold tracking-wide">PFS</span>
          </div>
        </div>
      )}

      {/* Centre de notifications : alertes à traiter (même moteur que la page Alertes) */}
      {hasAlerts && (
      <button
        ref={notificationsButtonRef}
        type="button"
        onClick={() => toggleMenu('notifications')}
        aria-label={alertCount ? `Notifications : ${alertCount} alerte(s) à traiter` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={activeMenu === 'notifications'}
        className={`relative flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors ${
          activeMenu === 'notifications'
            ? 'bg-[#eef6fc] text-[#1b75bc]'
            : 'text-[#5b6b77] hover:bg-[#f3f6f8] hover:text-[#102536]'
        }`}
      >
        <NavIcon name="bell" className="h-[18px] w-[18px]" />
        {alertCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cc0000] px-1 text-[9.5px] font-bold leading-none text-white">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>
      )}

      {hasAlerts && activeMenu === 'notifications' && (
        <div
          ref={notificationsPanelRef}
          role="dialog"
          aria-label="Notifications"
          className="cc-pop absolute right-2 top-[calc(100%+8px)] z-50 w-[calc(100vw-1rem)] max-w-[336px] overflow-hidden rounded-xl border border-[#e3e9ee] bg-white shadow-[0_20px_50px_-20px_rgba(16,37,54,.4)] sm:right-5"
        >
          <div className="flex items-center justify-between border-b border-[#eef1f4] px-4 py-3">
            <p className="text-[12.5px] font-semibold text-[#102536]">Alertes à traiter</p>
            <span className="rounded-full bg-[#f2f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#5b6b77]">
              {alerts.status === 'ready' ? alertCount : '...'}
            </span>
          </div>
          {alerts.status === 'loading' && alerts.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-[#93a1ab]">Chargement des alertes...</p>
          ) : alerts.status === 'error' ? (
            <p className="px-4 py-6 text-center text-[12px] text-red-600">Impossible de charger les alertes.</p>
          ) : alerts.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-[#4b5c68]">Aucune alerte à traiter.</p>
          ) : (
            <ul className="max-h-[320px] divide-y divide-[#f0f3f5] overflow-y-auto">
              {alerts.items.slice(0, 6).map((a) => (
                <li key={a.key} className="flex gap-2.5 px-4 py-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 flex-none rounded-full ${a.niveau === 'rouge' ? 'bg-[#cc0000]' : 'bg-[#f9a825]'}`}
                    aria-label={a.niveau === 'rouge' ? 'Urgent' : 'À surveiller'}
                  />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#8a99a4]">{a.cat}</p>
                    <p className="text-[12px] leading-snug text-[#1f2d38]">{a.msg}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/actions"
            onClick={closeMenus}
            className="flex items-center justify-between border-t border-[#eef1f4] bg-[#fafbfc] px-4 py-2.5 text-[12px] font-medium text-[#1b75bc] transition-colors hover:bg-[#eef6fc]"
          >
            Consulter les alertes
            <NavIcon name="chevronRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <span className="mx-0.5 hidden h-5 w-px flex-none bg-[#e6ebef] sm:mx-1 sm:block" aria-hidden="true" />

      {/* Profil utilisateur */}
      <button
        ref={profileButtonRef}
        type="button"
        onClick={() => toggleMenu('profile')}
        aria-label="Menu du compte"
        aria-haspopup="menu"
        aria-expanded={activeMenu === 'profile'}
        className={`flex h-10 flex-none items-center gap-2 rounded-lg py-1 pl-1 pr-1 transition-colors sm:pr-2 ${
          activeMenu === 'profile' ? 'bg-[#f3f6f8]' : 'hover:bg-[#f3f6f8]'
        }`}
      >
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-bold text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1b75bc 0%, #2f9a7c 100%)' }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden max-w-[150px] flex-col items-start leading-tight sm:flex">
          <span className="w-full truncate text-[12.5px] font-semibold text-[#1f2d38]">{user?.nom}</span>
          <span className="w-full truncate text-[10.5px] text-[#8a99a4]">{userSubtitle}</span>
        </span>
        <NavIcon name="chevronDown" className="hidden h-3.5 w-3.5 flex-none text-[#9aa8b2] sm:block" />
      </button>

      {activeMenu === 'profile' && (
        <div
          ref={profilePanelRef}
          role="menu"
          aria-label="Compte utilisateur"
          className="cc-pop absolute right-2 top-[calc(100%+8px)] z-50 w-[286px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-[#e3e9ee] bg-white shadow-[0_20px_50px_-20px_rgba(16,37,54,.4)] sm:right-5"
        >
          <div className="flex items-start gap-3 border-b border-[#eef1f4] px-4 py-4">
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1b75bc 0%, #2f9a7c 100%)' }}
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#102536]">{user?.nom}</p>
              <p className="truncate text-[11px] text-[#8a99a4]">{user?.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {user?.role && <RoleBadge role={user.role} />}
                {user?.rizerie && <span className="truncate text-[10.5px] text-[#7a8b97]">{user.rizerie}</span>}
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              to="/profil/mot-de-passe"
              role="menuitem"
              onClick={closeMenus}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] text-[#4b5c68] transition-colors hover:bg-[#f3f6f8] hover:text-[#102536]"
            >
              <NavIcon name="key" className="h-4 w-4 text-[#8a99a4]" />
              Changer le mot de passe
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenus()
                onLogout()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] text-red-600 transition-colors hover:bg-red-50"
            >
              <NavIcon name="logout" className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>

          <div className="border-t border-[#eef1f4] bg-[#fafbfc] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#a3b0ba]">
            Sales Cockpit · PFS
          </div>
        </div>
      )}
    </header>
  )
}
