import { useState } from 'react'
import api from '../services/api'

// Valeurs exactes du backend (gcr/utils/paiement.js et gcr/utils/parametresRizerie.js)
export const TOUTES_CONDITIONS = ['Comptant', 'J+15', 'J+30', 'J+45', 'J+60', 'J+90', '50% comptant / 50% J+15', '50% comptant / 50% J+30']
export const TOUS_MODES = ['Espèces', 'Mobile Money', 'Virement', 'Chèque']
export const REGLES_DEFAUT = {
  conditions_paiement: TOUTES_CONDITIONS,
  condition_defaut: null,
  modes_paiement: TOUS_MODES,
  modes_preuve: ['Chèque', 'Virement', 'Mobile Money'],
  validation_responsables: true,
  remise_max_pct: null,
  alerte_client_inactif_jours: 60,
  alerte_creance_jours: 30,
  alerte_objectif_pct: 80,
  taux_cout_defaut_pct: 70,
}

function Cases({ options, valeurs, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const actif = valeurs.includes(o)
        return (
          <label key={o} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
            actif ? 'border-[#1b75bc] bg-[#eaf3fb] text-[#1b75bc]' : 'border-gray-300 text-gray-600'
          } ${disabled ? 'opacity-60 cursor-default' : ''}`}>
            <input
              type="checkbox"
              className="accent-[#1b75bc]"
              checked={actif}
              disabled={disabled}
              onChange={() => onChange(actif ? valeurs.filter((v) => v !== o) : options.filter((x) => valeurs.includes(x) || x === o))}
            />
            {o}
          </label>
        )
      })}
    </div>
  )
}

function Nombre({ id, label, aide, value, onChange, min, max, suffixe, disabled, vide }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          className="input w-28 disabled:bg-gray-50"
          value={value ?? ''}
          placeholder={vide}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
        <span className="text-sm text-gray-500">{suffixe}</span>
      </div>
      {aide && <p className="text-xs text-gray-400 mt-1">{aide}</p>}
    </div>
  )
}

// Règles commerciales propres à la rizerie. Le serveur les applique à chaque vente,
// encaissement et validation. Le rizier et le directeur les modifient.
export default function ReglesRizerie({ regles, peutModifier, onEnregistre }) {
  const [r, setR] = useState({ ...REGLES_DEFAUT, ...(regles || {}) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState('')
  const set = (k) => (v) => setR((p) => ({ ...p, [k]: v }))
  const off = !peutModifier

  const enregistrer = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSucces('')
    try {
      const { data } = await api.put('/api/rizerie/parametres', {
        ...r,
        condition_defaut: r.condition_defaut && r.conditions_paiement.includes(r.condition_defaut) ? r.condition_defaut : null,
        modes_preuve: r.modes_preuve.filter((m) => r.modes_paiement.includes(m)),
      })
      setR({ ...REGLES_DEFAUT, ...data.parametres })
      setSucces('Règles enregistrées. Elles s\'appliquent tout de suite, sur le site et dans l\'app.')
      onEnregistre?.()
    } catch (err) {
      setError(err.response?.data?.error || 'Enregistrement impossible')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      {succes && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{succes}</div>}

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">Conditions de paiement</h3>
        <p className="text-sm text-gray-500">Le commercial choisit seulement parmi les conditions cochées.</p>
        <Cases options={TOUTES_CONDITIONS} valeurs={r.conditions_paiement} onChange={set('conditions_paiement')} disabled={off} />
        <div className="max-w-xs">
          <label className="label" htmlFor="r-defaut">Condition par défaut</label>
          <select id="r-defaut" className="input disabled:bg-gray-50" value={r.condition_defaut || ''} disabled={off}
            onChange={(e) => set('condition_defaut')(e.target.value || null)}>
            <option value="">Aucune</option>
            {r.conditions_paiement.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Appliquée quand le commercial ne précise rien.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">Modes de paiement</h3>
        <p className="text-sm text-gray-500">Modes acceptés par la rizerie.</p>
        <Cases options={TOUS_MODES} valeurs={r.modes_paiement} onChange={set('modes_paiement')} disabled={off} />
        <p className="text-sm text-gray-500 pt-2">Modes qui exigent une preuve (photo, capture).</p>
        <Cases options={r.modes_paiement} valeurs={r.modes_preuve.filter((m) => r.modes_paiement.includes(m))} onChange={set('modes_preuve')} disabled={off} />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">Validation et prix</h3>
        <label className={`flex items-start gap-3 text-sm ${off ? 'opacity-70' : ''}`}>
          <input type="checkbox" className="mt-1 accent-[#1b75bc]" checked={r.validation_responsables} disabled={off}
            onChange={(e) => set('validation_responsables')(e.target.checked)} />
          <span>
            <span className="font-medium text-gray-800">Les responsables valident aussi les encaissements</span>
            <span className="block text-gray-500">Décoché : seul le comptable valide. Le manager, le directeur et le rizier voient sans valider.</span>
          </span>
        </label>
        <Nombre id="r-remise" label="Remise maximale du commercial" suffixe="% du prix catalogue" min={0} max={100}
          value={r.remise_max_pct} onChange={set('remise_max_pct')} disabled={off} vide="Libre"
          aide="Laissez vide pour ne pas limiter. Le manager et les responsables ne sont pas limités." />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">Alertes et rentabilité</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Nombre id="r-inactif" label="Client inactif après" suffixe="jours sans achat" min={7} max={365}
            value={r.alerte_client_inactif_jours} onChange={set('alerte_client_inactif_jours')} disabled={off} />
          <Nombre id="r-creance" label="Créance en retard après" suffixe="jours après l'échéance" min={1} max={365}
            value={r.alerte_creance_jours} onChange={set('alerte_creance_jours')} disabled={off} />
          <Nombre id="r-objectif" label="Objectif sous la cible en dessous de" suffixe="% d'atteinte" min={10} max={100}
            value={r.alerte_objectif_pct} onChange={set('alerte_objectif_pct')} disabled={off} />
          <Nombre id="r-cout" label="Taux de coût par défaut" suffixe="% du prix de vente" min={0} max={100}
            value={r.taux_cout_defaut_pct} onChange={set('taux_cout_defaut_pct')} disabled={off}
            aide="Utilisé quand le coût réel d'un produit n'est pas connu." />
        </div>
      </section>

      {peutModifier && (
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Enregistrement…' : 'Enregistrer les règles'}
          </button>
        </div>
      )}
    </form>
  )
}
