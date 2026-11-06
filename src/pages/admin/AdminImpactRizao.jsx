import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

const RIZERIE_COLORS = ['#1b75bc', '#62bb46', '#F9A825', '#9C27B0', '#00897B', '#E64A19', '#5C6BC0']

function fillMonths(data, n = 12) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const found = (data || []).find((r) => r.mois === key)
    return { label, ca: found ? Number(found.ca) : 0 }
  })
}

const fmtYAxis = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n.toString()
}

function MetricCard({ title, value, sub, color }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminImpactRizao() {
  const [performance, setPerformance] = useState(null)
  const [rizeries, setRizeries]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/admin/performance'),
      api.get('/api/admin/rizeries'),
    ])
      .then(([perf, riz]) => { setPerformance(perf.data); setRizeries(riz.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const rizerieColorMap = rizeries.reduce((acc, r, i) => {
    acc[r.nom] = RIZERIE_COLORS[i % RIZERIE_COLORS.length]
    return acc
  }, {})

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="w-8 h-8 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Impact RIZAO</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance globale de la plateforme · avant / après adoption</p>
      </div>

      {performance && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard title="CA généré via Cockpit" value={fmt(performance.global.ca_app)} sub={`${performance.global.nb_ventes} ventes enregistrées`} color="#1b75bc" />
            <MetricCard title="CA avant RIZAO" value={fmt(performance.global.ca_baseline_total)} sub="Référence de départ des rizeries" color="#9e9e9e" />
            <MetricCard
              title="Taux de recouvrement"
              value={`${performance.global.taux_recouvrement}%`}
              sub={`${performance.global.nb_paye} soldées · ${performance.global.nb_retard} en retard`}
              color={performance.global.taux_recouvrement >= 80 ? '#62bb46' : performance.global.taux_recouvrement >= 50 ? '#F9A825' : '#E64A19'}
            />
            <MetricCard
              title="Emplois grâce à RIZAO"
              value={performance.global.emplois_app.toLocaleString('fr-FR')}
              sub="Emplois enregistrés via le Cockpit"
              color="#62bb46"
            />
            <MetricCard title="Clients servis" value={performance.global.nb_clients.toLocaleString('fr-FR')} sub="Clients uniques sur toutes les ventes" color="#9C27B0" />
            <MetricCard title="Contrats actifs" value={performance.global.contrats_actifs.toLocaleString('fr-FR')} sub="Engagements commerciaux récurrents" color="#00897B" />
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Statut des paiements</h3>
            <div className="flex gap-6 flex-wrap mb-3">
              {[
                { label: 'Soldées', n: performance.global.nb_paye, color: '#62bb46' },
                { label: 'En cours', n: performance.global.nb_en_cours, color: '#F9A825' },
                { label: 'En retard', n: performance.global.nb_retard, color: '#E64A19' },
              ].map(({ label, n, color }) => {
                const pct = performance.global.nb_ventes > 0 ? Math.round(n / performance.global.nb_ventes * 100) : 0
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{n} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
            {performance.global.nb_ventes > 0 && (
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                <div style={{ width: `${Math.round(performance.global.nb_paye / performance.global.nb_ventes * 100)}%`, background: '#62bb46' }} />
                <div style={{ width: `${Math.round(performance.global.nb_en_cours / performance.global.nb_ventes * 100)}%`, background: '#F9A825' }} />
                <div style={{ width: `${Math.round(performance.global.nb_retard / performance.global.nb_ventes * 100)}%`, background: '#E64A19' }} />
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Évolution du CA mensuel (12 derniers mois)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={fillMonths(performance.mensuel)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tickFormatter={fmtYAxis} tick={{ fontSize: 10, fill: '#6b7280' }} width={58} />
                <Tooltip
                  formatter={(v) => [Number(v).toLocaleString('fr-FR') + ' F', 'CA']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line type="monotone" dataKey="ca" stroke="#1b75bc" strokeWidth={2.5}
                  dot={{ fill: '#1b75bc', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-0 overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Performance par rizerie</h3>
              <p className="text-xs text-gray-500 mt-0.5">Comparatif avant / après adoption de la plateforme</p>
            </div>
            {performance.parRizerie.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune rizerie enregistrée</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Rizerie', 'CA avant', 'CA plateforme', 'Évol. CA', 'Emplois avant', '+ via app', 'Total emplois', 'Clients', 'Recouvrement'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap text-xs">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {performance.parRizerie.map(r => {
                    const caPct = r.ca_baseline > 0 ? Math.round(r.ca_app / r.ca_baseline * 100) : null
                    const color = rizerieColorMap[r.nom] || '#888'
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="table-cell font-semibold text-gray-900" style={{ borderLeft: `3px solid ${color}` }}>{r.nom}</td>
                        <td className="table-cell text-right text-sm text-gray-500">{fmt(r.ca_baseline)}</td>
                        <td className="table-cell text-right font-medium text-[#1b75bc]">{fmt(r.ca_app)}</td>
                        <td className="table-cell text-center whitespace-nowrap">
                          {caPct !== null
                            ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${caPct >= 100 ? 'bg-green-100 text-green-700' : caPct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>+{caPct}%</span>
                            : <span className="text-gray-300 text-xs">-</span>
                          }
                        </td>
                        <td className="table-cell text-center text-gray-500">{r.emplois_baseline}</td>
                        <td className="table-cell text-center font-medium" style={{ color: '#62bb46' }}>+{r.emplois_app}</td>
                        <td className="table-cell text-center font-bold">{r.emplois_total}</td>
                        <td className="table-cell text-center">{r.nb_clients}</td>
                        <td className="table-cell text-right">
                          <span className={`text-xs font-bold ${r.taux_recouvrement >= 80 ? 'text-green-600' : r.taux_recouvrement >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {r.taux_recouvrement}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
