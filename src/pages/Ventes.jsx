import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import StatutBadge from '../components/StatutBadge'

const STATUTS = ['En cours', 'Payé', 'En retard']

const VENTE_INIT = {
  client_nom: '', produit: '', quantite: '', montant: '', statut: 'En cours', date_vente: '',
}

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function Ventes() {
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMois, setFilterMois] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(VENTE_INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filterMois) params.mois = filterMois
    if (filterStatut) params.statut = filterStatut
    api.get('/api/ventes', { params })
      .then((r) => setVentes(r.data?.ventes || r.data || []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [filterMois, filterStatut])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ ...VENTE_INIT, date_vente: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/ventes', {
        ...form,
        quantite: Number(form.quantite),
        montant: Number(form.montant),
      })
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const changeStatut = async (id, statut) => {
    try {
      await api.patch(`/api/ventes/${id}/statut`, { statut })
      setVentes((prev) => prev.map((v) => (v.id === id ? { ...v, statut } : v)))
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

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Ventes</h2>
        <button onClick={openNew} className="btn-primary text-sm">
          + Nouvelle vente
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className="card flex flex-wrap items-center gap-3">
        <div>
          <label className="label mb-0 inline mr-2">Mois</label>
          <input
            type="month"
            className="input w-auto"
            value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)}
          />
        </div>
        <div>
          <label className="label mb-0 inline mr-2">Statut</label>
          <select className="input w-auto" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {(filterMois || filterStatut) && (
          <button
            className="text-xs text-gray-500 underline"
            onClick={() => { setFilterMois(''); setFilterStatut('') }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ventes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune vente trouvée</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Date', 'Client', 'Produit', 'Qté (kg)', 'Montant', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventes.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                  <td className="table-cell font-medium">{v.client_nom}</td>
                  <td className="table-cell">{v.produit}</td>
                  <td className="table-cell text-right">{Number(v.quantite).toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-right font-medium">{fmt(v.montant)}</td>
                  <td className="table-cell">
                    <select
                      value={v.statut}
                      onChange={(e) => changeStatut(v.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      {STATUTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => deleteVente(v.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Supprimer
                    </button>
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
            <input className="input" placeholder="Ex: Riz brisé 25%..." value={form.produit} onChange={set('produit')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantité (kg)</label>
              <input type="number" min="0" step="any" className="input" value={form.quantite} onChange={set('quantite')} required />
            </div>
            <div>
              <label className="label">Montant (FCFA)</label>
              <input type="number" min="0" className="input" value={form.montant} onChange={set('montant')} required />
            </div>
          </div>
          <div>
            <label className="label">Statut paiement</label>
            <select className="input" value={form.statut} onChange={set('statut')}>
              {STATUTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
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
