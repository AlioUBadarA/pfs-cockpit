import { useId } from 'react'
import pfsIcon from '../assets/pfs-icon.png'

// Tons disponibles : avertissement (indisponibilité) et erreur (incident inattendu).
const TONES = {
  warning: {
    badge: 'border-[#f9a825]/30 bg-[#fff8e8] text-[#8a5a00]',
    dot: 'bg-[#f9a825]',
    iconWrap: 'bg-[#fff4dd] text-[#a86c00] ring-[#f9a825]/25',
    glow: 'rgba(249,168,37,.18)',
  },
  danger: {
    badge: 'border-[#cc0000]/20 bg-[#fff1f1] text-[#a10000]',
    dot: 'bg-[#cc0000]',
    iconWrap: 'bg-[#ffecec] text-[#cc0000] ring-[#cc0000]/15',
    glow: 'rgba(204,0,0,.12)',
  },
}

function FieldPattern({ className = '' }) {
  // Lignes de contours de rizières : motif discret, propre au secteur du riz.
  return (
    <svg
      className={className}
      viewBox="0 0 560 400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M-60 372c130-58 262-58 392-2s250 56 320 6" />
      <path d="M-60 340c130-58 262-58 392-2s250 56 320 6" />
      <path d="M-60 306c130-58 262-58 392-2s250 56 320 6" />
      <path d="M-60 270c130-58 262-58 392-2s250 56 320 6" />
      <path d="M-60 232c130-58 262-58 392-2s250 56 320 6" />
    </svg>
  )
}

function GrainMark({ className = '' }) {
  // Épi de riz stylisé : trois paires de grains sur une tige.
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 56V22" />
      <path d="M32 36c-7-1-12-6-13-13 7 1 12 6 13 13Z" />
      <path d="M32 36c7-1 12-6 13-13-7 1-12 6-13 13Z" />
      <path d="M32 25c-6-1-10-5-11-11 6 1 10 5 11 11Z" />
      <path d="M32 25c6-1 10-5 11-11-6 1-10 5-11 11Z" />
      <path d="M32 14c-3-1-5-3-6-6 3 1 5 3 6 6Z" />
    </svg>
  )
}

/**
 * Coque visuelle commune aux pages d'état (indisponibilité, erreur inattendue).
 * Reprend l'identité « Sales Cockpit » : fond clair, dégradé vert → bleu PFS,
 * typographies Source Serif 4 / Source Sans 3.
 */
export default function StatusPage({
  badge,
  title,
  description,
  icon,
  tone = 'warning',
  actions,
  children,
  headingRef,
  aside,
}) {
  const titleId = useId()
  const colors = TONES[tone] || TONES.warning

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f7f9fb] text-[#102536]">
      {/* Filet dégradé de la charte PFS */}
      <div
        className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-[#62bb46] via-[#1b75bc] to-[#62bb46]"
        aria-hidden="true"
      />

      {/* Décor discret : halos, trame de points et lignes de rizières */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-36 h-[520px] w-[520px] rounded-full bg-[#1b75bc]/[0.07] blur-3xl" />
        <div className="absolute -left-44 top-1/3 h-[420px] w-[420px] rounded-full bg-[#62bb46]/[0.09] blur-3xl" />
        <div className="status-grid absolute inset-0" />
        <FieldPattern className="absolute -bottom-12 right-0 h-[360px] w-[560px] text-[#1b75bc]/[0.09]" />
      </div>

      {/* En-tête */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-5 sm:gap-4 sm:px-8 sm:py-6">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white p-2 shadow-[0_10px_26px_-16px_rgba(16,37,54,.5)] ring-1 ring-black/5 sm:h-16 sm:w-16">
          <img src={pfsIcon} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-[#102536] sm:text-[11.5px]">
            Partners In Food Solutions
          </p>
          <p className="font-display text-[20px] font-semibold leading-tight text-[#102536] sm:text-[24px]">
            Sales Cockpit
          </p>
        </div>

        <span className="ml-auto hidden items-center gap-2 rounded-full border border-[#e3e9ee] bg-white/80 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#6b7b87] backdrop-blur sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} status-pulse`} />
          Service indisponible
        </span>
      </header>

      {/* Carte principale */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6">
        <section
          className="status-rise w-full max-w-[660px] rounded-[1.75rem] border border-[#e5ebf0] bg-white/90 p-6 shadow-[0_32px_80px_-42px_rgba(16,37,54,.4)] backdrop-blur-sm sm:p-9"
          aria-labelledby={titleId}
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative flex-none">
              <span
                className="absolute -inset-2 rounded-[1.4rem] blur-xl"
                style={{ background: colors.glow }}
                aria-hidden="true"
              />
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ring-1 sm:h-16 sm:w-16 ${colors.iconWrap}`}
              >
                {icon}
              </span>
            </div>

            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] sm:text-[10px] ${colors.badge}`}
              >
                <span className={`status-pulse h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                {badge}
              </span>

              <h1
                id={titleId}
                ref={headingRef}
                tabIndex={-1}
                className="mt-3 font-display text-[clamp(1.85rem,4.6vw,2.7rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-[#102536] outline-none"
              >
                {title}
              </h1>
            </div>
          </div>

          <p className="mt-5 text-[14.5px] leading-relaxed text-[#5b6b77] sm:text-[15.5px]">
            {description}
          </p>

          {children}

          {actions && (
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {actions}
            </div>
          )}

          {aside}

          <div className="mt-6 flex items-center gap-2 border-t border-[#edf1f4] pt-4 text-[10.5px] uppercase tracking-[0.14em] text-[#93a1ab]">
            <GrainMark className="h-4 w-4 flex-none text-[#62bb46]" />
            Filière riz · Afrique de l'Ouest
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pb-6 text-[10.5px] text-[#93a1ab] sm:px-8">
        <span className="truncate">Sales Cockpit · Partners In Food Solutions</span>
        <span className="hidden flex-none sm:inline">{new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
