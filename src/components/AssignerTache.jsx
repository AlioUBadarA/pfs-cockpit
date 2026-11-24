import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from './Modal'
import ClientPicker from './ClientPicker'

// Actions possibles d'une tâche. Même liste que l'API (routes/taches.js).
export const TYPES_TACHE = ['Visite', 'Appel', 'Vente', 'Recouvrement', 'Prospection', 'Relance', 'Livraison', 'Démonstration', 'Négociation', 'Alerte', 'Autre']

export const dateDecalee = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Fenêtre de création d'une tâche.
// - mode « planning » : le commercial planifie pour lui, au plus tard la veille.
// - mode « assignation » : un responsable assigne à un membre de son équipe.
// `initial` pré-remplit le formulaire (par exemple depuis une alerte).
export default function AssignerTache({ open, onClose, onCree, mode = 'assignation', initial = null }) {
  const assigner = mode === 'assignation'
  const vide = { user_id: '', date_prevue: assigner ? dateDecalee(0) : dateDecalee(1), type: 'Visite', cible: null, consigne: '', vente_id: null, alerte_key: null }
  const [form, setForm] = useState(vide)
  const [equipe, setEquipe] = useState([])
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ ...vide, ...(initial || {}) })
    setErreur('')
    if (assigner) {
      api.get('/api/taches/rapport').then((r) => setEquipe(r.data.resume || [])).catch(() => setEquipe([]))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (champ) => (e) => setForm((f) => ({ ...f, [champ]: e.target.value }))

  const envoyer = async (e) => {
    e.preventDefault()
    if (assigner && !form.user_id) { setErreur('Choisissez le commercial.'); return }
    if (!form.cible && !form.vente_id) { setErreur('Choisissez un client ou un prospect.'); return }
    setEnvoi(true)
    setErreur('')
    try {
      const corps = { date_prevue: form.date_prevue, type: form.type, consigne: form.consigne || undefined }
      if (assigner) corps.user_id = form.user_id
      if (form.cible) corps[form.cible.type === 'prospect' ? 'prospect_id' : 'client_id'] = form.cible.id
      if (form.vente_id) corps.vente_id = form.vente_id
      if (form.alerte_key) corps.alerte_key = form.alerte_key
      const r = await api.post('/api/taches', corps)
      onCree?.(r.data)
      onClose()
    } catch (err) {
      setErreur(err.response?.data?.error || 'Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={assigner ? 'Assigner une tâche' : 'Planifier une tâche'}>
      <form onSubmit={envoyer} className="space-y-3">
        {assigner && (
          <div>
            <label className="label" htmlFor="tache-commercial">Commercial *</label>
            <select id="tache-commercial" className="input" value={form.user_id} onChange={set('user_id')} required>
              <option value="">Choisir…</option>
              {equipe.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.role === 'manager' ? ' (manager)' : ''}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="tache-date">Date *</label>
            <input id="tache-date" type="date" className="input" value={form.date_prevue} min={assigner ? dateDecalee(0) : dateDecalee(1)} onChange={set('date_prevue')} required />
          </div>
          <div>
            <label className="label" htmlFor="tache-type">Action *</label>
            <select id="tache-type" className="input" value={form.type} onChange={set('type')}>
              {TYPES_TACHE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tache-cible">Client ou prospect *</label>
          {form.vente_id && !form.cible ? (
            <p className="input bg-gray-50 text-sm text-gray-600">{initial?.cible_libelle || 'Client de la vente'}</p>
          ) : (
            <ClientPicker id="tache-cible" required value={form.cible} onChange={(c) => setForm((f) => ({ ...f, cible: c }))} />
          )}
        </div>
        <div>
          <label className="label" htmlFor="tache-consigne">Consigne</label>
          <textarea id="tache-consigne" className="input" rows={2} maxLength={1000} value={form.consigne} onChange={set('consigne')} placeholder="Ce qu'il faut faire ou obtenir" />
        </div>
        {!assigner && <p className="text-xs text-gray-500">Le planning se fait au plus tard la veille.</p>}
        {erreur && <p className="text-sm text-red-600" role="alert">{erreur}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" disabled={envoi} className="btn-primary flex-1">{envoi ? 'Enregistrement…' : assigner ? 'Assigner' : 'Planifier'}</button>
        </div>
      </form>
    </Modal>
  )
}
