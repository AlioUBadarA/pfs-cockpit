import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

const ICONS = {
  'Client inactif': '◷',
  'Créance en retard': '₣',
  'Objectif sous cible': '◎',
}

export default function Actions() {
  const [alertes, setAlertes] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vue, setVue] = useState('À traiter')
  const [cat, setCat] = useState('Toutes')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/actions')
      .then((r) => { setAlertes(r.data.alertes); setStats(r.data.stats) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (a) => {
    const next = !a.traitee
    setAlertes((prev) => prev.map((x) => (x.key === a.key ? { ...x, traitee: next } : x)))
    try {
      await api.patch('/api/actions/traiter', { key: a.key, traitee: next })
    } catch {
      setError('Erreur mise à jour')
      load()
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const base = vue === 'À traiter' ? alertes.filter((a) => !a.traitee)
    : vue === 'Traitées' ? alertes.filter((a) => a.traitee)
    : alertes
  const cats = ['Toutes', ...Array.from(new Set(base.map((a) => a.cat)))]
  const filt = cat === 'Toutes' ? base : base.filter((a) => a.cat === cat)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Alertes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Moteur unifié : client inactif &gt;60j · créance &gt;30j · atteinte &lt;80%</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">Actualiser</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="À traiter" value={stats.a_traiter ?? 0} sub="non encore traitées" color="#CC0000" />
        <KpiCard title="Rouges actives" value={stats.rouges_actives ?? 0} sub="action immédiate" color="#CC0000" />
        <KpiCard title="Traitées" value={stats.traitees ?? 0} sub="marquées comme réglées" color="#1B5E20" />
        <KpiCard title="Total alertes" value={stats.total ?? 0} sub="tous niveaux" />
      </div>

      <Panel title="Moteur d'alertes">
        <div className="flex gap-2 flex-wrap mb-3">
          {['À traiter', 'Traitées', 'Toutes'].map((v) => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md border ${vue === v ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
              style={vue === v ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
            >
              {v}{v === 'À traiter' ? ` (${alertes.length - alertes.filter((a) => a.traitee).length})` : v === 'Traitées' ? ` (${alertes.filter((a) => a.traitee).length})` : ''}
            </button>
          ))}
        </div>

        {filt.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            {vue === 'À traiter' ? '🎉 Aucune alerte à traiter — tout est à jour.' : 'Aucune alerte dans cette vue.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filt.slice(0, 60).map((a) => (
              <div
                key={a.key}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{
                  opacity: a.traitee ? 0.65 : 1,
                  background: a.traitee ? 'rgba(27,94,32,.05)' : a.niveau === 'rouge' ? 'rgba(204,0,0,.05)' : 'rgba(249,168,37,.08)',
                  borderColor: a.traitee ? 'rgba(27,94,32,.2)' : a.niveau === 'rouge' ? 'rgba(204,0,0,.18)' : 'rgba(249,168,37,.25)',
                }}
              >
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: a.traitee ? '#1B5E20' : a.niveau === 'rouge' ? '#CC0000' : '#F9A825' }} />
                <span className="text-sm w-5 text-center flex-none" style={{ color: a.traitee ? '#1B5E20' : a.niveau === 'rouge' ? '#CC0000' : '#F9A825' }}>
                  {a.traitee ? '✓' : (ICONS[a.cat] || '!')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{a.cat}</div>
                  <div className="text-[13px] text-gray-800" style={{ textDecoration: a.traitee ? 'line-through' : 'none' }}>{a.msg}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="text-[13px] font-semibold tabular-nums">{fmt(a.valeur)}</div>
                  <div className="text-[11px] text-gray-400">{a.owner_nom || '-'}</div>
                </div>
                <button
                  onClick={() => toggle(a)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border flex-none ${a.traitee ? 'bg-white text-gray-500 border-gray-300' : 'text-white'}`}
                  style={!a.traitee ? { background: '#1B5E20', borderColor: '#1B5E20' } : undefined}
                >
                  {a.traitee ? 'Rouvrir' : 'Traiter'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap mt-3">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-xs px-2.5 py-1 rounded-md border ${cat === c ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
              style={cat === c ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
