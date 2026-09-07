import { AsYouType, getCountryCallingCode } from 'libphonenumber-js'

// Formate le numéro en direct selon l'indicatif du pays sélectionné (ex: +221 pour le Sénégal).
// La valeur exposée via onChange inclut toujours l'indicatif, pour rester non ambigu
// quel que soit le pays de la rizerie.
export default function PhoneField({ country, value, onChange, label = 'Téléphone', required, placeholder }) {
  let callingCode = null
  try { callingCode = country ? getCountryCallingCode(country) : null } catch { callingCode = null }

  const prefix = callingCode ? `+${callingCode} ` : ''
  const national = value && value.startsWith(prefix) ? value.slice(prefix.length) : (value || '')

  const handleChange = (e) => {
    const raw = e.target.value
    const formatted = country ? new AsYouType(country).input(raw) : raw
    onChange(prefix + formatted)
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex gap-2">
        {callingCode && (
          <span className="px-3 flex items-center justify-center bg-gray-50 text-gray-500 text-sm font-medium rounded-lg border border-gray-300 shrink-0">
            +{callingCode}
          </span>
        )}
        <input
          className="input flex-1"
          value={national}
          onChange={handleChange}
          required={required}
          placeholder={placeholder || '77 123 45 67'}
        />
      </div>
    </div>
  )
}
