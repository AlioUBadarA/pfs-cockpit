// Drapeau du mode démo. Quand il est actif, toutes les requêtes axios sont servies par la
// fausse API locale (demoApi.js), chargée à la demande pour ne pas alourdir le bundle normal.
const FLAG_KEY = 'pfs_demo'

export function isDemoMode() {
  try { return localStorage.getItem(FLAG_KEY) === '1' } catch { return false }
}

export function setDemoMode(on) {
  try {
    if (on) localStorage.setItem(FLAG_KEY, '1')
    else localStorage.removeItem(FLAG_KEY)
  } catch { /* ignore */ }
}

export async function demoAdapter(config) {
  const { default: adapter } = await import('./demoApi')
  return adapter(config)
}

export async function resetDemoData() {
  const { resetDemoDb } = await import('./demoApi')
  resetDemoDb()
}

export async function clearDemoData() {
  const { clearDemoDb } = await import('./demoApi')
  clearDemoDb()
}
