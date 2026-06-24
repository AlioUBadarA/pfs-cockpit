import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const TENDANCES = ['hausse', 'stable', 'déclin']
const fmt = (n) => n ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

const tendanceColor = (t) => ({
  hausse:  'bg-green-100 text-green-700',
  stable:  'bg-gray-100 text-gray-700',
  'déclin':'bg-red-100 text-red-700',
}[t] || 'bg-gray-100 text-gray-600')

const INIT = { ref: '', nom: '', prix_kg: '', cout_kg: '', tendance: 'stable' }

export default function Produits() {
  const { isVendeur } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(INIT)
  const [saving, setSaving]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/produits')
      .then(r => setItems(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const openNew = () => { setEditing(null); setForm(INIT); setError(''); setModalOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      ref: item.ref, nom: item.nom,
      prix_kg: item.prix_kg || '', cout_kg: item.cout_kg || '',
      tendance: item.tendance || 'stable',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form, prix_kg: Number(form.prix_kg) || 0, cout_kg: Number(form.cout_kg) || 0 }
      if (editing) await api.put(`/api/produits/${editing.id}`, payload)
      else         await api.post('/api/produits', payload)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return
    try { await api.delete(`/api/produits/${id}`); setItems(p => p.filter(i => i.id !== id)) }
    catch { setError('Erreur suppression') }
  }

  const margeMoyenne = items.length
    ? items.reduce((s, i) => s + (Number(i.prix_kg || 0) - Number(i.cout_kg || 0)), 0) / items.length
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Produits</h2>
          <p className="text-sm text-gray-500 mt-0.5">Catalogue de la gamme riz : prix, coût et tendance</p>
        </div>
        {!isVendeur && <button onClick={openNew} className="btn-primary text-sm">+ Ajouter un produit</button>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Produits au catalogue</p>
          <p className="text-2xl font-bold text-[#1b75bc]">{items.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">En hausse</p>
          <p className="text-2xl font-bold text-green-700">{items.filter(i => i.tendance === 'hausse').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Marge moyenne / kg</p>
          <p className="text-lg font-bold text-purple-700">{fmt(margeMoyenne)}</p>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-3">Aucun produit enregistré</p>
            {!isVendeur && <button onClick={openNew} className="btn-primary text-sm">+ Premier produit</button>}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Référence','Nom','Prix/kg','Coût/kg','Marge/kg','Tendance', ...(!isVendeur ? ['Actions'] : [])].map(h => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={!isVendeur ? 'hover:bg-gray-50 cursor-pointer' : ''} onClick={!isVendeur ? () => openEdit(item) : undefined}>
                  <td className="table-cell font-mono text-xs text-gray-500">{item.ref}</td>
                  <td className="table-cell font-medium">{item.nom}</td>
                  <td className="table-cell text-right">{fmt(item.prix_kg)}</td>
                  <td className="table-cell text-right">{fmt(item.cout_kg)}</td>
                  <td className="table-cell text-right font-semibold text-[#1b75bc]">{fmt(item.prix_kg - item.cout_kg)}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tendanceColor(item.tendance)}`}>
                      {item.tendance}
                    </span>
                  </td>
                  {!isVendeur && (
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(item) }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
                        <button onClick={(e) => { e.stopPropagation(); del(item.id) }} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Modifier : ${editing.nom}` : 'Nouveau produit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Référence *</label>
              <input className="input" placeholder="Ex: RIZ-25" value={form.ref} onChange={set('ref')} required />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" placeholder="Ex: Riz brisé 25%" value={form.nom} onChange={set('nom')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix de vente (F/kg)</label>
              <input type="number" min="0" className="input" value={form.prix_kg} onChange={set('prix_kg')} />
            </div>
            <div>
              <label className="label">Coût de revient (F/kg)</label>
              <input type="number" min="0" className="input" value={form.cout_kg} onChange={set('cout_kg')} />
            </div>
          </div>
          <div>
            <label className="label">Tendance</label>
            <select className="input" value={form.tendance} onChange={set('tendance')}>
              {TENDANCES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Ajouter')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
