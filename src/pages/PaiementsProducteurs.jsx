import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import { LienCompte, kg } from '../components/CompteCommun'
import { PaiementProducteurForm } from '../components/AchatPaddy'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'

// Paiements aux producteurs de paddy : ce que la rizerie doit, par date de paiement prévue.
// Le comptable paie depuis cette page, avec le mode et la preuve.

const ETAT = {
  en_retard: ['En retard', 'text-red-700 bg-red-50'],
  proche: ['À payer bientôt', 'text-amber-700 bg-amber-50'],
  a_venir: ['À venir', 'text-gray-600 bg-gray-100'],
}

export default function PaiementsProducteurs() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [modes, setModes] = useState(undefined)
  const [cible, setCible] = useState(null)

  const load = useCallback(() => {
    api.get('/api/paddy/a-payer').then((r) => setData(r.data)).catch(() => setError('Erreur de chargement'))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/api/rizerie').then((r) => setModes(r.data?.parametres?.modes_paiement)).catch(() => {}) }, [])

  if (!data) return error
    ? <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
    : <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" /></div>

  const lignes = data.lignes
  const total = (f) => lignes.filter(f).reduce((s, l) => s + l.reste_a_payer, 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Paiements producteurs</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Paddy reçu et pas encore payé. {data.peut_payer ? 'Payez avec le mode et la preuve.' : 'Le comptable fait les paiements.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="En retard" value={fmt(total((l) => l.etat === 'en_retard'))} sub={`${lignes.filter((l) => l.etat === 'en_retard').length} livraison(s)`} color="#CC0000" />
        <KpiCard title={`À payer dans ${data.alerte_jours} jours`} value={fmt(total((l) => l.etat === 'proche'))} sub={`${lignes.filter((l) => l.etat === 'proche').length} livraison(s)`} color="#e08e0b" />
        <KpiCard title="Total dû aux producteurs" value={fmt(total(() => true))} sub={`${lignes.length} livraison(s) à payer`} color="#1b75bc" />
      </div>

      <div className="card overflow-x-auto p-0">
        {!lignes.length ? (
          <p className="text-center text-sm text-gray-400 py-10">Aucun paiement en attente.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>{['Paiement prévu', 'Producteur', 'Contrat', 'Reçu le', 'Paddy', 'Reste à payer', 'État', ''].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.livraison_id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{fmtDate(l.date_paiement_prevue)}</td>
                  <td className="table-cell">{l.producteur_id ? <LienCompte to={`/producteurs/${l.producteur_id}`}>{l.producteur_nom}</LienCompte> : l.producteur_nom}{l.telephone && <div className="text-[10.5px] text-gray-400">{l.telephone}</div>}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{l.contrat_numero || '-'}</td>
                  <td className="table-cell text-sm">{fmtDate(l.date_livraison)}</td>
                  <td className="table-cell text-sm text-right">{kg(l.quantite_kg)}</td>
                  <td className="table-cell text-right font-semibold">{fmt(l.reste_a_payer)}{l.regle > 0 && <div className="text-[10.5px] text-gray-400">déjà payé {fmt(l.regle)}</div>}</td>
                  <td className="table-cell"><span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${ETAT[l.etat][1]}`}>{ETAT[l.etat][0]}</span></td>
                  <td className="table-cell">
                    {data.peut_payer && <button onClick={() => setCible(l)} className="text-xs font-semibold text-[#1b75bc] hover:underline">Payer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PaiementProducteurForm open={!!cible} producteurNom={cible?.producteur_nom} montantPropose={cible?.reste_a_payer} modes={modes}
        contrats={cible ? [{ id: cible.contrat_id, numero: cible.contrat_numero }] : []}
        onClose={() => setCible(null)} onSaved={() => { setCible(null); load() }} />
    </div>
  )
}
