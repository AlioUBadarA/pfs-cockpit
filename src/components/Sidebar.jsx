import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import pfsIcon from '../assets/pfs-icon.png'

// Reprend exactement navConfig() du HTML de référence "Cockpit Commercial".
const GROUPS_USER = [
  { title: 'Pilotage', items: [
    { to: '/', label: 'Direction', end: true },
    { to: '/managers', label: 'Managers' },
    { to: '/equipe', label: 'Commerciaux' },
  ] },
  { title: 'Clients', items: [
    { to: '/clients', label: 'Portefeuille' },
    { to: '/prospection', label: 'Pipeline' },
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
    { to: '/ventes', label: 'Ventes' },
    { to: '/pilotage', label: 'Planning semaine' },
    { to: '/contrats-clients', label: 'Contrats clients' },
    { to: '/contrats-paddy', label: 'Contrats paddy' },
    { to: '/emplois', label: 'Emplois' },
    { to: '/argumentaire', label: 'Argumentaire de vente' },
  ] },
]

// Un vendeur n'a ni équipe ni managers à piloter : on retire ces deux items.
const GROUPS_VENDEUR = GROUPS_USER.map((g) =>
  g.title === 'Pilotage' ? { ...g, items: g.items.filter((it) => it.to === '/') } : g
)

const GROUPS_ADMIN = [
  { title: 'Administration', items: [
    { to: '/admin', label: 'Comptes', end: true },
    { to: '/admin/audit', label: "Journal d'audit" },
  ] },
]

export default function Sidebar({ onNavigate }) {
  const { isAdmin, isVendeur } = useAuth()
  const groups = isAdmin ? GROUPS_ADMIN : isVendeur ? GROUPS_VENDEUR : GROUPS_USER

  return (
    <aside
      className="w-[230px] flex-none flex flex-col h-screen sticky top-0 overflow-y-auto"
      style={{ background: 'var(--cc-sidebar)', color: 'var(--cc-sidebar-text)' }}
    >
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-white flex-none flex items-center justify-center p-1.5">
          <img src={pfsIcon} alt="PFS" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold text-white leading-tight">Cockpit Commercial</div>
          <div className="text-[10.5px] text-white/35 mt-0.5 uppercase tracking-wide">Filière riz · PFS</div>
        </div>
      </div>
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
    </aside>
  )
}
