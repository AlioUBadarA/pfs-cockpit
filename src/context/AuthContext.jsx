import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pfs_user')
    return stored ? JSON.parse(stored) : null
  })
  const [impersonating, setImpersonating] = useState(() => {
    const stored = localStorage.getItem('pfs_impersonating')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('pfs_token', data.token)
      localStorage.setItem('pfs_user', JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || 'Erreur de connexion' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('pfs_token')
    localStorage.removeItem('pfs_user')
    localStorage.removeItem('pfs_admin_token')
    localStorage.removeItem('pfs_admin_user')
    localStorage.removeItem('pfs_impersonating')
    setUser(null)
    setImpersonating(null)
  }

  // Entrer dans l'espace d'un rizier en tant qu'admin
  const startImpersonation = async (rizierUser, rizierToken, adminInfo) => {
    // Sauvegarde le token admin
    localStorage.setItem('pfs_admin_token', localStorage.getItem('pfs_token'))
    localStorage.setItem('pfs_admin_user', localStorage.getItem('pfs_user'))
    // Bascule sur le token du rizier
    localStorage.setItem('pfs_token', rizierToken)
    localStorage.setItem('pfs_user', JSON.stringify(rizierUser))
    localStorage.setItem('pfs_impersonating', JSON.stringify(adminInfo))
    setUser(rizierUser)
    setImpersonating(adminInfo)
  }

  // Sortir de l'impersonation et revenir au compte admin
  const stopImpersonation = () => {
    const adminToken = localStorage.getItem('pfs_admin_token')
    const adminUser  = localStorage.getItem('pfs_admin_user')
    if (adminToken && adminUser) {
      localStorage.setItem('pfs_token', adminToken)
      localStorage.setItem('pfs_user', adminUser)
      localStorage.removeItem('pfs_admin_token')
      localStorage.removeItem('pfs_admin_user')
      localStorage.removeItem('pfs_impersonating')
      setUser(JSON.parse(adminUser))
      setImpersonating(null)
    }
  }

  const register = async (formData) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', formData)
      localStorage.setItem('pfs_token', data.token)
      localStorage.setItem('pfs_user', JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.error || "Erreur d'inscription" }
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'superadmin'

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, register, isAdmin,
      impersonating, startImpersonation, stopImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
