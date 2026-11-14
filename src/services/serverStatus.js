import { useSyncExternalStore } from 'react'
import axios from 'axios'
import { isDemoMode } from '../demo/demoMode'
import { API_BASE_URL } from './apiConfig'

/*
 * Disponibilité du serveur (API hébergée sur Render).
 *
 * Quand le service Render est arrêté ou suspendu (facture impayée), il ne renvoie plus
 * de réponse JSON : soit une erreur réseau, soit une page HTML « Service Suspended ».
 * On centralise ici la détection pour que toute l'application puisse basculer sur une
 * page personnalisée au lieu de laisser l'utilisateur devant une erreur incompréhensible.
 */

let down = false
let reason = ''
let inFlightProbe = null

// Évite de re-sonder l'API à chaque rechargement : un serveur joignable le reste
// en général quelques minutes (et la moindre requête réussie rafraîchit ce cache).
const PROBE_CACHE_KEY = 'pfs_server_ok_at'
const PROBE_CACHE_TTL_MS = 2 * 60 * 1000

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

const listeners = new Set()

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

// Page renvoyée par Render lorsqu'un service est suspendu par son propriétaire.
const RENDER_SUSPENDED_PATTERN =
  /service\s+suspended|suspended\s+by\s+its\s+owner|service\s+suspendu|suspendu\s+par\s+son\s+propri[ée]taire/i

export function looksLikeSuspensionPage(data, headers) {
  if (typeof data !== 'string') return false
  const contentType = String(headers?.['content-type'] || '')
  // Une réponse JSON légitime (« Compte suspendu ») ne doit jamais déclencher la page.
  if (contentType && !/text\/html/i.test(contentType)) return false
  return RENDER_SUSPENDED_PATTERN.test(data.slice(0, 8000))
}

// Une erreur axios signifie-t-elle que le serveur est hors service (et non un refus métier) ?
export function isServerUnavailableError(error) {
  if (!error) return false
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return false
  // En mode démo, aucune requête ne part vers le serveur : rien à surveiller.
  if (isDemoMode()) return false

  const response = error.response
  if (!response) return true // erreur réseau, DNS, CORS : le serveur ne répond pas
  if ([502, 503, 504].includes(response.status)) return true
  return looksLikeSuspensionPage(response.data, response.headers)
}

/*
 * Sonde de disponibilité.
 *
 * On interroge une route légère de l'API (GET, sans effet de bord) :
 * - réponse HTTP (200, 401, 404…) → le serveur est debout ;
 * - 502/503/504 ou page « Service Suspended » → service arrêté/suspendu ;
 * - erreur réseau → serveur injoignable.
 * Les appels concurrents sont mutualisés pour ne pas marteler l'API.
 */
export function probeServer({ timeout = 60000, force = false } = {}) {
  if (inFlightProbe) return inFlightProbe

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

      const suspended =
        [502, 503, 504].includes(response.status) ||
        looksLikeSuspensionPage(response.data, response.headers)

      if (suspended) {
        reportServerDown('suspended')
        return false
      }

      reportServerUp()
      return true
    } catch {
      reportServerDown('unreachable')
      return false
    } finally {
      inFlightProbe = null
    }
  })()

  return inFlightProbe
}

// Hook React : se re-rend dès que la disponibilité change.
export function useServerStatus() {
  return useSyncExternalStore(subscribeServerStatus, isServerDown, isServerDown)
}

export const SERVER_DOWN_MESSAGE =
  "Le service est momentanément indisponible : le paiement en ligne n'est pas encore pris en charge. Merci de réessayer plus tard."
