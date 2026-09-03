import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const forced = !!user?.must_change_password

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      await api.patch('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      updateUser({ must_change_password: false })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      if (forced) {
        navigate('/', { replace: true })
      } else {
        setSuccess('Mot de passe modifié avec succès')
        setTimeout(() => setSuccess(''), 3500)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={forced ? 'min-h-screen flex items-center justify-center px-4' : 'max-w-md'} style={forced ? { background: 'var(--cc-bg)' } : undefined}>
      <div className={forced ? 'card w-full max-w-md' : 'card'}>
        <h2 className="font-display text-lg font-bold text-gray-900 mb-1">Changer le mot de passe</h2>
        {forced ? (
          <p className="text-sm text-gray-600 mb-4">
            Un administrateur vous demande de changer votre mot de passe avant de continuer.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">Modifiez le mot de passe de votre compte.</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input
              type="password" className="input" required
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input
              type="password" className="input" required minLength={12}
              placeholder="Min. 12 caractères"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input
              type="password" className="input" required minLength={12}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex gap-3 pt-2">
            {!forced && (
              <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>
                Annuler
              </button>
            )}
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Mettre à jour
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
