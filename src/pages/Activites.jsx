import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Panel from '../components/Panel'
import BarList from '../components/BarList'
import KpiCard from '../components/KpiCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const TYPES = ['Visite client', 'Appel', 'Réunion', 'Démonstration', 'Négociation', 'Relance', 'Contrat signé']
const RESULTATS = ['Positif', 'Négatif', 'Neutre']
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const INIT = { date: new Date().toISOString().slice(0, 10), type: 'Visite client', cible: '', resultat: 'Neutre', note: '' }

export default function Activites() {
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/activites')
      .then((r) => setActivites(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/api/activites', form)
      setModalOpen(false)
      setForm(INIT)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const byType = {}; TYPES.forEach((t) => { byType[t] = 0 }); activites.forEach((a) => { byType[a.type] = (byType[a.type] || 0) + 1 })
  const typeBars = TYPES.map((t) => ({ label: t, val: byType[t], disp: String(byType[t]) })).sort((a, b) => b.val - a.val)

  const byCom = {}; activites.forEach((a) => { const n = a.vendeur_nom || 'Moi'; byCom[n] = (byCom[n] || 0) + 1 })
  const comBars = Object.entries(byCom).map(([label, val]) => ({ label, val, disp: String(val) })).sort((a, b) => b.val - a.val)

  const now = new Date()
  const last12w = activites.filter((a) => (now - new Date(a.date)) / (86400000 * 7) <= 12)
  const perWeek = Math.round(last12w.length / 12)
  const signes = activites.filter((a) => a.type === 'Contrat signé').length
  const tauxPositif = activites.length ? Math.round(activites.filter((a) => a.resultat === 'Positif').length / activites.length * 100) : 0

  const recent = activites.slice(0, 16).map((a) => [
    fmtDate(a.date), a.vendeur_nom || '-',
    { v: a.type, c: a.type === 'Contrat signé' ? '#1B5E20' : a.type === 'Relance' ? '#F9A825' : undefined },
    a.cible || '-',
    { v: a.resultat, c: a.resultat === 'Positif' ? '#1B5E20' : a.resultat === 'Négatif' ? '#CC0000' : '#8a7f6e' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Activités</h2>
          <p className="text-sm text-gray-500 mt-0.5">Journal des visites, appels et relances terrain</p>
        </div>
        <button onClick={() => { setForm(INIT); setError(''); setModalOpen(true) }} className="btn-primary text-sm">
          + Nouvelle activité
        </button>
      </div>

      {error && !modalOpen && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Activités totales" value={activites.length} sub="historique" color="#1b75bc" />
        <KpiCard title="Rythme hebdo" value={`${perWeek} / sem`} sub="moyenne 12 dernières semaines" />
        <KpiCard title="Contrats signés" value={signes} sub="issus du terrain" color="#1B5E20" />
        <KpiCard title="Taux positif" value={`${tauxPositif} %`} sub="résultats favorables" color="#1B5E20" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel title="Activités par type">
              <BarList items={typeBars} labelWidth="150px" color="#5a6b7a" dense />
            </Panel>
            <Panel title="Activités par commercial" sub="volume terrain">
              <BarList items={comBars} labelWidth="120px" dense />
            </Panel>
          </div>

          <Panel title="Journal d'activité" sub="16 dernières actions">
            <DataTable headers={['Date', 'Resp.', 'Type', 'Cible', 'Résultat']} rows={recent} align={['left', 'left', 'left', 'left', 'left']} />
          </Panel>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle activité">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Cible (client / prospect)</label>
            <input className="input" value={form.cible} onChange={set('cible')} placeholder="Ex: Boutique Diallo" />
          </div>
          <div>
            <label className="label">Résultat</label>
            <select className="input" value={form.resultat} onChange={set('resultat')}>
              {RESULTATS.map((r) => <option key={r}>{r}</option>)}
            </select>
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
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
