import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../../services/api'
import KpiCard from '../../components/KpiCard'

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const fmtHeure = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'
const fmtDateCourt = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
}

const ROLE_LABELS = {
  rizier:     { label: 'Rizier',     color: '#1b75bc' },
  vendeur:    { label: 'Vendeur',    color: '#62bb46' },
  manager:    { label: 'Manager',    color: '#F9A825' },
  directeur:  { label: 'Directeur', color: '#9C27B0' },
  support:    { label: 'Support',    color: '#00897B' },
  superadmin: { label: 'Admin',      color: '#E64A19' },
}

function RolePill({ role }) {
  const r = ROLE_LABELS[role] || { label: role, color: '#888' }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: r.color + '18', color: r.color }}>
      {r.label}
    </span>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p style={{ color: '#1b75bc' }}>{payload[0]?.value} connexion{payload[0]?.value > 1 ? 's' : ''}</p>
      {payload[1] && <p style={{ color: '#62bb46' }}>{payload[1]?.value} utilisateur{payload[1]?.value > 1 ? 's' : ''} distinct{payload[1]?.value > 1 ? 's' : ''}</p>}
    </div>
  )
}

export default function AdminConnexions() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/admin/connexions')
      .then(r => setData(r.data))
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Remplir les jours sans connexion avec 0
  const chartData = (() => {
    if (!data) return []
    const map = {}
    data.parJour.forEach(r => { map[r.date] = r })
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result.push({
        date:            fmtDateCourt(key),
        connexions:      map[key]?.nb_connexions || 0,
        utilisateurs:    map[key]?.nb_utilisateurs || 0,
      })
    }
    return result
  })()

  const filteredRecents = data?.recents?.filter(r => {
    const q = search.toLowerCase()
    return !q ||
      r.actor_nom?.toLowerCase().includes(q) ||
      r.rizerie?.toLowerCase().includes(q) ||
      r.role?.toLowerCase().includes(q) ||
      r.ip?.includes(q)
  }) || []

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Connexions</h2>
          <p className="text-sm text-gray-500">Activité de connexion à la plateforme</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary text-sm">↻ Actualiser</button>
          <Link to="/admin" className="btn-secondary text-sm">← Retour</Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-4 border-[#1b75bc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Aujourd'hui"       value={data.kpi.aujourd_hui}       icon="📅" color="#1b75bc" />
            <KpiCard title="Utilisateurs uniques (auj.)" value={data.kpi.uniques_aujourd_hui} icon="👤" color="#62bb46" />
            <KpiCard title="Cette semaine"     value={data.kpi.cette_semaine}     icon="📆" color="#F9A825" />
            <KpiCard title="Ce mois"           value={data.kpi.ce_mois}           icon="🗓" color="#9C27B0" />
          </div>

          {/* Graphique 30 jours */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Connexions par jour — 30 derniers jours</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={2} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="connexions"   name="Connexions"         fill="#1b75bc" radius={[3,3,0,0]} maxBarSize={20} />
                <Bar dataKey="utilisateurs" name="Utilisateurs uniques" fill="#62bb46" radius={[3,3,0,0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1b75bc] inline-block"/>Connexions</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#62bb46] inline-block"/>Utilisateurs distincts</span>
            </div>
          </div>

          {/* Tableau des connexions récentes */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Connexions récentes
                <span className="ml-2 text-xs font-normal text-gray-400">({filteredRecents.length})</span>
              </h3>
              <input
                className="input w-48 text-sm py-1"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filteredRecents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucune connexion enregistrée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {['Utilisateur', 'Rôle', 'Rizerie', 'Date', 'Heure', 'IP'].map(h => (
                        <th key={h} className="table-header whitespace-nowrap text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecents.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <td className="table-cell">
                          <span className="font-medium text-gray-900 text-sm">{r.actor_nom || <span className="text-gray-300 italic">Inconnu</span>}</span>
                        </td>
                        <td className="table-cell"><RolePill role={r.role} /></td>
                        <td className="table-cell text-sm text-gray-600">{r.rizerie || <span className="text-gray-300">—</span>}</td>
                        <td className="table-cell text-sm text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                        <td className="table-cell text-sm font-mono text-gray-700">{fmtHeure(r.created_at)}</td>
                        <td className="table-cell text-xs font-mono text-gray-400">{r.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
