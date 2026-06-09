import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import KpiCard from '../../components/KpiCard'
import StatutBadge from '../../components/StatutBadge'
import { useAuth } from '../../context/AuthContext'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : 'jamais'

export default function AdminDashboard() {
  const { user: adminUser, startImpersonation } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('tous')
  const [error, setError]       = useState('')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState({ nom:'', email:'', password:'', rizerie:'', telephone:'', ville:'' })
  const [suspendReason, setSuspendReason] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.get('/api/admin/stats'), api.get('/api/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.nom?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) || u.rizerie?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'tous'      ? true :
      filter === 'suspendus' ? u.suspended :
      filter === 'actifs'    ? !u.suspended : true
    return matchSearch && matchFilter
  })

  const handleImpersonate = async (u) => {
    try {
      const { data } = await api.post(`/api/admin/users/${u.id}/impersonate`)
      await startImpersonation(data.user, data.token, { id: adminUser.id, nom: adminUser.nom })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible d\'accéder à cet espace')
    }
  }

  const handleSuspend = async (user, shouldSuspend) => {
    if (shouldSuspend) {
      setModal({ type: 'suspend', user, action: true })
      setSuspendReason('')
      return
    }
    await doSuspend(user.id, false, '')
  }

  const doSuspend = async (id, suspended, reason) => {
    setSaving(true)
    try {
      await api.patch(`/api/admin/users/${id}/suspend`, { suspended, reason })
      load()
      setModal(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/users', form)
      load()
      setModal(null)
      setForm({ nom:'', email:'', password:'', rizerie:'', telephone:'', ville:'' })
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur création')
    } finally {
      setSaving(false)
    }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Panel Superadmin</h2>
          <p className="text-sm text-gray-500">Gestion de tous les comptes riziers</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/audit" className="btn-secondary text-sm">
            Journal d'audit
          </Link>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary text-sm">
            + Créer un compte
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* KPI globaux */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard title="Riziers inscrits"   value={stats.total_riziers}   icon="🏭" color="#1B5E20" />
          <KpiCard title="Comptes suspendus"  value={stats.comptes_suspendus} icon="🚫" color={stats.comptes_suspendus > 0 ? '#CC0000' : '#388E3C'} />
          <KpiCard title="CA global"          value={fmt(stats.ca_global)}  icon="💰" color="#1B5E20" />
          <KpiCard title="CA ce mois"         value={fmt(stats.ca_mois)}    icon="📈" color="#388E3C" />
          <KpiCard title="Total ventes"       value={stats.total_ventes}    icon="🧾" color="#1B5E20" />
          <KpiCard title="Total clients"      value={stats.total_clients}   icon="👥" color="#388E3C" />
        </div>
      )}

      {/* Filtres */}
      <div className="card flex flex-wrap items-center gap-3">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Rechercher par nom, email, rizerie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {[['tous','Tous'], ['actifs','Actifs'], ['suspendus','Suspendus']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === v ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau utilisateurs */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun utilisateur trouvé</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Rizier', 'Email', 'Ville', 'CA total', 'Ventes', 'Clients', 'Dernière vente', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.suspended ? 'bg-red-50' : ''}`}>
                  <td className="table-cell">
                    <div className="font-semibold text-gray-900">{u.nom}</div>
                    <div className="text-xs text-gray-400">{u.rizerie || '—'}</div>
                  </td>
                  <td className="table-cell text-xs">{u.email}</td>
                  <td className="table-cell text-xs">{u.ville || '—'}</td>
                  <td className="table-cell text-right font-medium text-[#1B5E20]">{fmt(u.ca_total)}</td>
                  <td className="table-cell text-center">{u.nb_ventes}</td>
                  <td className="table-cell text-center">{u.nb_clients}</td>
                  <td className="table-cell text-xs whitespace-nowrap text-gray-500">
                    {u.derniere_vente ? fmtDate(u.derniere_vente) : <span className="text-gray-300">jamais</span>}
                  </td>
                  <td className="table-cell">
                    {u.suspended ? (
                      <div>
                        <span className="text-xs font-medium text-red-600">🚫 Suspendu</span>
                        {u.suspended_reason && (
                          <div className="text-xs text-red-400 mt-0.5 max-w-[120px] truncate" title={u.suspended_reason}>
                            {u.suspended_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-green-600">✅ Actif</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2 whitespace-nowrap flex-wrap">
                      {!u.suspended && (
                        <button
                          onClick={() => handleImpersonate(u)}
                          className="text-xs bg-[#1B5E20] text-white px-2 py-1 rounded font-medium hover:bg-[#388E3C] transition-colors"
                          title="Naviguer dans l'espace de ce rizier"
                        >
                          👁 Accéder
                        </button>
                      )}
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="text-xs text-[#1B5E20] font-medium hover:underline"
                      >
                        Détails
                      </Link>
                      {u.suspended ? (
                        <button
                          onClick={() => handleSuspend(u, false)}
                          className="text-xs text-green-700 font-medium hover:underline"
                        >
                          Réactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(u, true)}
                          className="text-xs text-red-600 font-medium hover:underline"
                        >
                          Suspendre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal : créer un compte */}
      {modal?.type === 'create' && (
        <ModalWrap title="Créer un compte rizier" onClose={() => setModal(null)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nom complet</label>
                <input className="input" value={form.nom} onChange={set('nom')} required placeholder="Mamadou Diallo" />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} required placeholder="email@rizerie.sn" />
              </div>
              <div className="col-span-2">
                <label className="label">Mot de passe provisoire</label>
                <input type="text" className="input" value={form.password} onChange={set('password')} required placeholder="Min. 6 caractères" minLength={6} />
              </div>
              <div className="col-span-2">
                <label className="label">Nom de la rizerie</label>
                <input className="input" value={form.rizerie} onChange={set('rizerie')} placeholder="Rizerie du Sahel" />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={form.telephone} onChange={set('telephone')} placeholder="77 000 00 00" />
              </div>
              <div>
                <label className="label">Ville</label>
                <input className="input" value={form.ville} onChange={set('ville')} placeholder="Dakar" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : suspendre */}
      {modal?.type === 'suspend' && (
        <ModalWrap title={`Suspendre — ${modal.user.nom}`} onClose={() => setModal(null)}>
          <p className="text-sm text-gray-600 mb-3">
            L'utilisateur ne pourra plus se connecter. Il verra la raison à la prochaine tentative.
          </p>
          {/* Raisons rapides */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['Non-paiement', 'Compte dupliqué', 'Activité suspecte', 'Contrat résilié', 'Demande utilisateur'].map((r) => (
              <button
                key={r}
                onClick={() => setSuspendReason(r)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  suspendReason === r
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Ou précise une raison personnalisée..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
            <button
              disabled={saving}
              onClick={() => doSuspend(modal.user.id, true, suspendReason)}
              className="btn-danger flex-1 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirmer suspension
            </button>
          </div>
        </ModalWrap>
      )}
    </div>
  )
}

function ModalWrap({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
