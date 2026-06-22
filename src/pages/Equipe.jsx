import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import DataTable from '../components/DataTable'
import KpiCard from '../components/KpiCard'

const fmt     = (n) => Number(n).toLocaleString('fr-FR') + ' F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const INIT = { nom: '', email: '', telephone: '' }

export default function Equipe() {
  const [vendeurs, setVendeurs] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [pwdModal, setPwdModal]   = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm]           = useState(INIT)
  const [newPwd, setNewPwd]       = useState('')
  const [saving, setSaving]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/equipe')
      .then(r => setVendeurs(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

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

  const rows = vendeurs.map(v => [
    { v: v.nom, sub: v.email },
    v.telephone || '-',
    v.nb_ventes,
    { v: fmt(v.ca_total), c: '#1b75bc', bold: true },
    fmtDate(v.derniere_vente),
    { v: v.suspended ? 'Suspendu' : 'Actif', c: v.suspended ? '#CC0000' : '#1b75bc' },
    {
      v: (
        <div className="flex gap-2 whitespace-nowrap">
          <button onClick={() => openEdit(v)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
          <button onClick={() => { setPwdModal(v); setNewPwd('') }} className="text-xs text-yellow-700 hover:text-yellow-900 font-medium">MDP</button>
          <button onClick={() => deleteVendeur(v.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
        </div>
      ),
    },
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Commerciaux</h2>
          <p className="text-sm text-gray-500 mt-0.5">Performance de l'équipe de vente</p>
        </div>
        <span className="text-xs text-gray-400 italic">Les comptes sont créés par l'administrateur</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Membres" value={vendeurs.length} color="#1b75bc" />
        <KpiCard title="CA équipe total" value={fmt(totalCA)} color="#1565C0" />
        <KpiCard title="Ventes équipe" value={vendeurs.reduce((s, v) => s + Number(v.nb_ventes || 0), 0)} color="#62bb46" />
      </div>

      <Panel title="Vendeurs" sub={vendeurs.length + ' membre(s)'}>
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendeurs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Aucun vendeur dans votre équipe pour le moment.</p>
            <p className="text-gray-300 text-xs mt-1">Contactez l'administrateur pour créer des comptes.</p>
          </div>
        ) : (
          <DataTable
            headers={['Nom', 'Téléphone', 'Ventes', 'CA total', 'Dernière vente', 'Statut', 'Actions']}
            rows={rows}
            align={['left', 'left', 'right', 'right', 'left', 'left', 'left']}
          />
        )}
      </Panel>

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
      <Modal open={!!pwdModal} onClose={() => setPwdModal(null)} title={`Mot de passe : ${pwdModal?.nom}`}>
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
