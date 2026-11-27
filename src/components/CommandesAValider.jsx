import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCFA as fmt, formatDate } from '../utils/format'

// Commandes de clients qui ont une échéance impayée en retard. Selon les paramètres de la
// rizerie, un responsable les valide avant la livraison. Rien ne s'affiche s'il n'y en a pas.
export default function CommandesAValider() {
  const { isManager, isDirecteur, isRizier } = useAuth()
  const responsable = isManager || isDirecteur || isRizier
  const [liste, setListe] = useState([])
  const [refus, setRefus] = useState(null)
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(null)

  const charger = useCallback(() => {
    if (!responsable) return
    api.get('/api/ventes/commandes/a-valider').then((r) => setListe(Array.isArray(r.data) ? r.data : [])).catch(() => setListe([]))
  }, [responsable])
  useEffect(() => { charger() }, [charger])

  const decider = async (v, decision) => {
    if (decision === 'refuser' && motif.trim().length < 3) { setErreur('Indiquez le motif du refus.'); return }
    setOccupe(v.id); setErreur('')
    try {
      await api.patch(`/api/ventes/${v.id}/commande`, { decision, motif: decision === 'refuser' ? motif.trim() : undefined })
      setRefus(null); setMotif(''); charger()
    } catch (err) {
      setErreur(err.response?.data?.error || 'Action impossible')
    } finally { setOccupe(null) }
  }

  if (!responsable || !liste.length) return null
  return (
    <div className="card border-amber-200 bg-amber-50/40 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">Commandes à valider ({liste.length})</h3>
        <p className="text-sm text-gray-600">Ces clients ont une échéance impayée en retard. Validez avant la livraison, ou refusez avec un motif.</p>
      </div>
      {erreur && <p className="text-sm text-red-600" role="alert">{erreur}</p>}
      <ul className="divide-y divide-amber-100">
        {liste.map((v) => (
          <li key={v.id} className="py-3 flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[220px]">
              <p className="font-medium text-gray-900">{v.client_nom} · {fmt(v.montant)}</p>
              <p className="text-xs text-gray-500">{v.numero} · {formatDate(v.date_vente)} · {v.vendeur_nom}</p>
              <p className="text-xs text-gray-500">{(v.lignes || []).map((l) => `${l.produit} (${Number(l.quantite).toLocaleString('fr-FR')} kg)`).join(', ')}</p>
              {refus === v.id && (
                <div className="flex gap-2 mt-2">
                  <input className="input text-sm" placeholder="Motif du refus" maxLength={300} value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus />
                  <button className="btn-secondary text-xs" onClick={() => decider(v, 'refuser')} disabled={occupe === v.id}>Confirmer le refus</button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs" onClick={() => decider(v, 'valider')} disabled={occupe === v.id}>Valider</button>
              {refus !== v.id && <button className="btn-secondary text-xs" onClick={() => { setRefus(v.id); setMotif(''); setErreur('') }}>Refuser</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
