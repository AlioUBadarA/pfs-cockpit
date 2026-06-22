import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'

const fmt     = (n) => Number(n).toLocaleString('fr-FR') + ' F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

function urgenceColor(jours) {
  if (jours == null) return 'bg-gray-100 text-gray-600'
  if (jours > 30) return 'bg-red-100 text-red-700'
  if (jours > 14) return 'bg-orange-100 text-orange-700'
  return 'bg-yellow-100 text-yellow-700'
}

export default function Actions() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/actions')
      .then(r => setData(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markPaid = async (id) => {
    try {
      await api.patch(`/api/ventes/${id}/statut`, { statut_paiement: 'Paye' })
      setData(prev => ({
        ...prev,
        creances_retard: prev.creances_retard.filter(v => v.id !== id),
      }))
    } catch {
      setError('Erreur mise à jour')
    }
  }

  const markProspectStatut = async (id, statut) => {
    try {
      await api.patch(`/api/prospection/${id}/statut`, { statut })
      load()
    } catch {
      setError('Erreur mise à jour')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="w-8 h-8 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const nbRetard = data?.creances_retard?.length || 0
  const nbInactifs = data?.clients_inactifs?.length || 0
  const nbProspects = data?.prospects_relance?.length || 0
  const total = nbRetard + nbInactifs + nbProspects
  const montantRetard = (data?.creances_retard || []).reduce((s, v) => s + Number(v.montant || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Alertes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Relances calculées automatiquement</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">Actualiser</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Actions en attente" value={total} color={total > 0 ? '#CC0000' : '#1b75bc'} />
        <KpiCard title="Créances en retard" value={nbRetard} sub={fmt(montantRetard)} color="#CC0000" />
        <KpiCard title="Clients inactifs" value={nbInactifs} color="#F9A825" />
        <KpiCard title="Prospects à relancer" value={nbProspects} color="#5a6b7a" />
      </div>

      {total === 0 && !error && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">✓</p>
          <p className="font-medium">Aucune action en attente. Tout est à jour !</p>
        </div>
      )}

      {nbRetard > 0 && (
        <Panel title="Créances en retard" sub={`${nbRetard} facture(s)`}>
          <div className="overflow-x-auto -m-1">
            <table className="w-full text-left border-collapse p-1">
              <thead>
                <tr>{['Client','Montant','Date vente','Retard','Vendeur','Action'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.creances_retard.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{v.client_nom}</td>
                    <td className="table-cell text-right font-semibold text-red-700">{fmt(v.montant)}</td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenceColor(v.jours_retard)}`}>
                        {v.jours_retard != null ? `${v.jours_retard}j` : '-'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{v.vendeur_nom || '-'}</td>
                    <td className="table-cell">
                      <button onClick={() => markPaid(v.id)} className="text-xs btn-primary py-1 px-3">
                        Marquer payé
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {nbInactifs > 0 && (
        <Panel title="Clients inactifs à relancer" sub={`${nbInactifs} client(s)`}>
          <div className="overflow-x-auto -m-1">
            <table className="w-full text-left border-collapse p-1">
              <thead>
                <tr>{['Client','Type','Zone','Téléphone','Dernière vente','Inactivité','Vendeur'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.clients_inactifs.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.nom}</td>
                    <td className="table-cell text-xs text-gray-600">{c.type}</td>
                    <td className="table-cell text-xs text-gray-500">{c.zone || '-'}</td>
                    <td className="table-cell text-xs">{c.telephone || '-'}</td>
                    <td className="table-cell whitespace-nowrap text-sm">{fmtDate(c.derniere_vente)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenceColor(c.jours_inactif)}`}>
                        {c.jours_inactif != null ? `${c.jours_inactif}j` : 'Jamais'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{c.vendeur_nom || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {nbProspects > 0 && (
        <Panel title="Prospects à relancer" sub={`${nbProspects} prospect(s)`}>
          <div className="overflow-x-auto -m-1">
            <table className="w-full text-left border-collapse p-1">
              <thead>
                <tr>{['Prospect','Statut','Priorité','Zone','Téléphone','Sans contact','Vendeur','Action'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.prospects_relance.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{p.nom}</td>
                    <td className="table-cell text-xs text-gray-600">{p.statut}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        p.priorite === 'Haute' ? 'bg-red-100 text-red-700' :
                        p.priorite === 'Basse' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'}`}>
                        {p.priorite}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{p.zone || '-'}</td>
                    <td className="table-cell text-xs">{p.telephone || '-'}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenceColor(p.jours_sans_contact)}`}>
                        {p.jours_sans_contact != null ? `${p.jours_sans_contact}j` : '-'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{p.vendeur_nom || '-'}</td>
                    <td className="table-cell">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
                        value={p.statut}
                        onChange={e => markProspectStatut(p.id, e.target.value)}
                      >
                        {['Nouveau','En contact','Présentation faite','Devis envoyé','Gagné','Perdu'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
