import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import KpiCard from '../../components/KpiCard'
import StatutBadge from '../../components/StatutBadge'
import { useAuth } from '../../context/AuthContext'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: adminUser, startImpersonation } = useAuth()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // Modals
  const [showSuspend, setShowSuspend]     = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [showDelete, setShowDelete]       = useState(false)
  const [showEdit, setShowEdit]           = useState(false)

  const [suspendReason, setSuspendReason] = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [editForm, setEditForm]           = useState({})
  const [saving, setSaving]               = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/api/admin/users/${id}`)
      .then((r) => {
        setData(r.data)
        setEditForm({
          nom: r.data.user.nom, email: r.data.user.email,
          rizerie: r.data.user.rizerie || '', telephone: r.data.user.telephone || '',
          ville: r.data.user.ville || '',
        })
      })
      .catch(() => setError('Utilisateur introuvable'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }

  const doSuspend = async (suspended) => {
    setSaving(true)
    try {
      await api.patch(`/api/admin/users/${id}/suspend`, { suspended, reason: suspendReason })
      load(); setShowSuspend(false); flash(suspended ? 'Compte suspendu' : 'Compte réactivé')
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const doPassword = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/api/admin/users/${id}/password`, { new_password: newPassword })
      setShowPassword(false); setNewPassword(''); flash('Mot de passe réinitialisé')
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const doEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/api/admin/users/${id}`, editForm)
      load(); setShowEdit(false); flash('Profil mis à jour')
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleImpersonate = async () => {
    try {
      const { data } = await api.post(`/api/admin/users/${id}/impersonate`)
      await startImpersonation(data.user, data.token, { id: adminUser.id, nom: adminUser.nom })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible d\'accéder à cet espace')
    }
  }

  const doDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/api/admin/users/${id}`)
      navigate('/admin')
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" /></div>
  if (error && !data) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-4 text-sm">{error}</div>

  const { user, ventes = [], clients = [], pilotage = [] } = data
  const caTotal = ventes.reduce((s, v) => s + Number(v.montant || 0), 0)
  const creances = ventes.filter((v) => ['En cours', 'En retard'].includes(v.statut_paiement))
  const creancesTotal = creances.reduce((s, v) => s + Number(v.montant || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/admin" className="text-sm text-[#1B5E20] hover:underline">← Retour</Link>
        <h2 className="text-xl font-bold text-gray-900 flex-1">{user.nom}</h2>
        <div className="flex gap-2 flex-wrap">
          {!user.suspended && (
            <button
              onClick={handleImpersonate}
              className="btn-primary text-sm flex items-center gap-1"
            >
              👁 Accéder à l'espace
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">Modifier profil</button>
          <button onClick={() => setShowPassword(true)} className="btn-secondary text-sm">Reset mot de passe</button>
          {user.suspended
            ? <button onClick={() => doSuspend(false)} className="btn-primary text-sm">Réactiver</button>
            : <button onClick={() => { setShowSuspend(true); setSuspendReason('') }} className="text-sm px-4 py-2 bg-[#F9A825] text-[#1A1A1A] rounded-lg font-medium hover:bg-yellow-500">Suspendre</button>
          }
          <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">Supprimer</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>}

      {/* Statut suspension */}
      {user.suspended && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-red-600 font-semibold text-sm">🚫 Compte suspendu</span>
          {user.suspended_reason && <span className="text-red-500 text-sm">— {user.suspended_reason}</span>}
          {user.suspended_at && <span className="text-red-400 text-xs ml-auto">le {fmtDate(user.suspended_at)}</span>}
        </div>
      )}

      {/* Info profil */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Informations du compte</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">Nom</span><p className="font-medium">{user.nom}</p></div>
          <div><span className="text-gray-500">Email</span><p className="font-medium">{user.email}</p></div>
          <div><span className="text-gray-500">Rizerie</span><p className="font-medium">{user.rizerie || '—'}</p></div>
          <div><span className="text-gray-500">Téléphone</span><p className="font-medium">{user.telephone || '—'}</p></div>
          <div><span className="text-gray-500">Ville</span><p className="font-medium">{user.ville || '—'}</p></div>
          <div><span className="text-gray-500">Inscrit le</span><p className="font-medium">{fmtDate(user.created_at)}</p></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CA total" value={fmt(caTotal)} icon="💰" color="#1B5E20" />
        <KpiCard title="Créances en cours" value={fmt(creancesTotal)} icon="📋" color={creancesTotal > 0 ? '#CC0000' : '#388E3C'} />
        <KpiCard title="Total ventes" value={ventes.length} icon="🧾" color="#388E3C" />
        <KpiCard title="Clients" value={clients.length} icon="👥" color="#1B5E20" />
      </div>

      {/* Ventes récentes */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Ventes récentes (50 dernières)</h3>
        </div>
        {ventes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune vente</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Date','Client','Produit','Qté','Montant','Statut'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {ventes.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell whitespace-nowrap">{fmtDate(v.date_vente)}</td>
                  <td className="table-cell font-medium">{v.client_nom}</td>
                  <td className="table-cell">{v.produit}</td>
                  <td className="table-cell text-right">{Number(v.quantite).toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-right font-semibold">{fmt(v.montant)}</td>
                  <td className="table-cell"><StatutBadge statut={v.statut_paiement === 'Paye' ? 'Payé' : v.statut_paiement} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Clients */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Clients ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun client</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{c.nom}</span>
                  <StatutBadge statut={c.statut} />
                </div>
                <p className="text-xs text-gray-500">{c.type} · {c.zone || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pilotage résumé */}
      {pilotage.length > 0 && (
        <div className="card p-0 overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Pilotage — 8 dernières semaines</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>{['Semaine','Objectif','Réalisé','Écart'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {pilotage.map((p) => {
                const ecart = Number(p.realise_total) - Number(p.objectif_total)
                return (
                  <tr key={p.semaine} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{p.semaine}</td>
                    <td className="table-cell text-right">{fmt(p.objectif_total)}</td>
                    <td className="table-cell text-right">{fmt(p.realise_total)}</td>
                    <td className={`table-cell text-right font-semibold ${ecart >= 0 ? 'text-[#1B5E20]' : 'text-[#CC0000]'}`}>
                      {ecart >= 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal : modifier profil */}
      {showEdit && (
        <ModalWrap title="Modifier le profil" onClose={() => setShowEdit(false)}>
          <form onSubmit={doEdit} className="space-y-3">
            {[['nom','Nom'],['email','Email'],['rizerie','Rizerie'],['telephone','Téléphone'],['ville','Ville']].map(([f, l]) => (
              <div key={f}>
                <label className="label">{l}</label>
                <input className="input" value={editForm[f] || ''} onChange={(e) => setEditForm({...editForm,[f]:e.target.value})} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowEdit(false)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Sauvegarder
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : reset password */}
      {showPassword && (
        <ModalWrap title="Réinitialiser le mot de passe" onClose={() => setShowPassword(false)}>
          <p className="text-sm text-gray-600 mb-3">Le nouveau mot de passe sera actif immédiatement.</p>
          <form onSubmit={doPassword} className="space-y-3">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="text" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min. 6 caractères" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowPassword(false)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Réinitialiser
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : suspendre */}
      {showSuspend && (
        <ModalWrap title={`Suspendre — ${user.nom}`} onClose={() => setShowSuspend(false)}>
          <p className="text-sm text-gray-600 mb-3">L'utilisateur ne pourra plus se connecter.</p>
          <textarea className="input resize-none" rows={3} placeholder="Raison (optionnel)..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          <div className="flex gap-3 mt-4">
            <button className="btn-secondary flex-1" onClick={() => setShowSuspend(false)}>Annuler</button>
            <button disabled={saving} onClick={() => doSuspend(true)} className="btn-danger flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirmer
            </button>
          </div>
        </ModalWrap>
      )}

      {/* Modal : supprimer */}
      {showDelete && (
        <ModalWrap title="Supprimer le compte" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-gray-700 mb-2">
            Supprimer définitivement le compte de <strong>{user.nom}</strong> ?
          </p>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            ⚠ Cette action est irréversible. Toutes les ventes, clients et données seront supprimés.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowDelete(false)}>Annuler</button>
            <button disabled={saving} onClick={doDelete} className="btn-danger flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Supprimer définitivement
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
