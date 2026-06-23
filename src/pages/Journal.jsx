import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import Panel from '../components/Panel'
import BarList from '../components/BarList'
import KpiCard from '../components/KpiCard'
import DataTable from '../components/DataTable'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const monthStart = () => today().slice(0, 7) + '-01'

const MODE_COLOR = { 'Espèces': '#1B5E20', 'Virement': '#5a6b7a', 'Chèque': '#F9A825', 'Mobile Money': '#7a6a52' }

export default function Journal() {
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [data, setData] = useState({ ventes: [], versements: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/journal', { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(() => { load() }, [load])

  const { ventes, versements } = data
  const caVendu = ventes.reduce((s, v) => s + Number(v.montant), 0)
  const encaisse = versements.reduce((s, v) => s + Number(v.montant), 0)
  const resteVentes = ventes.reduce((s, v) => s + Math.max(0, Number(v.montant) - Number(v.total_verse || 0)), 0)

  const encMode = {}; versements.forEach((v) => { const md = v.mode || 'Autre'; encMode[md] = (encMode[md] || 0) + Number(v.montant) })
  const venteMode = {}; ventes.forEach((v) => { const md = v.mode || 'Autre'; venteMode[md] = (venteMode[md] || 0) + Number(v.montant) })
  const encBars = Object.entries(encMode).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, val: v, disp: fmt(v), color: MODE_COLOR[k] || '#9a8f7e' }))
  const venteBars = Object.entries(venteMode).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, val: v, disp: fmt(v), color: MODE_COLOR[k] || '#9a8f7e' }))
  const topMode = encBars[0]?.label || '—'

  const presetBtn = (label, f, t) => {
    const on = from === f && to === t
    return (
      <button
        key={label}
        onClick={() => { setFrom(f); setTo(t) }}
        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${on ? 'text-white' : 'bg-white text-gray-600 border-gray-300'}`}
        style={on ? { background: 'var(--cc-accent)', borderColor: 'var(--cc-accent)' } : undefined}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Journal du jour</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ventes et encaissements sur la période choisie</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="card flex flex-wrap items-center gap-3">
        <span className="font-display text-sm font-semibold">Du</span>
        <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="font-display text-sm font-semibold">au</span>
        <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        {presetBtn("Aujourd'hui", today(), today())}
        {presetBtn('7 jours', daysAgo(6), today())}
        {presetBtn('30 jours', daysAgo(29), today())}
        {presetBtn('Ce mois', monthStart(), today())}
        <div className="flex-1" />
        <span className="text-xs text-gray-500">{ventes.length} vente(s) · {versements.length} encaissement(s)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="CA vendu (période)" value={fmt(caVendu)} sub={`${ventes.length} ventes saisies`} color="#1b75bc" />
        <KpiCard title="Encaissé (période)" value={fmt(encaisse)} sub={`${versements.length} versements`} color="#1B5E20" />
        <KpiCard title="Moyen principal" value={topMode} sub="le plus encaissé" />
        <KpiCard title="Reste sur ventes" value={fmt(resteVentes)} sub="non encore encaissé" color="#F9A825" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (ventes.length + versements.length) === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          Aucune vente ni encaissement saisi sur cette période.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel title="Encaissements par moyen de paiement" sub={fmt(encaisse) + ' encaissés'}>
              {encBars.length ? <BarList items={encBars} labelWidth="130px" dense /> : <p className="text-sm text-gray-400">Aucun encaissement.</p>}
            </Panel>
            <Panel title="Ventes par moyen prévu" sub={fmt(caVendu) + ' vendus'}>
              {venteBars.length ? <BarList items={venteBars} labelWidth="130px" dense /> : <p className="text-sm text-gray-400">Aucune vente.</p>}
            </Panel>
          </div>

          <Panel title="Ventes" sub={`${ventes.length} opération(s)`}>
            {ventes.length ? (
              <DataTable
                headers={['Date', 'Client', 'Produit', 'Montant', 'Statut', 'Moyen']}
                rows={ventes.map((v) => [
                  fmtDate(v.date_vente), v.client_nom, v.produit,
                  { v: fmt(v.montant), bold: true }, v.statut_paiement, v.mode || '-',
                ])}
                align={['left', 'left', 'left', 'right', 'left', 'left']}
              />
            ) : <p className="text-sm text-gray-400">—</p>}
          </Panel>

          <Panel title="Encaissements" sub={`${versements.length} opération(s)`}>
            {versements.length ? (
              <DataTable
                headers={['Date', 'Client', 'Montant', 'Moyen']}
                rows={versements.map((v) => [fmtDate(v.date), v.client_nom, { v: fmt(v.montant), bold: true }, v.mode || '-'])}
                align={['left', 'left', 'right', 'left']}
              />
            ) : <p className="text-sm text-gray-400">—</p>}
          </Panel>
        </>
      )}
    </div>
  )
}
