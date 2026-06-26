import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://gcr-3qft.onrender.com',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pfs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
