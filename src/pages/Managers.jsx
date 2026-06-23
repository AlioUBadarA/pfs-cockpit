import { useEffect, useState } from 'react'
import api from '../services/api'
import Panel from '../components/Panel'
import KpiCard from '../components/KpiCard'
import DataTable from '../components/DataTable'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

function TauxBadge({ taux }) {
  const color = taux >= 100 ? '#1B5E20' : taux >= 80 ? '#F9A825' : '#CC0000'
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}1a`, color }}>{Math.round(taux)} %</span>
}

export default function Managers() {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/managers')
      .then((r) => setManagers(r.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="w-8 h-8 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Managers</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance par équipe et par zone</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-4">{error}</div>}

      {!error && managers.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <p>Aucun manager créé pour le moment.</p>
          <p className="text-xs mt-1">Un manager peut être créé depuis la page Commerciaux.</p>
        </div>
      )}

      {managers.map((mg) => (
        <Panel key={mg.id} title={`${mg.nom} · Manager`} sub={`Zone ${mg.zone || 'n/a'} · ${mg.nb_com} commercial(aux)`}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <KpiCard title="CA cumulé YTD" value={fmt(mg.ca_ytd)} sub={`objectif ${fmt(mg.obj_annuel)}`} color="#1b75bc" />
            <KpiCard title="Atteinte" value={`${Math.round(mg.taux_atteinte)} %`} color={mg.taux_atteinte >= 100 ? '#1B5E20' : mg.taux_atteinte >= 90 ? '#F9A825' : '#CC0000'} />
            <KpiCard title="Projection annuelle" value={fmt(mg.forecast)} sub={mg.obj_annuel ? `${Math.round(mg.forecast / mg.obj_annuel * 100)} % / obj` : ''} />
            <KpiCard title="Marge nette" value={fmt(mg.marge)} />
            <KpiCard title="Créances équipe" value={fmt(mg.creances)} color="#CC0000" />
          </div>
          <DataTable
            headers={['Commercial', 'Objectif annuel', 'Réalisé YTD', 'Écart', 'Atteinte', 'Projection', 'Marge']}
            rows={mg.team.map((p) => [
              p.nom,
              fmt(p.obj_annuel),
              fmt(p.ca_ytd),
              { v: (p.ecart >= 0 ? '+' : '') + fmt(p.ecart), c: p.ecart >= 0 ? '#1B5E20' : '#CC0000' },
              { v: <TauxBadge taux={p.taux_atteinte} /> },
              fmt(p.forecast),
              fmt(p.marge),
            ])}
            align={['left', 'right', 'right', 'right', 'left', 'right', 'right']}
          />
        </Panel>
      ))}
    </div>
  )
}
