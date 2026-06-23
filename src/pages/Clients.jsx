import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import BarList from '../components/BarList'
import DataTable from '../components/DataTable'
import KpiCard from '../components/KpiCard'
import RfmGrid from '../components/RfmGrid'

const TYPES = ['Grossiste', 'Détaillant marché', 'Boutique', 'Restauration', 'Cantine-Institution']
const STATUTS_CLIENT = ['Actif', 'Prospect', 'Dormant']

const CLIENT_INIT = {
  nom: '', type: 'Boutique', statut: 'Prospect', zone: '', region: '', segment: '', potentiel_annuel: '',
  telephone: '', volume_estime: '', valorise: '', horaire: '',
}

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtM = (n) => (Number(n || 0) / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M'

// Scoring RFM identique au HTML de référence : récence (jours depuis dernier achat),
// fréquence (nb de ventes), montant (CA total) → segment Champion/Fidèle/À développer/Dormant/À reconquérir.
function computeRfm(c) {
  const recence = c.derniere_vente ? Math.round((new Date() - new Date(c.derniere_vente)) / 86400000) : 999
  const nbCmd = c.nb_ventes || 0
  const caTotal = c.ca_total || 0
  const rScore = recence <= 15 ? 5 : recence <= 30 ? 4 : recence <= 60 ? 3 : recence <= 120 ? 2 : 1
  const fScore = nbCmd >= 10 ? 5 : nbCmd >= 6 ? 4 : nbCmd >= 3 ? 3 : nbCmd >= 1 ? 2 : 1
  const mScore = caTotal >= 20e6 ? 5 : caTotal >= 10e6 ? 4 : caTotal >= 5e6 ? 3 : caTotal >= 1e6 ? 2 : 1
  const rfm = Math.round((rScore + fScore + mScore) / 15 * 100)
  const rfmSeg = recence > 90 ? 'À reconquérir' : recence > 60 ? 'Dormant'
    : (rScore >= 4 && fScore >= 4 ? 'Champion' : fScore >= 3 ? 'Fidèle' : 'À développer')
  return { ...c, recence, rScore, fScore, mScore, rfm, rfmSeg }
}

const SEG_COLOR = { Champion: '#1B5E20', Fidèle: '#1b75bc', 'À développer': '#5a6b7a', Dormant: '#CC0000', 'À reconquérir': '#CC0000' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('caTotal')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(CLIENT_INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/clients'),
      api.get('/api/ventes', { params: { limit: 500 } }),
    ])
      .then(([rc, rv]) => {
        const ventes = Array.isArray(rv.data) ? rv.data : []
        const byClient = {}
        ventes.forEach((v) => {
          if (!v.client_id) return
          const e = byClient[v.client_id] || { ca_total: 0, nb_ventes: 0, derniere_vente: null }
          e.ca_total += Number(v.montant || 0)
          e.nb_ventes += 1
          if (!e.derniere_vente || v.date_vente > e.derniere_vente) e.derniere_vente = v.date_vente
          byClient[v.client_id] = e
        })
        const enriched = (rc.data || []).map((c) => computeRfm({ ...c, ...(byClient[c.id] || { ca_total: 0, nb_ventes: 0, derniere_vente: null }) }))
        setClients(enriched)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm(CLIENT_INIT)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      nom: c.nom || '', type: c.type || 'Boutique', statut: c.statut || 'Prospect',
      zone: c.zone || '', region: c.region || '', segment: c.segment || '', potentiel_annuel: c.potentiel_annuel || '',
      telephone: c.telephone || '', volume_estime: c.volume_estime || '', valorise: c.valorise || '', horaire: c.horaire || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        volume_estime: form.volume_estime ? Number(form.volume_estime) : null,
        potentiel_annuel: form.potentiel_annuel ? Number(form.potentiel_annuel) : 0,
      }
      if (editing) await api.put(`/api/clients/${editing.id}`, body)
      else await api.post('/api/clients', body)
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const changeStatut = async (id, statut) => {
    try {
      await api.patch(`/api/clients/${id}/statut`, { statut })
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, statut } : c)))
    } catch {
      setError('Erreur mise à jour statut')
    }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const nbCl = clients.length || 1
  const nbActifs = clients.filter((c) => c.statut === 'Actif').length
  const nbInactifs = clients.filter((c) => c.rfmSeg === 'Dormant' || c.rfmSeg === 'À reconquérir').length
  const retPct = 100 - (nbInactifs / nbCl * 100)
  const caMoyen = clients.reduce((s, c) => s + c.ca_total, 0) / nbCl
  const nbChampions = clients.filter((c) => c.rfmSeg === 'Champion').length

  const segCount = {}
  clients.forEach((c) => { segCount[c.rfmSeg] = (segCount[c.rfmSeg] || 0) + 1 })
  const segArr = Object.entries(segCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, val: v, disp: `${v} clients`, color: SEG_COLOR[k] }))

  const sorted = [...clients].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 40)
  const rows = sorted.map((c) => [
    { v: c.nom, sub: [c.id?.slice(0, 8), c.zone].filter(Boolean).join(' · ') },
    c.segment || '-',
    { v: c.rfmSeg, c: SEG_COLOR[c.rfmSeg] },
    { v: String(c.rfm), sub: 'sur 100' },
    fmt(c.ca_total),
    { v: c.recence > 900 ? 'jamais' : `il y a ${c.recence} j`, c: c.recence > 120 ? '#CC0000' : c.recence > 60 ? '#F9A825' : '#1B5E20' },
    { v: fmt(c.potentiel_annuel), sub: c.potentiel_annuel ? `${Math.round(Math.min(100, c.ca_total / c.potentiel_annuel * 100))} % exploité` : '' },
    {
      v: (
        <select
          value={c.statut}
          onChange={(e) => changeStatut(c.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
        >
          {STATUTS_CLIENT.map((s) => <option key={s}>{s}</option>)}
        </select>
      ),
    },
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Portefeuille</h2>
          <p className="text-sm text-gray-500 mt-0.5">Carte RFM, valeur et fidélisation des clients</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">+ Ajouter un client</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard title="Base clients" value={clients.length} sub={`${nbActifs} actifs`} color="#1b75bc" />
        <KpiCard title="Clients fidèles" value={`${Math.round(retPct)} %`} sub="encore actifs" color="#1B5E20" />
        <KpiCard title="Clients perdus" value={`${Math.round(100 - retPct)} %`} sub={`${nbInactifs} inactifs`} color="#CC0000" />
        <KpiCard title="CA moyen / client" value={fmtM(caMoyen)} sub="depuis le début" />
        <KpiCard title="Meilleurs clients" value={nbChampions} sub="à fidéliser en priorité" color="#1B5E20" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Carte des clients" sub="ancienneté du dernier achat × nb d'achats · taille = nb clients">
              <RfmGrid clients={clients} />
            </Panel>
            <Panel title="Catégories de clients" sub="selon leur comportement d'achat">
              <BarList items={segArr} labelWidth="140px" color="#5a6b7a" />
            </Panel>
          </div>

          <Panel
            title="Portefeuille clients"
            sub={`Top 40 par ${sortKey === 'ca_total' ? 'CA' : sortKey === 'potentiel_annuel' ? 'potentiel/an' : 'score'}`}
            footer={
              <div className="flex gap-2 flex-wrap">
                {[['ca_total', 'CA'], ['potentiel_annuel', 'Potentiel/an'], ['rfm', 'Score RFM']].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`text-xs px-2.5 py-1 rounded-md border ${sortKey === k ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
                    style={sortKey === k ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
                  >
                    Trier : {l}
                  </button>
                ))}
              </div>
            }
          >
            <DataTable
              headers={['Client', 'Segment', 'Profil', 'Score', 'CA total', 'Dernier achat', 'Potentiel / an', 'Statut']}
              rows={rows}
              align={['left', 'left', 'left', 'left', 'right', 'left', 'right', 'left']}
              onRowClick={(ri) => openEdit(sorted[ri])}
            />
          </Panel>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Modifier : ${editing.nom}` : 'Nouveau client'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Nom du client</label>
            <input className="input" placeholder="Boutique Diallo" value={form.nom} onChange={set('nom')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.statut} onChange={set('statut')}>
                {STATUTS_CLIENT.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone</label>
              <input className="input" placeholder="Médina, Pikine..." value={form.zone} onChange={set('zone')} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" placeholder="77 000 00 00" value={form.telephone} onChange={set('telephone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Région</label>
              <input className="input" placeholder="Dakar" value={form.region} onChange={set('region')} />
            </div>
            <div>
              <label className="label">Segment</label>
              <input className="input" placeholder="Grand compte, PME..." value={form.segment} onChange={set('segment')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Volume estimé (FCFA/mois)</label>
              <input type="number" min="0" className="input" value={form.volume_estime} onChange={set('volume_estime')} />
            </div>
            <div>
              <label className="label">Potentiel annuel (FCFA)</label>
              <input type="number" min="0" className="input" value={form.potentiel_annuel} onChange={set('potentiel_annuel')} />
            </div>
          </div>
          <div>
            <label className="label">Ce qu'il valorise</label>
            <input className="input" placeholder="Prix, régularité, livraison..." value={form.valorise} onChange={set('valorise')} />
          </div>
          <div>
            <label className="label">Horaire de visite</label>
            <input className="input" placeholder="Lundi 9h–11h" value={form.horaire} onChange={set('horaire')} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
