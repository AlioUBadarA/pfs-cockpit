import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from './Modal'
import { formatDate } from '../utils/format'

// Repousser l'échéance d'une vente. Réservé au manager et au comptable (le serveur vérifie).
// Le motif est obligatoire. La date d'origine reste dans la vente.
export default function RepousserEcheance({ vente, onClose, onFait }) {
  const [date, setDate] = useState('')
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { setDate(''); setMotif(''); setErreur('') }, [vente])

  const envoyer = async (e) => {
    e.preventDefault()
    if (!date) { setErreur('Choisissez la nouvelle date.'); return }
    if (motif.trim().length < 3) { setErreur('Indiquez le motif du report.'); return }
    setEnvoi(true); setErreur('')
    try {
      await api.patch(`/api/echeances/vente/${vente.id}`, { date_echeance: date, motif: motif.trim() })
      onFait?.()
      onClose()
    } catch (err) {
      setErreur(err.response?.data?.error || 'Report impossible')
    } finally { setEnvoi(false) }
  }

  const aujourdhui = new Date().toISOString().slice(0, 10)
  return (
    <Modal open={!!vente} onClose={onClose} title="Repousser l'échéance">
      {vente && (
        <form onSubmit={envoyer} className="space-y-3">
          <p className="text-sm text-gray-600">
            {vente.numero} · {vente.client_nom}. Échéance actuelle : <strong>{formatDate(vente.date_echeance)}</strong>
            {vente.nb_reports > 0 ? ` (déjà repoussée ${vente.nb_reports} fois)` : ''}.
          </p>
          <div>
            <label className="label" htmlFor="report-date">Nouvelle échéance *</label>
            <input id="report-date" type="date" className="input" min={aujourdhui} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="report-motif">Motif *</label>
            <input id="report-motif" className="input" maxLength={300} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex : client en voyage, paiera au retour" required />
          </div>
          <p className="text-xs text-gray-500">Les relances de l'ancienne échéance s'arrêtent. Le commercial reçoit les nouvelles à J-2 et à J.</p>
          {erreur && <p className="text-sm text-red-600" role="alert">{erreur}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" disabled={envoi} className="btn-primary flex-1">{envoi ? 'Enregistrement…' : 'Repousser'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
