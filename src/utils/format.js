// Formats communs. Une valeur absente (null, undefined) donne « - ». Zéro reste « 0 F ».

export function formatCFA(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '-'
  // Espace insécable avant « F » : un montant ne se coupe jamais en fin de ligne.
  return Number(n).toLocaleString('fr-FR') + ' F'
}

export function formatNumber(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '-'
  return Number(n).toLocaleString('fr-FR')
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}
