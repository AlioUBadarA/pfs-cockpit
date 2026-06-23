import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import BarList from '../components/BarList'
import KpiCard from '../components/KpiCard'

const STATUTS   = ['Nouveau','Qualifié','Proposition','Négociation','Gagné','Perdu']
const PRIORITES = ['Haute','Normale','Basse']
const TYPES     = ['Grossiste','Detaillant marche','Boutique','Restauration','Cantine/Institution']
const SOURCES   = ['Recommandation','Marché','Réseau','Appel entrant','Visite terrain','Autre']

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

const statutColor = (s) => ({
  'Nouveau':     'bg-gray-100 text-gray-700',
  'Qualifié':    'bg-blue-100 text-blue-700',
  'Proposition': 'bg-purple-100 text-purple-700',
  'Négociation': 'bg-yellow-100 text-yellow-700',
  'Gagné':       'bg-green-100 text-green-700',
  'Perdu':       'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-700')

const INIT = {
  nom: '', type_client: '', zone: '', region: '', source: '', telephone: '',
  statut: 'Nouveau', priorite: 'Normale', date_contact: '', note: '', valeur_estimee: '',
}

export default function Prospection() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(INIT)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filterStatut) params.statut = filterStatut
    api.get('/api/prospection', { params })
      .then(r => setItems(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [filterStatut])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm(INIT)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      nom:          item.nom,
      type_client:  item.type_client || '',
      zone:         item.zone || '',
      region:       item.region || '',
      source:       item.source || '',
      telephone:    item.telephone || '',
      statut:       item.statut,
      priorite:     item.priorite || 'Normale',
      date_contact: item.date_contact ? item.date_contact.slice(0, 10) : '',
      note:         item.note || '',
      valeur_estimee: item.valeur_estimee || '',
    })
    setModalOpen(true)
  }

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        date_contact: form.date_contact || null,
        valeur_estimee: Number(form.valeur_estimee) || 0,
      }
      if (editing) {
        await api.put(`/api/prospection/${editing.id}`, payload)
      } else {
        await api.post('/api/prospection', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Supprimer ce prospect ?')) return
    try {
      await api.delete(`/api/prospection/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      setError('Erreur suppression')
    }
  }

  const changeStatut = async (id, statut) => {
    try {
      await api.patch(`/api/prospection/${id}/statut`, { statut })
      setItems(prev => prev.map(i => i.id === id ? { ...i, statut } : i))
    } catch {
      setError('Erreur mise à jour')
    }
  }

  const stats = STATUTS.reduce((acc, s) => {
    acc[s] = items.filter(i => i.statut === s).length
    return acc
  }, {})

  const ouverts = items.filter(i => i.statut !== 'Gagné' && i.statut !== 'Perdu')
  const valeurPipeline = ouverts.reduce((s, i) => s + Number(i.valeur_estimee || 0), 0)
  const gagnes = items.filter(i => i.statut === 'Gagné').length
  const perdus = items.filter(i => i.statut === 'Perdu').length
  const tauxConversion = (gagnes + perdus) ? Math.round((gagnes / (gagnes + perdus)) * 100) : 0

  const funnel = ['Nouveau','Qualifié','Proposition','Négociation'].map(s => {
    const list = items.filter(i => i.statut === s)
    const val = list.reduce((a, i) => a + Number(i.valeur_estimee || 0), 0)
    return { label: s, val: val || list.length, disp: `${fmt(val)} · ${list.length}` }
  })

  const bySrc = {}
  items.forEach((i) => { const s = i.source || 'Autre'; bySrc[s] = (bySrc[s] || 0) + 1 })
  const srcArr = Object.entries(bySrc).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, val: v, disp: `${v} prospect(s)` }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Pipeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des prospects par étape</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouveau prospect</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Prospects en cours" value={ouverts.length} color="#1b75bc" />
        <KpiCard title="Valeur espérée" value={fmt(valeurPipeline)} color="#1565C0" />
        <KpiCard title="Taux de signature" value={`${tauxConversion} %`} color="#62bb46" />
        <KpiCard title="Gagnés / Perdus" value={`${gagnes} / ${perdus}`} color="#F9A825" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Prospects par étape" sub="valeur espérée · nombre de prospects">
          <BarList items={funnel} labelWidth="120px" color="#5a6b7a" dense />
        </Panel>
        <Panel title="Prospects par origine">
          <BarList items={srcArr} labelWidth="140px" color="#7a6a52" dense />
        </Panel>
      </div>

      {/* Résumé pipeline */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUTS.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatut(filterStatut === s ? '' : s)}
            className={`card text-center py-2 px-1 cursor-pointer border-2 transition-all ${filterStatut === s ? 'border-[#1b75bc]' : 'border-transparent'}`}
          >
            <p className="text-lg font-bold text-gray-800">{stats[s] || 0}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{s}</p>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun prospect trouvé</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Prospect','Région','Origine','Valeur espérée','Priorité','Statut','Contact','Vendeur','Actions'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{item.nom}<div className="text-[10.5px] text-gray-400">{item.zone}</div></td>
                  <td className="table-cell text-xs text-gray-600">{item.region || '-'}</td>
                  <td className="table-cell text-xs text-gray-500">{item.source || '-'}</td>
                  <td className="table-cell text-right text-xs font-semibold text-[#1b75bc]">{fmt(item.valeur_estimee)}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.priorite === 'Haute' ? 'bg-red-100 text-red-700' :
                      item.priorite === 'Basse' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'}`}>
                      {item.priorite}
                    </span>
                  </td>
                  <td className="table-cell">
                    <select
                      value={item.statut}
                      onChange={e => changeStatut(item.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statutColor(item.statut)}`}
                    >
                      {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="table-cell text-xs whitespace-nowrap">
                    {item.date_contact ? new Date(item.date_contact).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="table-cell text-xs text-gray-500">{item.vendeur_nom || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le prospect' : 'Nouveau prospect'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom du prospect *</label>
            <input className="input" value={form.nom} onChange={set('nom')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type de client</label>
              <select className="input" value={form.type_client} onChange={set('type_client')}>
                <option value="">Choisir...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priorité</label>
              <select className="input" value={form.priorite} onChange={set('priorite')}>
                {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone</label>
              <input className="input" value={form.zone} onChange={set('zone')} placeholder="Ex: Dakar Plateau" />
            </div>
            <div>
              <label className="label">Région</label>
              <input className="input" value={form.region} onChange={set('region')} placeholder="Ex: Dakar" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.telephone} onChange={set('telephone')} />
            </div>
            <div>
              <label className="label">Origine</label>
              <select className="input" value={form.source} onChange={set('source')}>
                <option value="">Choisir...</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.statut} onChange={set('statut')}>
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date dernier contact</label>
              <input type="date" className="input" value={form.date_contact} onChange={set('date_contact')} />
            </div>
          </div>
          <div>
            <label className="label">Valeur espérée / an (FCFA)</label>
            <input type="number" min="0" className="input" value={form.valeur_estimee} onChange={set('valeur_estimee')} placeholder="0" />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input" rows={2} value={form.note} onChange={set('note')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Ajouter')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
