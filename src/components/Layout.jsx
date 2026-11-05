import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DemoBanner from './DemoBanner'
import ImpersonationBanner from './ImpersonationBanner'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const COMPACT_BREAKPOINT = 1280

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < COMPACT_BREAKPOINT) return true
    try {
      const stored = localStorage.getItem('cc_sidebar_open')
      if (stored !== null) return stored !== '1'
    } catch {
      /* stockage indisponible */
    }
    return false
  })

  // Mémorise la préférence de largeur du Sidebar.
  useEffect(() => {
    try {
      localStorage.setItem('cc_sidebar_open', collapsed ? '0' : '1')
    } catch {
      /* stockage indisponible */
    }
  }, [collapsed])

  // Tablette : repli automatique ; retour desktop : dépli.
  useEffect(() => {
    let compact = window.innerWidth < COMPACT_BREAKPOINT
    const handleResize = () => {
      const next = window.innerWidth < COMPACT_BREAKPOINT
      if (next === compact) return
      compact = next
      setCollapsed(next)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Ferme le tiroir mobile à chaque navigation.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  // Verrouille le défilement de la page quand le tiroir est ouvert.
  useEffect(() => {
    if (!mobileNavOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileNavOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cc-bg)' }}>
      {/* Sidebar desktop — fixe, repliable */}
      <div className="hidden flex-none md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>

      {/* Sidebar mobile — tiroir */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fermer le menu"
            className="absolute inset-0 h-full w-full cursor-default bg-[#102536]/45 backdrop-blur-[2px]"
          />
          <div className="cc-drawer-in relative flex h-full w-[280px] max-w-[86vw] shadow-[0_24px_60px_-20px_rgba(16,37,54,.5)]">
            <Sidebar
              mobile
              collapsed={false}
              onNavigate={() => setMobileNavOpen(false)}
              onToggle={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <ImpersonationBanner />

        <Topbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-[#e8edf1] px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 text-[10.5px] text-[#93a1ab]">
            <span className="truncate">Cockpit Commercial · Partners In Food Solutions</span>
            <span className="hidden flex-none sm:inline">{new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
