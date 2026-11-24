import api from '../services/api'

// Identité de la rizerie (nom, identifiants, adresse, logo) affichée sur le reçu, la facture,
// le bon de commande, le bon de dépôt et le contrat. Chargée une fois puis gardée en mémoire.
let cache = null

function blobEnDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function chargerEntreprise({ forcer = false } = {}) {
  if (cache && !forcer) return cache
  try {
    const { data } = await api.get('/api/rizerie')
    let logo = data.logo_data_url || null
    if (!logo && data.a_logo) {
      try {
        const r = await api.get('/api/rizerie/logo', { responseType: 'blob' })
        logo = await blobEnDataUrl(r.data)
      } catch { logo = null }
    }
    cache = { ...data, logo }
  } catch {
    cache = null
  }
  return cache
}

export function oublierEntreprise() {
  cache = null
}

// Ajoute l'entreprise à l'utilisateur passé aux fonctions d'impression.
export async function emetteur(user) {
  const entreprise = await chargerEntreprise()
  return { ...user, entreprise }
}

// Lit un fichier choisi par l'utilisateur et le prépare pour l'API : { nom, data } en base64.
// Contrôle léger côté navigateur (le serveur revérifie le type sur le contenu).
export const TAILLE_MAX_FICHIER = 3 * 1024 * 1024
export function lireFichierPourApi(file, typesAcceptes) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Aucun fichier')); return }
    if (file.size > TAILLE_MAX_FICHIER) { reject(new Error('Fichier trop lourd (3 Mo maximum)')); return }
    if (typesAcceptes && !typesAcceptes.includes(file.type)) {
      reject(new Error('Type de fichier refusé')); return
    }
    const reader = new FileReader()
    reader.onload = () => resolve({ nom: file.name, data: String(reader.result), type: file.type })
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(file)
  })
}

// Ouvre une preuve de paiement dans un nouvel onglet (le fichier exige le jeton de connexion,
// on le récupère donc par l'API puis on l'affiche depuis la mémoire du navigateur).
export async function ouvrirPreuve(versementId) {
  const fenetre = window.open('', '_blank')
  try {
    const r = await api.get(`/api/encaissements/versements/${versementId}/preuve`, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    if (fenetre) fenetre.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    if (fenetre) fenetre.close()
    throw new Error('Preuve indisponible')
  }
}
