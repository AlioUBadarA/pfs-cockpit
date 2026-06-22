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

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard'),
      api.get('/api/prospection'),
      api.get('/api/rentabilite'),
      api.get('/api/actions'),
    ])
      .then(([d, p, r, a]) => {
        setDash(d.data)
        setProspects(p.data || [])
        setRentabilite(r.data)
        setActions(a.data)
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

  const clientsRisque = (actions?.clients_inactifs || []).slice(0, 5)
  const creancesCritiques = (actions?.creances_retard || [])
    .filter((c) => c.jours_retard > 30)
    .slice(0, 5)

  const topRentables = [...(rentabilite?.par_client || [])]
    .sort((a, b) => b.taux_marge - a.taux_marge)
    .slice(0, 5)

  const kpis = dash?.kpis || {}
  const negociation = prospects.filter((p) => p.statut === 'Devis envoyé' || p.statut === 'Présentation faite')
  const valeurNegociation = negociation.reduce((s, p) => s + Number(p.valeur_estimee || 0), 0)

  const actionsPrioritaires = [
    {
      n: '1', c: '#CC0000',
      t: `Relancer les ${creancesCritiques.length} créance(s) critique(s) (+30 jours de retard)`,
      w: 'Recouvrement',
    },
    {
      n: '2', c: '#F9A825',
      t: `Réactiver ${clientsRisque.length} client(s) inactif(s) par une offre ciblée`,
      w: 'Portefeuille',
    },
    {
      n: '3', c: '#1b75bc',
      t: `Accélérer les ${negociation.length} prospect(s) en négociation pour sécuriser ${fmt(valeurNegociation)}`,
      w: 'Pipeline',
    },
    {
      n: '4', c: '#5a6b7a',
      t: `Taux de recouvrement actuel : ${kpis.taux_recouvrement != null ? kpis.taux_recouvrement + ' %' : 'n/a'} — surveiller les nouveaux encours`,
      w: 'Direction',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Insights</h2>
        <p className="text-sm text-gray-500 mt-0.5">Opportunités, risques et plan d'actions prioritaires</p>
      </div>

      <Panel title="Plan d'actions prioritaires" sub="généré à partir des signaux du cockpit">
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
        <Block title="Top prospects" color="#1b75bc" empty="Aucun prospect en cours.">
          {topProspects.map((p) => (
            <Li key={p.id} main={p.nom} sub={p.statut} val={fmt(p.valeur_estimee)} />
          ))}
        </Block>

        <Block title="Clients à risque" color="#CC0000" empty="Aucun client inactif détecté.">
          {clientsRisque.map((c) => (
            <Li key={c.id} main={c.nom} sub={c.jours_inactif != null ? `inactif depuis ${c.jours_inactif} j` : 'jamais acheté'} val={c.vendeur_nom || '-'} color="#CC0000" />
          ))}
        </Block>

        <Block title="Meilleurs taux de marge" color="#1565C0" empty="Pas encore de données de rentabilité.">
          {topRentables.map((r, i) => (
            <Li key={i} main={r.client_nom} sub={`marge ${fmt(r.marge)}`} val={`${r.taux_marge} %`} color="#1565C0" />
          ))}
        </Block>
      </div>
    </div>
  )
}
