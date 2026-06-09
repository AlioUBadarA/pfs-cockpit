import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email, form.password)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1B5E20] mb-4">
            <span className="text-white font-bold text-xl">PF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PFS Commercial</h1>
          <p className="text-gray-500 text-sm mt-1">Plateforme de pilotage commercial</p>
        </div>

        <div className="card shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Connexion</h2>

          {error && (
            <div className={`border text-sm rounded-lg px-4 py-3 mb-4 ${
              error.toLowerCase().includes('suspendu')
                ? 'bg-orange-50 border-orange-300 text-orange-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error.toLowerCase().includes('suspendu') && <p className="font-semibold mb-1">⛔ Accès suspendu</p>}
              {error}
              {error.toLowerCase().includes('suspendu') && (
                <p className="mt-2 text-xs">Contactez l'administrateur PFS pour régulariser votre situation.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="votre@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            Accès sur invitation uniquement.<br />
            Contactez l'administrateur PFS pour obtenir un compte.
          </p>
        </div>
      </div>
    </div>
  )
}
