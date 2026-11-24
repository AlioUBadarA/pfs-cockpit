import { useRef, useState } from 'react'
import { lireFichierPourApi } from '../utils/entreprise'

export const MODES = ['Espèces', 'Mobile Money', 'Virement', 'Chèque']
// Même liste que le serveur (gcr/utils/versements.js).
export const MODES_AVEC_PREUVE = ['Chèque', 'Virement', 'Mobile Money']
const TYPES_PREUVE = ['image/jpeg', 'image/png', 'application/pdf']

const REFERENCE_LABEL = {
  'Chèque': 'Numéro du chèque',
  'Virement': 'Référence du virement',
  'Mobile Money': 'Numéro de transaction',
}

// Boutons de mode de paiement, sur le modèle d'une caisse.
export function ModeButtons({ value, onChange, avecCredit = false }) {
  const options = avecCredit ? ['', ...MODES] : MODES
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Mode de paiement">
      {options.map((m) => {
        const actif = value === m
        return (
          <button
            key={m || 'credit'}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(m)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              actif
                ? 'border-[#1b75bc] bg-[#eaf3fb] text-[#1b75bc]'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m || 'À crédit'}
          </button>
        )
      })}
    </div>
  )
}

// Référence et preuve de paiement. La preuve est obligatoire pour un chèque, un virement ou du
// Mobile Money. `preuve` est l'objet { nom, data } prêt pour l'API.
export function PreuveFields({ mode, reference, onReference, preuve, onPreuve }) {
  const [erreur, setErreur] = useState('')
  const inputRef = useRef(null)
  if (!MODES_AVEC_PREUVE.includes(mode)) return null

  const choisir = async (e) => {
    setErreur('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      onPreuve(await lireFichierPourApi(file, TYPES_PREUVE))
    } catch (err) {
      onPreuve(null)
      setErreur(err.message === 'Type de fichier refusé' ? 'Types acceptés : JPG, PNG ou PDF' : err.message)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{REFERENCE_LABEL[mode] || 'Référence'}</label>
        <input className="input" maxLength={80} value={reference} onChange={(e) => onReference(e.target.value)} placeholder="Facultatif" />
      </div>
      <div>
        <label className="label">Preuve de paiement *</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={choisir}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-sm file:font-medium hover:file:bg-gray-50"
        />
        <p className="text-xs text-gray-400 mt-1">
          Photo du chèque, capture du virement ou du message Mobile Money. JPG, PNG ou PDF, 3 Mo maximum.
        </p>
        {preuve && <p className="text-xs text-green-700 mt-1">Fichier prêt : {preuve.nom}</p>}
        {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
      </div>
    </div>
  )
}

// Libellé et couleur du statut de validation d'un encaissement.
export const VALIDATION = {
  declare: { label: 'À valider', className: 'text-amber-700 bg-amber-50' },
  valide: { label: 'Validé', className: 'text-green-700 bg-green-50' },
  rejete: { label: 'Rejeté', className: 'text-red-700 bg-red-50' },
}

export function ValidationBadge({ statut }) {
  const v = VALIDATION[statut] || VALIDATION.valide
  return <span className={`text-[10.5px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${v.className}`}>{v.label}</span>
}
