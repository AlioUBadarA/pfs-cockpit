import { useEffect, useState } from 'react'

// Pays d'Afrique (54 États reconnus par l'ONU), les rizeries PFS sont réparties
// sur tout le continent, ce filtre évite de noyer le sélecteur dans les 250 pays du monde.
const AFRICA_ISO = [
  'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG',
  'GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML',
  'MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD',
  'TZ','TG','TN','UG','ZM','ZW',
]

// country-state-city embarque aussi une base de villes mondiale très lourde (~8 Mo) :
// on n'utilise donc que Country + State (~650 Ko), chargés à la demande (import
// dynamique) pour ne pas alourdir le bundle principal. La ville reste un champ libre.
export default function LocationFields({ pays, region, ville, onChange }) {
  const [csc, setCsc] = useState(null)

  useEffect(() => {
    // Sous-modules importés directement (pas l'index du package) pour éviter
    // d'entraîner le très lourd city.json (~8 Mo) dans ce chunk, inutilisé ici.
    Promise.all([
      import('country-state-city/lib/country'),
      import('country-state-city/lib/state'),
    ]).then(([countryMod, stateMod]) => setCsc({ Country: countryMod.default, State: stateMod.default }))
  }, [])

  if (!csc) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {['Pays', 'Région', 'Ville'].map((l) => (
          <div key={l}>
            <label className="label">{l}</label>
            <div className="input bg-gray-50 text-gray-400 text-sm">Chargement...</div>
          </div>
        ))}
      </div>
    )
  }

  const { Country, State } = csc
  const countries = Country.getAllCountries()
    .filter((c) => AFRICA_ISO.includes(c.isoCode))
    .sort((a, b) => a.name.localeCompare(b.name))
  const states = pays ? State.getStatesOfCountry(pays) : []

  const setPays = (e) => onChange({ pays: e.target.value, region: '', ville: '' })
  const setRegion = (e) => onChange({ pays, region: e.target.value, ville: '' })
  const setVille = (e) => onChange({ pays, region, ville: e.target.value })

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="label">Pays</label>
        <select className="input" value={pays || ''} onChange={setPays}>
          <option value="">Choisir...</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Région</label>
        <select className="input" value={region || ''} onChange={setRegion} disabled={!pays || states.length === 0}>
          <option value="">{states.length ? 'Choisir...' : '-'}</option>
          {states.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Ville</label>
        <input className="input" value={ville || ''} onChange={setVille} placeholder="Ville" disabled={!pays} />
      </div>
    </div>
  )
}
