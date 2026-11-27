import { Link } from 'react-router-dom'

// Briques communes aux pages « compte » : client, prospect, producteur, agent.

export const STATUT_VENTE = { Paye: ['Payé', 'text-green-700 bg-green-50'], 'En cours': ['En cours', 'text-amber-700 bg-amber-50'], 'En retard': ['En retard', 'text-red-700 bg-red-50'] }
export const STATUT_VERS = { valide: ['Validé', 'text-green-700 bg-green-50'], declare: ['À valider', 'text-amber-700 bg-amber-50'], rejete: ['Rejeté', 'text-red-700 bg-red-50'] }
export const STATUT_TACHE = { a_faire: ['À faire', 'text-blue-700 bg-blue-50'], terminee: ['Terminée', 'text-green-700 bg-green-50'], non_realisee: ['Pas faite', 'text-red-700 bg-red-50'] }

export const Badge = ({ def }) => (def ? <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${def[1]}`}>{def[0]}</span> : null)

export const kg = (n) => `${Number(n || 0).toLocaleString('fr-FR')} kg`

export function Tableau({ entetes, lignes, vide, alignDroite = [] }) {
  if (!lignes.length) return <p className="text-sm text-gray-500 py-4">{vide}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b">
            {entetes.map((e, i) => <th key={e} className={`py-2 pr-3 ${alignDroite.includes(i) ? 'text-right' : ''}`}>{e}</th>)}
          </tr>
        </thead>
        <tbody>
          {lignes.map((cellules, i) => (
            <tr key={i} className="border-b border-gray-100 align-top">
              {cellules.map((c, j) => <td key={j} className={`py-2 pr-3 ${alignDroite.includes(j) ? 'text-right tabular-nums' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EtatCompte({ erreur, retour, libelleRetour }) {
  if (erreur) return (
    <div className="space-y-4">
      <Link to={retour} className="text-sm text-[#1b75bc]">← {libelleRetour}</Link>
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{erreur}</div>
    </div>
  )
  return <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" /></div>
}

// Lien vers le compte d'un acteur, utilisé dans les listes.
export function LienCompte({ to, children }) {
  return (
    <Link to={to} className="text-[#1b75bc] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  )
}

// Lien vers la fiche du producteur. Sans fiche (cas rare), retrouve-la par le nom.
export const lienProducteur = (id, nom, telephone) => (id
  ? `/producteurs/${id}`
  : `/producteurs/compte?nom=${encodeURIComponent(nom || '')}${telephone ? `&telephone=${encodeURIComponent(telephone)}` : ''}`)
