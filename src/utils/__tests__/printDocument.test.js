import { describe, it, expect, vi, afterEach } from 'vitest'
import { printBonCommande, printFacture, printRecu } from '../printDocument'

const EVIL = '<img src=x onerror=alert(1)><script>alert(2)</script>'

function fakeWindow() {
  const state = { html: '' }
  globalThis.window = {
    open: vi.fn(() => ({
      document: { open() {}, write: (h) => { state.html += h }, close() {} },
    })),
    alert: vi.fn(),
  }
  return state
}

afterEach(() => {
  delete globalThis.window
})

const vente = {
  numero: EVIL, date_vente: '2026-11-14', client_nom: EVIL, note: EVIL, produit: EVIL,
  vendeur_nom: EVIL, mode: EVIL, quantite: 1, prix_unitaire: 100, montant: 100, statut: 'Paye',
}
const user = { rizerie: EVIL, nom: EVIL, ville: EVIL, telephone: EVIL }

describe('impression', () => {
  it('échappe le HTML du bon de commande', () => {
    const s = fakeWindow()
    printBonCommande(vente, user)
    expect(s.html).not.toContain('<img src=x')
    expect(s.html).not.toContain('<script>alert')
    expect(s.html).toContain('&lt;img src=x')
  })

  it('échappe le HTML de la facture', () => {
    const s = fakeWindow()
    printFacture(vente, [{ date: '2026-11-14', montant: 50, mode: EVIL }], user)
    expect(s.html).not.toContain('<img src=x')
    expect(s.html).not.toContain('<script>alert')
  })

  it('échappe le HTML du reçu', () => {
    const s = fakeWindow()
    printRecu({ numero: EVIL, client_nom: EVIL }, { date: '2026-11-14', montant: 10, mode: EVIL }, 10, 0, user)
    expect(s.html).not.toContain('<img src=x')
    expect(s.html).not.toContain('<script>alert')
  })

  it('ne plante pas si la pop-up est bloquée', () => {
    fakeWindow()
    globalThis.window.open = vi.fn(() => null)
    expect(() => printBonCommande(vente, user)).not.toThrow()
    expect(globalThis.window.alert).toHaveBeenCalled()
  })
})
