import { useRef, useState } from 'react'
import api from '../services/api'
import Modal from './Modal'
import { ModeButtons } from './PaiementFields'
import { lireFichierPourApi } from '../utils/entreprise'
import { formatCFA as fmt } from '../utils/format'

// Achat de paddy : la rizerie reçoit le paddy (livraison) puis le comptable paie le producteur.

const TYPES_PREUVE = ['image/jpeg', 'image/png', 'application/pdf']
const auj = () => new Date().toISOString().slice(0, 10)

// Ouvre la preuve d'un paiement producteur dans un nouvel onglet.
export async function ouvrirPreuvePaddy(paiementId) {
  const fenetre = window.open('', '_blank')
  try {
    const r = await api.get(`/api/paddy/paiements/${paiementId}/preuve`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    if (fenetre) fenetre.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    if (fenetre) fenetre.close()
    throw new Error('Preuve indisponible')
  }
}

// Livraison de paddy reçue. `contrats` : liste { id, numero, prix_kg } si plusieurs, sinon `contrat`.
export function LivraisonForm({ open, contrats, onClose, onSaved }) {
  const [form, setForm] = useState({ contrat_id: '', date: auj(), quantite_kg: '', humidite_pct: '', date_paiement_prevue: '', note: '' })
  const [erreur, setErreur] = useState('')
  const [saving, setSaving] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  if (open !== ouvert) {
    setOuvert(open)
    if (open) { setErreur(''); setForm({ contrat_id: contrats?.length === 1 ? contrats[0].id : '', date: auj(), quantite_kg: '', humidite_pct: '', date_paiement_prevue: '', note: '' }) }
  }
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const contrat = (contrats || []).find((c) => c.id === form.contrat_id)
  const montant = contrat && form.quantite_kg ? Number(form.quantite_kg) * Number(contrat.prix_kg) : 0

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!form.contrat_id) { setErreur('Choisissez le contrat'); return }
    setSaving(true); setErreur('')
    try {
      await api.post(`/api/paddy/contrats/${form.contrat_id}/livraisons`, {
        date: form.date, quantite_kg: Number(form.quantite_kg), humidite_pct: form.humidite_pct === '' ? null : Number(form.humidite_pct),
        date_paiement_prevue: form.date_paiement_prevue || undefined, note: form.note || null,
      })
      onSaved()
    } catch (err) { setErreur(err.response?.data?.error || 'Erreur') } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Paddy reçu du producteur">
      <form onSubmit={enregistrer} className="space-y-4">
        {(contrats || []).length > 1 && (
          <div>
            <label className="label" htmlFor="liv-contrat">Contrat *</label>
            <select id="liv-contrat" className="input" value={form.contrat_id} onChange={set('contrat_id')} required>
              <option value="">Choisir</option>
              {contrats.map((c) => <option key={c.id} value={c.id}>{c.numero || 'Contrat'} · {fmt(c.prix_kg)}/kg</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="liv-date">Date de réception *</label><input id="liv-date" type="date" max={auj()} className="input" value={form.date} onChange={set('date')} required /></div>
          <div><label className="label" htmlFor="liv-kg">Quantité reçue (kg) *</label><input id="liv-kg" type="number" min="0.01" step="0.01" className="input" value={form.quantite_kg} onChange={set('quantite_kg')} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="liv-hum">Humidité (%)</label><input id="liv-hum" type="number" min="0" max="100" step="0.1" className="input" value={form.humidite_pct} onChange={set('humidite_pct')} /></div>
          <div>
            <label className="label" htmlFor="liv-ech">Paiement prévu le</label>
            <input id="liv-ech" type="date" min={form.date} className="input" value={form.date_paiement_prevue} onChange={set('date_paiement_prevue')} />
            <p className="text-xs text-gray-400 mt-1">Vide : délai réglé dans les paramètres de la rizerie.</p>
          </div>
        </div>
        <div><label className="label" htmlFor="liv-note">Note (qualité, sacs…)</label><textarea id="liv-note" className="input" rows={2} maxLength={1000} value={form.note} onChange={set('note')} /></div>
        {montant > 0 && <div className="bg-amber-50 rounded-lg px-3 py-2 text-sm">La rizerie devra <strong className="text-amber-700">{fmt(montant)}</strong> au producteur.</div>}
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}

// Paiement du producteur par le comptable, avec mode, référence et preuve.
export function PaiementProducteurForm({ open, contrats, montantPropose, producteurNom, modes, onClose, onSaved }) {
  const [form, setForm] = useState({ contrat_id: '', montant: '', mode: 'Espèces', reference: '', date: auj(), note: '' })
  const [preuve, setPreuve] = useState(null)
  const [erreur, setErreur] = useState('')
  const [saving, setSaving] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  const fichierRef = useRef(null)
  if (open !== ouvert) {
    setOuvert(open)
    if (open) {
      setErreur(''); setPreuve(null)
      setForm({ contrat_id: contrats?.length === 1 ? contrats[0].id : '', montant: montantPropose ? String(Math.round(montantPropose)) : '', mode: (modes && modes[0]) || 'Espèces', reference: '', date: auj(), note: '' })
    }
  }
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const choisirFichier = async (e) => {
    setErreur('')
    const f = e.target.files?.[0]
    if (!f) { setPreuve(null); return }
    try { setPreuve(await lireFichierPourApi(f, TYPES_PREUVE)) } catch (err) {
      setPreuve(null); setErreur(err.message === 'Type de fichier refusé' ? 'Preuve : JPG, PNG ou PDF' : err.message)
      if (fichierRef.current) fichierRef.current.value = ''
    }
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!form.contrat_id) { setErreur('Choisissez le contrat'); return }
    if (!preuve) { setErreur('Ajoutez la preuve du paiement'); return }
    setSaving(true); setErreur('')
    try {
      await api.post(`/api/paddy/contrats/${form.contrat_id}/paiements`, {
        montant: Number(form.montant), mode: form.mode, reference: form.reference || null, date: form.date, note: form.note || null, preuve,
      })
      onSaved()
    } catch (err) { setErreur(err.response?.data?.error || 'Erreur') } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={producteurNom ? `Payer ${producteurNom}` : 'Payer le producteur'}>
      <form onSubmit={enregistrer} className="space-y-4">
        {(contrats || []).length > 1 && (
          <div>
            <label className="label" htmlFor="pp-contrat">Contrat *</label>
            <select id="pp-contrat" className="input" value={form.contrat_id} onChange={set('contrat_id')} required>
              <option value="">Choisir</option>
              {contrats.map((c) => <option key={c.id} value={c.id}>{c.numero || 'Contrat'}{c.reste_a_payer ? ` · reste ${fmt(c.reste_a_payer)}` : ''}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="pp-montant">Montant payé (F) *</label><input id="pp-montant" type="number" min="1" className="input" value={form.montant} onChange={set('montant')} required /></div>
          <div><label className="label" htmlFor="pp-date">Date du paiement *</label><input id="pp-date" type="date" max={auj()} className="input" value={form.date} onChange={set('date')} required /></div>
        </div>
        <div>
          <span className="label">Mode de paiement *</span>
          <ModeButtons value={form.mode} onChange={(m) => setForm((p) => ({ ...p, mode: m }))} modes={modes} />
        </div>
        {form.mode !== 'Espèces' && (
          <div><label className="label" htmlFor="pp-ref">Référence * (n° de chèque, de virement ou de transaction)</label><input id="pp-ref" className="input" maxLength={100} value={form.reference} onChange={set('reference')} required /></div>
        )}
        <div>
          <label className="label" htmlFor="pp-preuve">Preuve du paiement *</label>
          <input id="pp-preuve" ref={fichierRef} type="file" accept="image/jpeg,image/png,application/pdf" onChange={choisirFichier}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-sm file:font-medium hover:file:bg-gray-50" />
          <p className="text-xs text-gray-400 mt-1">Reçu signé par le producteur, capture du virement ou du Mobile Money. JPG, PNG ou PDF, 3 Mo maximum.</p>
        </div>
        <div><label className="label" htmlFor="pp-note">Note</label><textarea id="pp-note" className="input" rows={2} maxLength={1000} value={form.note} onChange={set('note')} /></div>
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement…' : 'Enregistrer le paiement'}</button>
        </div>
      </form>
    </Modal>
  )
}
