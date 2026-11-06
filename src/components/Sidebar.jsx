import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getActiveParentKeys,
  getNavigationForRole,
  isItemActive,
  resolveRoleKey,
} from '../config/navigation'
import NavIcon from './NavIcon'
import pfsIcon from '../assets/pfs-icon.png'

export default function Sidebar({ collapsed = false, onToggle, onNavigate, mobile = false }) {
  const { isAdmin, isComptable, isVendeur } = useAuth()
  const location = useLocation()
  const role = resolveRoleKey({ isAdmin, isComptable, isVendeur })
  const navigation = useMemo(() => getNavigationForRole(role), [role])

  const [openKeys, setOpenKeys] = useState(() => getActiveParentKeys(location.pathname, navigation))
  const [tooltip, setTooltip] = useState(null)

  // Ouvre automatiquement le sous-menu de la page active.
  useEffect(() => {
    const activeKeys = getActiveParentKeys(location.pathname, navigation)
    if (!activeKeys.length) return
    setOpenKeys((prev) => Array.from(new Set([...prev, ...activeKeys])))
  }, [location.pathname, navigation])

  useEffect(() => {
    setTooltip(null)
  }, [collapsed])

  const handleNavigate = () => {
    setTooltip(null)
    onNavigate?.()
    if (mobile) onToggle?.()
  }

  const toggleGroup = (key) => {
    // Replié, un clic sur une catégorie déploie la barre puis ouvre le sous-menu.
    if (collapsed && !mobile) {
      onToggle?.()
      setOpenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
      return
    }
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((entry) => entry !== key) : [...prev, key]))
  }

  const showTooltip = (event, label) => {
    if (!collapsed || mobile) return
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({ label, top: rect.top + rect.height / 2 })
  }

  return (
    <aside
      aria-label="Navigation latérale"
      className={`relative flex flex-none flex-col border-r border-[#e6ebef] bg-white transition-[width] duration-200 ease-out ${
        mobile ? 'w-full' : collapsed ? 'w-[80px]' : 'w-[260px]'
      } ${mobile ? 'h-full' : 'sticky top-0 h-screen'}`}
    >
      {/* Logo + nom de l'application */}
      <div
        className={`flex h-16 flex-none items-center border-b border-[#edf1f4] ${
          collapsed ? 'justify-center px-2' : 'gap-2 px-4'
        }`}
      >
        <Link
          to="/"
          onClick={handleNavigate}
          aria-label="Sales Cockpit, accueil"
          className={`flex min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/40 ${
            collapsed ? 'justify-center' : 'flex-1 gap-2.5'
          }`}
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white p-1 shadow-[0_1px_2px_rgba(16,37,54,.08)] ring-1 ring-[#e6ebef]">
            <img src={pfsIcon} alt="" className="h-full w-full object-contain" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-semibold leading-tight text-[#102536]">
                Sales Cockpit
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-[#94a3ae]">
                Filière riz · PFS
              </span>
            </span>
          )}
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-[#7a8b97] transition-colors hover:bg-[#f3f6f8] hover:text-[#102536]"
          >
            <NavIcon name="close" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation par catégories */}
      <nav
        aria-label="Navigation principale"
        className="cc-sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
        onScroll={() => setTooltip(null)}
      >
        {navigation.map((section, sectionIndex) => (
          <div key={section.key} className={collapsed ? 'mb-2' : 'mb-5'}>
            {collapsed ? (
              sectionIndex > 0 && <div className="mx-2 mb-2 mt-1 border-t border-[#edf1f4]" />
            ) : (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#96a3ad]">
                {section.title}
              </p>
            )}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                if (item.children) {
                  const isOpen = !collapsed && openKeys.includes(item.key)
                  const hasActiveChild = item.children.some((child) => isItemActive(child, location.pathname))

                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.key)}
                        onMouseEnter={(event) => showTooltip(event, item.label)}
                        onMouseLeave={() => setTooltip(null)}
                        aria-expanded={isOpen}
                        aria-label={collapsed ? item.label : undefined}
                        className={`group flex h-10 w-full items-center rounded-lg text-[13px] transition-colors duration-150 ${
                          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                        } ${
                          hasActiveChild
                            ? 'font-semibold text-[#1b75bc]'
                            : 'text-[#4b5c68] hover:bg-[#f3f6f8] hover:text-[#102536]'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors ${
                            hasActiveChild
                              ? 'bg-[#dcecf9] text-[#1b75bc]'
                              : 'text-[#7a8b97] group-hover:text-[#1b75bc]'
                          }`}
                        >
                          <NavIcon name={item.icon} />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                            <NavIcon
                              name="chevronDown"
                              className={`h-3.5 w-3.5 flex-none text-[#9aa8b2] transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {!collapsed && (
                        <div
                          className={`grid transition-all duration-200 ease-out ${
                            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <ul className="overflow-hidden">
                            {item.children.map((child) => (
                              <li key={child.key}>
                                <NavLink
                                  to={child.to}
                                  onClick={handleNavigate}
                                  className={({ isActive }) =>
                                    `relative flex h-9 items-center rounded-lg pl-11 pr-3 text-[12.5px] transition-colors duration-150 ${
                                      isActive
                                        ? 'bg-[#eaf3fb] font-semibold text-[#1b75bc]'
                                        : 'text-[#64757f] hover:bg-[#f4f7f9] hover:text-[#102536]'
                                    }`
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      <span
                                        className={`absolute left-[26px] h-1.5 w-1.5 rounded-full ${
                                          isActive ? 'bg-[#1b75bc]' : 'bg-[#c3ced5]'
                                        }`}
                                        aria-hidden="true"
                                      />
                                      <span className="truncate">{child.label}</span>
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={handleNavigate}
                      onMouseEnter={(event) => showTooltip(event, item.label)}
                      onMouseLeave={() => setTooltip(null)}
                      aria-label={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `group relative flex h-10 items-center rounded-lg text-[13px] transition-colors duration-150 ${
                          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                        } ${
                          isActive
                            ? 'bg-[#eaf3fb] font-semibold text-[#1b75bc]'
                            : 'text-[#4b5c68] hover:bg-[#f3f6f8] hover:text-[#102536]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed && (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1b75bc]"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? 'bg-[#dcecf9] text-[#1b75bc]'
                                : 'text-[#7a8b97] group-hover:text-[#1b75bc]'
                            }`}
                          >
                            <NavIcon name={item.icon} />
                          </span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied du panneau : réduction / identité */}
      <div className="flex-none border-t border-[#edf1f4] p-3">
        {!mobile ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            className={`group flex h-10 w-full items-center rounded-lg text-[12.5px] font-medium text-[#64757f] transition-colors hover:bg-[#f3f6f8] hover:text-[#102536] ${
              collapsed ? 'justify-center' : 'gap-3 px-3'
            }`}
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#7a8b97] group-hover:text-[#1b75bc]">
              <NavIcon name="panelLeft" />
            </span>
            {!collapsed && <span>Réduire le menu</span>}
          </button>
        ) : (
          <p className="px-2 text-center text-[10.5px] text-[#a3b0ba]">Sales Cockpit · PFS</p>
        )}
      </div>

      {/* Info-bulle des éléments repliés */}
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[70] hidden -translate-y-1/2 items-center whitespace-nowrap rounded-md bg-[#102536] px-2.5 py-1.5 text-[11.5px] font-medium text-white shadow-lg md:flex"
          style={{ top: tooltip.top, left: 88 }}
        >
          {tooltip.label}
        </div>
      )}
    </aside>
  )
}
