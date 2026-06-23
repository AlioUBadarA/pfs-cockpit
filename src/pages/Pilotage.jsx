import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const pct = (n) => n != null ? Number(n).toFixed(1) + ' %' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : 'jamais'

function getWeekKey(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

function buildDefaultRows() {
  return JOURS.map((j) => ({
    jour: j, zone: '', clients_visiter: '', objectif: '', realise: '', note: '',
  }))
}

const STATUT_COLOR = { Actif: '#1B5E20', Prospect: '#F9A825', Dormant: '#8a7f6e' }
const PROSPECT_COLOR = { Nouveau: '#8a7f6e', Qualifié: '#1b75bc', Proposition: '#6b46c1', Négociation: '#F9A825', Gagné: '#1B5E20', Perdu: '#CC0000' }

export default function Pilotage() {
  const [semaine, setSemaine] = useState(getWeekKey())
  const [rows, setRows] = useState(buildDefaultRows())
  const [visites, setVisites] = useState([])
  const [clients, setClients] = useState([])
  const [prospects, setProspects] = useState([])
  const [actions, setActions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingActions, setSavingActions] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pickerJour, setPickerJour] = useState(null)
  const [pickerTab, setPickerTab] = useState('clients')
  const [pickerSearch, setPickerSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/pilotage/${semaine}`),
      api.get(`/api/pilotage/${semaine}/actions`),
      api.get(`/api/pilotage/${semaine}/visites`),
      api.get('/api/clients'),
      api.get('/api/prospection'),
    ])
      .then(([joursRes, actionsRes, visitesRes, clientsRes, prospectsRes]) => {
        const jours = joursRes.data
        setRows(Array.isArray(jours) && jours.length ? jours : buildDefaultRows())
        setActions(actionsRes.data?.contenu || '')
        setVisites(visitesRes.data || [])
        setClients(clientsRes.data || [])
        setProspects((prospectsRes.data || []).filter((p) => p.statut !== 'Gagné' && p.statut !== 'Perdu'))
      })
      .catch(() => {
        setRows(buildDefaultRows())
        setActions('')
      })
      .finally(() => setLoading(false))
  }, [semaine])

  useEffect(() => { load() }, [load])

  const updateRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const ecart = (row) => {
    const obj = Number(row.objectif) || 0
    const real = Number(row.realise) || 0
    return real - obj
  }

  const totalObjectif = rows.reduce((s, r) => s + (Number(r.objectif) || 0), 0)
  const totalRealise = rows.reduce((s, r) => s + (Number(r.realise) || 0), 0)
  const totalEcart = totalRealise - totalObjectif
  const tauxExec = totalObjectif > 0 ? (totalRealise / totalObjectif) * 100 : 0

  const saveSemaine = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/api/pilotage/${semaine}`, { semaine, jours: rows })
      setSuccess('Semaine enregistrée avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const saveActions = async () => {
    setSavingActions(true)
    setError('')
    try {
      await api.put(`/api/pilotage/${semaine}/actions`, { contenu: actions })
      setSuccess('Actions correctives enregistrées')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError("Erreur d'enregistrement des actions")
    } finally {
      setSavingActions(false)
    }
  }

  const openPicker = (jour) => {
    setPickerJour(jour)
    setPickerSearch('')
    setPickerTab('clients')
  }

  const addVisite = async (item, type) => {
    try {
      const body = { jour: pickerJour, commentaire: '' }
      if (type === 'client') body.client_id = item.id
      else body.prospect_id = item.id
      const r = await api.post(`/api/pilotage/${semaine}/visites`, body)
      setVisites((prev) => [...prev, {
        ...r.data,
        client_nom: type === 'client' ? item.nom : null,
        client_statut: type === 'client' ? item.statut : null,
        client_zone: type === 'client' ? item.zone : null,
        client_telephone: type === 'client' ? item.telephone : null,
        client_type: type === 'client' ? item.type : null,
        client_ca_total: type === 'client' ? 0 : null,
        client_derniere_vente: type === 'client' ? null : null,
        prospect_nom: type === 'prospect' ? item.nom : null,
        prospect_statut: type === 'prospect' ? item.statut : null,
        prospect_zone: type === 'prospect' ? item.zone : null,
        prospect_telephone: type === 'prospect' ? item.telephone : null,
        prospect_valeur_estimee: type === 'prospect' ? item.valeur_estimee : null,
        prospect_priorite: type === 'prospect' ? item.priorite : null,
      }])
      setPickerJour(null)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout")
    }
  }

  const updateCommentaire = (id, commentaire) => {
    setVisites((prev) => prev.map((v) => v.id === id ? { ...v, commentaire } : v))
  }

  const saveCommentaire = async (v) => {
    try {
      await api.put(`/api/pilotage/visites/${v.id}`, { commentaire: v.commentaire })
    } catch {
      setError('Erreur sauvegarde du commentaire')
    }
  }

  const deleteVisite = async (id) => {
    try {
      await api.delete(`/api/pilotage/visites/${id}`)
      setVisites((prev) => prev.filter((v) => v.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  const filteredClients = clients.filter((c) => c.nom.toLowerCase().includes(pickerSearch.toLowerCase()))
  const filteredProspects = prospects.filter((p) => p.nom.toLowerCase().includes(pickerSearch.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-gray-900">Pilotage hebdomadaire</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Semaine du</label>
          <input
            type="date"
            className="input w-auto text-sm"
            value={semaine}
            onChange={(e) => setSemaine(getWeekKey(e.target.value))}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Objectif semaine" value={fmt(totalObjectif)} icon="🎯" color="#1b75bc" />
        <KpiCard title="Réalisé" value={fmt(totalRealise)} icon="✅" color="#62bb46" />
        <KpiCard title="Écart" value={fmt(totalEcart)} icon={totalEcart >= 0 ? '📈' : '📉'} color={totalEcart >= 0 ? '#1b75bc' : '#CC0000'} />
        <KpiCard title="Taux d'exécution" value={pct(tauxExec)} icon="📊" color={tauxExec >= 80 ? '#1b75bc' : '#F9A825'} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, i) => {
            const e = ecart(row)
            const jourVisites = visites.filter((v) => v.jour === row.jour)
            return (
              <div key={row.jour} className="card">
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
                  <span className="font-display text-base font-semibold text-gray-800 w-24 flex-none">{row.jour}</span>
                  <input
                    className="input w-auto flex-1 min-w-[120px] py-1.5 text-sm"
                    value={row.zone}
                    onChange={(e) => updateRow(i, 'zone', e.target.value)}
                    placeholder="Zone / marché..."
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Objectif</span>
                    <input
                      type="number" min="0" className="input w-28 py-1.5 text-sm text-right"
                      value={row.objectif} onChange={(e) => updateRow(i, 'objectif', e.target.value)} placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Réalisé</span>
                    <input
                      type="number" min="0" className="input w-28 py-1.5 text-sm text-right"
                      value={row.realise} onChange={(e) => updateRow(i, 'realise', e.target.value)} placeholder="0"
                    />
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${e >= 0 ? 'text-[#1b75bc]' : 'text-[#CC0000]'}`}>
                    {row.objectif !== '' || row.realise !== '' ? `${e >= 0 ? '+' : ''}${e.toLocaleString('fr-FR')} F` : '-'}
                  </span>
                </div>

                <div className="pt-3 flex flex-col gap-2">
                  {jourVisites.length === 0 ? (
                    <p className="text-xs text-gray-400 py-1">Aucune visite planifiée ce jour.</p>
                  ) : jourVisites.map((v) => {
                    const isClient = !!v.client_id
                    const nom = isClient ? v.client_nom : v.prospect_nom
                    const statut = isClient ? v.client_statut : v.prospect_statut
                    const zone = isClient ? v.client_zone : v.prospect_zone
                    const tel = isClient ? v.client_telephone : v.prospect_telephone
                    const color = isClient ? (STATUT_COLOR[statut] || '#8a7f6e') : (PROSPECT_COLOR[statut] || '#8a7f6e')
                    return (
                      <div key={v.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/60">
                        <div className="flex-none w-44 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: isClient ? '#1b75bc1a' : '#F9A8251a', color: isClient ? '#1b75bc' : '#F9A825' }}>
                              {isClient ? 'Client' : 'Prospect'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{nom}</p>
                          <p className="text-[11px] mt-0.5" style={{ color }}>{statut}</p>
                        </div>
                        <div className="flex-none w-40 text-[11px] text-gray-500 leading-tight">
                          {zone && <p>📍 {zone}</p>}
                          {tel && <p>📞 {tel}</p>}
                          {isClient ? (
                            <p>{v.client_ca_total > 0 ? `${fmt(v.client_ca_total)} · dernier achat ${fmtDate(v.client_derniere_vente)}` : 'Pas encore acheté'}</p>
                          ) : (
                            <p>{v.prospect_valeur_estimee ? `Espéré : ${fmt(v.prospect_valeur_estimee)}` : ''} {v.prospect_priorite ? `· ${v.prospect_priorite}` : ''}</p>
                          )}
                        </div>
                        <input
                          className="flex-1 min-w-0 input py-1.5 text-sm"
                          placeholder="Action à poser (ex: relancer, proposer une remise...)"
                          value={v.commentaire || ''}
                          onChange={(e) => updateCommentaire(v.id, e.target.value)}
                          onBlur={() => saveCommentaire(v)}
                        />
                        <button onClick={() => deleteVisite(v.id)} className="text-xs text-red-500 hover:text-red-700 flex-none mt-1.5">✕</button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => openPicker(row.jour)}
                    className="text-xs font-medium self-start mt-1"
                    style={{ color: 'var(--cc-accent)' }}
                  >
                    + Ajouter une visite
                  </button>
                </div>
              </div>
            )
          })}

          <div className="card flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
            <span className="font-semibold text-sm text-gray-700">Total semaine</span>
            <div className="flex gap-6 text-sm">
              <span>Objectif : <strong>{fmt(totalObjectif)}</strong></span>
              <span>Réalisé : <strong>{fmt(totalRealise)}</strong></span>
              <span className={totalEcart >= 0 ? 'text-[#1b75bc]' : 'text-[#CC0000]'}>
                Écart : <strong>{totalEcart >= 0 ? '+' : ''}{fmt(totalEcart)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={saveSemaine} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? 'Enregistrement...' : 'Sauvegarder la semaine'}
        </button>
      </div>

      {/* Actions correctives */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions correctives</h3>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Décrire les actions correctives pour cette semaine..."
          value={actions}
          onChange={(e) => setActions(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button onClick={saveActions} disabled={savingActions} className="btn-secondary flex items-center gap-2 text-sm">
            {savingActions && <span className="w-4 h-4 border-2 border-[#1b75bc] border-t-transparent rounded-full animate-spin" />}
            {savingActions ? 'Enregistrement...' : 'Sauvegarder les actions'}
          </button>
        </div>
      </div>

      {/* Picker client/prospect */}
      <Modal open={!!pickerJour} onClose={() => setPickerJour(null)} title={`Ajouter une visite — ${pickerJour}`}>
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Rechercher un nom..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPickerTab('clients')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md border ${pickerTab === 'clients' ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
              style={pickerTab === 'clients' ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
            >
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setPickerTab('prospects')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md border ${pickerTab === 'prospects' ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
              style={pickerTab === 'prospects' ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
            >
              Prospects ({prospects.length})
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5 -mx-1 px-1">
            {pickerTab === 'clients' ? (
              filteredClients.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Aucun client trouvé.</p> :
              filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addVisite(c, 'client')}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-[var(--cc-accent)] text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                    <p className="text-[11px] text-gray-400">{c.zone || 'Zone n/a'} · {c.type}</p>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: STATUT_COLOR[c.statut] || '#8a7f6e' }}>{c.statut}</span>
                </button>
              ))
            ) : (
              filteredProspects.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Aucun prospect trouvé.</p> :
              filteredProspects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addVisite(p, 'prospect')}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-[var(--cc-accent)] text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nom}</p>
                    <p className="text-[11px] text-gray-400">{p.zone || p.region || 'Zone n/a'}</p>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: PROSPECT_COLOR[p.statut] || '#8a7f6e' }}>{p.statut}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
