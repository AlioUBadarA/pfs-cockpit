import { useEffect, useState } from 'react'
import { chargerEntreprise } from './entreprise'
import { REGLES_DEFAUT } from '../components/ReglesRizerie'

// Règles commerciales de la rizerie (Paramètres > Règles commerciales). Le serveur les
// applique. L'écran s'en sert pour ne proposer que les choix permis.
export function useRegles() {
  const [regles, setRegles] = useState(REGLES_DEFAUT)
  const [pret, setPret] = useState(false)
  useEffect(() => {
    let actif = true
    chargerEntreprise().then((e) => {
      if (!actif) return
      setRegles({ ...REGLES_DEFAUT, ...(e?.parametres || {}) })
      setPret(true)
    })
    return () => { actif = false }
  }, [])
  return { regles, pret }
}
