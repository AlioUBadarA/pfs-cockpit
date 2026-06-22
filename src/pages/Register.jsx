import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INITIAL = {
  nom: '', email: '', password: '', rizerie: '', telephone: '', ville: '',
}

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await register(form)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1b75bc] mb-3">
            <span className="text-white font-bold text-lg">PF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">PFS Commercial - Riziers du Sénégal</p>
        </div>

        <div className="card shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nom complet</label>
                <input className="input" placeholder="Mamadou Diallo" value={form.nom} onChange={set('nom')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="votre@email.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Mot de passe</label>
                <input type="password" className="input" placeholder="8 caractères minimum" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="col-span-2">
                <label className="label">Nom de la rizerie</label>
                <input className="input" placeholder="Rizerie du Sahel" value={form.rizerie} onChange={set('rizerie')} required />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" placeholder="77 000 00 00" value={form.telephone} onChange={set('telephone')} />
              </div>
              <div>
                <label className="label">Ville</label>
                <input className="input" placeholder="Dakar" value={form.ville} onChange={set('ville')} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Inscription...' : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-[#1b75bc] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
