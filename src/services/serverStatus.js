import { useSyncExternalStore } from 'react'
import axios from 'axios'
import { isDemoMode } from '../demo/demoMode'
import { API_BASE_URL } from './apiConfig'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Disponibilité du service (frontend statique + API sur Render)
 * ─────────────────────────────────────────────────────────────────────────────
 * La page "Service indisponible" ne doit s'afficher que lorsque le serveur est
 * réellement hors ligne sur Render : injoignable (erreur réseau / instance
 * arrêtée ou endormie non réveillée), délai d'attente dépassé, ou page de
 * suspension Render. Dès que le serveur répond (même avec une erreur applicative
 * 4xx/5xx), il est considéré comme "on" et l'application reste visible.
 *
 * Raisons possibles (jamais affichées telles quelles) :
 *   - unreachable  : erreur réseau, DNS, serveur injoignable
 *   - timeout      : délai d'attente dépassé
 *   - suspended    : page de suspension Render
 */

const listeners = new Set()

let down = false
let reason = ''
let inFlightProbe = null

// Évite de re-sonder l'API à chaque rechargement : un serveur joignable le reste
// en général quelques minutes (et la moindre requête réussie rafraîchit ce cache).
const PROBE_CACHE_KEY = 'pfs_server_ok_at'
const PROBE_CACHE_TTL_MS = 2 * 60 * 1000

const PROBE_TIMEOUT_MS = 60_000
const RETRY_INTERVAL_MS = 45_000

// (Les statuts HTTP seuls ne suffisent pas à distinguer un serveur Render hors
// ligne d'une erreur applicative : seule l'absence de réponse réseau, le timeout
// ou une page de suspension Render indiquent un serveur réellement hors ligne.)

// Motifs typiques d'une connexion base de données perdue côté serveur.
// Utilisés uniquement pour qualifier la panne en interne, jamais affichés.
const DATABASE_ERROR_PATTERN =
  /(econnrefused|econnreset|etimedout|enotfound|database|base de donn[ée]es|postgres|postgresql|mysql|mariadb|mongodb|mongo|redis|sequelize|prisma|knex|typeorm|pgpool|connection pool|too many connections|pool (is )?(closed|terminated)|connection refused|relation .* does not exist|could not connect)/i

// Page renvoyée par Render lorsqu'un service est suspendu par son propriétaire.
const SUSPENSION_PAGE_PATTERN =
  /service\s+suspended|suspended\s+by\s+its\s+owner|service\s+suspendu|suspendu\s+par\s+son\s+propri[ée]taire|service\s+unavailable/i

/* ── Cache de sonde ───────────────────────────────────────────────────────── */

function readProbeCache() {
  try {
    const value = Number(sessionStorage.getItem(PROBE_CACHE_KEY) || 0)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function writeProbeCache() {
  try {
    sessionStorage.setItem(PROBE_CACHE_KEY, String(Date.now()))
  } catch {
    /* stockage indisponible : on re-sondera simplement */
  }
}

function clearProbeCache() {
  try {
    sessionStorage.removeItem(PROBE_CACHE_KEY)
  } catch {
    /* stockage indisponible */
  }
}

/* ── État partagé (module + hook React) ───────────────────────────────────── */

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeServerStatus(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isServerDown() {
  return down
}

export function getServerDownReason() {
  return reason
}

export function reportServerDown(nextReason = 'unreachable') {
  clearProbeCache()
  if (down && reason === nextReason) return
  down = true
  reason = nextReason
  emit()
}

export function reportServerUp() {
  writeProbeCache()
  if (!down) return
  down = false
  reason = ''
  emit()
}

// Hook React : se re-rend dès que la disponibilité change.
export function useServerStatus() {
  return useSyncExternalStore(subscribeServerStatus, isServerDown, isServerDown)
}

/* ── Analyse des réponses / erreurs ──────────────────────────────────────── */

function headerValue(headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name] || headers[name.toLowerCase()] || ''
}

function toText(data) {
  if (typeof data === 'string') return data
  if (data == null) return ''
  try {
    return JSON.stringify(data)
  } catch {
    return ''
  }
}

export function looksLikeSuspensionPage(data, headers) {
  if (typeof data !== 'string') return false
  const contentType = String(headerValue(headers, 'content-type'))
  // Une réponse JSON légitime (« Compte suspendu ») ne doit jamais déclencher la page.
  if (contentType && !/text\/html/i.test(contentType)) return false
  return SUSPENSION_PAGE_PATTERN.test(data.slice(0, 8000))
}

export function looksLikeDatabaseError(data) {
  const text = toText(data)
  return text ? DATABASE_ERROR_PATTERN.test(text.slice(0, 6000)) : false
}

function classifyResponse(response) {
  if (!response) return null

  // Page de suspension/indisponibilité Render : le service est hors ligne.
  if (looksLikeSuspensionPage(response.data, response.headers)) return 'suspended'

  // Toute autre réponse HTTP provient du serveur applicatif : le serveur est
  // démarré ("on"), donc la page Service indisponible ne doit pas s'afficher.
  return null
}

/**
 * Retourne la raison de l'indisponibilité, ou null si l'erreur est « métier »
 * (401, 403, 404, 409, 422…), applicative (5xx serveur démarré) ou ne doit pas
 * masquer l'application.
 *
 * La page Service indisponible ne doit s'afficher que lorsque le serveur Render
 * est réellement hors ligne : injoignable, en timeout réseau, ou suspendu.
 */
export function classifyServerError(error) {
  if (!error) return null
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
    return null
  }
  // En mode démo, aucune requête ne part vers le serveur : rien à surveiller.
  if (isDemoMode()) return null

  const response = error.response
  if (response) return classifyResponse(response)

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || /timeout/i.test(error.message || '')) {
    return 'timeout'
  }
  return 'unreachable'
}

// Compatibilité : booléen simple.
export function isServerUnavailableError(error) {
  return classifyServerError(error) !== null
}

/* ── Sonde active ────────────────────────────────────────────────────────── */

/*
 * On interroge une route légère de l'API (GET, sans effet de bord) :
 * - toute réponse HTTP (200, 4xx, 5xx…) → le serveur est démarré ("on") ;
 * - page « Service Suspended » de Render → service suspendu/hors ligne ;
 * - erreur réseau ou timeout → serveur injoignable/hors ligne.
 */
export function probeServer({ timeout = PROBE_TIMEOUT_MS, force = false } = {}) {
  if (inFlightProbe) return inFlightProbe

  // Un serveur déjà vérifié récemment n'a pas besoin d'être re-sondé.
  if (!force && !down && Date.now() - readProbeCache() < PROBE_CACHE_TTL_MS) {
    return Promise.resolve(true)
  }

  inFlightProbe = (async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout,
        validateStatus: () => true,
        headers: { Accept: 'application/json' },
      })

      const failureReason = classifyResponse(response)
      if (failureReason) {
        reportServerDown(failureReason)
        return false
      }

      reportServerUp()
      return true
    } catch (error) {
      const failureReason = classifyServerError(error)
      // Toute erreur de la sonde signifie que le service n'est pas joignable.
      reportServerDown(failureReason || 'unreachable')
      return false
    } finally {
      inFlightProbe = null
    }
  })()

  return inFlightProbe
}

export { RETRY_INTERVAL_MS }

// Message affiché si une action (connexion, inscription…) échoue à cause du service.
export const SERVER_DOWN_MESSAGE =
  'Le service est momentanément indisponible. Merci de réessayer dans quelques instants.'
