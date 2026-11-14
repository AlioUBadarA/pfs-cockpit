// Demande de confirmation sous forme de promesse. Remplace window.confirm.
// Le composant ConfirmHost (monté une fois dans App) affiche la fenêtre.

let listener = null

export function registerConfirmHost(fn) {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}

export function askConfirm(message, options = {}) {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(typeof window !== 'undefined' && window.confirm ? window.confirm(message) : false)
      return
    }
    listener({ message, ...options, resolve })
  })
}
