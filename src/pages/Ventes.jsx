import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import KebabMenu from '../components/KebabMenu'
import { useAuth } from '../context/AuthContext'
import { printBonCommande, printFacture } from '../utils/printDocument'
import { emetteur } from '../utils/entreprise'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'
import { askConfirm } from '../utils/askConfirm'

// Valeurs exactes du backend
const STATUTS_DB   = ['En cours', 'Paye', 'En retard']
const STATUT_LABEL = { 'Paye': 'Payé', 'En cours': 'En cours', 'En retard': 'En retard' }
const STATUT_STYLE = { 'Paye': 'text-green-700 bg-green-50', 'En cours': 'text-amber-700 bg-amber-50', 'En retard': 'text-red-700 bg-red-50' }

function resumeProduits(v) {
  const lignes = Array.isArray(v.lignes) && v.lignes.length ? v.lignes : null
  if (!lignes) return v.produit
  if (lignes.length === 1) return lignes[0].produit
  return `${lignes.length} produits`
}

export default function Ventes() {
  const { user, isVendeur, isComptable } = useAuth()
  const navigate = useNavigate()
  const [ventes, setVentes]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterMois, setFilterMois]     = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [error, setError]         = useState('')
  const [info, setInfo]           = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [ouverte, setOuverte] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filterMois) {
      const [year, month] = filterMois.split('-')
      params.mois  = month
      params.annee = year
    }
    if (filterStatut) params.statut = filterStatut
    api.get('/api/ventes', { params })
      .then((r) => setVentes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [filterMois, filterStatut])

  useEffect(() => { load() }, [load])

  // « Payé » ne se choisit plus à la main : il vient des encaissements validés.
  const changeStatut = async (id, statut_paiement) => {
    setError('')
    try {
      await api.patch(`/api/ventes/${id}/statut`, { statut_paiement })
      setVentes((prev) => prev.map((v) => v.id === id ? { ...v, statut_paiement } : v))
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur mise à jour statut')
    }
  }

  const deleteVente = async (id) => {
    if (!(await askConfirm('Supprimer cette vente ?'))) return
    try {
      await api.delete(`/api/ventes/${id}`)
      setVentes((prev) => prev.filter((v) => v.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  // La facture vient du serveur : il la refuse au commercial tant qu'aucun encaissement n'est
  // validé. Le commercial envoie alors le reçu de paiement (page Encaissements).
  const handlePrintFacture = async (vente) => {
    setError(''); setInfo('')
    try {
      const { data } = await api.get(`/api/ventes/${vente.id}/facture`)
      printFacture(data, data.versements || [], await emetteur(user))
    } catch (err) {
      if (err.response?.data?.code === 'FACTURE_NON_VALIDEE') setInfo(err.response.data.error)
      else setError(err.response?.data?.error || 'Facture indisponible')
    }
  }

  const factureDispo = (v) => !isVendeur || Number(v.total_valide) > 0

  // Reste à déclarer : montant moins ce qui est déjà déclaré ou validé (hors rejets).
  const resteADeclarer = (v) => Math.max(0, Number(v.montant) - Number(v.total_verse || 0))
  const lienEncaisser = (v) => `/encaissements?${new URLSearchParams({ ref: v.numero || v.client_nom, id: v.id, type: 'vente' })}`

  const venteMenuItems = (v) => [
    ...(resteADeclarer(v) > 0 && !isComptable
      ? [{ icon: '💰', label: 'Encaisser', onClick: () => navigate(lienEncaisser(v)) }]
      : []),
    { icon: '⎙', label: 'Bon de commande', onClick: async () => printBonCommande(v, await emetteur(user)) },
    factureDispo(v)
      ? { icon: '🧾', label: 'Facture', onClick: () => handlePrintFacture(v) }
      : { icon: '🧾', label: 'Facture (après validation)', onClick: () => handlePrintFacture(v) },
    ...(!isVendeur ? [{ icon: '🗑', label: 'Supprimer', onClick: () => deleteVente(v.id), danger: true }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Ventes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Le CA compte l'argent encaissé et validé. Une vente non payée reste en créance.</p>
        </div>
        <Link to="/ventes/nouvelle" className="btn-primary text-sm">+ Nouvelle vente</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}
      {info && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <span>{info}</span>
          <Link to="/encaissements" className="font-medium underline shrink-0">Aller aux encaissements</Link>
        </div>
      )}

      {/* Filtres */}
      <div className="card flex flex-wrap items-center gap-3">
        <div>
          <label className="label mb-0 inline mr-2">Mois</label>
          <input type="month" className="input w-auto" value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)} />
        </div>
        <div>
          <label className="label mb-0 inline mr-2">Statut</label>
          <select className="input w-auto" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            {STATUTS_DB.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
          </select>
        </div>
        {(filterMois || filterStatut) && (
          <button className="text-xs text-gray-500 underline"
            onClick={() => { setFilterMois(''); setFilterStatut('') }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ventes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune vente trouvée</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['N° transaction','Date','Client','Produits','Montant','Encaissé validé','En attente','Solde','Prochaine échéance','Statut',''].map(h => (
                  <th key={h || 'actions'} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventes.map((v) => {
                const multi = Array.isArray(v.lignes) && v.lignes.length > 1
                const solde = Math.max(0, Number(v.montant) - Number(v.total_valide || 0))
                return [
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-cell whitespace-nowrap font-mono text-xs text-gray-500">{v.numero || '-'}</td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                    <td className="table-cell font-medium min-w-[10rem]">{v.client_nom}</td>
                    <td className="table-cell min-w-[10rem]">
                      {multi ? (
                        <button type="button" className="text-[#1b75bc] underline-offset-2 hover:underline" onClick={() => setOuverte(ouverte === v.id ? null : v.id)}>
                          {resumeProduits(v)} {ouverte === v.id ? '▴' : '▾'}
                        </button>
                      ) : (
                        <span>{resumeProduits(v)} <span className="text-gray-400 text-xs">· {Number(v.quantite).toLocaleString('fr-FR')} kg</span></span>
                      )}
                    </td>
                    <td className="table-cell text-right font-semibold whitespace-nowrap tabular-nums">{fmt(v.montant)}</td>
                    <td className="table-cell text-right whitespace-nowrap tabular-nums text-green-700">{fmt(v.total_valide || 0)}</td>
                    <td className="table-cell text-right whitespace-nowrap tabular-nums text-amber-700">
                      {Number(v.total_declare) > 0 ? fmt(v.total_declare) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="table-cell text-right whitespace-nowrap tabular-nums">
                      {v.statut_paiement === 'Paye' ? <span className="text-xs text-green-700">Soldé</span> : fmt(solde)}
                      {resteADeclarer(v) > 0 && !isComptable && (
                        <Link to={lienEncaisser(v)} className="block text-[11px] font-semibold text-[#1b75bc] hover:underline">Encaisser</Link>
                      )}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {v.statut_paiement === 'Paye' || !v.date_echeance ? (
                        <span className="text-gray-300">-</span>
                      ) : (
                        <div>
                          <div>{fmtDate(v.date_echeance)}</div>
                          {Number(v.montant_attendu_prochaine_echeance) > 0 && (
                            <div className="text-[10.5px] text-gray-400">{fmt(v.montant_attendu_prochaine_echeance)} attendu</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {!isVendeur && v.statut_paiement !== 'Paye' ? (
                        <select
                          value={v.statut_paiement}
                          onChange={(e) => changeStatut(v.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
                          aria-label="Statut de la vente"
                        >
                          {['En cours', 'En retard'].map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                        </select>
                      ) : (
                        <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${STATUT_STYLE[v.statut_paiement] || ''}`}>
                          {STATUT_LABEL[v.statut_paiement] || v.statut_paiement}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <KebabMenu
                        menuKey={v.id}
                        open={openMenu === v.id}
                        onToggle={(k) => setOpenMenu(k)}
                        items={venteMenuItems(v)}
                      />
                    </td>
                  </tr>,
                  multi && ouverte === v.id ? (
                    <tr key={`${v.id}-lignes`} className="bg-gray-50/60">
                      <td colSpan={11} className="px-4 py-2">
                        <table className="w-full max-w-xl text-xs">
                          <tbody>
                            {v.lignes.map((l) => (
                              <tr key={l.id || l.produit}>
                                <td className="py-1 pr-3 text-gray-700">{l.produit}</td>
                                <td className="py-1 pr-3 text-right tabular-nums">{Number(l.quantite).toLocaleString('fr-FR')} kg</td>
                                <td className="py-1 pr-3 text-right tabular-nums text-gray-500">{fmt(l.prix_unitaire)}/kg</td>
                                <td className="py-1 text-right tabular-nums font-semibold">{fmt(l.montant)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null,
                ]
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
