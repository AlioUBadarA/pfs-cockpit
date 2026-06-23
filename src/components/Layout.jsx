import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ImpersonationBanner from './ImpersonationBanner'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user, logout, isSuperadmin, isSupport, isManager } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const initials = user?.nom
    ? user.nom.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CC'

  const roleBadge = isSuperadmin ? 'Superadmin' : isSupport ? 'Support' : isManager ? 'Manager' : null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cc-bg)' }}>
      {/* Sidebar — fixe sur desktop, tiroir sur mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-50 w-[230px] h-full">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <ImpersonationBanner />
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-14 border-b"
          style={{ background: 'rgba(244,242,238,.92)', backdropFilter: 'blur(8px)', borderColor: 'var(--cc-border)' }}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-black/5 flex-none"
            aria-label="Ouvrir le menu"
          >
            <span className="text-lg">☰</span>
          </button>
          <div className="flex-1" />
          {roleBadge && (
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'var(--cc-accent)', color: '#fff' }}>
              {roleBadge}
            </span>
          )}
          <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[160px]">
            {user?.rizerie || user?.nom}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center focus:outline-none flex-none"
              style={{ background: '#F9A825', color: '#1A1A1A' }}
            >
              {initials}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.nom}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {roleBadge && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: '#F9A825', color: '#1b75bc' }}>
                        {roleBadge}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
