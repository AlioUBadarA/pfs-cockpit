import { useState } from 'react'
import api from '../services/api'
import Panel from '../components/Panel'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const MODES = ['Espèces', 'Virement', 'Chèque', 'Mobile Money']

const statutColor = (s) => ({
  Paye: 'text-green-700', 'En cours': 'text-amber-600', 'En retard': 'text-red-600',
  Actif: 'text-green-700', Suspendu: 'text-amber-600', Terminé: 'text-gray-500',
}[s] || 'text-gray-600')

export default function Encaissements() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [selected, setSelected] = useState(null)
  const [versements, setVersements] = useState([])
  const [loadingVers, setLoadingVers] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ montant: '', mode: 'Espèces', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  const search = async (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setSearching(true); setError(''); setSelected(null)
    try {
      const { data } = await api.get('/api/encaissements/search', { params: { q: q.trim() } })
      setResults(data)
    } catch {
      setError('Erreur de recherche')
    } finally { setSearching(false) }
  }

  const openTransaction = async (item) => {
    setSelected(item)
    setLoadingVers(true)
    try {
      const { data } = await api.get(`/api/encaissements/${item.type}/${item.id}/versements`)
      setVersements(data)
    } catch {
      setError('Erreur de chargement des versements')
    } finally { setLoadingVers(false) }
  }

  const openNewVersement = () => {
    setForm({ montant: '', mode: 'Espèces', date: new Date().toISOString().slice(0, 10) })
    setError('')
    setModalOpen(true)
  }

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post(`/api/encaissements/${selected.type}/${selected.id}/versements`, {
        montant: Number(form.montant), mode: form.mode, date: form.date,
      })
      setModalOpen(false)
      // Relit les versements depuis l'API pour avoir le total exact
      const { data: fresh } = await api.get(`/api/encaissements/${selected.type}/${selected.id}/versements`)
      setVersements(fresh)
      const totalVerse = fresh.reduce((s, v) => s + Number(v.montant), 0)
      setSelected((p) => ({
        ...p, total_verse: totalVerse,
        statut: p.type === 'vente' && totalVerse >= Number(p.montant_total) ? 'Paye' : p.statut,
      }))
      setResults((rs) => rs.map((r) => r.id === selected.id ? { ...r, total_verse: totalVerse } : r))
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  const reste = selected ? Math.max(0, Number(selected.montant_total) - Number(selected.total_verse)) : 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Encaissements</h2>
        <p className="text-sm text-gray-500 mt-0.5">Recherchez une vente ou un contrat par numéro de transaction ou nom du client pour enregistrer un paiement, en une ou plusieurs tranches.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <form onSubmit={search} className="card flex gap-3">
        <input
          className="input flex-1"
          placeholder="Numéro de transaction (ex: V-2026-0007) ou nom du client..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" disabled={searching} className="btn-primary text-sm">
          {searching ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {results.length > 0 && !selected && (
        <Panel title="Résultats" sub={`${results.length} transaction(s) trouvée(s)`}>
          <DataTable
            headers={['N°', 'Type', 'Client', 'Montant', 'Encaissé', 'Statut']}
            align={['left', 'left', 'left', 'right', 'right', 'left']}
            rows={results.map((r) => [
              { v: r.numero || '-', sub: fmtDate(r.date) },
              r.type === 'vente' ? 'Vente' : 'Contrat',
              r.client_nom,
              fmt(r.montant_total),
              fmt(r.total_verse),
              { v: r.statut, c: undefined, bold: true },
            ])}
            onRowClick={(ri) => openTransaction(results[ri])}
          />
        </Panel>
      )}

      {results.length === 0 && q && !searching && (
        <p className="text-sm text-gray-400 text-center py-6">Aucune transaction ne correspond à "{q}"</p>
      )}

      {selected && (
        <Panel
          title={`${selected.type === 'vente' ? 'Vente' : 'Contrat'} ${selected.numero || ''} — ${selected.client_nom}`}
          sub={`Montant ${selected.type === 'vente' ? 'total' : 'mensuel'} : ${fmt(selected.montant_total)}`}
          right={<button className="btn-secondary text-sm" onClick={() => setSelected(null)}>← Retour aux résultats</button>}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Encaissé</p>
              <p className="text-lg font-bold text-[#1b75bc]">{fmt(selected.total_verse)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Reste à encaisser</p>
              <p className="text-lg font-bold text-amber-700">{fmt(reste)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 mb-1">Statut</p>
              <p className={`text-lg font-bold ${statutColor(selected.statut)}`}>{selected.statut}</p>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <button onClick={openNewVersement} className="btn-primary text-sm">+ Enregistrer une tranche</button>
          </div>

          {loadingVers ? (
            <div className="flex justify-center py-8"><span className="w-6 h-6 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <DataTable
              headers={['Date', 'Montant', 'Mode']}
              align={['left', 'right', 'left']}
              rows={versements.map((v) => [fmtDate(v.date), fmt(v.montant), v.mode || '-'])}
            />
          )}
        </Panel>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer une tranche">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Montant (F) *</label>
            <input type="number" min="1" className="input" value={form.montant} onChange={set('montant')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mode de paiement</label>
              <select className="input" value={form.mode} onChange={set('mode')}>
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} required />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
