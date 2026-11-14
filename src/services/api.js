import axios from 'axios'
import { isDemoMode, demoAdapter } from '../demo/demoMode'
import { API_BASE_URL } from './apiConfig'
import { classifyServerError, reportServerDown, reportServerUp } from './serverStatus'

// Délai maximal d'une requête : au-delà, on considère le service indisponible.
// Généreux pour laisser le temps à une instance Render de sortir de veille.
export const API_TIMEOUT_MS = 60_000

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  // Mode démo : la requête est servie localement par la fausse API, rien ne part vers le serveur
  if (isDemoMode()) {
    config.adapter = demoAdapter
    return config
  }
  const token = localStorage.getItem('pfs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    reportServerUp()
    return response
  },
  (error) => {
    // Serveur arrêté, suspendu, en erreur 5xx ou base de données inaccessible :
    // on lève le drapeau global pour afficher la page personnalisée.
    const failureReason = classifyServerError(error)
    if (failureReason) {
      error.isServerDown = true
      error.serverDownReason = failureReason
      reportServerDown(failureReason)
      return Promise.reject(error)
    }

    // Le serveur a répondu (ex. 401) : il est donc disponible.
    if (error.response) reportServerUp()

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthEndpoint = requestUrl.includes('/api/auth/')
      const isAlreadyOnLogin = window.location.pathname === '/login'
      // Évite la boucle /login → 401 → /login : on ne redirige pas si on est déjà
      // sur /login ou si la requête venait elle-même d'un endpoint d'authentification.
      if (!isAuthEndpoint && !isAlreadyOnLogin) {
        localStorage.removeItem('pfs_token')
        localStorage.removeItem('pfs_user')
        localStorage.removeItem('pfs_admin_token')
        localStorage.removeItem('pfs_admin_user')
        localStorage.removeItem('pfs_impersonating')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
