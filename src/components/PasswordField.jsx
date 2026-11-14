import { useState } from 'react'

function EyeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.9" />
      <path d="M6.4 6.4A17 17 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.7" />
      <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
    </svg>
  )
}

// Champ mot de passe avec un bouton œil. Le mot de passe est masqué par défaut.
// Les autres props (value, onChange, required, minLength, placeholder...) vont à l'input.
export default function PasswordField({ className = '', autoComplete = 'new-password', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={`input pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-[#1b75bc]/[0.07] hover:text-[#1b75bc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
