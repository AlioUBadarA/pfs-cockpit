import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const ACTION_LABELS = {
  ACCOUNT_CREATED_BY_ADMIN: { label: 'Compte créé (admin)', color: 'bg-blue-100 text-blue-800' },
  ACCOUNT_SUSPENDED:        { label: 'Suspension',          color: 'bg-red-100 text-red-800' },
  ACCOUNT_ACTIVATED:        { label: 'Réactivation',        color: 'bg-green-100 text-green-800' },
  ACCOUNT_DELETED:          { label: 'Suppression',         color: 'bg-red-200 text-red-900' },
  PASSWORD_RESET:           { label: 'Reset mdp',           color: 'bg-orange-100 text-orange-800' },
  PROFILE_UPDATED:          { label: 'Profil modifié',      color: 'bg-gray-100 text-gray-700' },
  LOGIN_SUCCESS:            { label: 'Connexion',           color: 'bg-green-50 text-green-700' },
  LOGIN_FAILED:             { label: 'Échec connexion',     color: 'bg-yellow-100 text-yellow-800' },
  SUPPORT_CREATED:          { label: 'Compte support créé', color: 'bg-blue-100 text-blue-800' },
  SUPPORT_DELETED:          { label: 'Compte support supprimé', color: 'bg-red-200 text-red-900' },
}

const fmtDatetime = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '-'

export default function AdminAudit() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [offset, setOffset]   = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const LIMIT = 50

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: LIMIT, offset }
    if (filterAction) params.action = filterAction
    api.get('/api/admin/audit', { params })
      .then((r) => { setLogs(r.data.logs); setTotal(r.data.total) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [offset, filterAction])

  useEffect(() => { load() }, [load])
  useEffect(() => { setOffset(0) }, [filterAction])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Journal d'audit</h2>
          <p className="text-sm text-gray-500">{total} événements enregistrés</p>
        </div>
        <Link to="/admin" className="btn-secondary text-sm">← Panel Admin</Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Filtre action */}
      <div className="card flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Filtrer :</span>
        <button
          onClick={() => setFilterAction('')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${!filterAction ? 'bg-[#1b75bc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Tous
        </button>
        {Object.entries(ACTION_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterAction(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${filterAction === k ? 'bg-[#1b75bc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun événement</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Date & heure', 'Acteur', 'Action', 'Cible', 'Détail'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs whitespace-nowrap text-gray-500">{fmtDatetime(log.created_at)}</td>
                    <td className="table-cell text-sm">
                      <span className="font-medium">{log.actor_nom || '-'}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{log.target_nom || '-'}</td>
                    <td className="table-cell text-xs text-gray-500 max-w-[200px] truncate">
                      {log.detail ? JSON.stringify(log.detail) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {offset + 1}–{Math.min(offset + LIMIT, total)} sur {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              ← Précédent
            </button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
