import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import pfsIcon from '../assets/pfs-icon.png'
import pfsLogo from '../assets/pfs-logo.png'

const REMEMBER_KEY = 'pfs_remember_identifiant'

function readRememberedIdentifiant() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || ''
  } catch {
    return ''
  }
}

/* ── Icônes (SVG inline, aucun asset supplémentaire) ─────────────────────── */

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

function ShieldCheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function SparkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 15v4" />
      <path d="M17 17h4" />
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

/* ── Aperçu « cockpit » du panneau gauche ────────────────────────────────── */

function DashboardPreview() {
  return (
    <div className="login-preview relative mt-9">
      <div
        className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#1b75bc]/25 via-transparent to-[#62bb46]/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="login-float relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.07] p-4 shadow-[0_28px_60px_-24px_rgba(0,0,0,.75)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="login-pulse-soft h-2 w-2 rounded-full bg-[#62bb46] shadow-[0_0_0_4px_rgba(98,187,70,.14)]" />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Aperçu filière
            </span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-medium text-white/45">
            Temps réel
          </span>
        </div>

        <svg viewBox="0 0 300 96" className="mt-4 h-auto w-full" aria-hidden="true">
          <defs>
            <linearGradient id="loginChartLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4a9bd6" />
              <stop offset="100%" stopColor="#8ada72" />
            </linearGradient>
            <linearGradient id="loginChartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#62bb46" stopOpacity=".32" />
              <stop offset="100%" stopColor="#62bb46" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="rgba(255,255,255,.07)" strokeWidth="1">
            <path d="M0 22h300M0 46h300M0 70h300" />
          </g>
          <path
            d="M0 78C30 74 42 52 70 56s42 16 70-6 50-22 78-16 52-14 82-10v64H0Z"
            fill="url(#loginChartArea)"
          />
          <path
            d="M0 78C30 74 42 52 70 56s42 16 70-6 50-22 78-16 52-14 82-10"
            fill="none"
            stroke="url(#loginChartLine)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="300" cy="24" r="3.5" fill="#9be08a" stroke="#0f2a38" strokeWidth="2" />
        </svg>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            { label: 'Ventes', dot: '#4a9bd6' },
            { label: 'Créances', dot: '#f9a825' },
            { label: 'Prévisions', dot: '#62bb46' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/[0.05] px-2.5 py-2">
              <span className="block h-1 w-5 rounded-full" style={{ backgroundColor: item.dot }} />
              <p className="mt-1.5 text-[9px] uppercase tracking-wide text-white/40">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#62bb46]/15 text-[#9be08a]">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
          </span>
          <p className="text-[9.5px] leading-snug text-white/45">
            Une lecture fiable, du terrain à la décision.
          </p>
        </div>
      </div>

      <div className="login-float-slow absolute -right-3 -top-5 rounded-xl border border-white/10 bg-[#0d2433]/90 px-3 py-2 shadow-xl backdrop-blur">
        <p className="text-[8.5px] uppercase tracking-[0.16em] text-white/40">Vue</p>
        <p className="text-[11px] font-semibold text-white">360°</p>
      </div>
    </div>
  )
}

/* ── Page de connexion ───────────────────────────────────────────────────── */

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

    try {
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, form.identifiant.trim())
      else localStorage.removeItem(REMEMBER_KEY)
    } catch {
      /* Stockage local indisponible : la connexion reste possible. */
    }

    const result = await login(form.identifiant, form.password)
    if (result.ok) {
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
      {/* ═══ Panneau gauche : identité & vision ═══ */}
      <aside
        className="login-rise relative hidden min-h-[100dvh] flex-col justify-between overflow-hidden px-7 py-8 text-white md:sticky md:top-0 md:flex md:h-[100dvh] lg:px-9 xl:px-12 xl:py-10"
        style={{ background: 'linear-gradient(158deg, #081b28 0%, #102536 52%, #123a4d 100%)' }}
        aria-label="Présentation du Cockpit Commercial"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="login-grid absolute inset-0 opacity-60" />
          <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#1b75bc]/25 blur-3xl" />
          <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-[#62bb46]/20 blur-3xl" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[520px] items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white p-2 shadow-[0_16px_30px_-16px_rgba(0,0,0,.8)]">
            <img src={pfsIcon} alt="Partners In Food Solutions" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Partners In Food Solutions
            </p>
            <p className="font-display text-[17px] font-semibold leading-tight text-white">
              Cockpit Commercial
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/65 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#62bb46] shadow-[0_0_0_4px_rgba(98,187,70,.16)]" />
              Filière riz · Afrique de l'Ouest
            </span>
            <h2 className="mt-5 max-w-[15ch] font-display text-[clamp(1.9rem,2.5vw,2.7rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
              La donnée au service de la filière riz.
            </h2>
            <p className="mt-4 max-w-[32ch] text-[13.5px] leading-relaxed text-white/55">
              Ventes, recouvrement et prévisions réunis dans un seul cockpit — pour décider vite, juste et ensemble.
            </p>
          </div>

          <DashboardPreview />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[520px] items-center gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">
          <span>Cockpit Commercial</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>PFS</span>
        </div>
      </aside>

      {/* ═══ Zone centrale : formulaire ═══ */}
      <main
        className="relative flex min-h-[100dvh] flex-col border-[#e8edf1] bg-white md:border-l"
        aria-labelledby="login-title"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#1b75bc]/[0.06] blur-3xl" />
          <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-[#62bb46]/[0.08] blur-3xl md:hidden" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1b75bc]/20 to-transparent md:hidden" />
        </div>

        <div className="login-center relative z-10 flex flex-1 items-center justify-center px-5 py-5 sm:px-8 sm:py-6 md:px-10 xl:px-14">
          <div className="w-full max-w-[430px]">
            {/* Identité mobile : le panneau latéral est masqué */}
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
                <img src={pfsIcon} alt="Partners In Food Solutions" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight text-[#102536]">
                  Cockpit Commercial
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Filière riz · PFS
                </p>
              </div>
            </div>

            <div className="login-rise login-rise-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b75bc]/15 bg-[#f2f8fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1b75bc]">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Accès sécurisé
              </span>
              <h1
                id="login-title"
                className="mt-3.5 font-display text-[clamp(2.2rem,4vw,2.9rem)] font-semibold leading-none tracking-[-0.02em] text-[#102536]"
              >
                Bienvenue
              </h1>
              <p className="mt-2.5 max-w-[36ch] text-[13.5px] leading-relaxed text-[#6b7b87]">
                Ravi de vous revoir. Connectez-vous pour reprendre le fil de votre activité commerciale.
              </p>
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className={`login-rise mt-6 flex gap-3 rounded-xl border px-4 py-3.5 text-[12.5px] leading-relaxed ${
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
                    <p className="mt-1.5 text-[11px] opacity-90">
                      Contactez l'administrateur PFS pour régulariser votre situation.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="login-rise login-rise-2 mt-6 space-y-5"
              aria-busy={loading}
            >
              <div>
                <label
                  htmlFor="identifiant"
                  className="mb-1.5 block text-[12.5px] font-semibold tracking-wide text-[#34434f]"
                >
                  Adresse e-mail
                </label>
                <div className="group relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#93a2ad] transition-colors duration-200 group-focus-within:text-[#1b75bc]" />
                  <input
                    id="identifiant"
                    name="identifiant"
                    type="text"
                    autoComplete="username"
                    placeholder="vous@exemple.com"
                    value={form.identifiant}
                    onChange={(e) => setForm({ ...form, identifiant: e.target.value })}
                    required
                    autoFocus
                    aria-describedby="identifiant-hint"
                    className="h-12 w-full rounded-xl border border-[#d8e1e8] bg-[#fbfcfd] pl-11 pr-4 text-[14px] text-[#16212b] outline-none transition-all duration-200 placeholder:text-[#a3b0ba] hover:border-[#c3d0d9] focus:border-[#1b75bc] focus:bg-white focus:ring-4 focus:ring-[#1b75bc]/10"
                  />
                </div>
                <p id="identifiant-hint" className="mt-1.5 text-[11px] text-[#83919b]">
                  Utilisez votre e-mail ou votre numéro de téléphone.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-[12.5px] font-semibold tracking-wide text-[#34434f]"
                  >
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotHelp((v) => !v)}
                    aria-expanded={showForgotHelp}
                    aria-controls="login-forgot-help"
                    className="rounded text-[12px] font-semibold text-[#1b75bc] transition-colors duration-150 hover:text-[#0f5a93] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30 focus-visible:ring-offset-2"
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
                    className="h-12 w-full rounded-xl border border-[#d8e1e8] bg-[#fbfcfd] pl-11 pr-12 text-[14px] text-[#16212b] outline-none transition-all duration-200 placeholder:text-[#a3b0ba] hover:border-[#c3d0d9] focus:border-[#1b75bc] focus:bg-white focus:ring-4 focus:ring-[#1b75bc]/10"
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
                    className="login-rise mt-2 flex gap-2.5 rounded-xl border border-[#1b75bc]/15 bg-[#f2f8fc] px-3.5 py-3 text-[11.5px] leading-relaxed text-[#31536d]"
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
                className="group flex w-fit cursor-pointer select-none items-center gap-2.5 text-[12.5px] text-[#4b5c68]"
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
                className="login-submit group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(27,117,188,.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(27,117,188,.65)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : null}
                <span>{loading ? 'Connexion…' : 'Se connecter'}</span>
                {!loading && (
                  <ArrowRightIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Démo — fonctionnalité existante conservée */}
            <div className="login-rise login-rise-3 mt-6 rounded-2xl border border-dashed border-[#cbd8e1] bg-[#f8fafb] p-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-[#1b75bc] shadow-sm ring-1 ring-black/5">
                  <SparkIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#102536]">Découvrir la plateforme</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#6b7b87]">
                    Un compte de démonstration rempli de données fictives. Aucune donnée réelle n'est affectée.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe3e9] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#31536d] transition-all duration-200 hover:border-[#1b75bc]/40 hover:text-[#1b75bc] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Essayer la démo
              </button>
            </div>

            <div className="login-rise login-rise-4 mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-[#83919b]">
              <LockIcon className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <p>
                Accès sur invitation uniquement. Contactez l'administrateur PFS pour obtenir un compte.
              </p>
            </div>

            <div className="login-brand-footer login-rise login-rise-4 mt-6 hidden items-center justify-center opacity-55 md:flex">
              <img src={pfsLogo} alt="Partners In Food Solutions" className="h-4 object-contain" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
