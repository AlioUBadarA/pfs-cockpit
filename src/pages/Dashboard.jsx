import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import StatutBadge from '../components/StatutBadge'

const fmt = (n) =>
  n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

const pct = (n) =>
  n != null ? Number(n).toFixed(1) + ' %' : '-'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-[#1B5E20]">{Number(payload[0].value).toLocaleString('fr-FR')} F</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setError('Impossible de charger le tableau de bord'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorBox msg={error} />

  const kpis = data?.kpis || {}
  const chartData = data?.ca_mensuel || []
  const topClients = data?.top_clients || []
  const alertes = data?.alertes || {}

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CA du mois"
          value={fmt(kpis.ca_mois)}
          icon="💰"
          color="#1B5E20"
        />
        <KpiCard
          title="Total créances"
          value={fmt(kpis.total_creances)}
          icon="📋"
          color="#CC0000"
        />
        <KpiCard
          title="Clients actifs"
          value={kpis.clients_actifs ?? '-'}
          icon="👥"
          color="#388E3C"
        />
        <KpiCard
          title="Taux recouvrement"
          value={pct(kpis.taux_recouvrement)}
          icon="📈"
          color={kpis.taux_recouvrement >= 80 ? '#1B5E20' : '#CC0000'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Chiffre d'affaires - 6 derniers mois
          </h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ca" fill="#388E3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top clients */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 5 clients</h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun client</p>
          ) : (
            <ol className="space-y-2">
              {topClients.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{c.nom}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1B5E20] whitespace-nowrap">
                    {fmt(c.ca_total)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Créances en retard */}
        <div className="card border-l-4 border-l-[#CC0000]">
          <h3 className="text-sm font-semibold text-[#CC0000] mb-3">
            ⚠ Créances en retard ({alertes.creances_retard?.length ?? 0})
          </h3>
          {!alertes.creances_retard?.length ? (
            <p className="text-sm text-gray-400">Aucune créance en retard</p>
          ) : (
            <ul className="space-y-1">
              {alertes.creances_retard.slice(0, 5).map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.client}</span>
                  <span className="text-[#CC0000] font-medium">{Number(c.montant).toLocaleString('fr-FR')} F</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clients dormants */}
        <div className="card border-l-4 border-l-[#F9A825]">
          <h3 className="text-sm font-semibold text-[#F9A825] mb-3">
            😴 Clients dormants ({alertes.clients_dormants?.length ?? 0})
          </h3>
          {!alertes.clients_dormants?.length ? (
            <p className="text-sm text-gray-400">Aucun client dormant</p>
          ) : (
            <ul className="space-y-1">
              {alertes.clients_dormants.slice(0, 5).map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.nom}</span>
                  <StatutBadge statut="Dormant" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-4 text-sm">
      {msg}
    </div>
  )
}
