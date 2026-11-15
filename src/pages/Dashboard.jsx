import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import api from '../services/api'

import Panel from '../components/Panel'
import BarList from '../components/BarList'
import { formatCFA as fmt } from '../utils/format'

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

      {/* Ce qui demande une action passe en premier, et seulement s'il y en a. */}
      {(mv.cmd_retard ?? 0) > 0 && (
        <Link
          to="/actions"
          className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium"
          style={{ background: '#fdecec', color: '#a32020' }}
        >
          <span>{mv.cmd_retard} alerte{mv.cmd_retard > 1 ? 's' : ''} critique{mv.cmd_retard > 1 ? 's' : ''} à traiter</span>
          <span aria-hidden="true">Voir →</span>
        </Link>
      )}

      {/* Le chiffre qui compte : le CA de l'année, face à l'objectif. */}
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cc-text-muted)' }}>Chiffre d'affaires de l'année</p>
            <p className="font-display text-4xl font-bold tabular-nums mt-1" style={{ color: 'var(--cc-text)' }}>{fmt(kpis.ca_ytd)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--cc-text-muted)' }}>sur {kpis.nb_ventes_ytd ?? 0} commandes</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cc-text-muted)' }}>Marge nette</p>
            <p className="font-display text-2xl font-semibold tabular-nums mt-1" style={{ color: 'var(--cc-text)' }}>{fmt(kpis.marge_nette)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--cc-text-muted)' }}>{kpis.taux_marge_nette ?? 0} % du CA</p>
          </div>
        </div>
        <Progression atteinte={kpis.taux_atteinte} projection={kpis.projection_annuel} objectif={kpis.objectif_annuel} />
      </section>

      {/* Les autres chiffres : deux bandeaux compacts, sans cartes. Couleur seulement si action. */}
      <section className="card p-0">
        <Bandeau titre="Trésorerie">
          <Chiffre libelle="Encaissé ce mois" valeur={fmt(kpis.encaisse_mois)} detail={`${fmt(kpis.encaisse_ytd)} depuis janvier`} />
          <Chiffre libelle="Créances ouvertes" valeur={fmt(kpis.total_creances)} detail={`${kpis.nb_creances ?? 0} en attente`} alerte={(kpis.nb_creances ?? 0) > 0} />
          <Chiffre libelle="Recouvrement" valeur={kpis.taux_recouvrement != null ? `${kpis.taux_recouvrement} %` : '-'} detail="versements / facturé" alerte={kpis.taux_recouvrement != null && kpis.taux_recouvrement < 50} />
        </Bandeau>
        <Bandeau titre="Développement">
          <Chiffre libelle="Prospection espérée" valeur={fmt(kpis.pipeline_espere)} detail={`${kpis.pipeline_nb ?? 0} prospect(s) en cours`} />
          <Chiffre libelle="Clients actifs" valeur={`${kpis.clients_actifs ?? 0} / ${kpis.clients_total ?? 0}`} detail={`${kpis.clients_dormants ?? 0} dormants`} />
        </Bandeau>
      </section>

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

/** Barre d'atteinte de l'objectif annuel : vert si atteint, bleu si en bonne voie, rouge sinon. */
function Progression({ atteinte, projection, objectif }) {
  const taux = Math.max(0, Number(atteinte) || 0)
  const couleur = taux >= 100 ? '#1B5E20' : taux >= 80 ? 'var(--cc-accent)' : '#CC0000'
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold tabular-nums" style={{ color: couleur }}>{pct(atteinte)}</span>
          <span style={{ color: 'var(--cc-text-muted)' }}> de l'objectif atteint</span>
        </span>
        <span className="tabular-nums" style={{ color: 'var(--cc-text-muted)' }}>
          Projection {fmt(projection)} · objectif {fmt(objectif)}
        </span>
      </div>
      <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: '#e8edf1' }} role="progressbar" aria-valuenow={Math.round(taux)} aria-valuemin={0} aria-valuemax={100} aria-label="Atteinte de l'objectif annuel">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, taux)}%`, background: couleur }} />
      </div>
    </div>
  )
}

function Bandeau({ titre, children }) {
  return (
    <div className="flex flex-col sm:flex-row border-b last:border-b-0" style={{ borderColor: 'var(--cc-border)' }}>
      <p className="px-5 pt-4 sm:py-4 sm:w-36 shrink-0 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cc-text-muted)' }}>{titre}</p>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3">{children}</div>
    </div>
  )
}

function Chiffre({ libelle, valeur, detail, alerte = false }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs" style={{ color: 'var(--cc-text-muted)' }}>{libelle}</p>
      <p className="font-display text-xl font-semibold tabular-nums mt-0.5" style={{ color: alerte ? '#CC0000' : 'var(--cc-text)' }}>{valeur}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--cc-text-muted)' }}>{detail}</p>
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
