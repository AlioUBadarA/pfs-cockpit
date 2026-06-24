import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import KpiCard from '../../components/KpiCard'
import StatutBadge from '../../components/StatutBadge'
import PageTabs from '../../components/PageTabs'
import LocationFields from '../../components/LocationFields'
import PhoneField from '../../components/PhoneField'
import { useAuth } from '../../context/AuthContext'
import Country from 'country-state-city/lib/country'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : 'jamais'
const fmtPays = (iso) => iso ? (Country.getCountryByCode(iso)?.flag || '') + ' ' + (Country.getCountryByCode(iso)?.name || iso) : null

const BASE_TABS = [
  { key: 'rizeries', label: 'Rizeries' },
  { key: 'comptes',  label: 'Comptes' },
]

export default function AdminDashboard() {
  const { user: adminUser, startImpersonation, isSuperadmin } = useAuth()
  const navigate = useNavigate()
  const TABS = isSuperadmin
    ? [...BASE_TABS, { key: 'support', label: 'Comptes support' }, { key: 'superadmins', label: 'Comptes superadmin' }]
    : BASE_TABS
  const [tab, setTab]           = useState('rizeries')
  const [stats, setStats]       = useState(null)
  const [rizeries, setRizeries] = useState([])
  const [users, setUsers]       = useState([])
  const [support, setSupport]   = useState([])
  const [superadmins, setSuperadmins] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('tous')
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)

  // Formulaires
  const RIZERIE_INIT    = { nom: '', pays: '', region: '', ville: '', telephone: '', emplois_baseline: '', masse_salariale_baseline: '', ca_baseline: '' }
  const COMPTE_INIT     = { nom: '', email: '', password: '', rizerie_id: '', telephone: '', ville: '' }
  const SUPPORT_INIT    = { nom: '', email: '', password: '' }
  const SUPERADMIN_INIT = { nom: '', email: '', password: '' }
  const EXPORT_INIT     = { type: 'ventes', periode: 'mois', annee: new Date().getFullYear(), valeur: new Date().getMonth() + 1, rizerie_id: '' }
  const [rForm, setRForm]   = useState(RIZERIE_INIT)
  const [cForm, setCForm]   = useState(COMPTE_INIT)
  const [sForm, setSForm]   = useState(SUPPORT_INIT)
  const [saForm, setSaForm] = useState(SUPERADMIN_INIT)
  const [eForm, setEForm]   = useState(EXPORT_INIT)
  const [suspendReason, setSuspendReason] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const calls = [
      api.get('/api/admin/stats'),
      api.get('/api/admin/rizeries'),
      api.get('/api/admin/users'),
    ]
    if (isSuperadmin) calls.push(api.get('/api/admin/support'), api.get('/api/admin/superadmins'))
    Promise.all(calls)
      .then(([s, r, u, sup, sa]) => {
        setStats(s.data); setRizeries(r.data); setUsers(u.data)
        if (sup) setSupport(sup.data)
        if (sa) setSuperadmins(sa.data)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [isSuperadmin])

  useEffect(() => { load() }, [load])

  const setR = (f) => (e) => setRForm(p => ({ ...p, [f]: e.target.value }))
  const setC = (f) => (e) => setCForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreateRizerie = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/rizeries', {
        ...rForm,
        emplois_baseline: Number(rForm.emplois_baseline) || 0,
        masse_salariale_baseline: Number(rForm.masse_salariale_baseline) || 0,
        ca_baseline: Number(rForm.ca_baseline) || 0,
      })
      load(); setModal(null); setRForm(RIZERIE_INIT)
    } catch (err) { setError(err.response?.data?.error || 'Erreur création') }
    finally { setSaving(false) }
  }

  const handleDeleteRizerie = async (r) => {
    if (!confirm(`Supprimer la rizerie "${r.nom}" ?`)) return
    try {
      await api.delete(`/api/admin/rizeries/${r.id}`)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const handleCreateCompte = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/users', cForm)
      load(); setModal(null); setCForm(COMPTE_INIT)
    } catch (err) { setError(err.response?.data?.error || 'Erreur création') }
    finally { setSaving(false) }
  }

  const handleImpersonate = async (u) => {
    try {
      const { data } = await api.post(`/api/admin/users/${u.id}/impersonate`)
      await startImpersonation(data.user, data.token, { id: adminUser.id, nom: adminUser.nom })
      navigate('/')
    } catch (err) { setError(err.response?.data?.error || 'Impossible d\'accéder à cet espace') }
  }

  const doSuspend = async (id, suspended, reason) => {
    setSaving(true)
    try {
      await api.patch(`/api/admin/users/${id}/suspend`, { suspended, reason })
      load(); setModal(null)
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const setS = (f) => (e) => setSForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreateSupport = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/support', sForm)
      load(); setModal(null); setSForm(SUPPORT_INIT)
    } catch (err) { setError(err.response?.data?.error || 'Erreur création') }
    finally { setSaving(false) }
  }

  const handleDeleteSupport = async (s) => {
    if (!confirm(`Supprimer définitivement le compte support "${s.nom}" ?`)) return
    try {
      await api.delete(`/api/admin/support/${s.id}`)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const setSa = (f) => (e) => setSaForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreateSuperadmin = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/superadmins', saForm)
      load(); setModal(null); setSaForm(SUPERADMIN_INIT)
    } catch (err) { setError(err.response?.data?.error || 'Erreur création') }
    finally { setSaving(false) }
  }

  const handleDeleteSuperadmin = async (s) => {
    if (!confirm(`Supprimer définitivement le compte superadmin "${s.nom}" ?`)) return
    try {
      await api.delete(`/api/admin/superadmins/${s.id}`)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const handleEditSuperadmin = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { nom: saForm.nom, email: saForm.email }
      if (saForm.password) payload.new_password = saForm.password
      await api.put(`/api/admin/superadmins/${modal.id}`, payload)
      load(); setModal(null)
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleEditSupport = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { nom: sForm.nom, email: sForm.email }
      if (sForm.password) payload.new_password = sForm.password
      await api.put(`/api/admin/support/${modal.id}`, payload)
      load(); setModal(null)
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const setE = (f) => (e) => setEForm(p => ({ ...p, [f]: e.target.value }))

  const handleExport = (e) => {
    e.preventDefault()
    const { type, periode, annee, valeur, rizerie_id } = eForm
    const params = new URLSearchParams({ type, periode, annee, valeur })
    if (rizerie_id) params.set('rizerie_id', rizerie_id)
    const token = localStorage.getItem('pfs_token')
    // Téléchargement via lien temporaire (le token est dans le header d'API mais
    // pour un téléchargement de fichier on passe par fetch+blob)
    const url = `/api/admin/export?${params.toString()}`
    api.get(url, { responseType: 'blob' }).then(({ data }) => {
      const blob = new Blob([data], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `export_${type}_${periode}_${annee}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      setModal(null)
    }).catch(() => setError('Erreur lors de l\'export'))
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.nom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.rizerie?.toLowerCase().includes(q)
    const matchFilter = filter === 'tous' ? true : filter === 'suspendus' ? u.suspended : !u.suspended
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Administration</h2>
          <p className="text-sm text-gray-500">Cockpit Commercial &middot; gestion des rizeries et des comptes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEForm(EXPORT_INIT); setError(''); setModal({ type: 'export' }) }} className="btn-secondary text-sm">
            ⬇ Exporter CSV
          </button>
          <Link to="/admin/audit" className="btn-secondary text-sm">Journal d'audit</Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex justify-between">
          {error}
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {/* KPIs globaux */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Rizeries" value={rizeries.length} icon="🏭" color="#1b75bc" />
          <KpiCard title="Comptes actifs" value={stats.total_riziers} icon="👤" color="#62bb46" />
          <KpiCard title="CA global" value={fmt(stats.ca_global)} icon="💰" color="#1b75bc" />
          <KpiCard title="Comptes suspendus" value={stats.comptes_suspendus} icon="🚫" color={stats.comptes_suspendus > 0 ? '#CC0000' : '#62bb46'} />
        </div>
      )}

      <PageTabs tabs={TABS} active={tab} setActive={setTab} />

      {/* ── ONGLET RIZERIES ── */}
      {tab === 'rizeries' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setRForm(RIZERIE_INIT); setError(''); setModal({ type: 'create-rizerie' }) }} className="btn-primary text-sm">
              + Créer une rizerie
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rizeries.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400 text-sm mb-3">Aucune rizerie créée</p>
              <button onClick={() => { setRForm(RIZERIE_INIT); setError(''); setModal({ type: 'create-rizerie' }) }} className="btn-primary text-sm">
                + Créer la première rizerie
              </button>
            </div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Rizerie', 'Pays', 'Ville / Région', 'Téléphone', 'Comptes', 'CA total', 'Emplois', 'Évolution CA', 'Actions'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rizeries.map(r => {
                    const emploisDelta = Number(r.emplois_actuels || 0) - Number(r.emplois_baseline || 0)
                    const caDelta = Number(r.ca_total || 0) - Number(r.ca_baseline || 0)
                    return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell font-semibold text-gray-900">{r.nom}</td>
                      <td className="table-cell text-sm text-gray-600 whitespace-nowrap">{fmtPays(r.pays) || '-'}</td>
                      <td className="table-cell text-sm text-gray-600">{[r.ville, r.region].filter(Boolean).join(', ') || '-'}</td>
                      <td className="table-cell text-sm">{r.telephone || '-'}</td>
                      <td className="table-cell text-center font-medium">{r.nb_comptes}</td>
                      <td className="table-cell text-right font-semibold text-[#1b75bc]">{fmt(r.ca_total)}</td>
                      <td className="table-cell text-center whitespace-nowrap">
                        {r.emplois_actuels} <span className={emploisDelta >= 0 ? 'text-green-600' : 'text-red-600'}>({emploisDelta >= 0 ? '+' : ''}{emploisDelta})</span>
                      </td>
                      <td className="table-cell text-right whitespace-nowrap font-medium" style={{ color: caDelta >= 0 ? '#1B5E20' : '#CC0000' }}>
                        {caDelta >= 0 ? '+' : ''}{fmt(caDelta)}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2 whitespace-nowrap">
                          <button
                            onClick={() => { setRForm({
                              nom: r.nom, pays: r.pays || '', region: r.region || '', ville: r.ville || '', telephone: r.telephone || '',
                              emplois_baseline: r.emplois_baseline || '', masse_salariale_baseline: r.masse_salariale_baseline || '', ca_baseline: r.ca_baseline || '',
                            }); setError(''); setModal({ type: 'edit-rizerie', id: r.id }) }}
                            className="text-xs text-blue-600 font-medium hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteRizerie(r)}
                            className="text-xs text-red-600 font-medium hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET COMPTES ── */}
      {tab === 'comptes' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center gap-3">
            <input
              className="input flex-1 min-w-[200px]"
              placeholder="Rechercher par nom, email, rizerie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-1">
              {[['tous','Tous'], ['actifs','Actifs'], ['suspendus','Suspendus']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === v ? 'bg-[#1b75bc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => { setCForm(COMPTE_INIT); setError(''); setModal({ type: 'create-compte' }) }} className="btn-primary text-sm">
              + Créer un compte
            </button>
          </div>

          <div className="card p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun compte trouvé</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Compte', 'Rizerie', 'CA total', 'Ventes', 'Dernière vente', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 ${u.suspended ? 'bg-red-50' : ''}`}>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">{u.nom}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="table-cell text-sm text-gray-600">
                        {u.rizerie_nom || u.rizerie || <span className="text-gray-300 italic">non rattaché</span>}
                      </td>
                      <td className="table-cell text-right font-medium text-[#1b75bc]">{fmt(u.ca_total)}</td>
                      <td className="table-cell text-center">{u.nb_ventes}</td>
                      <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                        {u.derniere_vente ? fmtDate(u.derniere_vente) : <span className="text-gray-300">jamais</span>}
                      </td>
                      <td className="table-cell">
                        {u.suspended
                          ? <span className="text-xs font-medium text-red-600">🚫 Suspendu</span>
                          : <span className="text-xs font-medium text-green-600">✅ Actif</span>
                        }
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 whitespace-nowrap flex-wrap">
                          {!u.suspended && (
                            <button onClick={() => handleImpersonate(u)}
                              className="text-xs bg-[#1b75bc] text-white px-2 py-1 rounded font-medium hover:bg-[#62bb46]">
                              👁 Accéder
                            </button>
                          )}
                          <Link to={`/admin/users/${u.id}`} className="text-xs text-[#1b75bc] font-medium hover:underline">
                            Détails
                          </Link>
                          {u.suspended
                            ? <button onClick={() => doSuspend(u.id, false, '')} className="text-xs text-green-700 font-medium hover:underline">Réactiver</button>
                            : <button onClick={() => { setModal({ type: 'suspend', user: u }); setSuspendReason(''); setError('') }} className="text-xs text-red-600 font-medium hover:underline">Suspendre</button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ONGLET COMPTES SUPPORT (vrai superadmin uniquement) ── */}
      {tab === 'support' && isSuperadmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setSForm(SUPPORT_INIT); setError(''); setModal({ type: 'create-support' }) }} className="btn-primary text-sm">
              + Créer un compte support
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
            Un compte support a les mêmes accès qu'un superadmin, sauf créer ou supprimer d'autres comptes support — réservé au vrai superadmin.
          </div>
          <div className="card p-0 overflow-x-auto">
            {support.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun compte support créé</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Nom', 'Email', 'Créé le', 'Actions'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {support.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-semibold text-gray-900">{s.nom}</td>
                      <td className="table-cell text-sm text-gray-600">{s.email}</td>
                      <td className="table-cell text-xs text-gray-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                      <td className="table-cell">
                        <div className="flex gap-3">
                          <button onClick={() => { setSForm({ nom: s.nom, email: s.email, password: '' }); setError(''); setModal({ type: 'edit-support', id: s.id }) }}
                            className="text-xs text-blue-600 font-medium hover:underline">Modifier</button>
                          <button onClick={() => handleDeleteSupport(s)} className="text-xs text-red-600 font-medium hover:underline">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ONGLET COMPTES SUPERADMIN (vrai superadmin uniquement) ── */}
      {tab === 'superadmins' && isSuperadmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setSaForm(SUPERADMIN_INIT); setError(''); setModal({ type: 'create-superadmin' }) }} className="btn-primary text-sm">
              + Créer un compte superadmin
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
            Accès le plus élevé de la plateforme : un superadmin peut créer/supprimer des rizeries, des comptes et d'autres superadmins. À réserver à des personnes de pleine confiance. Il doit toujours en rester au moins un.
          </div>
          <div className="card p-0 overflow-x-auto">
            {superadmins.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun compte superadmin créé</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>{['Nom', 'Email', 'Créé le', 'Actions'].map(h => (
                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {superadmins.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-semibold text-gray-900">{s.nom}</td>
                      <td className="table-cell text-sm text-gray-600">{s.email}</td>
                      <td className="table-cell text-xs text-gray-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                      <td className="table-cell">
                        <div className="flex gap-3">
                          <button onClick={() => { setSaForm({ nom: s.nom, email: s.email, password: '' }); setError(''); setModal({ type: 'edit-superadmin', id: s.id }) }}
                            className="text-xs text-blue-600 font-medium hover:underline">Modifier</button>
                          <button onClick={() => handleDeleteSuperadmin(s)} className="text-xs text-red-600 font-medium hover:underline">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal : créer une rizerie */}
      {modal?.type === 'create-rizerie' && (
        <ModalWrap title="Créer une rizerie" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleCreateRizerie} className="space-y-3">
            <div>
              <label className="label">Nom de la rizerie *</label>
              <input className="input" value={rForm.nom} onChange={setR('nom')} required placeholder="Rizerie du Sahel" />
            </div>
            <LocationFields
              pays={rForm.pays} region={rForm.region} ville={rForm.ville}
              onChange={(loc) => setRForm((p) => ({ ...p, ...loc }))}
            />
            <PhoneField
              country={rForm.pays}
              value={rForm.telephone}
              onChange={(v) => setRForm((p) => ({ ...p, telephone: v }))}
            />
            <BaselineFields rForm={rForm} setR={setR} />
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Créer
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : modifier une rizerie */}
      {modal?.type === 'edit-rizerie' && (
        <ModalWrap title="Modifier la rizerie" onClose={() => setModal(null)} error={error}>
          <form onSubmit={async (e) => {
            e.preventDefault(); setSaving(true)
            try {
              await api.put(`/api/admin/rizeries/${modal.id}`, {
                ...rForm,
                emplois_baseline: Number(rForm.emplois_baseline) || 0,
                masse_salariale_baseline: Number(rForm.masse_salariale_baseline) || 0,
                ca_baseline: Number(rForm.ca_baseline) || 0,
              })
              load(); setModal(null)
            }
            catch (err) { setError(err.response?.data?.error || 'Erreur') }
            finally { setSaving(false) }
          }} className="space-y-3">
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={rForm.nom} onChange={setR('nom')} required />
            </div>
            <LocationFields
              pays={rForm.pays} region={rForm.region} ville={rForm.ville}
              onChange={(loc) => setRForm((p) => ({ ...p, ...loc }))}
            />
            <PhoneField
              country={rForm.pays}
              value={rForm.telephone}
              onChange={(v) => setRForm((p) => ({ ...p, telephone: v }))}
            />
            <BaselineFields rForm={rForm} setR={setR} />
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : créer un compte */}
      {modal?.type === 'create-compte' && (
        <ModalWrap title="Créer un compte" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleCreateCompte} className="space-y-3">
            <div>
              <label className="label">Rattacher à une rizerie *</label>
              <select className="input" value={cForm.rizerie_id} onChange={setC('rizerie_id')} required>
                <option value="">Choisir une rizerie...</option>
                {rizeries.map(r => <option key={r.id} value={r.id}>{r.nom}{r.ville ? ` — ${r.ville}` : ''}{r.pays ? ` (${fmtPays(r.pays)})` : ''}</option>)}
              </select>
              {rizeries.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">Aucune rizerie existante. <button type="button" className="underline" onClick={() => { setRForm(RIZERIE_INIT); setError(''); setModal({ type: 'create-rizerie' }) }}>Créer d'abord une rizerie</button></p>
              )}
            </div>
            <div>
              <label className="label">Nom complet *</label>
              <input className="input" value={cForm.nom} onChange={setC('nom')} required placeholder="Mamadou Diallo" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={cForm.email} onChange={setC('email')} required placeholder="email@rizerie.sn" />
            </div>
            <div>
              <label className="label">Mot de passe provisoire *</label>
              <input type="text" className="input" value={cForm.password} onChange={setC('password')} required minLength={12} placeholder="Min. 12 caractères" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PhoneField
                country={rizeries.find((r) => r.id === cForm.rizerie_id)?.pays}
                value={cForm.telephone}
                onChange={(v) => setCForm((p) => ({ ...p, telephone: v }))}
              />
              <div><label className="label">Ville</label><input className="input" value={cForm.ville} onChange={setC('ville')} placeholder="Dakar" /></div>
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

      {/* Modal : créer un compte support */}
      {modal?.type === 'create-support' && (
        <ModalWrap title="Créer un compte support" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleCreateSupport} className="space-y-3">
            <div>
              <label className="label">Nom complet *</label>
              <input className="input" value={sForm.nom} onChange={setS('nom')} required placeholder="Aïssatou Ndiaye" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={sForm.email} onChange={setS('email')} required placeholder="support@pfs.sn" />
            </div>
            <div>
              <label className="label">Mot de passe provisoire *</label>
              <input type="text" className="input" value={sForm.password} onChange={setS('password')} required minLength={12} placeholder="Min. 12 caractères" />
            </div>
            <p className="text-xs text-gray-400">Ce compte aura les mêmes accès admin que vous, à l'exception de la gestion des comptes support.</p>
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

      {/* Modal : créer un compte superadmin */}
      {modal?.type === 'create-superadmin' && (
        <ModalWrap title="Créer un compte superadmin" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleCreateSuperadmin} className="space-y-3">
            <div>
              <label className="label">Nom complet *</label>
              <input className="input" value={saForm.nom} onChange={setSa('nom')} required placeholder="Aïssatou Ndiaye" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={saForm.email} onChange={setSa('email')} required placeholder="admin@pfs.sn" />
            </div>
            <div>
              <label className="label">Mot de passe provisoire *</label>
              <input type="text" className="input" value={saForm.password} onChange={setSa('password')} required minLength={12} placeholder="Min. 12 caractères" />
            </div>
            <p className="text-xs text-red-600">Accès complet à la plateforme, y compris la création/suppression d'autres superadmins. À réserver à des personnes de pleine confiance.</p>
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

      {/* Modal : modifier un compte support */}
      {modal?.type === 'edit-support' && (
        <ModalWrap title="Modifier le compte support" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleEditSupport} className="space-y-3">
            <div><label className="label">Nom complet *</label>
              <input className="input" value={sForm.nom} onChange={setS('nom')} required /></div>
            <div><label className="label">Email *</label>
              <input type="email" className="input" value={sForm.email} onChange={setS('email')} required /></div>
            <div><label className="label">Nouveau mot de passe <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span></label>
              <input type="text" className="input" value={sForm.password} onChange={setS('password')} minLength={12} placeholder="Min. 12 caractères" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'Sauvegarder'}</button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : modifier un compte superadmin */}
      {modal?.type === 'edit-superadmin' && (
        <ModalWrap title="Modifier le compte superadmin" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleEditSuperadmin} className="space-y-3">
            <div><label className="label">Nom complet *</label>
              <input className="input" value={saForm.nom} onChange={setSa('nom')} required /></div>
            <div><label className="label">Email *</label>
              <input type="email" className="input" value={saForm.email} onChange={setSa('email')} required /></div>
            <div><label className="label">Nouveau mot de passe <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span></label>
              <input type="text" className="input" value={saForm.password} onChange={setSa('password')} minLength={12} placeholder="Min. 12 caractères" /></div>
            <p className="text-xs text-red-600">Modification d'un compte à accès complet. Vérifiez bien l'email avant de sauvegarder.</p>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'Sauvegarder'}</button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : export CSV */}
      {modal?.type === 'export' && (
        <ModalWrap title="Exporter des données CSV" onClose={() => setModal(null)} error={error}>
          <form onSubmit={handleExport} className="space-y-3">
            <div>
              <label className="label">Type de données</label>
              <select className="input" value={eForm.type} onChange={setE('type')}>
                <option value="ventes">Ventes</option>
                <option value="clients">Clients</option>
                <option value="emplois">Emplois</option>
              </select>
            </div>
            <div>
              <label className="label">Rizerie</label>
              <select className="input" value={eForm.rizerie_id} onChange={setE('rizerie_id')}>
                <option value="">Toutes les rizeries</option>
                {rizeries.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Période</label>
                <select className="input" value={eForm.periode} onChange={setE('periode')}>
                  <option value="semaine">Semaine</option>
                  <option value="mois">Mois</option>
                  <option value="trimestre">Trimestre</option>
                  <option value="semestre">Semestre</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
              <div>
                <label className="label">Année</label>
                <input type="number" className="input" value={eForm.annee} onChange={setE('annee')} min="2020" max="2030" />
              </div>
            </div>
            {eForm.periode !== 'annuel' && (
              <div>
                <label className="label">
                  {eForm.periode === 'semaine' ? 'N° de semaine (1-52)' :
                   eForm.periode === 'mois' ? 'Mois (1-12)' :
                   eForm.periode === 'trimestre' ? 'Trimestre (1-4)' : 'Semestre (1-2)'}
                </label>
                <input type="number" className="input" value={eForm.valeur} onChange={setE('valeur')}
                  min="1" max={eForm.periode === 'semaine' ? 52 : eForm.periode === 'mois' ? 12 : eForm.periode === 'trimestre' ? 4 : 2} />
              </div>
            )}
            <p className="text-xs text-gray-400">Le fichier CSV est encodé UTF-8 avec BOM (compatible Excel).</p>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Télécharger
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Modal : suspendre */}
      {modal?.type === 'suspend' && (
        <ModalWrap title={`Suspendre : ${modal.user.nom}`} onClose={() => setModal(null)} error={error}>
          <p className="text-sm text-gray-600 mb-3">L'utilisateur ne pourra plus se connecter.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Non-paiement', 'Compte dupliqué', 'Activité suspecte', 'Contrat résilié', 'Demande utilisateur'].map(r => (
              <button key={r} onClick={() => setSuspendReason(r)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${suspendReason === r ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea className="input resize-none" rows={2} placeholder="Ou précise une raison personnalisée..."
            value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          <div className="flex gap-3 mt-4">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Annuler</button>
            <button disabled={saving} onClick={() => doSuspend(modal.user.id, true, suspendReason)}
              className="btn-danger flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirmer
            </button>
          </div>
        </ModalWrap>
      )}
    </div>
  )
}

function BaselineFields({ rForm, setR }) {
  return (
    <div className="border-t border-gray-100 pt-3">
      <p className="text-xs text-gray-500 mb-2">
        Photo de départ : nombre d'emplois, masse salariale et CA actuels de la rizerie, pour suivre la création d'emplois et l'évolution du CA dans le temps.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Emplois actuels</label>
          <input type="number" min="0" className="input" value={rForm.emplois_baseline} onChange={setR('emplois_baseline')} />
        </div>
        <div>
          <label className="label">Masse salariale (F/mois)</label>
          <input type="number" min="0" className="input" value={rForm.masse_salariale_baseline} onChange={setR('masse_salariale_baseline')} />
        </div>
        <div>
          <label className="label">CA actuel (F)</label>
          <input type="number" min="0" className="input" value={rForm.ca_baseline} onChange={setR('ca_baseline')} />
        </div>
      </div>
    </div>
  )
}

function ModalWrap({ title, onClose, error, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
