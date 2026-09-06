import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import KpiCard from '../components/KpiCard'

const TYPE_LABEL = { vente: 'Vente', echeance: 'Échéance contrat', contrat: 'Contrat', paddy: 'Contrat paddy' }
const TABS = [
  { key: 'declare', label: 'À valider' },
  { key: 'valide', label: 'Validés' },
  { key: 'rejete', label: 'Rejetés' },
]

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR') : '-'

export default function Comptabilite() {
  const [tab, setTab] = useState('declare')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [motif, setMotif] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/comptabilite/versements', { params: { statut: tab } })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  const valider = async (id) => {
    setBusyId(id)
    setError('')
    try {
      await api.patch(`/api/comptabilite/versements/${id}/valider`)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation')
    } finally {
      setBusyId(null)
    }
  }

  const openReject = (row) => { setRejectTarget(row); setMotif('') }

  const confirmReject = async (e) => {
    e.preventDefault()
    if (!motif.trim()) return
    setBusyId(rejectTarget.id)
    setError('')
    try {
      await api.patch(`/api/comptabilite/versements/${rejectTarget.id}/rejeter`, { motif })
      setRows((prev) => prev.filter((r) => r.id !== rejectTarget.id))
      setRejectTarget(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du rejet')
    } finally {
      setBusyId(null)
    }
  }

  const totalEnAttente = rows.reduce((s, r) => s + (tab === 'declare' ? Number(r.montant) : 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Validation des encaissements</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {tab === 'declare' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <KpiCard title="Encaissements à valider" value={rows.length} color="#e08e0b" />
          <KpiCard title="Montant en attente" value={fmt(totalEnAttente)} color="#e08e0b" />
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? 'border-[#1b75bc] text-[#1b75bc]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun encaissement dans cette liste</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['N°', 'Type', 'Client', 'Montant', 'Mode', 'Date', 'Déclaré par',
                  ...(tab !== 'declare' ? ['Traité par', 'Le'] : []),
                  ...(tab === 'rejete' ? ['Motif'] : []),
                  ...(tab === 'declare' ? ['Actions'] : []),
                ].map((h) => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap font-mono text-xs text-gray-500">{r.numero || '-'}</td>
                  <td className="table-cell whitespace-nowrap">{TYPE_LABEL[r.type] || r.type}</td>
                  <td className="table-cell font-medium">{r.client_nom || '-'}</td>
                  <td className="table-cell text-right font-semibold">{fmt(r.montant)}</td>
                  <td className="table-cell whitespace-nowrap">{r.mode || '-'}</td>
                  <td className="table-cell whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="table-cell whitespace-nowrap">{r.declare_par_nom || '-'}</td>
                  {tab !== 'declare' && (
                    <>
                      <td className="table-cell whitespace-nowrap">{r.valide_par_nom || '-'}</td>
                      <td className="table-cell whitespace-nowrap text-xs text-gray-500">{fmtDateTime(r.valide_at)}</td>
                    </>
                  )}
                  {tab === 'rejete' && (
                    <td className="table-cell text-xs text-gray-500 max-w-[220px]">{r.motif_rejet}</td>
                  )}
                  {tab === 'declare' && (
                    <td className="table-cell whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => valider(r.id)}
                          className="text-xs font-medium text-white bg-[#62bb46] hover:bg-[#559f3c] rounded px-2.5 py-1 disabled:opacity-50"
                        >
                          Valider
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => openReject(r)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 rounded px-2.5 py-1 disabled:opacity-50"
                        >
                          Rejeter
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Rejeter cet encaissement">
        <form onSubmit={confirmReject} className="space-y-4">
          <p className="text-sm text-gray-600">
            {rejectTarget?.numero} — {rejectTarget?.client_nom} — <strong>{fmt(rejectTarget?.montant)}</strong>
          </p>
          <div>
            <label className="label">Motif du rejet</label>
            <textarea
              className="input"
              rows={3}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : montant incorrect, pièce justificative manquante..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setRejectTarget(null)}>Annuler</button>
            <button type="submit" disabled={busyId === rejectTarget?.id} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600">
              Confirmer le rejet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
