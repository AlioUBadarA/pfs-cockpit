import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import BarList from '../components/BarList'

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const pct = (n) => n != null ? Math.round(n) + ' %' : '-'

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
  const chartData = (data?.ca_mensuel || []).map((m) => ({ ...m, mois: `${m.mois}/${String(m.annee).slice(2)}` }))
  const objectifMensuel = (kpis.objectif_annuel || 0) / 12

  const topClients = (data?.top_clients || []).map((c, i) => ({
    label: c.nom, val: c.ca_total, disp: fmt(c.ca_total), rank: i + 1,
  }))
  const segArr = (data?.ca_par_segment || []).map((s) => ({ label: s.segment, val: s.ca, disp: fmt(s.ca) }))
  const regArr = (data?.ca_par_region || []).map((r) => ({ label: r.region, val: r.ca, disp: fmt(r.ca) }))
  const prodArr = (data?.ca_par_produit || []).map((p) => ({ label: p.produit, val: p.ca, disp: fmt(p.ca) }))
  const atteinteVendeurs = (data?.atteinte_vendeurs || []).map((v) => ({
    label: v.nom, val: v.taux_atteinte, disp: pct(v.taux_atteinte),
    color: v.taux_atteinte >= 100 ? '#1B5E20' : v.taux_atteinte >= 80 ? '#1b75bc' : '#CC0000',
  }))
  const mv = data?.mouvements || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Direction</h2>
        <p className="text-sm text-gray-500 mt-0.5">Vue exécutive consolidée &middot; pilotage de la rizerie</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CA cumulé YTD" value={fmt(kpis.ca_ytd)} sub={`sur ${kpis.nb_ventes_ytd ?? 0} commandes`} color="#1b75bc" />
        <KpiCard title="Projection annuelle" value={fmt(kpis.projection_annuel)} sub={`objectif ${fmt(kpis.objectif_annuel)}`} />
        <KpiCard title="Atteinte objectif" value={pct(kpis.taux_atteinte)} color={kpis.taux_atteinte >= 100 ? '#1B5E20' : kpis.taux_atteinte >= 80 ? '#F9A825' : '#CC0000'} />
        <KpiCard title="Marge nette" value={fmt(kpis.marge_nette)} sub={`${kpis.taux_marge_nette ?? 0} % du CA`} />
        <KpiCard title="Créances ouvertes" value={fmt(kpis.total_creances)} sub={`${kpis.nb_creances ?? 0} en attente`} color="#CC0000" />
        <KpiCard title="Prospection espérée" value={fmt(kpis.pipeline_espere)} sub={`${kpis.pipeline_nb ?? 0} prospect(s) en cours`} color="#5a6b7a" />
        <KpiCard title="Clients actifs" value={`${kpis.clients_actifs ?? 0} / ${kpis.clients_total ?? 0}`} sub={`${kpis.clients_dormants ?? 0} dormants`} />
        <KpiCard title="Alertes critiques" value={mv.cmd_retard ?? 0} sub="à traiter" color="#CC0000" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Panel title="Évolution du chiffre d'affaires" sub="6 derniers mois · ligne objectif mensuel">
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {objectifMensuel > 0 && (
                    <ReferenceLine y={objectifMensuel} stroke="#1B5E20" strokeDasharray="6 4" label={{ value: `Objectif ${fmt(objectifMensuel)}/mois`, fontSize: 11, fill: '#1B5E20', position: 'insideTopLeft' }} />
                  )}
                  <Bar dataKey="ca" fill="#1b75bc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <Panel title="Atteinte par commercial" sub="% du prorata annuel">
          <BarList items={atteinteVendeurs} labelWidth="100px" dense />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Top 10 clients" sub="par CA sur la période">
          <BarList items={topClients} labelWidth="140px" dense />
        </Panel>
        <Panel title="CA par segment">
          <BarList items={segArr} labelWidth="140px" dense color="#5a6b7a" />
        </Panel>
        <Panel title="CA par région">
          <BarList items={regArr} labelWidth="120px" dense color="#7a6a52" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="CA par produit" sub="mix gamme riz">
          <BarList items={prodArr} labelWidth="180px" dense />
        </Panel>
        <Panel
          title="Mouvements du portefeuille"
          right={<Link to="/actions" className="text-xs font-semibold" style={{ color: 'var(--cc-accent)' }}>Voir les alertes →</Link>}
        >
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Clients gagnés" value={mv.clients_gagnes ?? 0} sub="opportunités signées" color="#1B5E20" />
            <Stat label="Clients perdus" value={mv.clients_perdus ?? 0} sub="prospects perdus" color="#CC0000" />
            <Stat label="Nouveaux contrats" value={mv.nouveaux_contrats ?? 0} sub="signés cette année" />
            <Stat label="Cmd en retard" value={mv.cmd_retard ?? 0} sub="paiement" color="#F9A825" />
          </div>
        </Panel>
      </div>
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
