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

const INIT = { producteur_nom: '', zone: '', telephone: '', variete: '', quantite_kg: '', prix_kg: '', date_debut: '', date_fin: '', statut: 'Actif', note: '' }

export default function ContratsPaddy() {
  const [items, setItems]     = useState([])
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
    api.get('/api/contrats/paddy', { params })
      .then(r => setItems(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [filterStatut])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const openNew = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      producteur_nom: item.producteur_nom,
      zone:           item.zone || '',
      telephone:      item.telephone || '',
      variete:        item.variete || '',
      quantite_kg:    item.quantite_kg || '',
      prix_kg:        item.prix_kg || '',
      date_debut:     item.date_debut ? item.date_debut.slice(0,10) : '',
      date_fin:       item.date_fin   ? item.date_fin.slice(0,10)   : '',
      statut:         item.statut,
      note:           item.note || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        quantite_kg: Number(form.quantite_kg) || 0,
        prix_kg:     Number(form.prix_kg)     || 0,
        date_debut: form.date_debut || null,
        date_fin:   form.date_fin   || null,
      }
      if (editing) await api.put(`/api/contrats/paddy/${editing.id}`, payload)
      else         await api.post('/api/contrats/paddy', payload)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce contrat ?')) return
    try { await api.delete(`/api/contrats/paddy/${id}`); setItems(p => p.filter(i => i.id !== id)) }
    catch { setError('Erreur suppression') }
  }

  const totalPaddyActif = items.filter(i => i.statut === 'Actif').reduce((s, i) => s + Number(i.quantite_kg || 0), 0)
  const valeurTotale    = items.filter(i => i.statut === 'Actif').reduce((s, i) => s + Number(i.quantite_kg || 0) * Number(i.prix_kg || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Contrats paddy (amont)</h2>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouveau contrat</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Producteurs actifs</p>
          <p className="text-2xl font-bold text-[#1b75bc]">{items.filter(i => i.statut === 'Actif').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Paddy contractualisé</p>
          <p className="text-lg font-bold text-amber-700">{totalPaddyActif > 0 ? Number(totalPaddyActif).toLocaleString('fr-FR') + ' kg' : '-'}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
          <p className="text-lg font-bold text-blue-700">{valeurTotale > 0 ? Number(valeurTotale).toLocaleString('fr-FR') + ' F' : '-'}</p>
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
            <p className="text-sm mb-3">Aucun contrat paddy enregistré</p>
            <button onClick={openNew} className="btn-primary text-sm">+ Premier contrat</button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Producteur','Zone','Variété','Quantité (kg)','Prix/kg','Valeur','Début','Fin','Statut','Actions'].map(h => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map(item => {
                const valeur = Number(item.quantite_kg || 0) * Number(item.prix_kg || 0)
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.statut === 'Terminé' ? 'opacity-50' : ''}`}>
                    <td className="table-cell font-medium">{item.producteur_nom}</td>
                    <td className="table-cell text-sm text-gray-500">{item.zone || '-'}</td>
                    <td className="table-cell text-sm">{item.variete || '-'}</td>
                    <td className="table-cell text-right font-medium">{item.quantite_kg ? Number(item.quantite_kg).toLocaleString('fr-FR') : '-'}</td>
                    <td className="table-cell text-right">{fmt(item.prix_kg)}</td>
                    <td className="table-cell text-right font-semibold text-amber-700">{valeur > 0 ? Number(valeur).toLocaleString('fr-FR') + ' F' : '-'}</td>
                    <td className="table-cell whitespace-nowrap text-sm">{fmtDate(item.date_debut)}</td>
                    <td className="table-cell whitespace-nowrap text-sm">{fmtDate(item.date_fin)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColor(item.statut)}`}>{item.statut}</span>
                    </td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le contrat' : 'Nouveau contrat paddy'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom du producteur *</label>
            <input className="input" value={form.producteur_nom} onChange={set('producteur_nom')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone / Village</label>
              <input className="input" placeholder="Ex: Vallée du Fleuve" value={form.zone} onChange={set('zone')} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.telephone} onChange={set('telephone')} />
            </div>
          </div>
          <div>
            <label className="label">Variété de paddy</label>
            <input className="input" placeholder="Ex: Jasmine, Sahel 108..." value={form.variete} onChange={set('variete')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantité (kg)</label>
              <input type="number" min="0" className="input" value={form.quantite_kg} onChange={set('quantite_kg')} />
            </div>
            <div>
              <label className="label">Prix/kg (F)</label>
              <input type="number" min="0" className="input" value={form.prix_kg} onChange={set('prix_kg')} />
            </div>
          </div>
          {form.quantite_kg && form.prix_kg && (
            <div className="bg-amber-50 rounded-lg px-3 py-2 text-sm">
              Valeur du contrat : <strong className="text-amber-700">{Number(form.quantite_kg * form.prix_kg).toLocaleString('fr-FR')} F</strong>
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
