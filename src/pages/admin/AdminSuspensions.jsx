import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import RoleBadge from '../../components/RoleBadge'
import { fmtPays } from '../../utils/pays'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : null
const fmtDateHeure = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null

const depuis = (d) => {
  if (!d) return null
  const jours = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (jours <= 0) return "aujourd'hui"
  return `il y a ${jours} jour${jours > 1 ? 's' : ''}`
}

export default function AdminSuspensions({ onChange }) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [saving, setSaving]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.get('/api/admin/suspensions')
      .then(r => setRows(r.data))
      .catch(() => setError('Impossible de charger les comptes suspendus.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const reactiver = async (u) => {
    if (!window.confirm(`Réactiver le compte de ${u.nom} ?`)) return
    setSaving(u.id)
    try {
      await api.patch(`/api/admin/users/${u.id}/suspend`, { suspended: false, reason: '' })
      load()
      onChange?.()
    } catch (err) {
      setError(err.response?.data?.error || 'La réactivation a échoué.')
    } finally {
      setSaving(null)
    }
  }

  const q = search.trim().toLowerCase()
  const filtres = rows.filter(u =>
    !q ||
    u.nom?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.rizerie?.toLowerCase().includes(q) ||
    u.suspended_reason?.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {rows.length} compte{rows.length > 1 ? 's' : ''} suspendu{rows.length > 1 ? 's' : ''}, tous rôles confondus.
        </p>
        <div className="flex items-center gap-2">
          <input
            className="input w-56 text-sm py-1.5"
            placeholder="Nom, rizerie, motif..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={load} className="btn-secondary text-sm">↻ Actualiser</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#1b75bc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 text-sm">
            {rows.length === 0 ? 'Aucun compte suspendu.' : 'Aucun compte ne correspond à la recherche.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Compte', 'Rôle', 'Rizerie', 'Pays', 'Motif', 'Suspendu le', 'Par', 'Dernière connexion', ''].map((h, i) => (
                    <th key={i} className="table-header whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 align-top">
                    <td className="table-cell">
                      <Link to={`/admin/users/${u.id}`} className="font-semibold text-gray-900 text-sm hover:text-[#1b75bc]">{u.nom}</Link>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="table-cell"><RoleBadge role={u.role} /></td>
                    <td className="table-cell text-sm text-gray-600">{u.rizerie || <span className="text-gray-300">-</span>}</td>
                    <td className="table-cell text-sm text-gray-600 whitespace-nowrap">{fmtPays(u.pays) || <span className="text-gray-300">-</span>}</td>
                    <td className="table-cell text-sm text-gray-700 max-w-xs">
                      {u.suspended_reason || <span className="text-gray-300 italic">Aucun motif</span>}
                    </td>
                    <td className="table-cell text-sm whitespace-nowrap">
                      {u.suspended_at ? (
                        <>
                          <div className="text-gray-700">{fmtDate(u.suspended_at)}</div>
                          <div className="text-xs text-gray-400">{depuis(u.suspended_at)}</div>
                        </>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="table-cell text-sm text-gray-600">{u.suspendu_par || <span className="text-gray-300">-</span>}</td>
                    <td className="table-cell text-sm text-gray-500 whitespace-nowrap">
                      {fmtDateHeure(u.derniere_connexion) || <span className="text-gray-300 italic">jamais</span>}
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => reactiver(u)}
                        disabled={saving === u.id}
                        className="btn-secondary text-xs whitespace-nowrap"
                      >
                        {saving === u.id ? '...' : '✅ Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
