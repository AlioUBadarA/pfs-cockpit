import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'

const STATUTS = ['Actif','Suspendu','Terminé']
const fmt = (n) => n ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const statutColor = (s) => ({
  'Actif':   'bg-green-100 text-green-700',
  'Suspendu':'bg-yellow-100 text-yellow-700',
  'Terminé': 'bg-gray-100 text-gray-500',
}[s] || 'bg-gray-100 text-gray-600')

const INIT = { client_nom: '', produits: [], quantite_mensuelle: '', prix_unitaire: '', date_debut: '', date_fin: '', statut: 'Actif', note: '' }

export default function ContratsClients() {
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

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filterStatut) params.statut = filterStatut
    Promise.all([
      api.get('/api/contrats/clients', { params }),
      api.get('/api/clients'),
      api.get('/api/produits'),
    ])
      .then(([r1, r2, r3]) => { setItems(r1.data); setClients(r2.data); setProduits(r3.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [filterStatut])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const toggleProduit = (nom) => {
    setForm((p) => {
      const next = p.produits.includes(nom)
        ? p.produits.filter((n) => n !== nom)
        : [...p.produits, nom]
      // auto-remplir le prix avec le premier produit sélectionné
      const match = produits.find((pr) => pr.nom === next[0])
      return { ...p, produits: next, prix_unitaire: !p.prix_unitaire && match ? match.prix_kg : p.prix_unitaire }
    })
  }

  const openNew = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      client_nom:         item.client_nom,
      produits:           Array.isArray(item.produits) && item.produits.length ? item.produits : (item.produit ? [item.produit] : []),
      quantite_mensuelle: item.quantite_mensuelle || '',
      prix_unitaire:      item.prix_unitaire || '',
      date_debut:         item.date_debut ? item.date_debut.slice(0,10) : '',
      date_fin:           item.date_fin ? item.date_fin.slice(0,10) : '',
      statut:             item.statut,
      note:               item.note || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        produits:           form.produits,
        quantite_mensuelle: Number(form.quantite_mensuelle) || 0,
        prix_unitaire:      Number(form.prix_unitaire) || 0,
        date_debut: form.date_debut || null,
        date_fin:   form.date_fin   || null,
      }
      if (editing) await api.put(`/api/contrats/clients/${editing.id}`, payload)
      else         await api.post('/api/contrats/clients', payload)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce contrat ?')) return
    try { await api.delete(`/api/contrats/clients/${id}`); setItems(p => p.filter(i => i.id !== id)) }
    catch { setError('Erreur suppression') }
  }

  const caAnnuelTotal = items.filter(i => i.statut === 'Actif')
    .reduce((s, i) => s + Number(i.quantite_mensuelle || 0) * Number(i.prix_unitaire || 0) * 12, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Contrats clients</h2>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouveau contrat</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Contrats actifs</p>
          <p className="text-2xl font-bold text-[#1b75bc]">{items.filter(i => i.statut === 'Actif').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total contrats</p>
          <p className="text-2xl font-bold text-gray-700">{items.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">CA annuel contractualisé</p>
          <p className="text-lg font-bold text-blue-700">{caAnnuelTotal > 0 ? Number(caAnnuelTotal).toLocaleString('fr-FR') + ' F' : '-'}</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="card flex items-center gap-3">
        <label className="text-sm text-gray-600">Statut</label>
        <select className="input w-auto" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous</option>
          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {filterStatut && <button className="text-xs text-gray-500 underline" onClick={() => setFilterStatut('')}>Réinitialiser</button>}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-3">Aucun contrat enregistré</p>
            <button onClick={openNew} className="btn-primary text-sm">+ Premier contrat</button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['N° contrat','Client','Produit','Qté/mois','Prix unit.','CA mensuel','Début','Fin','Statut','Vendeur','Actions'].map(h => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map(item => {
                const caMensuel = Number(item.quantite_mensuelle || 0) * Number(item.prix_unitaire || 0)
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.statut === 'Terminé' ? 'opacity-50' : ''}`}>
                    <td className="table-cell font-mono text-xs text-gray-500">{item.numero || '-'}</td>
                    <td className="table-cell font-medium">{item.client_nom}</td>
                    <td className="table-cell text-sm">
                      {(Array.isArray(item.produits) && item.produits.length ? item.produits : (item.produit ? [item.produit] : [])).join(', ') || '-'}
                    </td>
                    <td className="table-cell text-right">{item.quantite_mensuelle ? Number(item.quantite_mensuelle).toLocaleString('fr-FR') + ' kg' : '-'}</td>
                    <td className="table-cell text-right">{fmt(item.prix_unitaire)}</td>
                    <td className="table-cell text-right font-semibold text-[#1b75bc]">{caMensuel > 0 ? Number(caMensuel).toLocaleString('fr-FR') + ' F' : '-'}</td>
                    <td className="table-cell whitespace-nowrap text-sm">{fmtDate(item.date_debut)}</td>
                    <td className="table-cell whitespace-nowrap text-sm">{fmtDate(item.date_fin)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColor(item.statut)}`}>{item.statut}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{item.vendeur_nom || '-'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
                        <button onClick={() => del(item.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le contrat' : 'Nouveau contrat client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom du client *</label>
            <input className="input" list="clients-list" value={form.client_nom} onChange={set('client_nom')} required />
            <datalist id="clients-list">
              {clients.map(c => <option key={c.id} value={c.nom} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Produits du contrat *</label>
            {produits.length === 0 ? (
              <p className="text-xs text-amber-600">Aucun produit au catalogue — demandez à votre manager d'en ajouter.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {produits.map((p) => {
                  const sel = form.produits.includes(p.nom)
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProduit(p.nom)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        sel
                          ? 'bg-[#1b75bc] text-white border-[#1b75bc]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#1b75bc]'
                      }`}
                    >
                      {p.nom}{p.prix_kg ? ` — ${Number(p.prix_kg).toLocaleString('fr-FR')} F/kg` : ''}
                    </button>
                  )
                })}
              </div>
            )}
            {form.produits.length === 0 && <p className="text-xs text-red-500 mt-1">Sélectionnez au moins un produit</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantité mensuelle (kg)</label>
              <input type="number" min="0" className="input" value={form.quantite_mensuelle} onChange={set('quantite_mensuelle')} />
            </div>
            <div>
              <label className="label">Prix unitaire (F/kg)</label>
              <input type="number" min="0" className="input" value={form.prix_unitaire} onChange={set('prix_unitaire')} />
            </div>
          </div>
          {form.quantite_mensuelle && form.prix_unitaire && (
            <div className="bg-green-50 rounded-lg px-3 py-2 text-sm">
              CA mensuel estimé : <strong className="text-[#1b75bc]">{Number(form.quantite_mensuelle * form.prix_unitaire).toLocaleString('fr-FR')} F</strong>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date début</label>
              <input type="date" className="input" value={form.date_debut} onChange={set('date_debut')} />
            </div>
            <div>
              <label className="label">Date fin</label>
              <input type="date" className="input" value={form.date_fin} onChange={set('date_fin')} />
            </div>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.statut} onChange={set('statut')}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
    </div>
  )
}
