import { Fragment } from 'react'

// Grille RFM 5x5 (Récence en lignes, Fréquence en colonnes) — taille/couleur = nb clients,
// vert = "champions" (récence et fréquence élevées), ambre = le reste. Formule identique au HTML de référence.
const fmtM = (n) => (Number(n || 0) / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M'

export default function RfmGrid({ clients }) {
  const cell = {}
  clients.forEach((c) => {
    const k = `${c.rScore}-${c.fScore}`
    ;(cell[k] = cell[k] || []).push(c)
  })

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
      <div />
      {[1, 2, 3, 4, 5].map((f) => (
        <div key={`f${f}`} className="text-center text-[10px] text-gray-400 font-semibold">F{f}</div>
      ))}
      {[5, 4, 3, 2, 1].map((r) => (
        <Fragment key={r}>
          <div className="text-[10px] text-gray-400 font-semibold pr-1.5 flex items-center">R{r}</div>
          {[1, 2, 3, 4, 5].map((f) => {
            const cs = cell[`${r}-${f}`] || []
            const n = cs.length
            const ca = cs.reduce((s, c) => s + c.caTotal, 0)
            const intensity = Math.min(1, n / 6)
            const isChamp = r >= 4 && f >= 4
            const bg = n
              ? (isChamp ? `rgba(27,94,32,${0.18 + intensity * 0.55})` : `rgba(249,168,37,${0.12 + intensity * 0.5})`)
              : '#f6f2ec'
            return (
              <div
                key={`${r}-${f}`}
                title={`${n} client(s) · ${fmtM(ca)}`}
                className="rounded-md border flex flex-col items-center justify-center"
                style={{ aspectRatio: '1.4', background: bg, borderColor: '#f0ebe1' }}
              >
                {n ? (
                  <div className="font-display text-base font-semibold" style={{ color: intensity > 0.5 ? '#fff' : '#1a1714' }}>{n}</div>
                ) : (
                  <div className="text-gray-300">·</div>
                )}
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
