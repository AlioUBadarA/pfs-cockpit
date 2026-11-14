// Formats communs. Une valeur absente (null, undefined) donne « - ». Zéro reste « 0 F ».

export function formatCFA(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '-'
  return Number(n).toLocaleString('fr-FR') + ' F'
}

export function formatNumber(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '-'
  return Number(n).toLocaleString('fr-FR')
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}
