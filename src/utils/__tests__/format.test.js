import { describe, it, expect } from 'vitest'
import { formatCFA, formatNumber, formatDate } from '../format'

const norm = (s) => s.replace(/\s/g, ' ')

describe('formatCFA', () => {
  it('affiche 0 F pour zéro', () => {
    expect(norm(formatCFA(0))).toBe('0 F')
  })
  it('ne coupe jamais un montant : espace insécable avant F', () => {
    expect(formatCFA(2100000).endsWith(' F')).toBe(true)
    expect(/ /.test(formatCFA(2100000))).toBe(false)
  })
  it('affiche un tiret pour une valeur absente', () => {
    expect(formatCFA(null)).toBe('-')
    expect(formatCFA(undefined)).toBe('-')
    expect(formatCFA('')).toBe('-')
    expect(formatCFA('abc')).toBe('-')
  })
  it('sépare les milliers', () => {
    expect(norm(formatCFA(2165000))).toBe('2 165 000 F')
  })
})

describe('formatNumber', () => {
  it('garde zéro', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(null)).toBe('-')
  })
})

describe('formatDate', () => {
  it('renvoie un tiret sans date', () => {
    expect(formatDate(null)).toBe('-')
  })
  it('formate en jj/mm/aaaa', () => {
    expect(formatDate('2026-11-14T12:00:00')).toBe('14/11/2026')
  })
})
