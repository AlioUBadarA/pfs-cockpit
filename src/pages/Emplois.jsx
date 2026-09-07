import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import RoleBadge from '../components/RoleBadge'
import { useAuth } from '../context/AuthContext'

const TYPES = ['CDI','CDD','Temps partiel','Stage','Journalier']
const SEXES = ['Homme','Femme']
const PIECES_IDENTITE = ['CNI','Passeport','Permis de conduire','Autre']
const ROLES_AFFECTABLES = [
  { value: 'vendeur', label: 'Commercial (vendeur)' },
  { value: 'manager', label: 'Manager' },
  { value: 'directeur', label: 'Directeur' },
  { value: 'comptable', label: 'Comptable' },
]

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const fmtSalaire = (n) => n ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

const typeColor = (t) => ({
  'CDI':          'bg-green-100 text-green-700',
  'CDD':          'bg-blue-100 text-blue-700',
  'Temps partiel':'bg-purple-100 text-purple-700',
  'Stage':        'bg-yellow-100 text-yellow-700',
  'Journalier':   'bg-gray-100 text-gray-700',
}[t] || 'bg-gray-100 text-gray-600')

const PERIODES = ['Avec RIZAO', 'Avant RIZAO']
const periodeColor = (p) => p === 'Avant RIZAO'
  ? 'bg-gray-100 text-gray-600'
  : 'bg-green-100 text-green-700'

const INIT = {
  nom: '', poste: '', type_contrat: 'CDI', date_embauche: '', salaire: '', telephone: '', note: '', periode_rizao: 'Avec RIZAO',
  date_naissance: '', lieu_naissance: '', sexe: '', nationalite: '', piece_identite_type: '', piece_identite_numero: '', adresse: '',
}
const AFFECT_INIT = { role_plateforme: 'vendeur', email: '', password: '', objectif_annuel: '' }

export default function Emplois() {
  const { user } = useAuth()
  // Reflète exactement peutCreerRole() côté backend (utils/comptes.js) pour ne pas proposer
  // un rôle que l'affectation rejetterait ensuite.
  const rolesAutorises = {
    superadmin: ['directeur', 'manager', 'vendeur', 'comptable'],
    rizier:     ['directeur', 'manager', 'vendeur', 'comptable'],
    directeur:  ['manager', 'vendeur'],
    manager:    ['vendeur'],
  }[user?.role] || []

  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(INIT)
  const [saving, setSaving]       = useState(false)

  const [affectTarget, setAffectTarget] = useState(null)
  const [affectForm, setAffectForm]     = useState(AFFECT_INIT)
  const [affectError, setAffectError]   = useState('')
  const [affecting, setAffecting]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/emplois')
      .then(r => setItems(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const openNew = () => { setEditing(null); setForm(INIT); setModalOpen(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      nom:           item.nom,
      poste:         item.poste || '',
      type_contrat:  item.type_contrat || 'CDI',
      date_embauche: item.date_embauche ? item.date_embauche.slice(0,10) : '',
      salaire:       item.salaire || '',
      telephone:     item.telephone || '',
      note:          item.note || '',
      periode_rizao: item.periode_rizao || 'Avec RIZAO',
      date_naissance:        item.date_naissance ? item.date_naissance.slice(0,10) : '',
      lieu_naissance:        item.lieu_naissance || '',
      sexe:                  item.sexe || '',
      nationalite:           item.nationalite || '',
      piece_identite_type:   item.piece_identite_type || '',
      piece_identite_numero: item.piece_identite_numero || '',
      adresse:               item.adresse || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form, salaire: form.salaire ? Number(form.salaire) : null, date_embauche: form.date_embauche || null }
      if (editing) await api.put(`/api/emplois/${editing.id}`, payload)
      else         await api.post('/api/emplois', payload)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return
    try { await api.delete(`/api/emplois/${id}`); setItems(p => p.filter(i => i.id !== id)) }
    catch { setError('Erreur suppression') }
  }

  const openAffect = (item) => {
    setAffectTarget(item)
    setAffectForm({ ...AFFECT_INIT, email: '', password: '' })
    setAffectError('')
  }

  const setA = (f) => (e) => setAffectForm(p => ({ ...p, [f]: e.target.value }))

  const handleAffect = async (e) => {
    e.preventDefault()
    setAffecting(true); setAffectError('')
    try {
      await api.patch(`/api/emplois/${affectTarget.id}/affecter`, {
        role_plateforme: affectForm.role_plateforme,
        email: affectForm.email,
        password: affectForm.password,
        objectif_annuel: affectForm.objectif_annuel ? Number(affectForm.objectif_annuel) : undefined,
      })
      setAffectTarget(null); load()
    } catch (err) {
      setAffectError(err.response?.data?.error || 'Erreur lors de l\'affectation')
    } finally { setAffecting(false) }
  }

  const stats = TYPES.reduce((acc, t) => { acc[t] = items.filter(i => i.type_contrat === t).length; return acc }, {})
  const masseSalariale = items.reduce((s, i) => s + Number(i.salaire || 0), 0)
  const rolesDisponibles = ROLES_AFFECTABLES.filter(r => rolesAutorises.includes(r.value))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">RH</h2>
          <p className="text-sm text-gray-500 mt-0.5">Personnes, emplois et comptes de la rizerie</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">+ Ajouter un employé</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total employés</p>
          <p className="text-2xl font-bold text-[#1b75bc]">{items.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">CDI / CDD</p>
          <p className="text-2xl font-bold text-blue-700">{(stats['CDI'] || 0) + (stats['CDD'] || 0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Journaliers</p>
          <p className="text-2xl font-bold text-gray-700">{stats['Journalier'] || 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Masse salariale / mois</p>
          <p className="text-lg font-bold text-purple-700">{masseSalariale > 0 ? Number(masseSalariale).toLocaleString('fr-FR') + ' F' : '-'}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm mb-3">Aucun employé enregistré</p>
            <button onClick={openNew} className="btn-primary text-sm">+ Premier employé</button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Nom','Poste','Contrat','Période RIZAO','Embauche','Salaire/mois','Compte','Actions'].map(h => (
                <th key={h} className="table-header whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{item.nom}</td>
                  <td className="table-cell text-sm text-gray-600">{item.poste || '-'}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor(item.type_contrat)}`}>
                      {item.type_contrat}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${periodeColor(item.periode_rizao)}`}>
                      {item.periode_rizao || 'Avec RIZAO'}
                    </span>
                  </td>
                  <td className="table-cell whitespace-nowrap text-sm">{fmtDate(item.date_embauche)}</td>
                  <td className="table-cell text-right font-medium">{fmtSalaire(item.salaire)}</td>
                  <td className="table-cell">
                    {item.user_account_id ? (
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={item.role_plateforme} />
                        {item.compte_suspendu && <span className="text-[10px] text-red-500 font-semibold">Suspendu</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sans compte</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2 flex-wrap">
                      {!item.user_account_id && (
                        <button onClick={() => openAffect(item)} className="text-xs text-[#1b75bc] hover:text-[#155a8f] font-medium">Affecter</button>
                      )}
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
                      <button onClick={() => del(item.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créer/éditer employé */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Modifier : ${editing.nom}` : 'Nouvel employé'} width="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom complet *</label>
            <input className="input" value={form.nom} onChange={set('nom')} required />
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">État civil</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date de naissance</label>
                <input type="date" className="input" value={form.date_naissance} onChange={set('date_naissance')} />
              </div>
              <div>
                <label className="label">Lieu de naissance</label>
                <input className="input" value={form.lieu_naissance} onChange={set('lieu_naissance')} />
              </div>
              <div>
                <label className="label">Sexe</label>
                <select className="input" value={form.sexe} onChange={set('sexe')}>
                  <option value="">—</option>
                  {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nationalité</label>
                <input className="input" value={form.nationalite} onChange={set('nationalite')} />
              </div>
              <div>
                <label className="label">Type de pièce d'identité</label>
                <select className="input" value={form.piece_identite_type} onChange={set('piece_identite_type')}>
                  <option value="">—</option>
                  {PIECES_IDENTITE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">N° de pièce d'identité</label>
                <input className="input" value={form.piece_identite_numero} onChange={set('piece_identite_numero')} />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Adresse</label>
              <input className="input" value={form.adresse} onChange={set('adresse')} />
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Emploi</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Poste</label>
                <input className="input" placeholder="Ex: Responsable ventes" value={form.poste} onChange={set('poste')} />
              </div>
              <div>
                <label className="label">Type de contrat</label>
                <select className="input" value={form.type_contrat} onChange={set('type_contrat')}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date d'embauche</label>
                <input type="date" className="input" value={form.date_embauche} onChange={set('date_embauche')} />
              </div>
              <div>
                <label className="label">Salaire mensuel (F)</label>
                <input type="number" min="0" className="input" value={form.salaire} onChange={set('salaire')} />
              </div>
              <div>
                <label className="label">Période RIZAO</label>
                <select className="input" value={form.periode_rizao} onChange={set('periode_rizao')}>
                  <option value="Avec RIZAO">Avec le programme RIZAO</option>
                  <option value="Avant RIZAO">Avant RIZAO</option>
                </select>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={form.telephone} onChange={set('telephone')} />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Note</label>
              <textarea className="input" rows={2} value={form.note} onChange={set('note')} />
            </div>
          </div>

          {!editing && (
            <p className="text-xs text-gray-400">
              L'accès à l'application (compte, rôle, objectifs) se définit après la création, via "Affecter".
            </p>
          )}
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

      {/* Modal affecter un rôle / compte */}
      <Modal open={!!affectTarget} onClose={() => setAffectTarget(null)} title={`Affecter ${affectTarget?.nom || ''}`}>
        <form onSubmit={handleAffect} className="space-y-4">
          <div>
            <label className="label">Rôle *</label>
            <select className="input" value={affectForm.role_plateforme} onChange={setA('role_plateforme')}>
              {rolesDisponibles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {affectForm.role_plateforme === 'comptable' && (
              <p className="text-xs text-gray-400 mt-1">Le comptable valide les encaissements déclarés par les commerciaux, pour toute la rizerie.</p>
            )}
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={affectForm.email} onChange={setA('email')} required />
          </div>
          <div>
            <label className="label">Mot de passe provisoire *</label>
            <input type="text" className="input" value={affectForm.password} onChange={setA('password')} required minLength={12} placeholder="Min. 12 caractères" />
          </div>
          {['vendeur', 'manager', 'directeur'].includes(affectForm.role_plateforme) && (
            <div>
              <label className="label">Objectif annuel (F, optionnel)</label>
              <input type="number" min="0" className="input" value={affectForm.objectif_annuel} onChange={setA('objectif_annuel')} placeholder="Réparti également sur les 12 mois" />
              <p className="text-xs text-gray-400 mt-1">Ajustable ensuite mois par mois depuis la page Prévisions.</p>
            </div>
          )}
          {affectError && <p className="text-sm text-red-600">{affectError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setAffectTarget(null)}>Annuler</button>
            <button type="submit" disabled={affecting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {affecting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {affecting ? 'Affectation...' : 'Affecter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
