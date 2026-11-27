import { useState } from 'react'
import { GROUPES } from '../utils/champsFormation'

// Bloc repliable de champs facultatifs tirés de la formation (fiche produit, livraison,
// éléments d'un accord). `valeurs` contient les clés du groupe, `onChange(cle, valeur)`.
export default function ChampsFormation({ groupe, valeurs, onChange, ouvertParDefaut = false }) {
  const g = GROUPES[groupe]
  const rempli = g.champs.some((c) => valeurs?.[c.cle] !== undefined && valeurs?.[c.cle] !== '')
  const [ouvert, setOuvert] = useState(ouvertParDefaut || rempli)

  return (
    <fieldset className="border border-gray-200 rounded-lg">
      <legend className="px-1">
        <button type="button" onClick={() => setOuvert((o) => !o)} className="text-sm font-semibold text-[#1b75bc] flex items-center gap-1" aria-expanded={ouvert}>
          {ouvert ? '▾' : '▸'} {g.titre}
        </button>
      </legend>
      {ouvert && (
        <div className="px-3 pb-3 space-y-3">
          {g.aide && <p className="text-xs text-gray-500">{g.aide}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {g.champs.map((c) => {
              const id = `${groupe}-${c.cle}`
              const v = valeurs?.[c.cle] ?? ''
              return (
                <div key={c.cle}>
                  <label className="label" htmlFor={id}>{c.libelle}</label>
                  {c.type === 'choix' ? (
                    <select id={id} className="input" value={v} onChange={(e) => onChange(c.cle, e.target.value)}>
                      <option value="">Non précisé</option>
                      {c.liste.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      id={id}
                      className="input"
                      type={c.type === 'date' ? 'date' : c.type === 'nombre' ? 'number' : 'text'}
                      step={c.type === 'nombre' ? 'any' : undefined}
                      min={c.type === 'nombre' ? 0 : undefined}
                      placeholder={c.exemple ? `Ex : ${c.exemple}` : ''}
                      value={v}
                      onChange={(e) => onChange(c.cle, e.target.value)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </fieldset>
  )
}
