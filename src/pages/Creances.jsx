import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import BarList from '../components/BarList'
import StatutBadge from '../components/StatutBadge'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '0 F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const BUCKETS = ['Non échu', '1-30 j', '31-60 j', '61-90 j', '> 90 j']
const BUCKET_COLOR = { 'Non échu': '#1b75bc', '1-30 j': '#7a9a4e', '31-60 j': '#F9A825', '61-90 j': '#d98324', '> 90 j': '#CC0000' }

function bucketOf(joursRetard) {
  if (joursRetard == null || joursRetard <= 0) return 'Non échu'
  if (joursRetard <= 30) return '1-30 j'
  if (joursRetard <= 60) return '31-60 j'
  if (joursRetard <= 90) return '61-90 j'
  return '> 90 j'
}

function risqueOf(joursRetard) {
  if (joursRetard == null || joursRetard <= 0) return { label: 'Faible', color: '#1b75bc' }
  if (joursRetard <= 30) return { label: 'À surveiller', color: '#F9A825' }
  if (joursRetard <= 90) return { label: 'Élevé', color: '#d98324' }
  return { label: 'Critique', color: '#CC0000' }
}

export default function Creances() {
  const [data, setData]       = useState({ creances: [], kpis: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [updating, setUpdating] = useState(null)
  const [filterRisque, setFilterRisque] = useState('Tous')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/ventes', { params: { statut: 'En cours' } }),
      api.get('/api/ventes', { params: { statut: 'En retard' } }),
      api.get('/api/ventes', { params: { statut: 'Paye' } }),
    ])
      .then(([enCours, enRetard, paye]) => {
        const parseList = (r) => Array.isArray(r.data) ? r.data : []
        const listEnCours  = parseList(enCours)
        const listEnRetard = parseList(enRetard)
        const listPaye     = parseList(paye)

        const somme = (arr) => arr.reduce((s, v) => s + Number(v.montant || 0), 0)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const payeMois = listPaye.filter((v) => new Date(v.date_vente) >= startOfMonth)

        const enAttente = [...listEnRetard, ...listEnCours].map((v) => {
          const echeance = v.date_echeance ? new Date(v.date_echeance) : new Date(new Date(v.date_vente).getTime() + 30 * 86400000)
          const joursRetard = Math.round((now - echeance) / 86400000)
          return { ...v, joursRetard, bucket: bucketOf(joursRetard), risque: risqueOf(joursRetard) }
        })

        setData({
          creances: enAttente,
          kpis: {
            en_retard: somme(listEnRetard),
            en_cours:  somme(listEnCours),
            paye_mois: somme(payeMois),
            nb_retard: listEnRetard.length,
            nb_cours:  listEnCours.length,
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
      await api.patch(`/api/ventes/${id}/statut`, { statut_paiement: 'Paye' })
      load()
    } catch {
      setError('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  const { creances, kpis } = data

  const buckets = BUCKETS.map((b) => {
    const list = creances.filter((c) => c.bucket === b)
    const val = list.reduce((s, c) => s + Number(c.montant || 0), 0)
    return { label: b, val: val || list.length, disp: fmt(val), color: BUCKET_COLOR[b] }
  })

  const filtered = filterRisque === 'Tous' ? creances : creances.filter((c) => c.risque.label === filterRisque)
  const critique = creances.filter((c) => c.risque.label === 'Critique').reduce((s, c) => s + Number(c.montant || 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Recouvrement</h2>
        <p className="text-sm text-gray-500 mt-0.5">Balance âgée et niveau de risque des créances</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="En retard"   value={fmt(kpis.en_retard)} sub={`${kpis.nb_retard ?? 0} vente(s)`} color="#CC0000" />
        <KpiCard title="En cours"    value={fmt(kpis.en_cours)}  sub={`${kpis.nb_cours ?? 0} vente(s)`}  color="#F9A825" />
        <KpiCard title="Payé ce mois" value={fmt(kpis.paye_mois)} color="#1b75bc" />
        <KpiCard title="Risque critique (+90j)" value={fmt(critique)} color="#CC0000" />
      </div>

      <Panel title="Balance âgée" sub="répartition de l'encours par ancienneté">
        <BarList items={buckets} labelWidth="90px" dense />
      </Panel>

      <div className="flex gap-2 flex-wrap">
        {['Tous', 'Faible', 'À surveiller', 'Élevé', 'Critique'].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRisque(r)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterRisque === r ? 'text-white' : 'bg-white text-gray-600 border-gray-300'
            }`}
            style={filterRisque === r ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune créance dans cette catégorie</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Date','Client','Produit','Montant','Ancienneté','Risque','Statut','Action'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                  <td className="table-cell font-medium">{v.client_nom}</td>
                  <td className="table-cell">{v.produit}</td>
                  <td className="table-cell text-right font-semibold">
                    {Number(v.montant).toLocaleString('fr-FR')} F
                  </td>
                  <td className="table-cell text-xs">
                    {v.joursRetard > 0 ? `${v.joursRetard} j de retard` : 'à échoir'}
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${v.risque.color}1a`, color: v.risque.color }}>
                      {v.risque.label}
                    </span>
                  </td>
                  <td className="table-cell">
                    <StatutBadge statut={v.statut_paiement} />
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
