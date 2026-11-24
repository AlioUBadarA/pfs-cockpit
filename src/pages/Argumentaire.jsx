import { useCallback, useEffect, useMemo, useState } from 'react'
import { MODULES, SOURCE } from '../data/argumentaireC3'

// Argumentaire de vente en diapositives, d'après la formation commerciale PFS, cohorte 3.
// Flèches du clavier ou boutons pour passer d'une diapositive à l'autre.

const TOUTES = MODULES.flatMap((m, im) => m.slides.map((s, is) => ({ ...s, module: m.titre, im, is })))

function Diapo({ d }) {
  return (
    <div className="space-y-4">
      {d.exemple && (
        <blockquote className="border-l-4 border-[#62bb46] bg-green-50 text-gray-800 rounded-r-lg px-4 py-3 text-[15px] leading-relaxed">
          « {d.exemple} »
        </blockquote>
      )}
      {d.points && (
        <ul className="space-y-2.5">
          {d.points.map((p) => (
            <li key={p} className="flex gap-3 text-[15px] text-gray-800 leading-relaxed">
              <span className="mt-2 w-2 h-2 rounded-full bg-[#1b75bc] flex-none" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {d.tableau && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {d.tableau.entetes.map((e, i) => (
                  <th key={i} className="text-left font-semibold text-white bg-[#1b75bc] px-3 py-2 first:rounded-tl-lg last:rounded-tr-lg">{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.tableau.lignes.map((l, i) => (
                <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  {l.map((c, j) => <td key={j} className={`px-3 py-2 border-b border-gray-100 ${j === 0 ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {d.regle && (
        <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-2.5 text-sm font-semibold">Règle : {d.regle}</p>
      )}
    </div>
  )
}

export default function Argumentaire() {
  const [index, setIndex] = useState(0)
  const d = TOUTES[index]
  const debutModule = useMemo(() => MODULES.map((m, im) => TOUTES.findIndex((x) => x.im === im)), [])

  const aller = useCallback((n) => setIndex(Math.max(0, Math.min(TOUTES.length - 1, n))), [])

  useEffect(() => {
    const touche = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
      if (e.key === 'ArrowRight') aller(index + 1)
      if (e.key === 'ArrowLeft') aller(index - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [index, aller])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Argumentaire de vente</h2>
        <p className="text-sm text-gray-500 mt-1">{SOURCE}</p>
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Modules">
        {MODULES.map((m, im) => (
          <button
            key={m.titre}
            role="tab"
            aria-selected={d.im === im}
            onClick={() => aller(debutModule[im])}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${d.im === im ? 'bg-[#1b75bc] text-white border-[#1b75bc]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#1b75bc]'}`}
          >
            {im + 1}. {m.titre}
          </button>
        ))}
      </div>

      <section className="card p-0 overflow-hidden" aria-live="polite" aria-label={`Diapositive ${index + 1} sur ${TOUTES.length}`}>
        <div className="bg-[#1b75bc] text-white px-6 py-5">
          <p className="text-[11px] uppercase tracking-wider text-blue-100 font-semibold">Module {d.im + 1} · {d.module}</p>
          <h3 className="font-display text-2xl font-bold mt-1">{d.titre}</h3>
        </div>
        <div className="px-6 py-6 min-h-[320px]">
          <Diapo d={d} />
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button className="btn-secondary text-sm" onClick={() => aller(index - 1)} disabled={index === 0}>← Précédente</button>
          <span className="text-xs text-gray-500 tabular-nums">{index + 1} / {TOUTES.length}</span>
          <button className="btn-primary text-sm" onClick={() => aller(index + 1)} disabled={index === TOUTES.length - 1}>Suivante →</button>
        </div>
      </section>

      <div className="flex gap-1 justify-center flex-wrap" aria-hidden="true">
        {TOUTES.map((x, i) => (
          <button key={i} tabIndex={-1} onClick={() => aller(i)} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-[#1b75bc]' : 'w-1.5 bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}
