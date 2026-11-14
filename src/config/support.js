// Coordonnées de support affichées sur la page « Service indisponible ».
//
// Aucune coordonnée n'est inventée : elles proviennent exclusivement des variables
// d'environnement du site (voir .env.example et render.yaml). Si aucune n'est
// configurée, la page invite simplement à contacter l'administrateur PFS.
//
// Format attendu :
//   VITE_SUPPORT_EMAIL=support@exemple.com
//   VITE_SUPPORT_PHONE=+221771234567
//   VITE_SUPPORT_URL=https://exemple.com/support
//
// Priorité : e-mail → téléphone → URL.

function readEnv(name) {
  const value = import.meta.env?.[name]
  return typeof value === 'string' ? value.trim() : ''
}

function telHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function mailtoHref(email) {
  // Encode les éventuels caractères spéciaux de l'adresse.
  return `mailto:${encodeURIComponent(email)}`
}

const email = readEnv('VITE_SUPPORT_EMAIL')
const phone = readEnv('VITE_SUPPORT_PHONE')
const url = readEnv('VITE_SUPPORT_URL')

export const SUPPORT_CONTACT = email
  ? { type: 'email', href: mailtoHref(email), label: email, external: false }
  : phone
    ? { type: 'phone', href: telHref(phone), label: phone, external: false }
    : url
      ? { type: 'url', href: url, label: 'Ouvrir le support', external: true }
      : null
