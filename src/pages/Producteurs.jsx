import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import FicheProducteurForm from '../components/FicheProducteurForm'
import { LienCompte, kg } from '../components/CompteCommun'
import { formatCFA as fmt } from '../utils/format'
import { askConfirm } from '../utils/askConfirm'
import { useAuth } from '../context/AuthContext'

// Fiches des producteurs de paddy de la rizerie.

export default function Producteurs() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recherche, setRecherche] = useState('')
  const [form, setForm] = useState({ open: false, fiche: null })
  const peutSupprimer = ['manager', 'directeur', 'rizier'].includes(user?.role)
  const peutModifier = user?.role !== 'comptable'

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/producteurs')
      .then((r) => setItems(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const visibles = useMemo(() => {
    const t = recherche.trim().toLowerCase()
    if (!t) return items
    return items.filter((p) => [p.nom, p.telephone, p.zone, p.village, p.groupement].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)))
  }, [items, recherche])

  const supprimer = async (p) => {
    if (!(await askConfirm(`Supprimer la fiche de ${p.nom} ?`))) return
    try { await api.delete(`/api/producteurs/${p.id}`); load() }
    catch (err) { setError(err.response?.data?.error || 'Erreur suppression') }
  }

  const totalReste = items.reduce((s, p) => s + Number(p.reste_a_payer || 0), 0)
  const totalVolume = items.reduce((s, p) => s + Number(p.volume_kg || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Producteurs de paddy</h2>
          <p className="text-sm text-gray-500 mt-0.5">Une fiche par producteur. Ses contrats et ses paiements s'y rattachent.</p>
        </div>
        {peutModifier && <button onClick={() => setForm({ open: true, fiche: null })} className="btn-primary text-sm">+ Nouveau producteur</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Producteurs" value={items.length} sub={`${items.filter((p) => p.nb_actifs).length} avec un contrat actif`} color="#1b75bc" />
        <KpiCard title="Paddy reçu" value={kg(items.reduce((s, p) => s + Number(p.livre_kg || 0), 0))} sub={`sur ${kg(totalVolume)} contractés`} />
        <KpiCard title="Reste à payer" value={fmt(totalReste)} sub="dû par la rizerie" color={totalReste ? '#e08e0b' : '#1B5E20'} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="card overflow-x-auto p-0">
        <div className="p-3 border-b border-gray-100">
          <input className="input max-w-sm" placeholder="Rechercher un nom, un numéro, une zone…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" /></div>
        ) : !visibles.length ? (
          <p className="text-center text-sm text-gray-400 py-10">{items.length ? 'Aucun producteur ne correspond.' : 'Aucun producteur pour le moment.'}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>{['Producteur', 'Téléphone', 'Zone / village', 'Superficie', 'Contrats', 'Paddy reçu', 'Reste à payer', 'Actions'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell"><LienCompte to={`/producteurs/${p.id}`}>{p.nom}</LienCompte>{p.groupement && <div className="text-[10.5px] text-gray-400">{p.groupement}</div>}</td>
                  <td className="table-cell text-sm">{p.telephone || '-'}</td>
                  <td className="table-cell text-sm text-gray-600">{[p.zone, p.village].filter(Boolean).join(' · ') || '-'}</td>
                  <td className="table-cell text-sm text-right">{p.superficie_ha ? `${Number(p.superficie_ha).toLocaleString('fr-FR')} ha` : '-'}</td>
                  <td className="table-cell text-sm text-right">{p.nb_contrats}{p.nb_actifs ? <span className="text-green-700"> · {p.nb_actifs} actif(s)</span> : ''}</td>
                  <td className="table-cell text-sm text-right">{kg(p.livre_kg)}<div className="text-[10.5px] text-gray-400">sur {kg(p.volume_kg)}</div></td>
                  <td className="table-cell text-sm text-right font-semibold" style={{ color: p.reste_a_payer ? '#b45309' : '#1B5E20' }}>{fmt(p.reste_a_payer)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {peutModifier && <button onClick={() => setForm({ open: true, fiche: p })} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Éditer</button>}
                      {peutSupprimer && !p.nb_contrats && <button onClick={() => supprimer(p)} className="text-xs text-red-600 hover:text-red-800 font-medium">Suppr.</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FicheProducteurForm open={form.open} fiche={form.fiche} onClose={() => setForm({ open: false, fiche: null })}
        onSaved={() => { setForm({ open: false, fiche: null }); load() }} />
    </div>
  )
}
