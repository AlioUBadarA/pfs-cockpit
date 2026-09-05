import { Fragment, useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import DataTable from '../components/DataTable'
import KpiCard from '../components/KpiCard'
import KebabMenu from '../components/KebabMenu'
import RoleBadge from '../components/RoleBadge'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

const EDIT_INIT   = { nom: '', email: '', telephone: '' }
const CREATE_INIT = { nom: '', email: '', password: '', telephone: '', role: 'vendeur', zone: '', manager_id: '' }
const COLS   = ['Commercial', 'Obj./mois', 'Obj./an', 'Réalisé YTD', 'Écart', 'Atteinte', 'Projection', 'Marge nette', 'Activité', 'Créances', 'Actions']
const ALIGNS = ['left', 'right', 'right', 'right', 'right', 'left', 'right', 'right', 'left', 'right', 'center']

function TauxBadge({ taux }) {
  const color = taux >= 100 ? '#1B5E20' : taux >= 80 ? '#F9A825' : '#CC0000'
  return (
    <div className="flex items-center gap-2">
      <div className="bar-row-track flex-1 min-w-[50px]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, taux)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums min-w-[38px] text-right" style={{ color }}>{Math.round(taux)}%</span>
    </div>
  )
}

function TauxBadgeSm({ taux }) {
  const color = taux >= 100 ? '#1B5E20' : taux >= 80 ? '#F9A825' : '#CC0000'
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}1a`, color }}>{Math.round(taux)} %</span>
}

function EquipeRow({ cells, aligns, highlighted }) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${highlighted ? 'bg-blue-50/50' : ''}`}>
      {cells.map((cell, ci) => {
        const align = aligns[ci]
        if (cell && typeof cell === 'object' && !Array.isArray(cell) && 'v' in cell) {
          return (
            <td key={ci} className="table-cell tabular-nums" style={{ textAlign: align, color: cell.c, fontWeight: cell.bold ? 700 : undefined }}>
              <div>{cell.v}</div>
              {cell.sub && <div className="text-[10.5px] mt-0.5" style={{ color: '#a39988' }}>{cell.sub}</div>}
            </td>
          )
        }
        return <td key={ci} className="table-cell tabular-nums" style={{ textAlign: align }}>{cell}</td>
      })}
    </tr>
  )
}

export default function Equipe() {
  const { isManager, isDirecteur, isRizier } = useAuth()
  // superadmin exclu : cette page est bloquée pour lui par ManagerRoute (redirigé vers /admin).
  const canPromote = isDirecteur || isRizier
  const canAssign  = canPromote

  const [vendeurs, setVendeurs]     = useState([])
  const [managers, setManagers]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [openMenu, setOpenMenu]     = useState(null)
  const [pwdModal, setPwdModal]     = useState(null)
  const [editModal, setEditModal]   = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [teamModal, setTeamModal]   = useState(null)
  const [form, setForm]             = useState(EDIT_INIT)
  const [cForm, setCForm]           = useState(CREATE_INIT)
  const [newPwd, setNewPwd]         = useState('')
  const [assignMgr, setAssignMgr]   = useState('')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/equipe'),
      isManager ? Promise.resolve({ data: [] }) : api.get('/api/managers').catch(() => ({ data: [] })),
    ])
      .then(([eq, mg]) => { setVendeurs(eq.data); setManagers(mg.data) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [isManager])

  useEffect(() => { load() }, [load])

  const set  = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  const setC = (f) => (e) => setCForm(p => ({ ...p, [f]: e.target.value }))

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.put(`/api/equipe/${editModal.id}`, { nom: form.nom, email: form.email, telephone: form.telephone })
      setEditModal(null); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handlePwd = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.patch(`/api/equipe/${pwdModal.id}/password`, { new_password: newPwd })
      setPwdModal(null); setNewPwd('')
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleForcePwd = async (v) => {
    setSaving(true); setError('')
    try {
      await api.patch(`/api/equipe/${v.id}/force-password-change`)
      load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/api/equipe', cForm)
      setCreateOpen(false); setCForm(CREATE_INIT); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleAssignManager = async (e) => {
    e.preventDefault()
    if (!assignMgr) return
    setSaving(true); setError('')
    try {
      await api.patch(`/api/equipe/${assignModal.id}/manager`, { manager_id: assignMgr })
      setAssignModal(null); load()
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const openEdit = (v) => { setForm({ nom: v.nom, email: v.email, telephone: v.telephone || '' }); setError(''); setEditModal(v) }

  const deleteUser = async (id) => {
    if (!confirm('Supprimer ce compte ? Les données (ventes, clients) seront conservées.')) return
    try {
      await api.delete(`/api/equipe/${id}`)
      setVendeurs(prev => prev.filter(v => v.id !== id))
    } catch { setError('Erreur suppression') }
  }

  const handlePromote = async (v) => {
    if (!confirm(`Promouvoir ${v.nom} au rang de Manager ?\nIl pourra désormais gérer une équipe.`)) return
    try { await api.patch(`/api/equipe/${v.id}/role`, { role: 'manager' }); load() }
    catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const openAssign = (v) => {
    setAssignMgr(v.parent_id && managers.some(m => m.id === v.parent_id) ? v.parent_id : '')
    setError(''); setAssignModal(v)
  }

  const openTeamView = (mgRow) => {
    const mgData = managers.find(m => m.id === mgRow.id)
    setTeamModal(mgData || {
      ...mgRow, team: [], nb_com: 0,
      ca_ytd: mgRow.ca_total || 0, obj_annuel: mgRow.objectif_annuel || 0,
      taux_atteinte: mgRow.taux_atteinte || 0, forecast: mgRow.forecast || 0,
      marge: mgRow.marge || 0, creances: mgRow.creances || 0,
    })
  }

  // Groupement par manager
  const managerRows  = vendeurs.filter(v => v.role === 'manager')
  const othersRows   = vendeurs.filter(v => v.role !== 'manager')
  const managerById  = Object.fromEntries(managerRows.map(m => [m.id, m]))
  const groupsByMgr  = {}
  const noMgrList    = []
  othersRows.forEach(v => {
    if (v.parent_id && managerById[v.parent_id]) {
      if (!groupsByMgr[v.parent_id]) groupsByMgr[v.parent_id] = []
      groupsByMgr[v.parent_id].push(v)
    } else {
      noMgrList.push(v)
    }
  })

  const objAnnuelGroupe    = vendeurs.reduce((s, v) => s + Number(v.objectif_annuel || 0), 0)
  const caYTDGroupe        = vendeurs.reduce((s, v) => s + Number(v.ca_total || 0), 0)
  const tauxAtteinteGroupe = objAnnuelGroupe > 0 ? caYTDGroupe / (objAnnuelGroupe / 12 * (new Date().getMonth() + 1)) * 100 : 0
  const forecastGroupe     = vendeurs.reduce((s, v) => s + Number(v.forecast || 0), 0)

  const vendeurActions = (v) => [
    { icon: '✏️', label: 'Éditer', onClick: () => openEdit(v) },
    { icon: '🔑', label: 'Mot de passe', onClick: () => { setPwdModal(v); setNewPwd(''); setError('') } },
    ...(v.must_change_password
      ? [{ icon: '⏳', label: 'Changement déjà forcé', disabled: true }]
      : [{ icon: '⚠️', label: 'Forcer le changement', onClick: () => handleForcePwd(v) }]),
    ...(canAssign && managers.length > 0 && v.role === 'vendeur' ? [{
      icon: '👥',
      label: v.manager_nom ? 'Réassigner manager' : 'Assigner un manager',
      onClick: () => openAssign(v),
    }] : []),
    ...(canPromote && v.role === 'vendeur' ? [{ icon: '⭐', label: 'Promouvoir manager', onClick: () => handlePromote(v) }] : []),
    { icon: '🗑️', label: 'Supprimer', danger: true, onClick: () => deleteUser(v.id) },
  ]

  const managerActions = (m) => [
    { icon: '👁️', label: "Voir l'équipe", onClick: () => openTeamView(m) },
    { icon: '✏️', label: 'Éditer', onClick: () => openEdit(m) },
    { icon: '🔑', label: 'Mot de passe', onClick: () => { setPwdModal(m); setNewPwd(''); setError('') } },
    ...(m.must_change_password
      ? [{ icon: '⏳', label: 'Changement déjà forcé', disabled: true }]
      : [{ icon: '⚠️', label: 'Forcer le changement', onClick: () => handleForcePwd(m) }]),
    { icon: '🗑️', label: 'Supprimer', danger: true, onClick: () => deleteUser(m.id) },
  ]

  const makeRow = (v, isMgr = false) => [
    isMgr
      ? { v: <span className="flex items-center gap-1.5"><span className="font-semibold text-blue-900">{v.nom}</span><RoleBadge role={v.role} /></span>, sub: v.zone ? `Zone ${v.zone}` : '' }
      : { v: <span className="flex items-center gap-1.5"><span>{v.nom}</span><RoleBadge role={v.role} /></span>, sub: v.email },
    fmt(v.objectif_mensuel),
    fmt(v.objectif_annuel),
    { v: fmt(v.ca_total), bold: true },
    { v: (v.ecart >= 0 ? '+' : '') + fmt(v.ecart), c: v.ecart >= 0 ? '#1B5E20' : '#CC0000' },
    { v: <TauxBadge taux={v.taux_atteinte} /> },
    fmt(v.forecast),
    { v: fmt(v.marge), sub: v.ca_total ? `${Math.round(v.marge / v.ca_total * 100)} %` : '' },
    { v: `${v.nb_clients} cli.`, sub: `${v.nb_ventes} cmd` },
    { v: fmt(v.creances), c: v.creances > 0 ? '#CC0000' : '#8a7f6e' },
    {
      v: (
        <KebabMenu
          menuKey={v.id}
          open={openMenu === v.id}
          onToggle={setOpenMenu}
          items={isMgr ? managerActions(v) : vendeurActions(v)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Commerciaux</h2>
          <p className="text-sm text-gray-500 mt-0.5">Objectif · réalisé · écart · forecast · marge · créances</p>
        </div>
        <button onClick={() => { setCForm(CREATE_INIT); setError(''); setCreateOpen(true) }} className="btn-primary text-sm">
          + Créer un commercial
        </button>
      </div>

      {error && !editModal && !pwdModal && !createOpen && !assignModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Équipe commerciale" value={vendeurs.length} sub={`${managers.length} manager(s)`} color="#1b75bc" />
        <KpiCard title="Objectif groupe" value={fmt(objAnnuelGroupe)} sub="annuel cumulé" />
        <KpiCard title="Réalisé YTD" value={fmt(caYTDGroupe)} sub={`${Math.round(tauxAtteinteGroupe)} % d'atteinte`} color={tauxAtteinteGroupe >= 100 ? '#1B5E20' : '#F9A825'} />
        <KpiCard title="Projection groupe" value={fmt(forecastGroupe)} sub="projection fin d'année" />
      </div>

      <Panel title="Performance individuelle" sub="trié par équipe · objectif · réalisé · écart · forecast · marge · créances">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendeurs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Aucun commercial dans votre équipe pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -m-1">
            <table className="w-full border-collapse p-1">
              <thead>
                <tr>
                  {COLS.map((h, i) => (
                    <th key={h} className="table-header" style={{ textAlign: ALIGNS[i] }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {managerRows.map(m => (
                  <Fragment key={m.id}>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td colSpan={COLS.length} className="px-3 py-1">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          Équipe de {m.nom}
                          {m.zone && <span className="font-normal normal-case tracking-normal text-blue-500"> · Zone {m.zone}</span>}
                          <span className="font-normal normal-case tracking-normal text-blue-400"> · {groupsByMgr[m.id]?.length || 0} commercial(aux)</span>
                        </span>
                      </td>
                    </tr>
                    <EquipeRow cells={makeRow(m, true)} aligns={ALIGNS} highlighted />
                    {(groupsByMgr[m.id] || []).map(v => (
                      <EquipeRow key={v.id} cells={makeRow(v)} aligns={ALIGNS} />
                    ))}
                  </Fragment>
                ))}

                {noMgrList.length > 0 && (
                  <>
                    {managerRows.length > 0 && (
                      <tr className="bg-gray-100 border-t-2 border-gray-200">
                        <td colSpan={COLS.length} className="px-3 py-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Sans manager
                            <span className="font-normal normal-case tracking-normal text-gray-400"> · {noMgrList.length} commercial(aux)</span>
                          </span>
                        </td>
                      </tr>
                    )}
                    {noMgrList.map(v => (
                      <EquipeRow key={v.id} cells={makeRow(v, v.role === 'directeur')} aligns={ALIGNS} highlighted={v.role === 'directeur'} />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal créer commercial/manager */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un commercial">
        <form onSubmit={handleCreate} className="space-y-4">
          {!isManager && (
            <div>
              <label className="label">Rôle</label>
              <select
                className="input"
                value={cForm.role}
                onChange={(e) => {
                  const newRole = e.target.value
                  setCForm(p => ({ ...p, role: newRole, manager_id: newRole === 'manager' ? '' : p.manager_id }))
                }}
              >
                <option value="vendeur">Commercial (vendeur)</option>
                <option value="manager">Manager</option>
                {isRizier && <option value="directeur">Directeur</option>}
              </select>
            </div>
          )}
          {cForm.role === 'manager' && (
            <div>
              <label className="label">Zone</label>
              <input className="input" value={cForm.zone} onChange={setC('zone')} placeholder="Ex: Dakar Nord" />
            </div>
          )}
          {cForm.role === 'vendeur' && !isManager && managers.length > 0 && (
            <div>
              <label className="label">Rattacher à un manager (optionnel)</label>
              <select className="input" value={cForm.manager_id} onChange={setC('manager_id')}>
                <option value="">Aucun (rattaché directement à moi)</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.zone ? ` (${m.zone})` : ''}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Nom complet *</label>
            <input className="input" value={cForm.nom} onChange={setC('nom')} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={cForm.email} onChange={setC('email')} required />
          </div>
          <div>
            <label className="label">Mot de passe provisoire *</label>
            <input type="text" className="input" value={cForm.password} onChange={setC('password')} required minLength={12} placeholder="Min. 12 caractères" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={cForm.telephone} onChange={setC('telephone')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setCreateOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Création...' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal éditer */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Modifier : ${editModal?.nom}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" value={form.nom} onChange={set('nom')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.telephone} onChange={set('telephone')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setEditModal(null)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Mise à jour...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal mot de passe */}
      <Modal open={!!pwdModal} onClose={() => setPwdModal(null)} title={`Mot de passe : ${pwdModal?.nom}`}>
        <form onSubmit={handlePwd} className="space-y-4">
          <div>
            <label className="label">Nouveau mot de passe *</label>
            <input type="password" className="input" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={12} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setPwdModal(null)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'Mettre à jour'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal assigner / réassigner manager */}
      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={assignModal?.manager_nom ? `Réassigner ${assignModal?.nom}` : `Assigner ${assignModal?.nom} à un manager`}
      >
        <form onSubmit={handleAssignManager} className="space-y-4">
          <p className="text-sm text-gray-600">
            {assignModal?.manager_nom
              ? <>Actuellement dans l'équipe de <strong>{assignModal.manager_nom}</strong>.</>
              : `${assignModal?.nom} n'est rattaché à aucun manager.`}
          </p>
          <div>
            <label className="label">Nouveau manager *</label>
            <select className="input" value={assignMgr} onChange={e => setAssignMgr(e.target.value)} required>
              <option value="">-- Choisir un manager --</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.nom}{m.zone ? ` · Zone ${m.zone}` : ''}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setAssignModal(null)}>Annuler</button>
            <button type="submit" disabled={saving || !assignMgr} className="btn-primary flex-1">
              {saving ? '...' : assignModal?.manager_nom ? 'Réassigner' : 'Assigner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal voir équipe du manager */}
      <Modal open={!!teamModal} onClose={() => setTeamModal(null)} title={`Équipe de ${teamModal?.nom}`} width="max-w-4xl">
        {teamModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <KpiCard title="CA cumulé YTD" value={fmt(teamModal.ca_ytd)} sub={`objectif ${fmt(teamModal.obj_annuel)}`} color="#1b75bc" />
              <KpiCard
                title="Atteinte"
                value={`${Math.round(teamModal.taux_atteinte)} %`}
                color={teamModal.taux_atteinte >= 100 ? '#1B5E20' : teamModal.taux_atteinte >= 90 ? '#F9A825' : '#CC0000'}
              />
              <KpiCard title="Projection" value={fmt(teamModal.forecast)} sub={teamModal.obj_annuel ? `${Math.round(teamModal.forecast / teamModal.obj_annuel * 100)} % / obj` : ''} />
              <KpiCard title="Marge nette" value={fmt(teamModal.marge)} />
              <KpiCard title="Créances équipe" value={fmt(teamModal.creances)} color="#CC0000" />
            </div>
            {teamModal.team && teamModal.team.length > 0 ? (
              <DataTable
                headers={['Commercial', 'Objectif annuel', 'Réalisé YTD', 'Écart', 'Atteinte', 'Projection', 'Marge']}
                rows={teamModal.team.map(p => [
                  p.nom,
                  fmt(p.obj_annuel),
                  fmt(p.ca_ytd),
                  { v: (p.ecart >= 0 ? '+' : '') + fmt(p.ecart), c: p.ecart >= 0 ? '#1B5E20' : '#CC0000' },
                  { v: <TauxBadgeSm taux={p.taux_atteinte} /> },
                  fmt(p.forecast),
                  fmt(p.marge),
                ])}
                align={['left', 'right', 'right', 'right', 'left', 'right', 'right']}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucun commercial dans cette équipe.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
