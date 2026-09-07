import { useState } from 'react'
import PhoneField from './PhoneField'

// Bascule Email / Téléphone pour la création d'un compte : les deux sont acceptés comme
// identifiant de connexion (voir routes/auth.js), au moins l'un des deux est requis. On ne
// garde que le champ du mode actif pour ne jamais envoyer les deux à la fois au serveur.
export default function IdentifiantField({ email, telephone, onEmailChange, onTelephoneChange, country, required = true }) {
  const [mode, setMode] = useState(telephone && !email ? 'telephone' : 'email')

  const switchTo = (next) => {
    setMode(next)
    if (next === 'email') onTelephoneChange('')
    else onEmailChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{mode === 'email' ? 'Email' : 'Téléphone'} {required && '*'}</label>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:underline"
          onClick={() => switchTo(mode === 'email' ? 'telephone' : 'email')}
        >
          {mode === 'email' ? 'Utiliser un téléphone à la place' : 'Utiliser un email à la place'}
        </button>
      </div>
      {mode === 'email' ? (
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required={required}
          placeholder="email@exemple.com"
        />
      ) : (
        <PhoneField
          label=""
          country={country}
          value={telephone}
          onChange={onTelephoneChange}
          required={required}
        />
      )}
    </div>
  )
}
