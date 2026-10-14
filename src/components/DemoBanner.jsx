import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resetDemoData } from '../demo/demoMode'

export default function DemoBanner() {
  const { isDemo, logout } = useAuth()
  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)

  if (!isDemo) return null

  const handleReset = async () => {
    if (!confirm('Réinitialiser la démo ? Toutes vos modifications seront effacées.')) return
    setResetting(true)
    await resetDemoData()
    // Recharge la page courante pour que chaque écran relise les données d'origine
    window.location.reload()
  }

  const handleQuit = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="bg-[#1b75bc] text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5 flex-none">Démo</span>
        <span className="truncate">
          Données fictives : testez librement, rien n'est enregistré sur le serveur.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-none">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
        >
          {resetting ? 'Réinitialisation...' : '↺ Réinitialiser'}
        </button>
        <button
          onClick={handleQuit}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-[#1b75bc] hover:bg-gray-100 transition-colors"
        >
          Quitter la démo
        </button>
      </div>
    </div>
  )
}
