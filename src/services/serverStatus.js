import { useSyncExternalStore } from 'react'
import axios from 'axios'
import { isDemoMode } from '../demo/demoMode'
import { API_BASE_URL } from './apiConfig'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Disponibilité du service (frontend statique + API sur Render)
 * ─────────────────────────────────────────────────────────────────────────────
 * Quand l'API est arrêtée, suspendue (facture impayée) ou que sa base de données
 * est inaccessible, le navigateur reçoit soit une erreur réseau, soit un code
 * 5xx, soit la page HTML « Service Suspended » de Render.
 *
 * Ce module centralise la détection pour que toute l'application bascule sur une
 * page personnalisée, sans jamais exposer de détail technique à l'utilisateur.
 *
 * Raisons possibles (jamais affichées telles quelles) :
 *   - unreachable  : erreur réseau, DNS, CORS
 *   - timeout      : délai d'attente dépassé
 *   - suspended    : page de suspension Render
 *   - database     : erreur serveur qui ressemble à une panne de base de données
 *   - server-error : autre erreur 5xx
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

// Statuts considérés comme « service indisponible ».
const UNAVAILABLE_STATUSES = new Set([408, 500, 502, 503, 504, 521, 522, 523, 524])

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

  if (looksLikeSuspensionPage(response.data, response.headers)) return 'suspended'

  const status = Number(response.status)
  if (!UNAVAILABLE_STATUSES.has(status)) return null

  if (looksLikeDatabaseError(response.data)) return 'database'
  if (status === 408) return 'timeout'
  return 'server-error'
}

/**
 * Retourne la raison de l'indisponibilité, ou null si l'erreur est « métier »
 * (401, 403, 404, 409, 422…) et ne doit pas masquer l'application.
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
 * - réponse HTTP saine (200, 401, 404…) → le serveur est debout ;
 * - 408/5xx ou page « Service Suspended » → service arrêté/suspendu ;
 * - erreur réseau ou timeout → serveur injoignable.
 *
 * Si le backend expose /api/health, il peut renvoyer 503 quand la base est
 * indisponible (voir docs/service-indisponible.md).
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
