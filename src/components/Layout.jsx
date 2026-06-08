import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',         label: 'Dashboard',  end: true },
  { to: '/ventes',   label: 'Ventes' },
  { to: '/creances', label: 'Créances' },
  { to: '/clients',  label: 'Clients' },
  { to: '/pilotage', label: 'Pilotage' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.nom
    ? user.nom.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PF'

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      {/* Navbar */}
      <header className="bg-[#1B5E20] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white font-bold text-lg tracking-tight">
              PFS <span className="text-[#F9A825]">Commercial</span>
            </span>
          </div>

          {/* Nav tabs — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-[#1B5E20] font-semibold'
                      : 'text-green-100 hover:bg-[#388E3C] hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Avatar + user */}
          <div className="ml-auto flex items-center gap-3 relative">
            <span className="hidden sm:block text-green-100 text-sm">{user?.rizerie || user?.nom}</span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-[#F9A825] text-[#1B5E20] font-bold text-sm flex items-center justify-center focus:outline-none"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.nom}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nav tabs — mobile */}
        <div className="md:hidden border-t border-[#388E3C] flex overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex-shrink-0 px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#1B5E20] font-semibold'
                    : 'text-green-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
