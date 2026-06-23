import { useEffect, useState } from 'react'
import api from '../services/api'
import Panel from '../components/Panel'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

function Li({ main, sub, val, color }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <div className="min-w-0">
        <div className="text-[13px] text-gray-800 font-medium truncate">{main}</div>
        {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
      </div>
      <div className="text-[13px] font-semibold whitespace-nowrap" style={{ color: color || '#1a1714' }}>{val}</div>
    </div>
  )
}

function Block({ title, color, children, empty }) {
  return (
    <section className="panel">
      <div className="flex items-center gap-2.5 pb-2.5 border-b" style={{ borderColor: '#f0ebe1' }}>
        <span className="w-1.5 h-4.5 rounded-sm" style={{ background: color }} />
        <span className="font-display text-[15px] font-semibold">{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {children.length ? children : <p className="text-sm text-gray-400 py-1">{empty}</p>}
      </div>
    </section>
  )
}

export default function Insights() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dash, setDash] = useState(null)
  const [prospects, setProspects] = useState([])
  const [rentabilite, setRentabilite] = useState(null)
  const [actions, setActions] = useState(null)
  const [clients, setClients] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard'),
      api.get('/api/prospection'),
      api.get('/api/rentabilite'),
      api.get('/api/actions'),
      api.get('/api/clients'),
    ])
      .then(([d, p, r, a, c]) => {
        setDash(d.data)
        setProspects(p.data || [])
        setRentabilite(r.data)
        setActions(a.data)
        setClients(c.data || [])
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="w-8 h-8 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-4 text-sm">{error}</div>

  const topProspects = [...prospects]
    .filter((p) => p.statut !== 'Gagné' && p.statut !== 'Perdu')
    .sort((a, b) => Number(b.valeur_estimee || 0) - Number(a.valeur_estimee || 0))
    .slice(0, 5)

  const alertes = actions?.alertes || []
  const clientsRisque = alertes.filter((a) => a.cat === 'Client inactif' && !a.traitee).slice(0, 5)
  const creancesCritiques = alertes.filter((a) => a.cat === 'Créance en retard' && a.niveau === 'rouge' && !a.traitee)

  const topRentables = [...(rentabilite?.par_client || [])]
    .sort((a, b) => b.taux_marge - a.taux_marge)
    .slice(0, 3)
  const produitsDeclin = (rentabilite?.par_produit || []).filter((p) => p.tendance === 'déclin').slice(0, 2)

  const zonePot = {}
  clients.forEach((c) => { if (c.region) zonePot[c.region] = (zonePot[c.region] || 0) + Number(c.potentiel_annuel || 0) })
  const zoneCa = {}
  ;(rentabilite?.par_region || []).forEach((r) => { zoneCa[r.region] = r.ca })
  const zones = Object.entries(zonePot)
    .map(([region, pot]) => ({ region, pot, ca: zoneCa[region] || 0, gap: pot - (zoneCa[region] || 0) }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4)

  const kpis = dash?.kpis || {}
  const negociation = prospects.filter((p) => p.statut === 'Négociation' || p.statut === 'Proposition')
  const valeurNegociation = negociation.reduce((s, p) => s + Number(p.valeur_estimee || 0), 0)
  const sousObjectif = alertes.find((a) => a.cat === 'Objectif sous cible' && !a.traitee)

  const actionsPrioritaires = [
    {
      n: '1', c: '#CC0000',
      t: `Relancer les ${creancesCritiques.length} créance(s) critique(s) (+90 jours de retard)`,
      w: `Recouvrement · ${fmt(creancesCritiques.reduce((s, a) => s + a.valeur, 0))}`,
    },
    {
      n: '2', c: '#F9A825',
      t: `Réactiver ${clientsRisque.length} client(s) dormant(s) par une offre ciblée`,
      w: 'Portefeuille · LTV à protéger',
    },
    {
      n: '3', c: '#1B5E20',
      t: `Accélérer les ${negociation.length} prospect(s) en négociation pour sécuriser la projection`,
      w: `Pipeline · ${fmt(valeurNegociation)}`,
    },
    {
      n: '4', c: '#5a6b7a',
      t: sousObjectif ? `Soutenir ${sousObjectif.owner_nom} (sous objectif) par de l'accompagnement terrain` : 'Toute l\'équipe est dans ses objectifs',
      w: 'Management',
    },
    {
      n: '5', c: '#7a6a52',
      t: produitsDeclin.length ? `Arbitrer la gamme en déclin (${produitsDeclin.map((p) => p.produit).join(', ')}) vs produits à forte marge` : 'Aucun produit en déclin détecté',
      w: 'Rentabilité',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Analyses & Actions</h2>
        <p className="text-sm text-gray-500 mt-0.5">Opportunités, risques et plan d'actions prioritaires</p>
      </div>

      <Panel title="Plan d'actions prioritaires" sub="recommandations générées à partir des signaux du cockpit">
        <div className="flex flex-col gap-2.5">
          {actionsPrioritaires.map((a) => (
            <div key={a.n} className="flex gap-3.5 items-center px-3.5 py-3 rounded-lg" style={{ background: '#faf8f4', border: '1px solid #f0ebe1' }}>
              <div className="font-display text-2xl font-bold w-7 flex-none" style={{ color: a.c }}>{a.n}</div>
              <div className="flex-1">
                <div className="text-[13.5px] text-gray-800 font-medium">{a.t}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{a.w}</div>
              </div>
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: a.c }} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Block title="Top prospects" color="#1B5E20" empty="Aucun prospect en cours.">
          {topProspects.map((p) => (
            <Li key={p.id} main={p.nom} sub={p.statut} val={fmt(p.valeur_estimee)} />
          ))}
        </Block>

        <Block title="Clients à risque" color="#CC0000" empty="Aucun client inactif détecté.">
          {clientsRisque.map((c) => (
            <Li key={c.key} main={c.msg} sub={c.cat} val={c.owner_nom || '-'} color="#CC0000" />
          ))}
        </Block>

        <Block title="Prévision mois prochain" color="#F9A825" empty="Pas encore de données.">
          {[
            { main: 'CA attendu', sub: 'rythme des 3 derniers mois', val: fmt(kpis.projection_annuel ? kpis.projection_annuel / 12 : 0) },
            { main: 'À signer bientôt', sub: 'signature prévue < 30 j', val: fmt(valeurNegociation) },
            { main: 'Objectif mensuel', sub: 'groupe', val: fmt(kpis.objectif_annuel ? kpis.objectif_annuel / 12 : 0) },
            { main: 'Reste à faire', sub: "pour l'objectif annuel", val: fmt(Math.max(0, (kpis.objectif_annuel || 0) - (kpis.ca_ytd || 0))), color: '#F9A825' },
          ].map((li, i) => <Li key={i} {...li} />)}
        </Block>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Block title="Produits les plus rentables" color="#1B5E20" empty="Pas encore de données de rentabilité.">
          {topRentables.map((r, i) => <Li key={i} main={r.client_nom} sub={`taux net ${r.taux_marge} %`} val={fmt(r.marge)} />)}
        </Block>

        <Block title="Produits en déclin" color="#CC0000" empty="Aucun produit en déclin détecté.">
          {produitsDeclin.map((p, i) => <Li key={i} main={p.produit} sub="tendance baissière" val={`${p.taux_marge} %`} color="#CC0000" />)}
        </Block>

        <Block title="Zones à fort potentiel" color="#5a6b7a" empty="Renseignez la région et le potentiel annuel des clients pour activer ce panneau.">
          {zones.map((z, i) => <Li key={i} main={z.region} sub={`CA actuel ${fmt(z.ca)}`} val={`+${fmt(z.gap)} pot.`} color="#1B5E20" />)}
        </Block>
      </div>
    </div>
  )
}
