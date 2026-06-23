import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import DataTable from '../components/DataTable'
import KpiCard from '../components/KpiCard'
import { useAuth } from '../context/AuthContext'

const fmt     = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const EDIT_INIT   = { nom: '', email: '', telephone: '' }
const CREATE_INIT = { nom: '', email: '', password: '', telephone: '', role: 'vendeur', zone: '', manager_id: '' }

function TauxBadge({ taux }) {
  const color = taux >= 100 ? '#1B5E20' : taux >= 80 ? '#F9A825' : '#CC0000'
  return (
    <div className="flex items-center gap-2">
      <div className="bar-row-track flex-1 min-w-[50px]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, taux)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums min-w-[38px] text-right" style={{ color }}>{Math.round(taux)}%</span>
    </div>
  )
}

export default function Equipe() {
  const { isManager } = useAuth()
  const [vendeurs, setVendeurs] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [pwdModal, setPwdModal]   = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]           = useState(EDIT_INIT)
  const [cForm, setCForm]         = useState(CREATE_INIT)
  const [newPwd, setNewPwd]       = useState('')
  const [saving, setSaving]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/equipe'),
      isManager ? Promise.resolve({ data: [] }) : api.get('/api/managers').catch(() => ({ data: [] })),
    ])
      .then(([eq, mg]) => { setVendeurs(eq.data); setManagers(mg.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [isManager])

  useEffect(() => { load() }, [load])

  const set  = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))
  const setC = (f) => (e) => setCForm((prev) => ({ ...prev, [f]: e.target.value }))

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/equipe/${editModal.id}`, { nom: form.nom, email: form.email, telephone: form.telephone })
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

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/equipe', cForm)
      setCreateOpen(false)
      setCForm(CREATE_INIT)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (v) => {
    setForm({ nom: v.nom, email: v.email, telephone: v.telephone || '' })
    setError('')
    setEditModal(v)
  }

  const deleteVendeur = async (id) => {
    if (!confirm('Supprimer ce commercial ? Ses données (ventes, clients) seront conservées.')) return
    try {
      await api.delete(`/api/equipe/${id}`)
      setVendeurs((prev) => prev.filter((v) => v.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  const objAnnuelGroupe = vendeurs.reduce((s, v) => s + Number(v.objectif_annuel || 0), 0)
  const caYTDGroupe = vendeurs.reduce((s, v) => s + Number(v.ca_total || 0), 0)
  const tauxAtteinteGroupe = objAnnuelGroupe > 0 ? caYTDGroupe / (objAnnuelGroupe / 12 * (new Date().getMonth() + 1)) * 100 : 0
  const forecastGroupe = vendeurs.reduce((s, v) => s + Number(v.forecast || 0), 0)

  const rows = vendeurs.map((v) => [
    { v: v.nom, sub: [v.manager_nom, v.email].filter(Boolean).join(' · ') },
    fmt(v.objectif_mensuel),
    fmt(v.objectif_annuel),
    { v: fmt(v.ca_total), bold: true },
    { v: (v.ecart >= 0 ? '+' : '') + fmt(v.ecart), c: v.ecart >= 0 ? '#1B5E20' : '#CC0000' },
    { v: <TauxBadge taux={v.taux_atteinte} /> },
    fmt(v.forecast),
    { v: fmt(v.marge), sub: v.ca_total ? `${Math.round(v.marge / v.ca_total * 100)} %` : '' },
    { v: `${v.nb_clients} cli.`, sub: `${v.nb_ventes} cmd` },
    { v: fmt(v.creances), c: v.creances > 0 ? '#CC0000' : '#8a7f6e' },
    {
      v: (
        <div className="flex gap-2 whitespace-nowrap">
          <button onClick={() => openEdit(v)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
          <button onClick={() => { setPwdModal(v); setNewPwd(''); setError('') }} className="text-xs text-yellow-700 hover:text-yellow-900 font-medium">MDP</button>
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
          <p className="text-sm text-gray-500 mt-0.5">Objectif · réalisé · écart · forecast · marge · créances</p>
        </div>
        <button onClick={() => { setCForm(CREATE_INIT); setError(''); setCreateOpen(true) }} className="btn-primary text-sm">
          + Créer un commercial
        </button>
      </div>

      {error && !editModal && !pwdModal && !createOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Équipe commerciale" value={vendeurs.length} sub={`${managers.length} manager(s)`} color="#1b75bc" />
        <KpiCard title="Objectif groupe" value={fmt(objAnnuelGroupe)} sub="annuel cumulé" />
        <KpiCard title="Réalisé YTD" value={fmt(caYTDGroupe)} sub={`${Math.round(tauxAtteinteGroupe)} % d'atteinte`} color={tauxAtteinteGroupe >= 100 ? '#1B5E20' : '#F9A825'} />
        <KpiCard title="Projection groupe" value={fmt(forecastGroupe)} sub="projection fin d'année" />
      </div>

      <Panel title="Performance individuelle" sub="objectif · réalisé · écart · forecast · marge · créances">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendeurs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Aucun commercial dans votre équipe pour le moment.</p>
          </div>
        ) : (
          <DataTable
            headers={['Commercial', 'Obj./mois', 'Obj./an', 'Réalisé YTD', 'Écart', 'Atteinte', 'Projection', 'Marge nette', 'Activité', 'Créances', 'Actions']}
            rows={rows}
            align={['left', 'right', 'right', 'right', 'right', 'left', 'right', 'right', 'left', 'right', 'left']}
          />
        )}
      </Panel>

      {/* Modal créer commercial/manager */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un commercial">
        <form onSubmit={handleCreate} className="space-y-4">
          {!isManager && (
            <div>
              <label className="label">Rôle</label>
              <select className="input" value={cForm.role} onChange={setC('role')}>
                <option value="vendeur">Commercial (vendeur)</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}
          {cForm.role === 'manager' && (
            <div>
              <label className="label">Zone</label>
              <input className="input" value={cForm.zone} onChange={setC('zone')} placeholder="Ex: Dakar Nord" />
            </div>
          )}
          {cForm.role === 'vendeur' && !isManager && managers.length > 0 && (
            <div>
              <label className="label">Rattacher à un manager (optionnel)</label>
              <select className="input" value={cForm.manager_id} onChange={setC('manager_id')}>
                <option value="">Aucun (rattaché directement à moi)</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.nom} ({m.zone || 'zone n/a'})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Nom complet *</label>
            <input className="input" value={cForm.nom} onChange={setC('nom')} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={cForm.email} onChange={setC('email')} required />
          </div>
          <div>
            <label className="label">Mot de passe provisoire *</label>
            <input type="text" className="input" value={cForm.password} onChange={setC('password')} required minLength={6} placeholder="Min. 6 caractères" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={cForm.telephone} onChange={setC('telephone')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setCreateOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal éditer commercial */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Modifier le commercial">
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
            <input type="password" className="input" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} />
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
