import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ImpersonationBanner() {
  const { user, impersonating, stopImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!impersonating) return null

  const handleExit = () => {
    stopImpersonation()
    navigate('/admin')
  }

  return (
    <div className="relative z-20 bg-[#F9A825] px-4 py-2 flex items-center justify-between text-sm font-medium text-[#1A1A1A] shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">👁️</span>
        <span>
          Vous naviguez dans l'espace de <strong>{user?.rizerie || user?.nom}</strong>
          <span className="ml-2 text-xs font-normal opacity-70">(vue en lecture/écriture active)</span>
        </span>
      </div>
      <button
        onClick={handleExit}
        className="bg-[#1A1A1A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
      >
        ← Quitter · Retour Admin
      </button>
    </div>
  )
}
