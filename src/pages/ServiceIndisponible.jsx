import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getServerDownReason, probeServer } from '../services/serverStatus'
import pfsIcon from '../assets/pfs-icon.png'

const RETRY_INTERVAL_MS = 45_000

function CloudOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 18a3.5 3.5 0 0 1-.4-6.98A5.5 5.5 0 0 1 16.9 8.5a4 4 0 0 1 1.6 7.66" />
      <path d="m3 3 18 18" />
    </svg>
  )
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  )
}

function SparkIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 15v4" />
      <path d="M17 17h4" />
    </svg>
  )
}

function LockIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  )
}

/**
 * Page affichée lorsque l'API hébergée sur Render ne répond plus (service arrêté ou
 * suspendu, par exemple en attente du paiement de l'hébergement). Elle remplace toute
 * l'application grâce au ServerGuard d'App.jsx.
 */
export default function ServiceIndisponible() {
  const { loginDemo } = useAuth()
  const navigate = useNavigate()

  const [retrying, setRetrying] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [stillDown, setStillDown] = useState(false)

  const isSuspended = getServerDownReason() === 'suspended'

  // Nouvelle tentative automatique + reprise dès le retour de la connexion réseau.
  useEffect(() => {
    const interval = setInterval(() => {
      probeServer()
    }, RETRY_INTERVAL_MS)

    const handleOnline = () => {
      probeServer()
    }
    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const handleRetry = async () => {
    setRetrying(true)
    setStillDown(false)
    const available = await probeServer()
    setRetrying(false)
    // Si le serveur répond, le ServerGuard démonte cette page automatiquement.
    if (!available) setStillDown(true)
  }

  const handleDemo = async () => {
    setDemoLoading(true)
    const result = await loginDemo()
    setDemoLoading(false)
    if (result.ok) navigate('/')
  }

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden text-white"
      style={{ background: 'linear-gradient(158deg, #081b28 0%, #102536 52%, #123a4d 100%)' }}
    >
      {/* Décor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="login-grid absolute inset-0 opacity-60" />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#1b75bc]/25 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#62bb46]/20 blur-3xl" />
      </div>

      {/* En-tête */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-6 sm:px-8">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white p-2 shadow-[0_16px_30px_-16px_rgba(0,0,0,.8)]">
          <img src={pfsIcon} alt="Partners In Food Solutions" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Partners In Food Solutions
          </p>
          <p className="font-display text-[16px] font-semibold leading-tight text-white">
            Cockpit Commercial
          </p>
        </div>

        <span className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/60 backdrop-blur sm:inline-flex">
          <span className="login-pulse-soft h-1.5 w-1.5 rounded-full bg-[#f9a825]" />
          {isSuspended ? 'Hébergement suspendu' : 'Serveur injoignable'}
        </span>
      </header>

      {/* Contenu */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14 pt-2 sm:px-6">
        <section
          className="login-rise w-full max-w-[580px] rounded-[1.6rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,.85)] backdrop-blur-xl sm:p-9"
          aria-labelledby="service-indisponible-title"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f9a825]/25 bg-[#f9a825]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffd27a]">
            <span className="login-pulse-soft h-1.5 w-1.5 rounded-full bg-[#f9a825]" />
            Service temporairement indisponible
          </span>

          <div className="mt-5 flex items-start gap-4">
            <span className="hidden h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/[0.08] text-[#ffd27a] ring-1 ring-white/10 sm:flex">
              <CloudOffIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1
                id="service-indisponible-title"
                className="font-display text-[clamp(1.55rem,3.4vw,2.15rem)] font-semibold leading-[1.14] tracking-[-0.02em] text-white"
              >
                Le paiement n'est pas encore pris en charge
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/65">
                Le Cockpit Commercial est momentanément hors ligne : son hébergement est en attente de
                régularisation. Le service sera rétabli automatiquement dès que possible — vos données
                restent intactes.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-[#0b1e2b]/60 px-4 py-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[#1b75bc]/20 text-[#8ec9f0]">
              <SparkIcon className="h-4 w-4" />
            </span>
            <p className="text-[12px] leading-relaxed text-white/55">
              En attendant le retour du service, vous pouvez explorer la plateforme avec le{' '}
              <span className="font-semibold text-white/80">compte de démonstration</span> : données
              fictives, aucun serveur nécessaire.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="login-submit group flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(27,117,188,.65)] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {retrying ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <RefreshIcon className={`h-4 w-4 ${retrying ? '' : 'transition-transform duration-500 group-hover:rotate-180'}`} />
              )}
              {retrying ? 'Vérification…' : 'Réessayer maintenant'}
            </button>

            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-[13.5px] font-semibold text-white/85 transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              ) : (
                <SparkIcon className="h-4 w-4" />
              )}
              {demoLoading ? 'Ouverture…' : 'Essayer la démo'}
            </button>
          </div>

          <div className="mt-5 space-y-2 border-t border-white/10 pt-4" aria-live="polite">
            <p className="flex items-center gap-2 text-[11px] text-white/40">
              <RefreshIcon className="h-3.5 w-3.5 flex-none" />
              Nouvelle vérification automatique toutes les 45 secondes.
            </p>
            {stillDown && (
              <p className="login-rise text-[11.5px] font-medium text-[#ffd27a]">
                Le service est toujours indisponible. Nous réessaierons automatiquement.
              </p>
            )}
            <p className="flex items-center gap-2 text-[11px] text-white/40">
              <LockIcon className="h-3.5 w-3.5 flex-none" />
              Si le problème persiste, contactez l'administrateur PFS.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-6 text-[10px] uppercase tracking-[0.16em] text-white/25 sm:px-8">
        Cockpit Commercial · PFS
      </footer>
    </div>
  )
}
