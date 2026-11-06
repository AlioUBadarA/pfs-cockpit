import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import pfsIcon from '../assets/pfs-icon.png'
import pfsLogo from '../assets/pfs-logo.png'

const REMEMBER_KEY = 'pfs_remember_identifiant'

// Couleurs PFS du panneau gauche : vert en haut, bleu en bas.
const LOGIN_COLOR_GRADIENT = 'linear-gradient(180deg, #62bb46 0%, #62bb46 12%, #1b75bc 72%, #1b75bc 100%)'

// Opacité des couleurs, de gauche à droite. Le fondu commence dans le panneau gauche
// (pleine opacité jusqu'à 52 %, 30 % au bord), puis se prolonge dans la zone du formulaire
// et s'éteint juste avant les champs. Les deux masques se raccordent à 30 %.
const LOGIN_COLOR_FADE =
  'linear-gradient(90deg, #000 0%, #000 52%, rgba(0,0,0,.9) 62%, rgba(0,0,0,.72) 72%, rgba(0,0,0,.53) 82%, rgba(0,0,0,.4) 91%, rgba(0,0,0,.3) 100%)'
const LOGIN_COLOR_FADE_END =
  'linear-gradient(90deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.2) 25%, rgba(0,0,0,.11) 50%, rgba(0,0,0,.04) 75%, rgba(0,0,0,0) 100%)'

function readRememberedIdentifiant() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || ''
  } catch {
    return ''
  }
}

/* Icônes SVG inline */

function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  )
}

function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.9" />
      <path d="M6.4 6.4A17 17 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.7" />
      <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
    </svg>
  )
}

function ArrowRightIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function InfoIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function PlayIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 7 8 5-8 5V7Z" />
    </svg>
  )
}

/* Page de connexion */

export default function Login() {
  const { login, loginDemo, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(() => ({
    identifiant: readRememberedIdentifiant(),
    password: '',
  }))
  const [rememberMe, setRememberMe] = useState(() => Boolean(readRememberedIdentifiant()))
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotHelp, setShowForgotHelp] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const result = await login(form.identifiant, form.password)
    if (result.ok) {
      // On ne mémorise l'identifiant qu'après une connexion réussie.
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, form.identifiant.trim())
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* Stockage local indisponible : sans conséquence sur la connexion. */
      }
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  const handleDemo = async () => {
    setError('')
    const result = await loginDemo()
    if (result.ok) navigate('/')
    else setError(result.message)
  }

  const isSuspended = error.toLowerCase().includes('suspendu')

  return (
    <div className="min-h-[100dvh] w-full bg-[#f7f9fb] md:grid md:grid-cols-[minmax(240px,0.82fr)_minmax(0,1.18fr)] xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
      {/* Panneau gauche : vert PFS (haut) vers bleu PFS (bas), les couleurs s'estompent vers le blanc à droite */}
      <aside
        className="relative hidden min-h-[100dvh] flex-col justify-between overflow-hidden bg-white py-8 pl-7 pr-[38%] text-[#102536] md:sticky md:top-0 md:flex md:h-[100dvh] lg:pl-9 xl:py-10 xl:pl-12"
        aria-label="Présentation de Sales Cockpit"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: LOGIN_COLOR_GRADIENT,
            WebkitMaskImage: LOGIN_COLOR_FADE,
            maskImage: LOGIN_COLOR_FADE,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full items-center gap-4">
          <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-2xl bg-white p-2.5 shadow-[0_10px_24px_-14px_rgba(16,37,54,.45)]">
            <img src={pfsIcon} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="flex-none">
            <p className="whitespace-nowrap text-[clamp(11px,1.05vw,15px)] font-bold uppercase leading-tight tracking-[0.1em] text-[#102536]">
              Partners In Food Solutions
            </p>
            <p className="mt-0.5 font-display text-[25px] font-semibold leading-tight">
              Sales Cockpit
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[540px] text-white">
          <h2 className="font-display text-[clamp(2.1rem,2.9vw,3.1rem)] font-semibold leading-[1.15]">
            Le suivi commercial des rizeries accompagnées par PFS.
          </h2>
          <p className="mt-4 max-w-[42ch] text-[17px] leading-relaxed text-white/90">
            Ventes, contrats, encaissements et prévisions, dans un même outil partagé par les équipes des rizeries.
          </p>
        </div>
      </aside>

      {/* Zone principale : formulaire */}
      <main
        className="relative flex min-h-[100dvh] flex-col bg-white"
        aria-labelledby="login-title"
      >
        {/* Suite du fondu du panneau gauche : s'éteint juste avant le formulaire (500 px centré).
            Couche collante : elle reste alignée sur le panneau gauche pendant le défilement. */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
          <div
            className="sticky top-0 h-[100dvh]"
            style={{
              width: 'max(0px, calc(50% - 250px - 12px))',
              background: LOGIN_COLOR_GRADIENT,
              WebkitMaskImage: LOGIN_COLOR_FADE_END,
              maskImage: LOGIN_COLOR_FADE_END,
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#1b75bc]/[0.06] blur-3xl" />
          <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-[#62bb46]/[0.08] blur-3xl md:hidden" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1b75bc]/20 to-transparent md:hidden" />
        </div>

        <div className="login-center relative z-10 flex flex-1 items-center justify-center px-5 py-4 sm:px-8 md:px-10 xl:px-14">
          <div className="w-full max-w-[500px]">
            {/* Identité mobile : le panneau latéral est masqué */}
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
                <img src={pfsIcon} alt="Partners In Food Solutions" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight text-[#102536]">
                  Sales Cockpit
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Filière riz · PFS
                </p>
              </div>
            </div>

            <div className="login-rise login-rise-1">
              <h1
                id="login-title"
                className="font-display text-[clamp(2.2rem,3.4vw,2.9rem)] font-semibold leading-tight text-[#102536]"
              >
                Connexion
              </h1>
              <p className="mt-1 text-[18.5px] font-semibold leading-snug text-[#1b75bc]">
                Partners In Food Solutions vous souhaite la bienvenue
              </p>
              <p className="mt-1 text-[16px] leading-snug text-[#6b7b87] sm:whitespace-nowrap">
                Saisissez vos identifiants pour accéder à votre espace.
              </p>
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className={`login-rise mt-4 flex gap-3 rounded-xl border px-4 py-3.5 text-[14.5px] leading-relaxed ${
                  isSuspended
                    ? 'border-orange-300 bg-orange-50 text-orange-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg ${isSuspended ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'}`}>
                  <InfoIcon className="h-4 w-4" />
                </span>
                <div>
                  {isSuspended && <p className="font-semibold">Accès suspendu</p>}
                  <p>{error}</p>
                  {isSuspended && (
                    <p className="mt-1.5 text-[13px] opacity-90">
                      Contactez l'administrateur PFS pour régulariser votre situation.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="login-rise login-rise-2 mt-6 space-y-4"
              aria-busy={loading}
            >
              <div>
                <label
                  htmlFor="identifiant"
                  className="mb-1.5 block text-[14.5px] font-semibold tracking-wide text-[#34434f]"
                >
                  E-mail ou téléphone
                </label>
                <div className="group relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93a2ad] transition-colors duration-200 group-focus-within:text-[#1b75bc]" />
                  <input
                    id="identifiant"
                    name="identifiant"
                    type="text"
                    autoComplete="username"
                    placeholder="vous@exemple.com ou +221 77 123 45 67"
                    value={form.identifiant}
                    onChange={(e) => setForm({ ...form, identifiant: e.target.value })}
                    required
                    autoFocus
                    className="h-12 w-full rounded-xl border border-[#d8e1e8] bg-[#fbfcfd] pl-11 pr-4 text-[16px] text-[#16212b] outline-none transition-all duration-200 placeholder:text-[#a3b0ba] hover:border-[#c3d0d9] focus:border-[#1b75bc] focus:bg-white focus:ring-4 focus:ring-[#1b75bc]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-[14.5px] font-semibold tracking-wide text-[#34434f]"
                  >
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotHelp((v) => !v)}
                    aria-expanded={showForgotHelp}
                    aria-controls="login-forgot-help"
                    className="rounded text-[14px] font-semibold text-[#1b75bc] transition-colors duration-150 hover:text-[#0f5a93] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30 focus-visible:ring-offset-2"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <div className="group relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93a2ad] transition-colors duration-200 group-focus-within:text-[#1b75bc]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="h-12 w-full rounded-xl border border-[#d8e1e8] bg-[#fbfcfd] pl-11 pr-12 text-[16px] text-[#16212b] outline-none transition-all duration-200 placeholder:text-[#a3b0ba] hover:border-[#c3d0d9] focus:border-[#1b75bc] focus:bg-white focus:ring-4 focus:ring-[#1b75bc]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#93a2ad] transition-colors duration-150 hover:bg-[#1b75bc]/[0.07] hover:text-[#1b75bc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30"
                  >
                    {showPassword ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
                  </button>
                </div>

                {showForgotHelp && (
                  <div
                    id="login-forgot-help"
                    role="region"
                    aria-label="Réinitialisation du mot de passe"
                    className="login-rise mt-2 flex gap-2.5 rounded-xl border border-[#1b75bc]/15 bg-[#f2f8fc] px-3.5 py-3 text-[13.5px] leading-relaxed text-[#31536d]"
                  >
                    <InfoIcon className="mt-0.5 h-4 w-4 flex-none text-[#1b75bc]" />
                    <div>
                      <p className="font-semibold text-[#123d5c]">Réinitialisation par l'administrateur</p>
                      <p className="mt-0.5">
                        Pour des raisons de sécurité, contactez l'administrateur PFS pour obtenir un nouveau mot de passe.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <label
                htmlFor="remember"
                className="group flex w-fit cursor-pointer select-none items-center gap-2.5 text-[14.5px] text-[#4b5c68]"
              >
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[#c3d0d9] accent-[#1b75bc] focus:ring-2 focus:ring-[#1b75bc]/25"
                />
                <span className="transition-colors duration-150 group-hover:text-[#102536]">
                  Se souvenir de moi
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="login-submit group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-[16.5px] font-semibold text-white transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : null}
                <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
                {!loading && (
                  <ArrowRightIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Compte de démonstration */}
            <div className="login-rise login-rise-3 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#cbd8e1] bg-[#f8fafb] px-3.5 py-3">
              <div className="min-w-0 flex-1 basis-[200px]">
                <p className="text-[15px] font-semibold text-[#102536]">Découvrir la plateforme</p>
                <p className="text-[13.5px] leading-snug text-[#6b7b87]">
                  Compte de démonstration, données fictives.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="flex flex-none items-center justify-center gap-2 rounded-lg border border-[#dbe3e9] bg-white px-4 py-2.5 text-[14.5px] font-semibold text-[#31536d] transition-all duration-200 hover:border-[#1b75bc]/40 hover:text-[#1b75bc] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Essayer la démo
              </button>
            </div>

            <div className="login-rise login-rise-4 mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-[#83919b]">
              <LockIcon className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <p>
                Accès sur invitation uniquement. Contactez l'administrateur PFS pour obtenir un compte.
              </p>
            </div>

            <div className="login-brand-footer login-rise login-rise-4 mt-4 hidden items-center justify-center opacity-55 md:flex">
              <img src={pfsLogo} alt="Partners In Food Solutions" className="h-4 object-contain" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
