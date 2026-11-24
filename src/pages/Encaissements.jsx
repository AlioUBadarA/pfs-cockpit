import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Panel from '../components/Panel'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import KebabMenu from '../components/KebabMenu'
import { ModeButtons, PreuveFields, MODES_AVEC_PREUVE, ValidationBadge } from '../components/PaiementFields'
import { useAuth } from '../context/AuthContext'
import { printRecu, printFacture } from '../utils/printDocument'
import { emetteur, ouvrirPreuve } from '../utils/entreprise'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'

const statutColor = (s) => ({
  Paye: 'text-green-700', 'En cours': 'text-amber-600', 'En retard': 'text-red-600',
  Actif: 'text-green-700', Suspendu: 'text-amber-600', Terminé: 'text-gray-500',
}[s] || 'text-gray-600')

const TYPE_LABEL = { vente: 'Vente', echeance: 'Contrat', paddy: 'Contrat paddy', depot: 'Dépôt-vente' }

const FORM_INIT = () => ({
  montant: '', mode: 'Espèces', date: new Date().toISOString().slice(0, 10),
  prochaine_echeance: '', reference: '', preuve: null,
})

// Le commercial déclare l'argent reçu, avec une preuve pour un chèque, un virement ou du
// Mobile Money. Le comptable ou un responsable valide ensuite. Seul l'encaissement validé
// compte dans le CA et solde la transaction. Le reçu peut être remis tout de suite ; la
// facture attend la validation.
export default function Encaissements() {
  const { user, isVendeur, isComptable } = useAuth()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [selected, setSelected] = useState(null)
  const [versements, setVersements] = useState([])
  const [loadingVers, setLoadingVers] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(FORM_INIT)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const search = async (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setSearching(true); setError(''); setInfo(''); setSelected(null)
    try {
      const { data } = await api.get('/api/encaissements/search', { params: { q: q.trim() } })
      setResults(data)
    } catch {
      setError('Erreur de recherche')
    } finally { setSearching(false) }
  }

  const chargerVersements = async (item) => {
    const { data } = await api.get(`/api/encaissements/${item.type}/${item.id}/versements`)
    setVersements(data)
    return data
  }

  const openTransaction = async (item) => {
    setSelected(item)
    setInfo('')
    setLoadingVers(true)
    try {
      await chargerVersements(item)
    } catch {
      setError('Erreur de chargement des versements')
    } finally { setLoadingVers(false) }
  }

  const openNewVersement = (montantPropose) => {
    setForm({ ...FORM_INIT(), montant: montantPropose > 0 ? String(montantPropose) : '' })
    setFormError('')
    setModalOpen(true)
  }

  // Arrivée depuis une vente (bouton « Encaisser ») : /encaissements?ref=V-2026-0005&id=…&type=vente
  // La transaction s'ouvre directement, avec le formulaire de déclaration si un solde reste dû.
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    const ref = params.get('ref')
    const id = params.get('id')
    const type = params.get('type') || 'vente'
    if (!ref || !id) return
    setParams({}, { replace: true })
    setQ(ref)
    setSearching(true)
    api.get('/api/encaissements/search', { params: { q: ref } })
      .then(async ({ data }) => {
        setResults(data)
        const item = data.find((r) => String(r.id) === id && r.type === type)
        if (!item) { setError('Transaction introuvable'); return }
        await openTransaction(item)
        const resteDu = Number(item.montant_total) - Number(item.total_verse || 0)
        if (resteDu > 0 && !isComptable) openNewVersement(resteDu)
      })
      .catch(() => setError('Erreur de recherche'))
      .finally(() => setSearching(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  // Plafond : tout ce qui est déclaré ou validé (les rejets libèrent le montant).
  const reste = selected ? Math.max(0, Number(selected.montant_total) - Number(selected.total_verse)) : 0
  const resteValide = selected ? Math.max(0, Number(selected.montant_total) - Number(selected.total_valide || 0)) : 0
  const enAttente = versements.filter((v) => v.statut_validation === 'declare').reduce((s, v) => s + Number(v.montant), 0)

  const supportsEcheance = selected && ['vente', 'echeance'].includes(selected.type)
  const soldeApresVersement = selected ? reste - (Number(form.montant) || 0) : 0
  const demandeProchaineEcheance = supportsEcheance && soldeApresVersement > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (demandeProchaineEcheance && !form.prochaine_echeance) {
      setFormError('La prochaine date de paiement est requise tant qu\'il reste un solde')
      return
    }
    if (MODES_AVEC_PREUVE.includes(form.mode) && !form.preuve) {
      setFormError(`Ajoutez la preuve du paiement par ${form.mode}`)
      return
    }
    setSaving(true); setFormError('')
    try {
      const { data: versement } = await api.post(`/api/encaissements/${selected.type}/${selected.id}/versements`, {
        montant: Number(form.montant), mode: form.mode, date: form.date,
        prochaine_echeance: demandeProchaineEcheance ? form.prochaine_echeance : undefined,
        reference: form.reference.trim() || undefined,
        preuve: form.preuve ? { nom: form.preuve.nom, data: form.preuve.data } : undefined,
      })
      setModalOpen(false)
      const fresh = await chargerVersements(selected)
      const totalVerse = fresh.filter((v) => v.statut_validation !== 'rejete').reduce((s, v) => s + Number(v.montant), 0)
      const totalValide = fresh.filter((v) => v.statut_validation === 'valide').reduce((s, v) => s + Number(v.montant), 0)
      const montantTotal = Number(selected.montant_total)
      setSelected((p) => ({
        ...p, total_verse: totalVerse, total_valide: totalValide,
        statut: ['vente', 'depot'].includes(p.type) && totalValide >= montantTotal ? 'Paye' : p.statut,
        ...(demandeProchaineEcheance ? (
          p.type === 'vente' ? { date_echeance: form.prochaine_echeance } : { date: form.prochaine_echeance }
        ) : {}),
      }))
      setResults((rs) => rs.map((r) => r.id === selected.id ? { ...r, total_verse: totalVerse, total_valide: totalValide } : r))
      setInfo(versement.statut_validation === 'declare'
        ? 'Encaissement déclaré. Il compte dans le CA après validation du comptable ou du manager.'
        : 'Encaissement enregistré et validé.')
      // Impression automatique du reçu
      printRecu(selected, { ...versement, montant: Number(form.montant) }, totalVerse, Math.max(0, montantTotal - totalVerse), await emetteur(user))
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  const imprimerFacture = async () => {
    setError(''); setInfo('')
    try {
      const { data } = await api.get(`/api/ventes/${selected.id}/facture`)
      printFacture(data, data.versements || [], await emetteur(user))
    } catch (err) {
      if (err.response?.data?.code === 'FACTURE_NON_VALIDEE') setInfo(err.response.data.error)
      else setError(err.response?.data?.error || 'Facture indisponible')
    }
  }

  const voirPreuve = async (id) => {
    try { await ouvrirPreuve(id) } catch { setError('Preuve indisponible') }
  }

  const factureDispo = selected?.type === 'vente' && (!isVendeur || Number(selected.total_valide) > 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Encaissements</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Cherchez une vente, un dépôt ou un contrat. Déclarez ensuite l'argent reçu. Le client peut payer en plusieurs fois.
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      {info && <div className="bg-[#eaf3fb] border border-[#cfe3f4] text-[#155d96] text-sm rounded-lg px-4 py-3">{info}</div>}

      <form onSubmit={search} className="card flex gap-3">
        <input
          className="input flex-1"
          placeholder="Numéro de transaction (ex: V-2026-0007) ou nom du client..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" disabled={searching} className="btn-primary text-sm">
          {searching ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {results.length > 0 && !selected && (
        <Panel title="Résultats" sub={`${results.length} transaction(s) trouvée(s)`}>
          <DataTable
            headers={['N°', 'Type', 'Client', 'Montant', 'Validé', 'Statut']}
            align={['left', 'left', 'left', 'right', 'right', 'left']}
            rows={results.map((r) => [
              { v: r.numero || '-', sub: fmtDate(r.date) },
              TYPE_LABEL[r.type] || 'Contrat',
              r.client_nom,
              fmt(r.montant_total),
              fmt(r.total_valide ?? r.total_verse),
              { v: r.statut, c: undefined, bold: true },
            ])}
            onRowClick={(ri) => openTransaction(results[ri])}
          />
        </Panel>
      )}

      {results.length === 0 && q && !searching && (
        <p className="text-sm text-gray-400 text-center py-6">Aucune transaction ne correspond à "{q}"</p>
      )}

      {selected && (
        <Panel
          title={`${TYPE_LABEL[selected.type] || 'Contrat'} ${selected.numero || ''} · ${selected.client_nom}`}
          sub={`Montant ${selected.type === 'vente' ? 'total' : selected.type === 'depot' ? 'dû (quantités vendues déclarées)' : 'mensuel'} : ${fmt(selected.montant_total)}`}
          right={<button className="btn-secondary text-sm" onClick={() => setSelected(null)}>← Retour aux résultats</button>}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Encaissé validé</p>
              <p className="text-lg font-bold text-green-700">{fmt(selected.total_valide || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">En attente de validation</p>
              <p className="text-lg font-bold text-amber-700">{fmt(enAttente)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Reste à encaisser</p>
              <p className="text-lg font-bold text-gray-800">{fmt(reste)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Statut</p>
              <p className={`text-lg font-bold ${statutColor(selected.statut)}`}>{selected.statut}</p>
              {reste > 0 && supportsEcheance && (selected.date_echeance || selected.date) && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Échéance {fmtDate(selected.type === 'vente' ? selected.date_echeance : selected.date)}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mb-3 flex-wrap">
            {selected.type === 'vente' && (
              <button
                onClick={imprimerFacture}
                className="btn-secondary text-sm"
                title={factureDispo ? '' : 'Disponible après validation d\'un encaissement'}
              >
                ⎙ Facture{factureDispo ? '' : ' (après validation)'}
              </button>
            )}
            {reste > 0 && !isComptable && (
              <button onClick={() => openNewVersement(reste)} className="btn-primary text-sm">+ Déclarer un encaissement</button>
            )}
          </div>
          {resteValide > 0 && reste <= 0 && (
            <p className="text-xs text-amber-700 mb-3">Tout est déclaré. La transaction sera soldée après validation.</p>
          )}

          {loadingVers ? (
            <div className="flex justify-center py-8"><span className="w-6 h-6 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
          ) : versements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun versement enregistré.</p>
          ) : (
            <div className="overflow-x-auto -m-1">
              <table className="w-full border-collapse p-1">
                <thead>
                  <tr>
                    {['Date', 'Montant', 'Mode', 'Référence', 'Validation', ''].map((h) => (
                      <th key={h || 'actions'} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {versements.map((v, i) => {
                    // total cumulé (hors rejets) jusqu'à ce versement (liste en DESC)
                    const cumulVerse = versements.slice(i).filter((x) => x.statut_validation !== 'rejete').reduce((s, x) => s + Number(x.montant), 0)
                    const resteAuMoment = Math.max(0, Number(selected.montant_total) - cumulVerse)
                    const items = []
                    if (v.statut_validation !== 'rejete') {
                      items.push({ icon: '⎙', label: 'Imprimer le reçu', onClick: async () => printRecu(selected, v, cumulVerse, resteAuMoment, await emetteur(user)) })
                    }
                    if (v.a_preuve) items.push({ icon: '📎', label: 'Voir la preuve', onClick: () => voirPreuve(v.id) })
                    return (
                      <tr key={v.id || i} className="hover:bg-gray-50">
                        <td className="table-cell">{fmtDate(v.date)}</td>
                        <td className={`table-cell text-right font-semibold ${v.statut_validation === 'rejete' ? 'line-through text-gray-400' : ''}`}>{fmt(v.montant)}</td>
                        <td className="table-cell">{v.mode || '-'}</td>
                        <td className="table-cell text-xs text-gray-500">{v.reference || '-'}</td>
                        <td className="table-cell">
                          <ValidationBadge statut={v.statut_validation} />
                          {v.statut_validation === 'rejete' && v.motif_rejet && (
                            <p className="text-[11px] text-red-600 mt-1 max-w-[220px]">{v.motif_rejet}</p>
                          )}
                        </td>
                        <td className="table-cell">
                          {items.length > 0 && (
                            <KebabMenu
                              menuKey={v.id ?? i}
                              open={openMenu === (v.id ?? i)}
                              onToggle={(k) => setOpenMenu(k)}
                              items={items}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Déclarer un encaissement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Mode de paiement</label>
            <ModeButtons value={form.mode} onChange={(m) => setForm((p) => ({ ...p, mode: m, preuve: null, reference: '' }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant (F) *</label>
              <input type="number" min="1" max={reste || undefined} className="input" value={form.montant} onChange={set('montant')} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} required />
            </div>
          </div>
          <PreuveFields
            mode={form.mode}
            reference={form.reference}
            onReference={(v) => setForm((p) => ({ ...p, reference: v }))}
            preuve={form.preuve}
            onPreuve={(v) => setForm((p) => ({ ...p, preuve: v }))}
          />
          {form.montant && (
            <p className="text-xs text-gray-500">
              Reste après cette tranche : <strong>{fmt(Math.max(0, soldeApresVersement))}</strong>
            </p>
          )}
          {demandeProchaineEcheance && (
            <div>
              <label className="label">Prochaine date de paiement *</label>
              <input type="date" className="input" value={form.prochaine_echeance} onChange={set('prochaine_echeance')} min={form.date} required />
              <p className="text-xs text-gray-400 mt-1">Il restera un solde après ce versement. Indiquez la date du prochain paiement.</p>
            </div>
          )}
          <p className="text-xs text-gray-500">Le comptable ou le manager valide ensuite cet encaissement. Le reçu s'imprime tout de suite.</p>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : 'Déclarer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
