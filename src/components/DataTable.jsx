// Table générique réutilisable : chaque cellule peut être une valeur simple,
// ou un objet { v, sub, c (couleur), bold, bar: { value, color } } pour une cellule riche.
function Cell({ cell, align }) {
  if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
    if (cell.bar) {
      return (
        <td className="table-cell">
          <div className="flex items-center gap-2">
            <div className="bar-row-track flex-1 min-w-[50px]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, cell.bar.value)}%`, background: cell.bar.color || '#1b75bc' }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums min-w-[42px] text-right" style={{ color: cell.bar.color }}>
              {Math.round(cell.bar.value)}%
            </span>
          </div>
        </td>
      )
    }
    return (
      <td
        className="table-cell tabular-nums"
        style={{ textAlign: align, color: cell.c || undefined, fontWeight: cell.bold ? 700 : undefined }}
      >
        <div>{cell.v}</div>
        {cell.sub && <div className="text-[10.5px] mt-0.5" style={{ color: '#a39988' }}>{cell.sub}</div>}
      </td>
    )
  }
  return (
    <td className="table-cell tabular-nums" style={{ textAlign: align }}>
      {cell}
    </td>
  )
}

export default function DataTable({ headers, rows, align, onRowClick }) {
  const aligns = align || headers.map(() => 'left')
  if (!rows.length) return <p className="text-sm text-gray-400 text-center py-8">Aucune donnée.</p>
  return (
    <div className="overflow-x-auto -m-1">
      <table className="w-full border-collapse p-1">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="table-header" style={{ textAlign: aligns[headers.indexOf(h)] }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-50'}
              onClick={onRowClick ? () => onRowClick(ri) : undefined}
            >
              {row.map((cell, ci) => <Cell key={ci} cell={cell} align={aligns[ci]} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
