// Les rizeries stockent le pays en code ISO (« SN », « CI »).
// On affiche le drapeau emoji et le nom en français (« 🇨🇮 Côte d’Ivoire »).
const noms = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['fr'], { type: 'region' })
  : null

function getFlagEmoji(code) {
  if (!code || !/^[A-Z]{2}$/i.test(code)) return null
  try {
    const codePoints = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  } catch {
    return null
  }
}

export function nomPays(code) {
  if (!code) return ''
  if (!/^[A-Z]{2}$/i.test(code)) return code
  try {
    return noms?.of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

export function fmtPays(code) {
  if (!code) return null
  const flag = getFlagEmoji(code)
  const nom = nomPays(code)
  return flag ? `${flag} ${nom}` : nom
}
