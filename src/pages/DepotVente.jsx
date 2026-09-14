import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'

const STATUTS = ['En cours', 'Clôturé']
const STATUT_PAIEMENT_LABEL = { 'En cours': 'En cours', 'Paye': 'Payé' }
const TYPES_MOUVEMENT = [
  { value: 'vente',  label: 'Quantité vendue' },
  { value: 'retour', label: 'Quantité retournée (invendu)' },
]

const fmt = (n) => n ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtQ = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' kg' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const statutColor = (s) => ({
  'En cours':  'bg-blue-100 text-blue-700',
  'Clôturé':   'bg-gray-100 text-gray-500',
  'Paye':      'bg-green-100 text-green-700',
}[s] || 'bg-gray-100 text-gray-600')

const INIT = { client_nom: '', produit: '', quantite_deposee: '', prix_unitaire: '', date_depot: '', note: '' }
const MOUV_INIT = { type: 'vente', quantite: '', date: '', note: '' }

export default function DepotVente() {
  const [items, setItems]     = useState([])
  const [clients, setClients] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('')
  const [error, setError]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(INIT)
  const [saving, setSaving]       = useState(false)

  // Mouvements (rapports périodiques du distributeur) d'un dépôt
  const [movModal, setMovModal]       = useState(null) // le dépôt dont on affiche les mouvements
  const [movDetail, setMovDetail]     = useState(null)
  const [movLoading, setMovLoading]   = useState(false)
  const [movForm, setMovForm]         = useState(MOUV_INIT)
  const [movSaving, setMovSaving]     = useState(false)
  const [movError, setMovError]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/depots'),
      api.get('/api/clients'),
      api.get('/api/produits'),
    ])
      .then(([r1, r2, r3]) => { setItems(r1.data); setClients(r2.data); setProduits(r3.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const setProduit = (e) => {
    const nom = e.target.value
    const match = produits.find((p) => p.nom === nom)
    setForm((p) => ({ ...p, produit: nom, prix_unitaire: !p.prix_unitaire && match ? match.prix_kg : p.prix_unitaire }))
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...INIT, date_depot: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      client_nom:       item.client_nom,
      produit:          item.produit,
      quantite_deposee: item.quantite_deposee,
      prix_unitaire:    item.prix_unitaire,
      date_depot:       item.date_depot ? item.date_depot.slice(0, 10) : '',
      note:             item.note || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        quantite_deposee: Number(form.quantite_deposee) || 0,
        prix_unitaire:    Number(form.prix_unitaire) || 0,
      }
      if (editing) await api.put(`/api/depots/${editing.id}`, payload)
      else         await api.post('/api/depots', payload)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce dépôt ?')) return
    try { await api.delete(`/api/depots/${id}`); setItems((p) => p.filter((i) => i.id !== id)) }
    catch { setError('Erreur suppression') }
  }

  const openMouvements = (item) => {
    setMovModal(item)
    setMovForm({ ...MOUV_INIT, date: new Date().toISOString().slice(0, 10) })
    setMovError('')
    setMovLoading(true)
    api.get(`/api/depots/${item.id}`)
      .then((r) => setMovDetail(r.data))
      .catch(() => setMovError('Erreur de chargement des mouvements'))
      .finally(() => setMovLoading(false))
  }

  const setMov = (f) => (e) => setMovForm((p) => ({ ...p, [f]: e.target.value }))

  const submitMouvement = async (e) => {
    e.preventDefault(); setMovSaving(true); setMovError('')
    try {
      await api.post(`/api/depots/${movModal.id}/mouvements`, {
        type: movForm.type, quantite: Number(movForm.quantite), date: movForm.date, note: movForm.note || undefined,
      })
      const [detailR, listR] = await Promise.all([api.get(`/api/depots/${movModal.id}`), api.get('/api/depots')])
      setMovDetail(detailR.data)
      setItems(listR.data)
      setMovForm({ ...MOUV_INIT, date: new Date().toISOString().slice(0, 10) })
    } catch (err) {
      setMovError(err.response?.data?.error || 'Erreur lors de la déclaration')
    } finally { setMovSaving(false) }
  }

  const depotsEnCours = items.filter((i) => i.statut === 'En cours').length
  const montantDuTotal = items.reduce((s, i) => s + Number(i.montant_restant || 0), 0)

  const visibleItems = filterStatut ? items.filter((i) => i.statut === filterStatut) : items

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Dépôt-vente</h2>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouveau dépôt</button>
      </div>
      <p className="text-sm text-gray-500 -mt-3">
        Marchandise déposée chez un distributeur : il ne règle que ce qu'il a effectivement vendu, déclaré par rapports périodiques.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Dépôts en cours</p>
          <p className="text-2xl font-bold text-[#1b75bc]">{depotsEnCours}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total dépôts</p>
          <p className="text-2xl font-bold text-gray-700">{items.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Montant dû (ventes déclarées non réglées)</p>
          <p className="text-lg font-bold text-amber-700">{fmt(montantDuTotal)}</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="card flex items-center gap-3">
        <label className="text-sm text-gray-600">Statut</label>
        <select className="input w-auto" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous</option>
          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {filterStatut && <button className="text-xs text-gray-500 underline" onClick={() => setFilterStatut('')}>Réinitialiser</button>}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-3">{filterStatut ? 'Aucun dépôt pour ce statut' : 'Aucun dépôt enregistré'}</p>
            {!filterStatut && <button onClick={openNew} className="btn-primary text-sm">+ Premier dépôt</button>}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['N° dépôt', 'Client', 'Produit', 'Déposé', 'Vendu déclaré', 'Solde restant', 'Montant dû', 'Statut paiement', 'Statut dépôt', 'Vendeur', 'Actions'].map((h) => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.statut === 'Clôturé' ? 'opacity-60' : ''}`}>
                  <td className="table-cell font-mono text-xs text-gray-500">{item.numero || '-'}</td>
                  <td className="table-cell font-medium">{item.client_nom}</td>
                  <td className="table-cell text-sm">{item.produit}</td>
                  <td className="table-cell text-right">{fmtQ(item.quantite_deposee)}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => openMouvements(item)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      {fmtQ(item.quantite_vendue)}
                    </button>
                  </td>
                  <td className="table-cell text-right">{fmtQ(item.solde_restant)}</td>
                  <td className="table-cell text-right font-semibold">
                    {fmt(item.montant_du)}
                    {item.montant_restant > 0 && <div className="text-[10px] text-gray-400">reste {fmt(item.montant_restant)}</div>}
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColor(item.statut_paiement)}`}>{STATUT_PAIEMENT_LABEL[item.statut_paiement]}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColor(item.statut)}`}>{item.statut}</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{item.vendeur_nom || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openMouvements(item)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Rapports</button>
                      <button onClick={() => openEdit(item)} className="text-xs text-gray-600 hover:text-gray-800 font-medium">Éditer</button>
                      <button onClick={() => del(item.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nouveau/édition dépôt */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le dépôt' : 'Nouveau dépôt-vente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Distributeur / point de vente *</label>
            <input className="input" list="clients-list" value={form.client_nom} onChange={set('client_nom')} required />
            <datalist id="clients-list">
              {clients.map((c) => <option key={c.id} value={c.nom} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Produit *</label>
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
              <label className="label">Quantité déposée (kg) *</label>
              <input type="number" min="0.01" step="any" className="input" value={form.quantite_deposee} onChange={set('quantite_deposee')} required />
            </div>
            <div>
              <label className="label">Prix unitaire (F/kg) *</label>
              <input type="number" min="1" className="input" value={form.prix_unitaire} onChange={set('prix_unitaire')} required />
            </div>
          </div>
          <div>
            <label className="label">Date de dépôt *</label>
            <input type="date" className="input" value={form.date_depot} onChange={set('date_depot')} required />
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Le distributeur ne devra que les quantités qu'il déclarera avoir vendues (rapports périodiques, après création).
          </p>
          <div>
            <label className="label">Note</label>
            <textarea className="input" rows={2} value={form.note} onChange={set('note')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rapports périodiques (mouvements) d'un dépôt */}
      <Modal open={!!movModal} onClose={() => setMovModal(null)} title={`Rapports — ${movModal?.client_nom || ''}`} width="max-w-2xl">
        {movLoading ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : movDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="card text-center py-2">
                <p className="text-[10px] text-gray-500">Déposé</p>
                <p className="text-sm font-bold">{fmtQ(movDetail.quantite_deposee)}</p>
              </div>
              <div className="card text-center py-2">
                <p className="text-[10px] text-gray-500">Vendu déclaré</p>
                <p className="text-sm font-bold text-[#1b75bc]">{fmtQ(movDetail.quantite_vendue)}</p>
              </div>
              <div className="card text-center py-2">
                <p className="text-[10px] text-gray-500">Solde restant</p>
                <p className="text-sm font-bold">{fmtQ(movDetail.solde_restant)}</p>
              </div>
              <div className="card text-center py-2">
                <p className="text-[10px] text-gray-500">Reste à payer</p>
                <p className="text-sm font-bold text-amber-700">{fmt(movDetail.montant_restant)}</p>
              </div>
            </div>

            <form onSubmit={submitMouvement} className="card space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nouveau rapport</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={movForm.type} onChange={setMov('type')}>
                    {TYPES_MOUVEMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Quantité (kg)</label>
                  <input type="number" min="0.01" step="any" className="input" value={movForm.quantite} onChange={setMov('quantite')} required />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={movForm.date} onChange={setMov('date')} required />
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" value={movForm.note} onChange={setMov('note')} placeholder="Optionnel" />
              </div>
              {movError && <p className="text-sm text-red-600">{movError}</p>}
              <button type="submit" disabled={movSaving} className="btn-primary text-sm">
                {movSaving ? 'Enregistrement...' : '+ Enregistrer le rapport'}
              </button>
            </form>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Historique</p>
              {movDetail.mouvements?.length ? (
                <div className="overflow-x-auto -m-1">
                  <table className="w-full text-left border-collapse p-1">
                    <thead>
                      <tr>{['Date', 'Type', 'Quantité', 'Note'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {movDetail.mouvements.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="table-cell whitespace-nowrap text-sm">{fmtDate(m.date)}</td>
                          <td className="table-cell text-sm">{m.type === 'vente' ? 'Vendu' : 'Retourné'}</td>
                          <td className="table-cell text-right">{fmtQ(m.quantite)}</td>
                          <td className="table-cell text-xs text-gray-500">{m.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucun rapport enregistré.</p>
              )}
            </div>

            <p className="text-xs text-gray-400">Les paiements se font depuis la page Encaissements, en recherchant le dépôt par numéro ou nom du client.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
