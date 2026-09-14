import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import pfsIcon from '../assets/pfs-icon.png'

const GROUPS_USER = [
  { title: 'Pilotage', items: [
    { to: '/', label: 'Direction', end: true },
    { to: '/managers', label: 'Managers' },
    { to: '/equipe', label: 'Commerciaux' },
    { to: '/emplois', label: 'RH' },
  ] },
  { title: 'Clients & Ventes', items: [
    { to: '/clients', label: 'Portefeuille' },
    { to: '/prospection', label: 'Prospection' },
    { to: '/pilotage', label: 'Planning semaine' },
    { to: '/ventes', label: 'Ventes' },
    { to: '/contrats-clients', label: 'Contrats clients' },
    { to: '/contrats-paddy', label: 'Contrats paddy' },
    { to: '/depots-vente', label: 'Dépôt-vente' },
    { to: '/produits', label: 'Produits' },
    { to: '/encaissements', label: 'Encaissements' },
    { to: '/creances', label: 'Recouvrement' },
  ] },
  { title: 'Analyse', items: [
    { to: '/journal', label: 'Journal du jour' },
    { to: '/rentabilite', label: 'Rentabilité' },
    { to: '/forecast', label: 'Prévisions' },
    { to: '/activites', label: 'Activités' },
  ] },
  { title: 'Décision', items: [
    { to: '/actions', label: 'Alertes' },
    { to: '/insights', label: 'Analyses & Actions' },
  ] },
  { title: 'Référentiel', items: [
    { to: '/argumentaire', label: 'Argumentaire de vente' },
    { to: '/guide', label: "Guide d'utilisation" },
  ] },
]

// Un vendeur n'accède pas au pilotage global (vue Direction réservée aux managers/riziers),
// ni au planning semaine (page /pilotage, réservée par ManagerRoute) même si ce lien est
// niché dans un autre groupe que "Pilotage".
const GROUPS_VENDEUR = GROUPS_USER
  .filter((g) => g.title !== 'Pilotage')
  .map((g) => ({ ...g, items: g.items.filter((it) => it.to !== '/pilotage') }))

const GROUPS_ADMIN = [
  { title: 'Administration', items: [
    { to: '/admin/impact-rizao', label: 'Impact RIZAO' },
    { to: '/admin', label: 'Administration', end: true },
    { to: '/admin/audit', label: "Journal d'audit" },
  ] },
]

const GROUPS_COMPTABLE = [
  { title: 'Comptabilité', items: [
    { to: '/comptabilite', label: 'Validation des encaissements', end: true },
  ] },
]

export default function Sidebar({ onNavigate, collapsed = false, onToggle }) {
  const { isAdmin, isVendeur, isComptable } = useAuth()
  const groups = isAdmin ? GROUPS_ADMIN : isComptable ? GROUPS_COMPTABLE : isVendeur ? GROUPS_VENDEUR : GROUPS_USER

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-[230px]'} flex-none flex flex-col h-screen sticky top-0 overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-in-out`}
      style={{ background: 'var(--cc-sidebar)', color: 'var(--cc-sidebar-text)' }}
    >
      <div className={`py-5 border-b border-white/10 flex items-center ${collapsed ? 'justify-center px-0' : 'px-5 gap-2.5'}`}>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            className="w-9 h-9 flex-none flex items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white"
          >
            <span className="text-lg leading-none">{collapsed ? '☰' : '✕'}</span>
          </button>
        )}
        {!collapsed && (
          <>
            <div className="w-9 h-9 rounded-lg bg-white flex-none flex items-center justify-center p-1.5">
              <img src={pfsIcon} alt="PFS" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[15px] font-semibold text-white leading-tight">Cockpit Commercial</div>
              <div className="text-[10.5px] text-white/35 mt-0.5 uppercase tracking-wide">Filière riz · PFS</div>
            </div>
          </>
        )}
      </div>
      {!collapsed && (
        <>
          <nav className="flex-1 px-3 py-3">
            {groups.map((g) => (
              <div key={g.title} className="mb-3.5">
                <div className="text-[10px] uppercase tracking-wider text-white/30 px-2.5 py-1">{g.title}</div>
                {g.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-none" />
                    {it.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="px-5 py-3.5 border-t border-white/10 text-[10.5px] text-white/30">
            Cockpit Commercial &middot; PFS
          </div>
        </>
      )}
    </aside>
  )
}
