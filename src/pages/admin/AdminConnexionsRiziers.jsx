import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../../services/api'
import KpiCard from '../../components/KpiCard'

import { fmtPays, nomPays } from '../../utils/pays'

const fmtDateHeure = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null

// Les périodes arrivent au format AAAA-MM-JJ. On les lit en date locale.
const toDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const VUES = {
  jour: {
    label: 'Par jour',
    titre: 'Connexions par jour (30 derniers jours)',
    fmt: (s) => toDate(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    interval: 2,
  },
  semaine: {
    label: 'Par semaine',
    titre: 'Connexions par semaine (12 dernières semaines)',
    fmt: (s) => 'Sem. ' + toDate(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    interval: 0,
  },
  mois: {
    label: 'Par mois',
    titre: 'Connexions par mois (12 derniers mois)',
    fmt: (s) => toDate(s).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    interval: 0,
  },
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const nbC = payload[0]?.value ?? 0
  const nbR = payload[1]?.value ?? 0
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p style={{ color: '#1b75bc' }}>{nbC} connexion{nbC > 1 ? 's' : ''}</p>
      <p style={{ color: '#62bb46' }}>{nbR} rizier{nbR > 1 ? 's' : ''} connecté{nbR > 1 ? 's' : ''}</p>
    </div>
  )
}

export default function AdminConnexionsRiziers() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [vue, setVue]         = useState('jour')
  const [pays, setPays]       = useState('')
  const [search, setSearch]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.get('/api/admin/connexions-riziers', { params: pays ? { pays } : {} })
      .then(r => setData(r.data))
      .catch(() => setError('Impossible de charger les connexions.'))
      .finally(() => setLoading(false))
  }, [pays])

  useEffect(() => { load() }, [load])

  const v = VUES[vue]
  const chartData = (data?.[vue] || []).map(r => ({
    periode:      v.fmt(r.periode),
    connexions:   r.nb_connexions,
    riziers:      r.nb_riziers,
  }))

  const q = search.trim().toLowerCase()
  const riziers = (data?.riziers || []).filter(r =>
    !q || r.nom?.toLowerCase().includes(q) || r.rizerie?.toLowerCase().includes(q)
  )
  const k = data?.kpi

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          {Object.entries(VUES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setVue(key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                vue === key ? 'bg-[#1b75bc] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select className="input text-sm py-1.5 w-48" value={pays} onChange={e => setPays(e.target.value)}>
            <option value="">Tous les pays</option>
            {[...(data?.pays || [])].sort((a, b) => nomPays(a).localeCompare(nomPays(b), 'fr')).map(p => <option key={p} value={p}>{fmtPays(p)}</option>)}
          </select>
          <button onClick={load} className="btn-secondary text-sm">↻ Actualiser</button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Seuls les comptes rizier sont comptés. Les comptes support, admin, test et démo sont exclus.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-4 border-[#1b75bc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data && (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Aujourd'hui"   value={k.jour}    sub={`${k.riziers_jour} rizier${k.riziers_jour > 1 ? 's' : ''}`}       icon="📅" color="#1b75bc" />
            <KpiCard title="Cette semaine" value={k.semaine} sub={`${k.riziers_semaine} rizier${k.riziers_semaine > 1 ? 's' : ''}`} icon="📆" color="#F9A825" />
            <KpiCard title="Ce mois"       value={k.mois}    sub={`${k.riziers_mois} rizier${k.riziers_mois > 1 ? 's' : ''}`}       icon="🗓" color="#9C27B0" />
            <KpiCard
              title="Riziers actifs ce mois"
              value={`${k.riziers_mois} / ${k.total_riziers}`}
              sub={k.total_riziers ? `${Math.round(k.riziers_mois * 100 / k.total_riziers)} % des comptes` : null}
              icon="👤" color="#62bb46"
            />
          </div>

          {/* Graphique */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{v.titre}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={2} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="periode" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={v.interval} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="connexions" name="Connexions"        fill="#1b75bc" radius={[3,3,0,0]} maxBarSize={24} />
                <Bar dataKey="riziers"    name="Riziers connectés" fill="#62bb46" radius={[3,3,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1b75bc] inline-block" />Connexions</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#62bb46] inline-block" />Riziers connectés</span>
            </div>
          </div>

          {/* Détail par rizier */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Détail par rizier
                <span className="ml-2 text-xs font-normal text-gray-400">({riziers.length})</span>
              </h3>
              <input
                className="input w-48 text-sm py-1"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {riziers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun rizier trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {["Rizier", 'Rizerie', 'Pays', "Aujourd'hui", 'Semaine', 'Mois', 'Total', 'Dernière connexion'].map(h => (
                        <th key={h} className="table-header whitespace-nowrap text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riziers.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <td className="table-cell">
                          <Link to={`/admin/users/${r.id}`} className="font-medium text-gray-900 text-sm hover:text-[#1b75bc]">{r.nom}</Link>
                        </td>
                        <td className="table-cell text-sm text-gray-600">{r.rizerie || <span className="text-gray-300">-</span>}</td>
                        <td className="table-cell text-sm text-gray-600 whitespace-nowrap">{fmtPays(r.pays) || <span className="text-gray-300">-</span>}</td>
                        {['jour', 'semaine', 'mois', 'total'].map(col => (
                          <td
                            key={col}
                            className={`table-cell text-sm text-right tabular-nums ${
                              r[col] === 0 ? 'text-gray-300'
                                : col === vue ? 'font-semibold text-[#1b75bc]' : 'text-gray-600'
                            }`}
                          >
                            {r[col]}
                          </td>
                        ))}
                        <td className="table-cell text-sm text-gray-500 whitespace-nowrap">
                          {fmtDateHeure(r.derniere_connexion) || <span className="text-gray-300 italic">jamais</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
