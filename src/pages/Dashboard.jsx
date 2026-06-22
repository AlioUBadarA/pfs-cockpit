import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import BarList from '../components/BarList'

const fmt = (n) =>
  n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'

const pct = (n) =>
  n != null ? Number(n).toFixed(1) + ' %' : '-'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-[#1b75bc]">{Number(payload[0].value).toLocaleString('fr-FR')} F</p>
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
  const creances = data?.creances || {}
  const chartData = data?.ca_mensuel || []
  const topClients = (data?.top_clients || []).map((c, i) => ({
    label: c.nom, val: c.ca_total, disp: fmt(c.ca_total), rank: i + 1,
  }))
  const nbAlertes = (creances.nb_retard || 0) + (kpis.clients_dormants || 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Direction</h2>
        <p className="text-sm text-gray-500 mt-0.5">Vue exécutive consolidée &middot; pilotage de la rizerie</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CA du mois" value={fmt(kpis.ca_mois)} sub={`${kpis.nb_ventes_mois ?? 0} vente(s)`} icon="💰" color="#1b75bc" />
        <KpiCard title="Total créances" value={fmt(kpis.total_creances)} sub={`${kpis.nb_creances ?? 0} en attente`} icon="📋" color="#CC0000" />
        <KpiCard title="Clients actifs" value={kpis.clients_actifs ?? '-'} sub={`${kpis.clients_prospects ?? 0} prospect(s)`} icon="👥" color="#62bb46" />
        <KpiCard
          title="Taux recouvrement"
          value={pct(kpis.taux_recouvrement)}
          icon="📈"
          color={kpis.taux_recouvrement >= 80 ? '#1b75bc' : '#CC0000'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Panel title="Chiffre d'affaires" sub="6 derniers mois">
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
                  <Bar dataKey="ca" fill="#62bb46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <Panel title="Top clients" sub="par chiffre d'affaires">
          <BarList items={topClients} labelWidth="110px" dense />
        </Panel>
      </div>

      <Panel
        title="Alertes en cours"
        sub="créances en retard, encours et clients dormants"
        right={<Link to="/actions" className="text-xs font-semibold" style={{ color: 'var(--cc-accent)' }}>Voir le détail →</Link>}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Créances en retard" value={fmt(creances.montant_retard)} sub={`${creances.nb_retard ?? 0} facture(s)`} color="#CC0000" />
          <Stat label="Créances en cours" value={fmt(creances.montant_encours)} sub={`${creances.nb_encours ?? 0} facture(s)`} color="#F9A825" />
          <Stat label="Clients dormants" value={kpis.clients_dormants ?? 0} sub="aucune commande récente" color="#F9A825" />
          <Stat label="Total à traiter" value={nbAlertes} sub="actions à mener" color="#CC0000" />
        </div>
      </Panel>
    </div>
  )
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-display text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
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
