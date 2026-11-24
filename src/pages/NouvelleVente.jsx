import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ClientPicker, { clientPayload } from '../components/ClientPicker'
import { ModeButtons, PreuveFields, MODES_AVEC_PREUVE } from '../components/PaiementFields'
import { printBonCommande, printRecu } from '../utils/printDocument'
import { emetteur } from '../utils/entreprise'
import { formatCFA as fmt } from '../utils/format'

// Valeurs exactes du backend (gcr/utils/paiement.js)
const CONDITIONS_PAIEMENT = ['Comptant', 'J+15', 'J+30', 'J+45', 'J+60', 'J+90', '50% comptant / 50% J+15', '50% comptant / 50% J+30']

const TENDANCE = {
  hausse: { label: 'En hausse', className: 'text-green-700 bg-green-50' },
  stable: { label: 'Stable', className: 'text-gray-600 bg-gray-100' },
  'déclin': { label: 'En déclin', className: 'text-red-700 bg-red-50' },
}
const FILTRES = [
  { key: '', label: 'Tous' },
  { key: 'hausse', label: 'En hausse' },
  { key: 'stable', label: 'Stables' },
  { key: 'déclin', label: 'En déclin' },
]

const today = () => new Date().toISOString().slice(0, 10)

function IconSac() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

// Écran de saisie d'une vente sur le modèle d'une caisse : catalogue à gauche, panier à droite.
// Le commercial choisit un client existant ou un prospect, ajoute un ou plusieurs produits et
// peut déclarer tout de suite l'argent reçu. Cet encaissement attend la validation du
// comptable ou d'un responsable avant de compter dans le CA.
export default function NouvelleVente() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [produits, setProduits] = useState([])
  const [loadingProduits, setLoadingProduits] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('')

  const [panier, setPanier] = useState([]) // { produit_id, produit, quantite, prix_unitaire }
  const [client, setClient] = useState(null)
  const [dateVente, setDateVente] = useState(today())
  const [conditions, setConditions] = useState('')
  const [mode, setMode] = useState('')
  const [montantRecu, setMontantRecu] = useState('')
  const [reference, setReference] = useState('')
  const [preuve, setPreuve] = useState(null)
  const [note, setNote] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resultat, setResultat] = useState(null)

  useEffect(() => {
    api.get('/api/produits')
      .then((r) => setProduits(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Impossible de charger le catalogue'))
      .finally(() => setLoadingProduits(false))
  }, [])

  const visibles = useMemo(() => {
    const t = recherche.trim().toLowerCase()
    return produits.filter((p) =>
      (!filtre || p.tendance === filtre) &&
      (!t || p.nom.toLowerCase().includes(t) || String(p.ref || '').toLowerCase().includes(t)))
  }, [produits, recherche, filtre])

  const total = panier.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0)
  const recu = Number(montantRecu) || 0

  const ajouter = (p) => {
    setPanier((prev) => {
      const existe = prev.find((l) => l.produit_id === p.id)
      if (existe) return prev.map((l) => l.produit_id === p.id ? { ...l, quantite: String((Number(l.quantite) || 0) + 1) } : l)
      return [...prev, { produit_id: p.id, produit: p.nom, quantite: '1', prix_unitaire: String(p.prix_kg || '') }]
    })
  }
  const modifier = (id, champ, valeur) => setPanier((prev) => prev.map((l) => l.produit_id === id ? { ...l, [champ]: valeur } : l))
  const retirer = (id) => setPanier((prev) => prev.filter((l) => l.produit_id !== id))

  const choisirMode = (m) => {
    setMode(m)
    setPreuve(null)
    setReference('')
    if (m && !montantRecu) setMontantRecu(total ? String(total) : '')
    if (!m) setMontantRecu('')
  }

  const valider = () => {
    if (!panier.length) return 'Ajoutez au moins un produit au panier'
    if (panier.some((l) => !(Number(l.quantite) > 0) || !(Number(l.prix_unitaire) > 0))) return 'Chaque produit doit avoir une quantité et un prix positifs'
    if (!client) return 'Choisissez un client ou un prospect'
    if (mode) {
      if (!(recu > 0)) return 'Indiquez le montant reçu'
      if (recu > total) return 'Le montant reçu dépasse le total de la vente'
      if (MODES_AVEC_PREUVE.includes(mode) && !preuve) return `Ajoutez la preuve du paiement par ${mode}`
    }
    return ''
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    const msg = valider()
    if (msg) { setError(msg); return }
    setSaving(true); setError('')
    try {
      const { data } = await api.post('/api/ventes', {
        ...clientPayload(client),
        date_vente: dateVente,
        conditions_paiement: conditions || undefined,
        note: note.trim() || undefined,
        lignes: panier.map((l) => ({ produit_id: l.produit_id, quantite: Number(l.quantite), prix_unitaire: Number(l.prix_unitaire) })),
        encaissement: mode ? {
          montant: recu, mode,
          reference: reference.trim() || undefined,
          preuve: preuve ? { nom: preuve.nom, data: preuve.data } : undefined,
        } : undefined,
      })
      setResultat(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const recommencer = () => {
    setPanier([]); setClient(null); setConditions(''); setMode(''); setMontantRecu('')
    setReference(''); setPreuve(null); setNote(''); setResultat(null); setError(''); setDateVente(today())
  }

  if (resultat) {
    const v = resultat
    const vers = v.versement
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card text-center space-y-2 py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-2xl">✓</div>
          <h2 className="font-display text-xl font-semibold text-gray-900">Vente {v.numero} enregistrée</h2>
          <p className="text-sm text-gray-600">{v.client_nom} · {fmt(v.montant)}</p>
          {vers && (
            <p className="text-sm text-gray-600">
              {vers.statut_validation === 'declare'
                ? `Encaissement de ${fmt(vers.montant)} déclaré. Il entre dans le CA après validation.`
                : `Encaissement de ${fmt(vers.montant)} enregistré et validé.`}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="btn-secondary" onClick={async () => printBonCommande(v, await emetteur(user))}>⎙ Bon de commande</button>
          {vers && (
            <button
              className="btn-secondary"
              onClick={async () => printRecu(
                { ...v, montant_total: v.montant }, vers, Number(vers.montant),
                Math.max(0, Number(v.montant) - Number(vers.montant)), await emetteur(user),
              )}
            >
              🧾 Reçu de paiement
            </button>
          )}
          <button className="btn-primary" onClick={recommencer}>+ Nouvelle vente</button>
          <button className="btn-secondary" onClick={() => navigate('/ventes')}>Voir les ventes</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={enregistrer} className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1b75bc]">Ventes</p>
          <h2 className="font-display text-2xl font-semibold text-gray-900">Nouvelle vente</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choisissez les produits, le client et le mode de paiement.</p>
        </div>
        <Link to="/ventes" className="text-sm font-medium text-gray-700 hover:text-[#1b75bc]">← Ventes</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        {/* Catalogue */}
        <div className="card space-y-4">
          <input
            className="input"
            placeholder="Rechercher un produit par nom ou référence…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {FILTRES.map((f) => (
              <button
                key={f.key || 'tous'}
                type="button"
                onClick={() => setFiltre(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filtre === f.key ? 'bg-[#1b75bc] border-[#1b75bc] text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingProduits ? (
            <div className="flex justify-center py-10">
              <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : produits.length === 0 ? (
            <p className="text-sm text-amber-700 text-center py-10">Aucun produit au catalogue. Demandez à votre manager d'en ajouter.</p>
          ) : visibles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun produit ne correspond.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibles.map((p) => {
                const dansPanier = panier.find((l) => l.produit_id === p.id)
                const t = TENDANCE[p.tendance]
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => ajouter(p)}
                    className={`text-center rounded-lg border p-3 flex flex-col items-center gap-1.5 transition-colors ${
                      dansPanier ? 'border-[#1b75bc] bg-[#f5f9fd]' : 'border-gray-200 bg-white hover:border-[#1b75bc]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center"><IconSac /></span>
                    <span className="text-[13px] font-semibold text-gray-900 leading-tight">{p.nom}</span>
                    <span className="text-sm font-bold text-[#1b75bc] tabular-nums">
                      {p.prix_kg ? `${Number(p.prix_kg).toLocaleString('fr-FR')} F/kg` : 'Prix libre'}
                    </span>
                    <span className="flex items-center gap-1 flex-wrap justify-center">
                      {p.ref && <span className="text-[10px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{p.ref}</span>}
                      {t && <span className={`text-[10px] rounded px-1.5 py-0.5 ${t.className}`}>{t.label}</span>}
                    </span>
                    {dansPanier && <span className="text-[10.5px] font-semibold text-[#1b75bc]">{Number(dansPanier.quantite).toLocaleString('fr-FR')} kg au panier</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panier */}
        <div className="card p-0 lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Panier ({panier.length})</div>
          <div className="p-4 space-y-4">
            {panier.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Touchez un produit pour l'ajouter.</p>
            ) : (
              <div className="space-y-2">
                {panier.map((l) => (
                  <div key={l.produit_id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{l.produit}</p>
                      <button type="button" onClick={() => retirer(l.produit_id)} className="text-red-600 hover:text-red-700 text-xs" aria-label={`Retirer ${l.produit}`}>
                        Retirer
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end mt-2">
                      <label className="text-[11px] text-gray-500">
                        Quantité (kg)
                        <input type="number" min="0.01" step="any" className="input mt-0.5 py-1.5" value={l.quantite}
                          onChange={(e) => modifier(l.produit_id, 'quantite', e.target.value)} />
                      </label>
                      <label className="text-[11px] text-gray-500">
                        Prix (F/kg)
                        <input type="number" min="1" step="any" className="input mt-0.5 py-1.5" value={l.prix_unitaire}
                          onChange={(e) => modifier(l.produit_id, 'prix_unitaire', e.target.value)} />
                      </label>
                      <span className="text-sm font-bold text-gray-900 tabular-nums pb-2">
                        {fmt((Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="label" htmlFor="client-picker">Client *</label>
              <ClientPicker value={client} onChange={setClient} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={dateVente} onChange={(e) => setDateVente(e.target.value)} required />
              </div>
              <div>
                <label className="label">Conditions</label>
                <select className="input" value={conditions} onChange={(e) => setConditions(e.target.value)}>
                  <option value="">Non précisé</option>
                  {CONDITIONS_PAIEMENT.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Paiement reçu maintenant</label>
              <ModeButtons value={mode} onChange={choisirMode} avecCredit />
            </div>

            {mode && (
              <div className="space-y-3">
                <div>
                  <label className="label">Montant reçu</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm text-gray-600 whitespace-nowrap">F CFA</span>
                    <input type="number" min="1" step="any" className="input rounded-l-none" value={montantRecu} onChange={(e) => setMontantRecu(e.target.value)} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Il sera compté dans le CA après validation du comptable ou du manager.</p>
                </div>
                <PreuveFields mode={mode} reference={reference} onReference={setReference} preuve={preuve} onPreuve={setPreuve} />
              </div>
            )}

            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} maxLength={2000} placeholder="Notes (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Sous-total</span><span className="tabular-nums">{fmt(total)}</span></div>
              {mode && recu > 0 && (
                <div className="flex justify-between text-gray-500"><span>Reste à payer</span><span className="tabular-nums">{fmt(Math.max(0, total - recu))}</span></div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span className="tabular-nums">{fmt(total)}</span></div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Enregistrement…' : 'Enregistrer la vente'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
