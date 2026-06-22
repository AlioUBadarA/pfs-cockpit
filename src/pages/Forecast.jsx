import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'

const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' F'

export default function Forecast() {
  const [annee, setAnnee]     = useState(new Date().getFullYear())
  const [data, setData]       = useState([])
  const [editing, setEditing] = useState({})
  const [saving, setSaving]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/forecast', { params: { annee } })
      .then(r => {
        setData(r.data.months || [])
        const init = {}
        r.data.months.forEach(m => { init[m.mois] = String(m.objectif || '') })
        setEditing(init)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [annee])

  useEffect(() => { load() }, [load])

  const save = async (mois) => {
    const val = Number(editing[mois])
    if (isNaN(val) || val < 0) return
    setSaving(mois)
    try {
      await api.post('/api/forecast', { annee, mois, objectif_montant: val })
      setData(prev => prev.map(m => m.mois === mois ? { ...m, objectif: val } : m))
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  const chartData = data.map(m => ({
    name: MOIS_LABELS[m.mois - 1],
    Objectif: m.objectif,
    Réalisé:  m.realise,
  }))

  const totalObj = data.reduce((s, m) => s + m.objectif, 0)
  const totalReal = data.reduce((s, m) => s + m.realise, 0)
  const avancement = totalObj > 0 ? Math.round(totalReal / totalObj * 100) : null

  // Projection : rythme moyen des 3 derniers mois ayant un réalisé non nul, étalé sur les mois restants.
  const moisActuel = annee === new Date().getFullYear() ? new Date().getMonth() + 1 : 12
  const moisEcoules = data.filter(m => m.mois <= moisActuel && m.realise > 0)
  const rythme = moisEcoules.length ? moisEcoules.slice(-3).reduce((s, m) => s + m.realise, 0) / Math.min(3, moisEcoules.length) : 0
  const moisRestants = Math.max(0, 12 - moisActuel)
  const projectionAnnuelle = totalReal + rythme * moisRestants

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Prévisions</h2>
          <p className="text-sm text-gray-500 mt-0.5">Objectifs mensuels et projection annuelle</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Année</label>
          <select className="input w-auto" value={annee} onChange={e => setAnnee(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Objectif annuel" value={fmt(totalObj)} color="#1b75bc" />
        <KpiCard title="Réalisé" value={fmt(totalReal)} color="#1565C0" />
        <KpiCard
          title="Avancement"
          value={avancement != null ? `${avancement}%` : '-'}
          color={avancement == null ? '#8a7f6e' : avancement >= 100 ? '#1b75bc' : avancement >= 70 ? '#F9A825' : '#CC0000'}
        />
        <KpiCard title="Projection fin d'année" value={fmt(projectionAnnuelle)} sub="au rythme des 3 derniers mois" color="#6b46c1" />
      </div>

      {!loading && data.length > 0 && (
        <Panel title="Objectif vs Réalisé par mois">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={v => Number(v).toLocaleString('fr-FR') + ' F'} />
              <Legend />
              <Bar dataKey="Objectif" fill="#9E9E9E" radius={[3,3,0,0]} />
              <Bar dataKey="Réalisé"  fill="#2E7D32" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel title="Saisie des objectifs mensuels">
        <div className="overflow-x-auto -m-1">
          <table className="w-full text-left border-collapse p-1">
            <thead>
              <tr>
                {['Mois','Objectif (F)','Réalisé (F)','Avancement','Sauvegarder'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(m => {
                const pct = m.objectif > 0 ? Math.round(m.realise / m.objectif * 100) : null
                return (
                  <tr key={m.mois} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{MOIS_LABELS[m.mois - 1]}</td>
                    <td className="table-cell">
                      <input
                        type="number" min="0" className="input w-36 py-1 text-sm"
                        value={editing[m.mois] ?? ''}
                        onChange={e => setEditing(prev => ({ ...prev, [m.mois]: e.target.value }))}
                        onBlur={() => save(m.mois)}
                        onKeyDown={e => e.key === 'Enter' && save(m.mois)}
                      />
                    </td>
                    <td className="table-cell text-right font-medium text-blue-700">{fmt(m.realise)}</td>
                    <td className="table-cell">
                      {pct != null ? (
                        <div className="flex items-center gap-2">
                          <div className="bar-row-track flex-1 min-w-[60px]">
                            <div
                              className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold w-10 text-right">{pct}%</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => save(m.mois)} disabled={saving === m.mois}
                        className="text-xs btn-primary py-1 px-3"
                      >
                        {saving === m.mois ? '...' : 'OK'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
