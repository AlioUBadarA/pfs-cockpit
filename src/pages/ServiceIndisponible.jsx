import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SUPPORT_CONTACT } from '../config/support'
import { getServerDownReason, probeServer, RETRY_INTERVAL_MS } from '../services/serverStatus'
import StatusPage from '../components/StatusPage'

function CloudOffIcon({ className = 'h-7 w-7' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function SupportIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2-2h1v5H6a2 2 0 0 1-2-2Z" />
      <path d="M20 13a2 2 0 0 0-2-2h-1v5h1a2 2 0 0 0 2-2Z" />
      <path d="M18 17v1a2 2 0 0 1-2 2h-3" />
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

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function ClockIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function formatTime(date) {
  try {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/**
 * Page affichée lorsque le service est indisponible (API arrêtée/suspendue,
 * base de données inaccessible, erreur serveur). Pilotée par ServerGuard.
 */
export default function ServiceIndisponible() {
  const { loginDemo } = useAuth()
  const navigate = useNavigate()

  const headingRef = useRef(null)
  const [retrying, setRetrying] = useState(false)
  const [stillDown, setStillDown] = useState(false)
  const [lastCheck, setLastCheck] = useState(() => new Date())
  const [demoLoading, setDemoLoading] = useState(false)
  const [showSupportHelp, setShowSupportHelp] = useState(false)

  const isSuspended = getServerDownReason() === 'suspended'

  // Annonce la page aux lecteurs d'écran.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // Vérification automatique + reprise dès le retour de la connexion réseau.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') probeServer()
    }, RETRY_INTERVAL_MS)

    const handleOnline = () => probeServer()
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
    setLastCheck(new Date())
    // Si le serveur répond, le ServerGuard retire cette page automatiquement.
    if (!available) setStillDown(true)
  }

  const handleDemo = async () => {
    setDemoLoading(true)
    const result = await loginDemo()
    setDemoLoading(false)
    if (result.ok) navigate('/')
  }

  const supportHref = SUPPORT_CONTACT?.href
  const supportExternal = Boolean(SUPPORT_CONTACT?.external)

  return (
    <StatusPage
      badge="Service temporairement indisponible"
      title="Nous revenons bientôt"
      description="Notre plateforme est momentanément indisponible. Nous effectuons actuellement des opérations de maintenance afin d'améliorer votre expérience. Notre équipe met tout en œuvre pour rétablir le service dans les meilleurs délais."
      icon={<CloudOffIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
      headingRef={headingRef}
      actions={
        <>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="login-submit group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(27,117,188,.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(27,117,188,.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {retrying ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <RefreshIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
            )}
            {retrying ? 'Vérification…' : 'Réessayer maintenant'}
          </button>

          {supportHref ? (
            <a
              href={supportHref}
              {...(supportExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d3dde4] bg-white px-5 py-3 text-[14px] font-semibold text-[#31536d] transition-colors duration-200 hover:border-[#1b75bc]/40 hover:text-[#1b75bc] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/20"
            >
              <SupportIcon className="h-4 w-4" />
              Contacter le support
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setShowSupportHelp((value) => !value)}
              aria-expanded={showSupportHelp}
              aria-controls="support-help"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d3dde4] bg-white px-5 py-3 text-[14px] font-semibold text-[#31536d] transition-colors duration-200 hover:border-[#1b75bc]/40 hover:text-[#1b75bc] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1b75bc]/20"
            >
              <SupportIcon className="h-4 w-4" />
              Contacter le support
            </button>
          )}
        </>
      }
      aside={
        <div className="mt-5 space-y-3">
          {showSupportHelp && !supportHref && (
            <p
              id="support-help"
              role="status"
              className="status-rise rounded-xl border border-[#dce6ee] bg-[#f6fafc] px-4 py-3 text-[12.5px] leading-relaxed text-[#31536d]"
            >
              Le canal de support n'est pas encore configuré sur cette page. Contactez
              l'administrateur PFS pour obtenir de l'aide.
            </p>
          )}

          <p className="flex items-center gap-2 text-[11.5px] text-[#83919b]">
            <ClockIcon className="h-3.5 w-3.5 flex-none" />
            Dernière vérification à {formatTime(lastCheck)} · nouvelle tentative automatique toutes
            les 45&nbsp;secondes.
          </p>

          {stillDown && (
            <p role="status" className="status-rise text-[12.5px] font-medium text-[#a86c00]">
              Le service est toujours indisponible. Nous réessayons automatiquement.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#edf1f4] pt-3">
            <span className="text-[12px] text-[#83919b]">En attendant :</span>
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 rounded text-[12.5px] font-semibold text-[#1b75bc] underline-offset-4 transition-colors hover:text-[#1667a6] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b75bc]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoLoading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-[#1b75bc] border-t-transparent animate-spin" />
              ) : (
                <SparkIcon className="h-3.5 w-3.5" />
              )}
              {demoLoading ? 'Ouverture de la démo…' : 'explorer la démo sans serveur'}
            </button>
          </div>
        </div>
      }
    >
      {/* Message secondaire demandé */}
      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#dceee2] bg-[#f5fbf7] px-4 py-3 text-[13px] leading-relaxed text-[#2f6b45]">
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#62bb46]/15 text-[#3f8a2c]">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <p>Merci pour votre patience et votre compréhension.</p>
      </div>

      {/* Contexte propre au projet : hébergement en attente de régularisation */}
      {isSuspended && (
        <p className="mt-3 rounded-xl border border-[#f4e4c2] bg-[#fffaf0] px-4 py-3 text-[12.5px] leading-relaxed text-[#7a5a12]">
          L'hébergement du service est en attente de régularisation : le paiement en ligne n'est
          pas encore pris en charge. L'accès sera rétabli automatiquement dès que possible.
        </p>
      )}
    </StatusPage>
  )
}
