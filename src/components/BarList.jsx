// Liste de barres horizontales proportionnelles (classements, répartitions).
// items: [{ label, val, disp, color, rank }]
export default function BarList({ items, color = '#1b75bc', labelWidth = '150px', dense = false }) {
  if (!items.length) return <p className="text-sm text-gray-400 py-2">Aucune donnée.</p>
  const max = Math.max(1, ...items.map((i) => i.val))
  return (
    <div className={`flex flex-col ${dense ? 'gap-2' : 'gap-2.5'}`}>
      {items.map((it, i) => (
        <div
          key={it.label + i}
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: `${labelWidth} 1fr auto` }}
        >
          <div className="text-[12.5px] text-gray-700 truncate" title={it.label}>
            {it.rank != null && <span className="text-gray-400 mr-1.5 tabular-nums">{it.rank}</span>}
            {it.label}
          </div>
          <div className="bar-row-track">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (it.val / max) * 100)}%`, background: it.color || color }}
            />
          </div>
          <div className="text-[12.5px] font-semibold text-gray-900 tabular-nums whitespace-nowrap">{it.disp}</div>
        </div>
      ))}
    </div>
  )
}
