import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'

// Choix du client d'une vente ou d'un dépôt : un client du portefeuille ou un prospect.
// Aucune saisie libre : le nom tapé sert seulement à filtrer la liste.
// `value` : { type: 'client' | 'prospect', id, nom } ou null.
export default function ClientPicker({ value, onChange, required = false, id = 'client-picker' }) {
  const [clients, setClients] = useState([])
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    let actif = true
    Promise.allSettled([api.get('/api/clients'), api.get('/api/prospection')])
      .then(([c, p]) => {
        if (!actif) return
        setClients(c.status === 'fulfilled' && Array.isArray(c.value.data) ? c.value.data : [])
        // Un prospect déjà converti en client apparaît dans la liste des clients.
        setProspects(p.status === 'fulfilled' && Array.isArray(p.value.data)
          ? p.value.data.filter((x) => x.statut !== 'Perdu' && !x.client_id)
          : [])
      })
      .finally(() => actif && setLoading(false))
    return () => { actif = false }
  }, [])

  useEffect(() => {
    const fermer = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fermer)
    return () => document.removeEventListener('mousedown', fermer)
  }, [])

  const options = useMemo(() => {
    const t = q.trim().toLowerCase()
    const match = (x) => !t || x.nom?.toLowerCase().includes(t) || x.telephone?.toLowerCase().includes(t)
    return [
      ...clients.filter(match).map((c) => ({ type: 'client', id: c.id, nom: c.nom, info: [c.type, c.zone].filter(Boolean).join(' · '), statut: c.statut })),
      ...prospects.filter(match).map((p) => ({ type: 'prospect', id: p.id, nom: p.nom, info: [p.type_client, p.zone].filter(Boolean).join(' · '), statut: 'Prospect' })),
    ].slice(0, 60)
  }, [clients, prospects, q])

  const choisir = (o) => { onChange(o); setQ(''); setOpen(false) }

  return (
    <div className="relative" ref={boxRef}>
      {value ? (
        <div className="flex items-center justify-between gap-2 input bg-gray-50">
          <span className="truncate">
            <span className="font-medium text-gray-900">{value.nom}</span>
            {value.type === 'prospect' && (
              <span className="ml-2 text-[10.5px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">Prospect</span>
            )}
          </span>
          <button type="button" className="text-xs text-gray-500 underline shrink-0" onClick={() => { onChange(null); setOpen(true) }}>
            Changer
          </button>
        </div>
      ) : (
        <input
          id={id}
          className="input"
          placeholder={loading ? 'Chargement des clients…' : 'Rechercher un client ou un prospect…'}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          aria-required={required}
        />
      )}
      {open && !value && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {options.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-3">
              {loading ? 'Chargement…' : 'Aucun résultat. Ajoutez d\'abord ce client dans le Portefeuille ou la Prospection.'}
            </p>
          ) : options.map((o) => (
            <button
              key={`${o.type}-${o.id}`}
              type="button"
              onClick={() => choisir(o)}
              className="w-full text-left px-3 py-2 hover:bg-[#eaf3fb] flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate">{o.nom}</span>
                {o.info && <span className="block text-[11px] text-gray-500 truncate">{o.info}</span>}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0 ${
                o.type === 'prospect' ? 'text-amber-700 bg-amber-50' : 'text-[#1b75bc] bg-[#eaf3fb]'
              }`}>
                {o.type === 'prospect' ? 'Prospect' : (o.statut || 'Client')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Corps d'API correspondant au choix : { client_id } ou { prospect_id }.
export function clientPayload(value) {
  if (!value) return {}
  return value.type === 'prospect' ? { prospect_id: value.id } : { client_id: value.id }
}
