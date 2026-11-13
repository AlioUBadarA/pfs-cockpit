import Country from 'country-state-city/lib/country'

// Les rizeries stockent le pays en code ISO (« SN », « CI »).
// On affiche le drapeau et le nom en français (« 🇨🇮 Côte d’Ivoire »).
const noms = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['fr'], { type: 'region' })
  : null

export function nomPays(code) {
  if (!code) return ''
  if (!/^[A-Z]{2}$/.test(code)) return code
  try {
    return noms?.of(code) || Country.getCountryByCode(code)?.name || code
  } catch {
    return Country.getCountryByCode(code)?.name || code
  }
}

export function fmtPays(code) {
  if (!code) return null
  const flag = /^[A-Z]{2}$/.test(code) ? Country.getCountryByCode(code)?.flag : null
  return flag ? `${flag} ${nomPays(code)}` : nomPays(code)
}
