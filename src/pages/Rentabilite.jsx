import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'

const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' F'

function TauxBadge({ taux }) {
  const color = taux >= 30 ? 'bg-green-100 text-green-700'
              : taux >= 15 ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {taux}%
    </span>
  )
}

export default function Rentabilite() {
  const [annee, setAnnee]       = useState(new Date().getFullYear())
  const [tauxCout, setTauxCout] = useState(70)
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/rentabilite', { params: { annee, taux_cout: tauxCout } })
      .then(r => setData(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [annee, tauxCout])

  useEffect(() => { load() }, [load])

  const chartData = data?.par_type?.map(r => ({
    name:    r.type_client,
    CA:      r.ca,
    Marge:   r.marge,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Rentabilité</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Année</label>
            <select className="input w-auto" value={annee} onChange={e => setAnnee(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Taux de coût (%)</label>
            <input
              type="number" min="0" max="100" className="input w-20 py-1"
              value={tauxCout}
              onChange={e => setTauxCout(+e.target.value)}
              onBlur={load}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs globaux */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">CA total</p>
            <p className="text-lg font-bold text-[#1B5E20]">{fmt(data.ca_total)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Coût estimé ({tauxCout}%)</p>
            <p className="text-lg font-bold text-gray-700">{fmt(data.ca_total * tauxCout / 100)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Marge brute</p>
            <p className="text-lg font-bold text-blue-700">{fmt(data.ca_total * (100 - tauxCout) / 100)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Taux de marge</p>
            <p className="text-lg font-bold text-purple-700">{100 - tauxCout}%</p>
          </div>
        </div>
      )}

      {/* Graphique par type */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">CA et marge par type de client</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
              <Tooltip formatter={v => Number(v).toLocaleString('fr-FR') + ' F'} />
              <Legend />
              <Bar dataKey="CA"    fill="#2E7D32" radius={[3,3,0,0]} />
              <Bar dataKey="Marge" fill="#81C784" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tableau par client */}
      {!loading && (
        <div className="card p-0 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Détail par client</h3>
          </div>
          {data?.par_client?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucune vente pour cette période</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>{['Client','Type','CA','Coût','Marge','Taux','Ventes','Vendeur'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data?.par_client?.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{r.client_nom}</td>
                    <td className="table-cell text-xs text-gray-600">{r.type_client}</td>
                    <td className="table-cell text-right font-semibold text-[#1B5E20]">{fmt(r.ca)}</td>
                    <td className="table-cell text-right text-gray-600">{fmt(r.cout)}</td>
                    <td className="table-cell text-right text-blue-700 font-medium">{fmt(r.marge)}</td>
                    <td className="table-cell text-center"><TauxBadge taux={r.taux_marge} /></td>
                    <td className="table-cell text-center text-sm">{r.nb_ventes}</td>
                    <td className="table-cell text-xs text-gray-500">{r.vendeur_nom || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
