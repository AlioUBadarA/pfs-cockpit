import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import BarList from '../components/BarList'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '0 F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const BUCKETS = ['Non échu', '1-30 j', '31-60 j', '61-90 j', '91-120 j', '>120 j']
const BUCKET_COLOR = { 'Non échu': '#1B5E20', '1-30 j': '#7a9a4e', '31-60 j': '#F9A825', '61-90 j': '#d98324', '91-120 j': '#c1521d', '>120 j': '#CC0000' }

function bucketOf(age) {
  if (age == null || age <= 0) return 'Non échu'
  if (age <= 30) return '1-30 j'
  if (age <= 60) return '31-60 j'
  if (age <= 90) return '61-90 j'
  if (age <= 120) return '91-120 j'
  return '>120 j'
}

function risqueOf(age) {
  if (age == null || age <= 0) return { label: 'Faible', color: '#1B5E20' }
  if (age <= 30) return { label: 'Surveiller', color: '#F9A825' }
  if (age <= 90) return { label: 'Élevé', color: '#d98324' }
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
          const age = Math.round((now - echeance) / 86400000)
          return { ...v, age, bucket: bucketOf(age), risque: risqueOf(age) }
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

  const relancer = async (id) => {
    setUpdating(id)
    try {
      await api.post(`/api/ventes/${id}/relances`, {})
      load()
    } catch {
      setError('Erreur lors de la relance')
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

  const parVendeur = {}
  creances.forEach((c) => { const n = c.vendeur_nom || 'Moi'; parVendeur[n] = (parVendeur[n] || 0) + Number(c.montant || 0) })
  const vendeurArr = Object.entries(parVendeur).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([label, val]) => ({ label, val, disp: fmt(val), color: '#CC0000' }))

  const filtered = [...(filterRisque === 'Tous' ? creances : creances.filter((c) => c.risque.label === filterRisque))].sort((a, b) => b.age - a.age)
  const critique = creances.filter((c) => c.risque.label === 'Critique').reduce((s, c) => s + Number(c.montant || 0), 0)
  const encours = creances.reduce((s, c) => s + Number(c.montant || 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Recouvrement</h2>
        <p className="text-sm text-gray-500 mt-0.5">Balance âgée, niveau de risque et suivi des relances</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard title="Encours total" value={fmt(encours)} sub={`${creances.length} facture(s)`} color="#CC0000" />
        <KpiCard title="En retard"   value={fmt(kpis.en_retard)} sub={`${kpis.nb_retard ?? 0} vente(s)`} color="#CC0000" />
        <KpiCard title="En cours"    value={fmt(kpis.en_cours)}  sub={`${kpis.nb_cours ?? 0} vente(s)`}  color="#F9A825" />
        <KpiCard title="Payé ce mois" value={fmt(kpis.paye_mois)} color="#1B5E20" />
        <KpiCard title="Risque critique (+90j)" value={fmt(critique)} color="#CC0000" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Balance âgée" sub="répartition de l'encours par ancienneté">
          <BarList items={buckets} labelWidth="90px" dense />
        </Panel>
        <Panel title="Encours par commercial" sub="responsable recouvrement">
          <BarList items={vendeurArr} labelWidth="120px" dense />
        </Panel>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Tous', 'Faible', 'Surveiller', 'Élevé', 'Critique'].map((r) => (
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
                {['Client', 'Resp.', 'Montant dû', 'Échéance', 'Ancienneté', 'Risque', 'Relances', 'Action'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{v.client_nom}<div className="text-[10.5px] text-gray-400">{v.produit}</div></td>
                  <td className="table-cell text-xs text-gray-500">{v.vendeur_nom || '-'}</td>
                  <td className="table-cell text-right font-semibold">{Number(v.montant).toLocaleString('fr-FR')} F</td>
                  <td className="table-cell whitespace-nowrap text-xs">{fmtDate(v.date_echeance)}</td>
                  <td className="table-cell text-xs">{v.age > 0 ? `${v.age} j de retard` : 'à échoir'}</td>
                  <td className="table-cell">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${v.risque.color}1a`, color: v.risque.color }}>
                      {v.risque.label}
                    </span>
                  </td>
                  <td className="table-cell text-xs">
                    {v.nb_relances > 0 ? `${v.nb_relances} · ${fmtDate(v.derniere_relance)}` : '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => relancer(v.id)}
                        disabled={updating === v.id}
                        className="text-xs btn-secondary py-1 px-2.5"
                      >
                        Relancer
                      </button>
                      <button
                        onClick={() => marquerPaye(v.id)}
                        disabled={updating === v.id}
                        className="text-xs btn-primary py-1 px-2.5 flex items-center gap-1"
                      >
                        {updating === v.id && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Payé
                      </button>
                    </div>
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
