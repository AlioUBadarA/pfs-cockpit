import { useState } from 'react'
import api from '../services/api'
import Modal from './Modal'

// Formulaire de la fiche producteur : création et modification.
const VIDE = { nom: '', telephone: '', zone: '', village: '', superficie_ha: '', varietes: '', groupement: '', note: '' }

export default function FicheProducteurForm({ open, fiche, onClose, onSaved }) {
  const [form, setForm] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [saving, setSaving] = useState(false)
  const [ouvertePour, setOuvertePour] = useState(null)

  // Recharge le formulaire à chaque ouverture.
  const cle = open ? (fiche?.id || 'nouvelle') : null
  if (cle !== ouvertePour) {
    setOuvertePour(cle)
    if (open) {
      setErreur('')
      setForm(fiche ? Object.fromEntries(Object.keys(VIDE).map((k) => [k, fiche[k] ?? ''])) : VIDE)
    }
  }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const enregistrer = async (e) => {
    e.preventDefault(); setSaving(true); setErreur('')
    try {
      const corps = { ...form, superficie_ha: form.superficie_ha === '' ? null : Number(form.superficie_ha) }
      const r = fiche ? await api.put(`/api/producteurs/${fiche.id}`, corps) : await api.post('/api/producteurs', corps)
      onSaved(r.data)
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={fiche ? 'Modifier la fiche producteur' : 'Nouveau producteur'}>
      <form onSubmit={enregistrer} className="space-y-4">
        <div>
          <label className="label">Nom du producteur *</label>
          <input className="input" value={form.nom} onChange={set('nom')} required maxLength={150} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={set('telephone')} maxLength={30} /></div>
          <div><label className="label">Zone</label><input className="input" placeholder="Ex : Dagana" value={form.zone} onChange={set('zone')} maxLength={100} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Village</label><input className="input" value={form.village} onChange={set('village')} maxLength={100} /></div>
          <div><label className="label">Superficie (ha)</label><input type="number" min="0" step="0.01" className="input" value={form.superficie_ha} onChange={set('superficie_ha')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Variétés cultivées</label><input className="input" placeholder="Ex : Sahel 108, Jasmine" value={form.varietes} onChange={set('varietes')} maxLength={200} /></div>
          <div><label className="label">Groupement</label><input className="input" placeholder="GIE, coopérative…" value={form.groupement} onChange={set('groupement')} maxLength={150} /></div>
        </div>
        <div><label className="label">Note</label><textarea className="input" rows={2} value={form.note} onChange={set('note')} maxLength={2000} /></div>
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
