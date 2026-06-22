import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import StatutBadge from '../components/StatutBadge'
import KpiCard from '../components/KpiCard'

const TYPES = ['Grossiste', 'Détaillant marché', 'Boutique', 'Restauration', 'Cantine-Institution']
const STATUTS_CLIENT = ['Actif', 'Prospect', 'Dormant']
const TABS = ['Tous', 'Actif', 'Prospect', 'Dormant']

const CLIENT_INIT = {
  nom: '', type: 'Boutique', statut: 'Prospect', zone: '',
  telephone: '', volume_estime: '', valorise: '', horaire: '',
}

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

// Profil simplifié basé sur la récence du dernier achat (proxy Récence/Fréquence/Montant).
function profilOf(c) {
  if (c.nb_ventes === 0) return { label: 'Pas encore acheté', color: '#8a7f6e' }
  if (c.recence == null) return { label: 'Pas encore acheté', color: '#8a7f6e' }
  if (c.recence <= 30) return { label: 'Actif récent', color: '#1b75bc' }
  if (c.recence <= 60) return { label: 'À relancer', color: '#F9A825' }
  return { label: 'Inactif', color: '#CC0000' }
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Tous')
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
        const today = new Date()
        const byClient = {}
        ventes.forEach((v) => {
          if (!v.client_id) return
          const e = byClient[v.client_id] || { ca_total: 0, nb_ventes: 0, derniere_vente: null }
          e.ca_total += Number(v.montant || 0)
          e.nb_ventes += 1
          if (!e.derniere_vente || v.date_vente > e.derniere_vente) e.derniere_vente = v.date_vente
          byClient[v.client_id] = e
        })
        const enriched = (rc.data || []).map((c) => {
          const e = byClient[c.id] || { ca_total: 0, nb_ventes: 0, derniere_vente: null }
          const recence = e.derniere_vente ? Math.round((today - new Date(e.derniere_vente)) / 86400000) : null
          return { ...c, ...e, recence }
        })
        setClients(enriched)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = tab === 'Tous' ? clients : clients.filter((c) => c.statut === tab)
  const caPortefeuille = clients.reduce((s, c) => s + c.ca_total, 0)
  const aRelancer = clients.filter((c) => c.recence != null && c.recence > 30).length

  const openNew = () => {
    setEditing(null)
    setForm(CLIENT_INIT)
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      nom: c.nom || '',
      type: c.type || 'Boutique',
      statut: c.statut || 'Prospect',
      zone: c.zone || '',
      telephone: c.telephone || '',
      volume_estime: c.volume_estime || '',
      valorise: c.valorise || '',
      horaire: c.horaire || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        volume_estime: form.volume_estime ? Number(form.volume_estime) : null,
        valorise: form.valorise ? Number(form.valorise) : null,
      }
      if (editing) {
        await api.put(`/api/clients/${editing.id}`, body)
      } else {
        await api.post('/api/clients', body)
      }
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Portefeuille</h2>
          <p className="text-sm text-gray-500 mt-0.5">Valeur, fidélisation et relance des clients</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">
          + Ajouter un client
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Clients" value={clients.length} color="#1b75bc" />
        <KpiCard title="CA portefeuille" value={fmt(caPortefeuille)} color="#1565C0" />
        <KpiCard title="À relancer (+30j)" value={aRelancer} color="#F9A825" />
      </div>

      {/* Tabs filtre */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#1b75bc] text-[#1b75bc]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs text-gray-400">
              ({t === 'Tous' ? clients.length : clients.filter((c) => c.statut === t).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Aucun client dans cette catégorie</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              onEdit={() => openEdit(c)}
              onChangeStatut={(s) => changeStatut(c.id, s)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Modifier : ${editing.nom}` : 'Nouveau client'}
      >
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
              <label className="label">Volume estimé (FCFA)</label>
              <input type="number" min="0" className="input" value={form.volume_estime} onChange={set('volume_estime')} />
            </div>
            <div>
              <label className="label">Valorisé (FCFA)</label>
              <input type="number" min="0" className="input" value={form.valorise} onChange={set('valorise')} />
            </div>
          </div>
          <div>
            <label className="label">Horaire de visite</label>
            <input className="input" placeholder="Lundi 9h–11h" value={form.horaire} onChange={set('horaire')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
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

function ClientCard({ client: c, onEdit, onChangeStatut }) {
  const profil = profilOf(c)
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{c.nom}</h3>
          <p className="text-xs text-gray-500">{c.type} · {c.zone || 'Zone n/a'}</p>
        </div>
        <StatutBadge statut={c.statut} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${profil.color}1a`, color: profil.color }}>
          {profil.label}
        </span>
        {c.nb_ventes > 0 && (
          <span className="text-[11px] text-gray-500">{fmt(c.ca_total)} · {c.nb_ventes} vente(s)</span>
        )}
      </div>

      <div className="space-y-1 text-xs text-gray-600 mb-3">
        {c.telephone && (
          <p>📞 {c.telephone}</p>
        )}
        {c.volume_estime && (
          <p>📦 Volume estimé : <span className="font-medium">{fmt(c.volume_estime)}</span></p>
        )}
        {c.valorise && (
          <p>💰 Valorisé : <span className="font-medium text-[#1b75bc]">{fmt(c.valorise)}</span></p>
        )}
        {c.horaire && (
          <p>🕐 {c.horaire}</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <select
          value={c.statut}
          onChange={(e) => onChangeStatut(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 focus:outline-none cursor-pointer"
        >
          {['Actif', 'Prospect', 'Dormant'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={onEdit}
          className="text-xs text-[#1b75bc] font-medium hover:underline"
        >
          Modifier
        </button>
      </div>
    </div>
  )
}
