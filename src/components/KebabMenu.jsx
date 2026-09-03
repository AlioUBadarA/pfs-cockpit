import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function KebabMenu({ menuKey, open, onToggle, items }) {
  const btnRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const menuH = items.length * 44 + 12
      const openAbove = r.bottom + menuH > window.innerHeight
      setPos(openAbove
        ? { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right }
        : { top: r.bottom + 4, right: window.innerWidth - r.right }
      )
    }
  }, [open, items.length])

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); onToggle(menuKey) }}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none"
        title="Actions"
      >
        ⋮
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => onToggle(null)} />
          <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-48" style={pos}>
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { if (item.disabled) return; onToggle(null); item.onClick() }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  item.disabled ? 'text-gray-400 cursor-default' : item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon && <span className="text-sm w-4 text-center">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
