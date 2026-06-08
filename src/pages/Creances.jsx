import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import StatutBadge from '../components/StatutBadge'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '0 F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Creances() {
  const [data, setData] = useState({ creances: [], kpis: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/ventes', { params: { statut: 'En cours' } }),
      api.get('/api/ventes', { params: { statut: 'En retard' } }),
      api.get('/api/ventes', { params: { statut: 'Payé' } }),
    ])
      .then(([enCours, enRetard, paye]) => {
        const parseList = (r) => r.data?.ventes || r.data || []
        const listEnCours = parseList(enCours)
        const listEnRetard = parseList(enRetard)
        const listPaye = parseList(paye)

        const somme = (arr) => arr.reduce((s, v) => s + Number(v.montant || 0), 0)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const payeMois = listPaye.filter((v) => new Date(v.date_vente) >= startOfMonth)

        setData({
          creances: [...listEnRetard, ...listEnCours],
          kpis: {
            en_retard: somme(listEnRetard),
            en_cours: somme(listEnCours),
            paye_mois: somme(payeMois),
            nb_retard: listEnRetard.length,
            nb_cours: listEnCours.length,
          },
        })
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const marquerPaye = async (id) => {
    setUpdating(id)
    try {
      await api.patch(`/api/ventes/${id}/statut`, { statut: 'Payé' })
      load()
    } catch {
      setError('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  const { creances, kpis } = data

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Créances</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="En retard"
          value={fmt(kpis.en_retard)}
          sub={`${kpis.nb_retard ?? 0} vente(s)`}
          color="#CC0000"
          icon="🔴"
        />
        <KpiCard
          title="En cours"
          value={fmt(kpis.en_cours)}
          sub={`${kpis.nb_cours ?? 0} vente(s)`}
          color="#F9A825"
          icon="🟡"
        />
        <KpiCard
          title="Payé ce mois"
          value={fmt(kpis.paye_mois)}
          color="#1B5E20"
          icon="✅"
        />
      </div>

      {/* Tableau créances */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : creances.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune créance en attente</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Date', 'Client', 'Produit', 'Montant', 'Statut', 'Action'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creances.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                  <td className="table-cell font-medium">{v.client_nom}</td>
                  <td className="table-cell">{v.produit}</td>
                  <td className="table-cell text-right font-semibold">
                    {Number(v.montant).toLocaleString('fr-FR')} F
                  </td>
                  <td className="table-cell">
                    <StatutBadge statut={v.statut} />
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => marquerPaye(v.id)}
                      disabled={updating === v.id}
                      className="text-xs btn-primary py-1 px-3 flex items-center gap-1"
                    >
                      {updating === v.id && (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      Marquer payé
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
