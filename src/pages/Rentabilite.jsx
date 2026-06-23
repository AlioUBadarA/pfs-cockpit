import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import DataTable from '../components/DataTable'
import BarList from '../components/BarList'

const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' F'

function TauxBadge({ taux }) {
  const color = taux >= 30 ? 'bg-green-100 text-green-700'
              : taux >= 15 ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {taux}%
    </span>
  )
}

export default function Rentabilite() {
  const [annee, setAnnee]       = useState(new Date().getFullYear())
  const [tauxCout, setTauxCout] = useState(70)
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/rentabilite', { params: { annee, taux_cout: tauxCout } })
      .then(r => setData(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [annee, tauxCout])

  useEffect(() => { load() }, [load])

  const chartData = data?.par_type?.map(r => ({
    name:    r.type_client,
    CA:      r.ca,
    Marge:   r.marge,
  })) || []

  const rows = (data?.par_client || []).map((r) => [
    r.client_nom,
    { v: r.type_client, c: '#8a7f6e' },
    { v: fmt(r.ca), c: '#1b75bc', bold: true },
    fmt(r.cout),
    { v: fmt(r.marge), c: '#1565C0' },
    { v: <TauxBadge taux={r.taux_marge} /> },
    r.nb_ventes,
    { v: r.vendeur_nom || '-', c: '#9a8f7e' },
  ])

  const regionArr  = (data?.par_region  || []).map((r) => ({ label: r.region,  val: r.marge, disp: fmt(r.marge) }))
  const segmentArr = (data?.par_segment || []).map((r) => ({ label: r.segment, val: r.marge, disp: fmt(r.marge) }))

  const prodRows = (data?.par_produit || []).map((r) => [
    { v: r.produit, sub: r.tendance },
    fmt(r.ca), fmt(r.marge),
    { v: <TauxBadge taux={r.taux_marge} /> },
    { v: r.tendance || '-', c: r.tendance === 'hausse' ? '#1B5E20' : r.tendance === 'déclin' ? '#CC0000' : '#8a7f6e' },
  ])

  const vendeurRows = (data?.par_vendeur || []).map((r) => [
    r.vendeur_nom || '-', fmt(r.ca), fmt(r.marge),
    { v: <TauxBadge taux={r.taux_marge} /> },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Rentabilité</h2>
          <p className="text-sm text-gray-500 mt-0.5">Marges par client, type et produit</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Année</label>
            <select className="input w-auto" value={annee} onChange={e => setAnnee(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Taux de coût (%)</label>
            <input
              type="number" min="0" max="100" className="input w-20 py-1"
              value={tauxCout}
              onChange={e => setTauxCout(+e.target.value)}
              onBlur={load}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard title="CA total" value={fmt(data.ca_total)} color="#1b75bc" />
          <KpiCard title={`Coût estimé (${tauxCout}%)`} value={fmt(data.ca_total * tauxCout / 100)} color="#8a7f6e" />
          <KpiCard title="Marge brute" value={fmt(data.ca_total * (100 - tauxCout) / 100)} color="#1565C0" />
          <KpiCard title="Taux de marge" value={`${100 - tauxCout}%`} color="#6b46c1" />
        </div>
      )}

      {chartData.length > 0 && (
        <Panel title="CA et marge par type de client">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
              <Tooltip formatter={v => Number(v).toLocaleString('fr-FR') + ' F'} />
              <Legend />
              <Bar dataKey="CA"    fill="#2E7D32" radius={[3,3,0,0]} />
              <Bar dataKey="Marge" fill="#81C784" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Marge nette par région">
              <BarList items={regionArr} labelWidth="130px" color="#1B5E20" dense />
            </Panel>
            <Panel title="Marge nette par segment">
              <BarList items={segmentArr} labelWidth="150px" color="#1B5E20" dense />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Rentabilité par produit" sub="marge & tendance gamme">
              <DataTable headers={['Produit', 'CA', 'Marge', 'Taux', 'Tendance']} rows={prodRows} align={['left', 'right', 'right', 'left', 'left']} />
            </Panel>
            <Panel title="Marge par commercial">
              <DataTable headers={['Commercial', 'CA', 'Marge', 'Taux']} rows={vendeurRows} align={['left', 'right', 'right', 'left']} />
            </Panel>
          </div>

          <Panel title="Détail par client">
            <DataTable
              headers={['Client', 'Type', 'CA', 'Coût', 'Marge', 'Taux', 'Ventes', 'Vendeur']}
              rows={rows}
              align={['left', 'left', 'right', 'right', 'right', 'left', 'right', 'left']}
            />
          </Panel>
        </>
      )}
    </div>
  )
}
