import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import StatutBadge from '../components/StatutBadge'
import { useAuth } from '../context/AuthContext'
import { printBonCommande, printFacture } from '../utils/printDocument'

// Valeurs exactes du backend
const STATUTS_DB   = ['En cours', 'Paye', 'En retard']
const STATUT_LABEL = { 'Paye': 'Payé', 'En cours': 'En cours', 'En retard': 'En retard' }

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const VENTE_INIT = {
  client_nom: '', produit: '', quantite: '', prix_unitaire: '',
  statut_paiement: 'En cours', date_vente: '',
}

export default function Ventes() {
  const { user } = useAuth()
  const [ventes, setVentes]     = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterMois, setFilterMois]     = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]           = useState(VENTE_INIT)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [printMenu, setPrintMenu] = useState(null) // id de la vente dont le menu est ouvert

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
  useEffect(() => { api.get('/api/produits').then((r) => setProduits(r.data)).catch(() => {}) }, [])

  const openNew = () => {
    setForm({ ...VENTE_INIT, date_vente: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/ventes', {
        client_nom:      form.client_nom,
        produit:         form.produit,
        date_vente:      form.date_vente,
        quantite:        Number(form.quantite),
        prix_unitaire:   Number(form.prix_unitaire),
        statut_paiement: form.statut_paiement,
      })
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const changeStatut = async (id, statut_paiement) => {
    try {
      await api.patch(`/api/ventes/${id}/statut`, { statut_paiement })
      setVentes((prev) => prev.map((v) => v.id === id ? { ...v, statut_paiement } : v))
    } catch {
      setError('Erreur mise à jour statut')
    }
  }

  const deleteVente = async (id) => {
    if (!confirm('Supprimer cette vente ?')) return
    try {
      await api.delete(`/api/ventes/${id}`)
      setVentes((prev) => prev.filter((v) => v.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  const handlePrintFacture = async (vente) => {
    setPrintMenu(null)
    try {
      const { data: versements } = await api.get(`/api/ventes/${vente.id}/versements`)
      printFacture(vente, versements, user)
    } catch {
      printFacture(vente, [], user)
    }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const setProduit = (e) => {
    const nom = e.target.value
    const match = produits.find((p) => p.nom === nom)
    setForm((p) => ({ ...p, produit: nom, prix_unitaire: !p.prix_unitaire && match ? match.prix_kg : p.prix_unitaire }))
  }

  // Montant calculé en temps réel dans le formulaire
  const montantCalc = form.quantite && form.prix_unitaire
    ? (Number(form.quantite) * Number(form.prix_unitaire)).toLocaleString('fr-FR') + ' F'
    : '-'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Ventes</h2>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouvelle vente</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
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
                {['N° transaction','Date','Client','Produit','Qté (kg)','P.U.','Montant','Statut','Actions'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventes.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap font-mono text-xs text-gray-500">{v.numero || '-'}</td>
                  <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                  <td className="table-cell font-medium">{v.client_nom}</td>
                  <td className="table-cell">{v.produit}</td>
                  <td className="table-cell text-right">{Number(v.quantite).toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-right">{fmt(v.prix_unitaire)}</td>
                  <td className="table-cell text-right font-semibold">{fmt(v.montant)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={v.statut_paiement}
                        onChange={(e) => changeStatut(v.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        {STATUTS_DB.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                      </select>
                      {v.statut_paiement === 'Paye' && (
                        <span className="text-xs font-medium text-green-700" title="Transaction clôturée">✓ Clôturée</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {/* Menu impression */}
                      <div className="relative">
                        <button
                          onClick={() => setPrintMenu(printMenu === v.id ? null : v.id)}
                          className="text-xs text-[#1b75bc] hover:text-blue-800 font-medium"
                        >
                          ⎙ Imprimer
                        </button>
                        {printMenu === v.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setPrintMenu(null)} />
                            <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-48">
                              <button
                                onClick={() => { setPrintMenu(null); printBonCommande(v, user) }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Bon de commande
                              </button>
                              {v.statut_paiement === 'Paye' && (
                                <>
                                  <div className="border-t border-gray-100 mx-2" />
                                  <button
                                    onClick={() => handlePrintFacture(v)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Facture
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => deleteVente(v.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nouvelle vente */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle vente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date_vente} onChange={set('date_vente')} required />
          </div>
          <div>
            <label className="label">Nom du client</label>
            <input className="input" placeholder="Ex: Boutique Diallo" value={form.client_nom} onChange={set('client_nom')} required />
          </div>
          <div>
            <label className="label">Produit</label>
            <select className="input" value={form.produit} onChange={setProduit} required>
              <option value="">— Choisir un produit —</option>
              {produits.map((p) => (
                <option key={p.id} value={p.nom}>
                  {p.nom}{p.prix_kg ? ` — ${Number(p.prix_kg).toLocaleString('fr-FR')} F/kg` : ''}
                </option>
              ))}
            </select>
            {produits.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Aucun produit au catalogue — demandez à votre manager d'en ajouter.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantité (kg)</label>
              <input type="number" min="0.01" step="any" className="input" value={form.quantite} onChange={set('quantite')} required />
            </div>
            <div>
              <label className="label">Prix unitaire (F/kg)</label>
              <input type="number" min="1" className="input" value={form.prix_unitaire} onChange={set('prix_unitaire')} required />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
            Montant total : <strong className="text-[#1b75bc]">{montantCalc}</strong>
          </div>
          <div>
            <label className="label">Statut paiement</label>
            <select className="input" value={form.statut_paiement} onChange={set('statut_paiement')}>
              {STATUTS_DB.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
