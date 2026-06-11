import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'

const fmt     = (n) => Number(n).toLocaleString('fr-FR') + ' F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const INIT = { nom: '', email: '', password: '', telephone: '' }

export default function Equipe() {
  const [vendeurs, setVendeurs] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [pwdModal, setPwdModal]       = useState(null)
  const [editModal, setEditModal]     = useState(null)
  const [form, setForm]               = useState(INIT)
  const [newPwd, setNewPwd]           = useState('')
  const [saving, setSaving]           = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/equipe')
      .then(r => setVendeurs(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/equipe', form)
      setModalOpen(false)
      setForm(INIT)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/equipe/${editModal.id}`, {
        nom: form.nom, email: form.email, telephone: form.telephone,
      })
      setEditModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handlePwd = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.patch(`/api/equipe/${pwdModal.id}/password`, { new_password: newPwd })
      setPwdModal(null)
      setNewPwd('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (v) => {
    setForm({ nom: v.nom, email: v.email, telephone: v.telephone || '', password: '' })
    setEditModal(v)
  }

  const deleteVendeur = async (id) => {
    if (!confirm('Supprimer ce vendeur ? Ses données (ventes, clients) seront conservées.')) return
    try {
      await api.delete(`/api/equipe/${id}`)
      setVendeurs(prev => prev.filter(v => v.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  const totalCA = vendeurs.reduce((s, v) => s + Number(v.ca_total || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Équipe de vente</h2>
        <button onClick={() => { setForm(INIT); setModalOpen(true) }} className="btn-primary text-sm">
          + Ajouter un vendeur
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs équipe */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Membres</p>
          <p className="text-2xl font-bold text-[#1B5E20]">{vendeurs.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">CA équipe total</p>
          <p className="text-lg font-bold text-blue-700">{fmt(totalCA)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Ventes équipe</p>
          <p className="text-2xl font-bold text-gray-700">{vendeurs.reduce((s, v) => s + Number(v.nb_ventes || 0), 0)}</p>
        </div>
      </div>

      {/* Liste vendeurs */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendeurs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm mb-3">Aucun vendeur dans votre équipe</p>
            <button onClick={() => { setForm(INIT); setModalOpen(true) }} className="btn-primary text-sm">
              + Ajouter le premier vendeur
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Nom','Email','Téléphone','Ventes','CA total','Dernière vente','Statut','Actions'].map(h => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {vendeurs.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{v.nom}</td>
                  <td className="table-cell text-sm text-gray-600">{v.email}</td>
                  <td className="table-cell text-sm">{v.telephone || '—'}</td>
                  <td className="table-cell text-center font-medium">{v.nb_ventes}</td>
                  <td className="table-cell text-right font-semibold text-[#1B5E20]">{fmt(v.ca_total)}</td>
                  <td className="table-cell whitespace-nowrap text-sm">{fmtDate(v.derniere_vente)}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {v.suspended ? 'Suspendu' : 'Actif'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2 whitespace-nowrap">
                      <button onClick={() => openEdit(v)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
                      <button onClick={() => { setPwdModal(v); setNewPwd('') }} className="text-xs text-yellow-700 hover:text-yellow-900 font-medium">MDP</button>
                      <button onClick={() => deleteVendeur(v.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créer vendeur */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau vendeur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nom complet *</label>
            <input className="input" value={form.nom} onChange={set('nom')} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.telephone} onChange={set('telephone')} />
          </div>
          <div>
            <label className="label">Mot de passe * (min. 6 caractères)</label>
            <input type="password" className="input" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <p className="text-xs text-gray-500">Le vendeur pourra se connecter avec cet email et ce mot de passe.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal éditer vendeur */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Modifier le vendeur">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" value={form.nom} onChange={set('nom')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.telephone} onChange={set('telephone')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setEditModal(null)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Mise à jour...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal reset mot de passe */}
      <Modal open={!!pwdModal} onClose={() => setPwdModal(null)} title={`Mot de passe — ${pwdModal?.nom}`}>
        <form onSubmit={handlePwd} className="space-y-4">
          <div>
            <label className="label">Nouveau mot de passe *</label>
            <input type="password" className="input" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setPwdModal(null)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? '...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
