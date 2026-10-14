// Fausse API du mode démo : remplace l'adaptateur HTTP d'axios et répond à chaque endpoint
// utilisé par le frontend à partir d'une base en mémoire (voir demoData.js).
// Aucune requête ne part vers le serveur : les actions du visiteur ne touchent que cette base,
// conservée dans le localStorage de son navigateur et réinitialisable à tout moment.
import { AxiosError } from 'axios'
import {
  DEMO_USER, DELAIS_PAIEMENT, buildDemoDb, genererEcheances,
  isoDate, parseDate, addDays, todayDate, uid,
} from './demoData'

const DB_KEY = 'pfs_demo_db'
const DB_VERSION = 1

let db = null

function loadDb() {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.version === DB_VERSION) db = parsed
  } catch { /* stockage indisponible : on repart d'une base neuve */ }
  if (!db) { db = buildDemoDb(); saveDb() }
  return db
}

function saveDb() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* ignore */ }
}

export function resetDemoDb() {
  db = buildDemoDb()
  saveDb()
}

export function clearDemoDb() {
  db = null
  try { localStorage.removeItem(DB_KEY) } catch { /* ignore */ }
}

// ── Helpers ─────────────────────────────────────────────────
class HttpError extends Error {
  constructor(status, data) { super(data?.error || 'Erreur'); this.status = status; this.data = data }
}
const fail = (status, error, extra = {}) => { throw new HttpError(status, { error, ...extra }) }
const notFound = () => fail(404, 'Élément introuvable')
const newId = () => uid()
const today = () => todayDate()
const todayIso = () => isoDate(todayDate())
const sum = (arr, f) => arr.reduce((s, x) => s + Number(f(x) || 0), 0)
const round1 = (n) => Math.round(n * 10) / 10
const byId = (arr, id) => arr.find((x) => String(x.id) === String(id))
const userNom = (id) => (id === DEMO_USER.id ? DEMO_USER.nom : db.users.find((u) => u.id === id)?.nom) || null
const produitByNom = (nom) => db.produits.find((p) => p.nom === nom)
const groupSum = (arr, keyF, valF) => {
  const out = {}
  arr.forEach((x) => { const k = keyF(x) || 'Non renseigné'; out[k] = (out[k] || 0) + Number(valF(x) || 0) })
  return out
}
const moisEcoules = () => today().getMonth() + 1

function versementsDe(type, refId) {
  return db.versements.filter((v) => v.type === type && v.ref_id === refId)
}
const totalVerse = (type, refId) => sum(versementsDe(type, refId), (v) => v.montant)

// ── Enrichissements ─────────────────────────────────────────
function venteView(v) {
  const verse = totalVerse('vente', v.id)
  return {
    ...v,
    vendeur_nom: userNom(v.vendeur_id),
    total_verse: verse,
    montant_attendu_prochaine_echeance: Math.max(0, v.montant - verse),
  }
}

function coutVente(v) {
  const p = produitByNom(v.produit)
  return v.quantite * (p?.cout_kg ?? v.prix_unitaire * 0.7)
}

function clientView(c) {
  const ventes = db.ventes.filter((v) => v.client_id === c.id)
  const derniere = ventes.reduce((m, v) => (v.date_vente > m ? v.date_vente : m), '')
  return {
    ...c,
    ca_total: sum(ventes, (v) => v.montant),
    nb_ventes: ventes.length,
    derniere_vente: derniere || null,
    vendeur_nom: userNom(c.vendeur_id),
    can_edit: true,
    can_delete: true,
  }
}

function contratView(c) {
  const ech = db.echeances.filter((e) => e.contrat_id === c.id)
  return {
    ...c,
    vendeur_nom: userNom(c.vendeur_id),
    nb_echeances: ech.length,
    echeances_impayees: ech.filter((e) => e.statut_paiement === 'En retard').length,
    ca_contractualise: sum(ech, (e) => e.montant),
  }
}

function echeanceView(e) {
  const c = byId(db.contrats_clients, e.contrat_id)
  return {
    ...e,
    total_verse: totalVerse('echeance', e.id),
    client_nom: c?.client_nom,
    contrat_numero: c?.numero,
    vendeur_nom: userNom(c?.vendeur_id),
  }
}

function depotView(d) {
  const movs = db.mouvements.filter((m) => m.depot_id === d.id)
  const vendue = sum(movs.filter((m) => m.type === 'vente'), (m) => m.quantite)
  const retour = sum(movs.filter((m) => m.type === 'retour'), (m) => m.quantite)
  const montantDu = vendue * d.prix_unitaire
  const verse = totalVerse('depot', d.id)
  const solde = Math.max(0, d.quantite_deposee - vendue - retour)
  return {
    ...d,
    vendeur_nom: userNom(d.vendeur_id),
    quantite_vendue: vendue,
    quantite_retournee: retour,
    solde_restant: solde,
    montant_du: montantDu,
    total_verse: verse,
    montant_restant: Math.max(0, montantDu - verse),
    statut: solde === 0 ? 'Clôturé' : 'En cours',
    statut_paiement: montantDu > 0 && verse >= montantDu ? 'Paye' : 'En cours',
  }
}

// Statistiques commerciales d'un membre de l'équipe (ventes propres, année en cours)
function statsUser(u) {
  const year = String(today().getFullYear())
  const ventes = db.ventes.filter((v) => v.vendeur_id === u.id)
  const ytd = ventes.filter((v) => v.date_vente.startsWith(year))
  const ca = sum(ytd, (v) => v.montant)
  const obj = Number(u.objectif_annuel || 0)
  const prorata = (obj / 12) * moisEcoules()
  const creances = sum(ventes.filter((v) => v.statut_paiement !== 'Paye'), (v) => v.montant - totalVerse('vente', v.id))
  return {
    ca_ytd: ca,
    objectif_annuel: obj,
    objectif_mensuel: Math.round(obj / 12),
    ecart: Math.round(ca - prorata),
    taux_atteinte: prorata > 0 ? round1((ca / prorata) * 100) : 0,
    forecast: Math.round((ca / moisEcoules()) * 12),
    marge: Math.round(sum(ytd, (v) => v.montant - coutVente(v))),
    nb_clients: db.clients.filter((c) => c.vendeur_id === u.id).length,
    nb_ventes: ytd.length,
    creances: Math.round(creances),
  }
}

function equipeView(u) {
  const s = statsUser(u)
  return {
    ...u,
    ...s,
    ca_total: s.ca_ytd,
    manager_nom: u.parent_id ? userNom(u.parent_id) : null,
  }
}

function managersView() {
  return db.users.filter((u) => u.role === 'manager').map((m) => {
    const membres = [m, ...db.users.filter((u) => u.parent_id === m.id)]
    const team = membres.map((u) => {
      const s = statsUser(u)
      return { id: u.id, nom: u.nom, obj_annuel: s.objectif_annuel, ca_ytd: s.ca_ytd, ecart: s.ecart, taux_atteinte: s.taux_atteinte, forecast: s.forecast, marge: s.marge, creances: s.creances }
    })
    const obj = sum(team, (t) => t.obj_annuel)
    const ca = sum(team, (t) => t.ca_ytd)
    const prorata = (obj / 12) * moisEcoules()
    return {
      id: m.id, nom: m.nom, zone: m.zone, email: m.email,
      nb_com: membres.length - 1,
      ca_ytd: ca, obj_annuel: obj,
      taux_atteinte: prorata > 0 ? round1((ca / prorata) * 100) : 0,
      forecast: sum(team, (t) => t.forecast),
      marge: sum(team, (t) => t.marge),
      creances: sum(team, (t) => t.creances),
      team,
    }
  })
}

// ── Calculs des écrans d'analyse ────────────────────────────
function dashboard() {
  const t = today()
  const year = String(t.getFullYear())
  const moisCourant = isoDate(t).slice(0, 7)
  const ventesYtd = db.ventes.filter((v) => v.date_vente.startsWith(year))
  const caYtd = sum(ventesYtd, (v) => v.montant)
  const objectifAnnuel = sum(Object.entries(db.objectifs).filter(([k]) => k.startsWith(`${year}-`)), ([, v]) => v)
  const marge = sum(ventesYtd, (v) => v.montant - coutVente(v))
  const versYtd = db.versements.filter((v) => v.date.startsWith(year) && v.type !== 'paddy')
  const ouvertes = db.ventes.filter((v) => v.statut_paiement !== 'Paye')
  const pipeline = db.prospects.filter((p) => !['Gagné', 'Perdu'].includes(p.statut))
  const clients = db.clients.map(clientView)
  const dormant = (c) => !c.derniere_vente || (t - parseDate(c.derniere_vente)) / 86400000 > 60

  const caMensuel = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth() - i, 1)
    const key = isoDate(d).slice(0, 7)
    caMensuel.push({ mois: d.getMonth() + 1, annee: d.getFullYear(), ca: sum(db.ventes.filter((v) => v.date_vente.startsWith(key)), (v) => v.montant) })
  }

  const clientById = Object.fromEntries(db.clients.map((c) => [c.id, c]))
  const toArr = (obj, key) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ [key]: k, ca: v }))

  return {
    kpis: {
      ca_ytd: caYtd,
      nb_ventes_ytd: ventesYtd.length,
      objectif_annuel: objectifAnnuel,
      projection_annuel: Math.round((caYtd / moisEcoules()) * 12),
      taux_atteinte: objectifAnnuel ? round1((caYtd / ((objectifAnnuel / 12) * moisEcoules())) * 100) : null,
      marge_nette: Math.round(marge),
      taux_marge_nette: caYtd ? round1((marge / caYtd) * 100) : 0,
      encaisse_mois: sum(versYtd.filter((v) => v.date.startsWith(moisCourant)), (v) => v.montant),
      encaisse_ytd: sum(versYtd, (v) => v.montant),
      total_creances: Math.round(sum(ouvertes, (v) => v.montant - totalVerse('vente', v.id))),
      nb_creances: ouvertes.length,
      taux_recouvrement: caYtd ? Math.round((sum(versYtd.filter((v) => v.type === 'vente'), (v) => v.montant) / caYtd) * 100) : null,
      pipeline_espere: sum(pipeline, (p) => p.valeur_estimee),
      pipeline_nb: pipeline.length,
      clients_actifs: clients.filter((c) => c.statut === 'Actif' && !dormant(c)).length,
      clients_total: clients.length,
      clients_dormants: clients.filter(dormant).length,
    },
    ca_mensuel: caMensuel,
    top_clients: clients.map((c) => ({ nom: c.nom, ca_total: sum(ventesYtd.filter((v) => v.client_id === c.id), (v) => v.montant) }))
      .sort((a, b) => b.ca_total - a.ca_total).slice(0, 10),
    ca_par_segment: toArr(groupSum(ventesYtd, (v) => clientById[v.client_id]?.segment, (v) => v.montant), 'segment'),
    ca_par_region: toArr(groupSum(ventesYtd, (v) => clientById[v.client_id]?.region, (v) => v.montant), 'region'),
    ca_par_produit: toArr(groupSum(ventesYtd, (v) => v.produit, (v) => v.montant), 'produit'),
    atteinte_vendeurs: db.users.map((u) => ({ nom: u.nom, taux_atteinte: statsUser(u).taux_atteinte }))
      .sort((a, b) => b.taux_atteinte - a.taux_atteinte),
    mouvements: {
      clients_gagnes: db.prospects.filter((p) => p.statut === 'Gagné').length,
      clients_perdus: db.prospects.filter((p) => p.statut === 'Perdu').length,
      nouveaux_contrats: db.contrats_clients.filter((c) => c.date_debut.startsWith(year)).length,
      cmd_retard: db.ventes.filter((v) => v.statut_paiement === 'En retard').length,
    },
  }
}

function rentabilite(params) {
  const annee = String(params.annee || today().getFullYear())
  const tauxCout = Number(params.taux_cout ?? 70) / 100
  const ventes = db.ventes.filter((v) => v.date_vente.startsWith(annee))
  const clientById = Object.fromEntries(db.clients.map((c) => [c.id, c]))
  const cout = (v) => {
    const p = produitByNom(v.produit)
    return p?.cout_kg ? v.quantite * p.cout_kg : v.montant * tauxCout
  }
  const agg = (keyF, extra = () => ({})) => {
    const out = {}
    ventes.forEach((v) => {
      const k = keyF(v) || 'Non renseigné'
      out[k] = out[k] || { key: k, ca: 0, cout: 0, nb_ventes: 0, ...extra(v) }
      out[k].ca += v.montant; out[k].cout += cout(v); out[k].nb_ventes += 1
    })
    return Object.values(out).map((r) => ({
      ...r, cout: Math.round(r.cout), marge: Math.round(r.ca - r.cout),
      taux_marge: r.ca ? round1(((r.ca - r.cout) / r.ca) * 100) : 0,
    })).sort((a, b) => b.ca - a.ca)
  }
  const ca = sum(ventes, (v) => v.montant)
  const coutTotal = sum(ventes, cout)
  return {
    ca_total: ca,
    cout_total: Math.round(coutTotal),
    marge_total: Math.round(ca - coutTotal),
    taux_marge_total: ca ? round1(((ca - coutTotal) / ca) * 100) : 0,
    par_type: agg((v) => clientById[v.client_id]?.type).map((r) => ({ ...r, type_client: r.key })),
    par_client: agg((v) => v.client_id, (v) => ({ client_nom: v.client_nom, type_client: clientById[v.client_id]?.type, vendeur_nom: userNom(v.vendeur_id) })),
    par_region: agg((v) => clientById[v.client_id]?.region).map((r) => ({ ...r, region: r.key })),
    par_segment: agg((v) => clientById[v.client_id]?.segment).map((r) => ({ ...r, segment: r.key })),
    par_produit: agg((v) => v.produit).map((r) => ({ ...r, produit: r.key, tendance: produitByNom(r.key)?.tendance })),
    par_vendeur: agg((v) => v.vendeur_id).map((r) => ({ ...r, vendeur_nom: userNom(r.key) })),
  }
}

function forecast(params) {
  const annee = Number(params.annee || today().getFullYear())
  const echeancesAnnee = db.echeances.filter((e) => e.annee === annee)
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${annee}-${String(i + 1).padStart(2, '0')}`
    return {
      mois: i + 1,
      objectif: Number(db.objectifs[`${annee}-${i + 1}`] || 0),
      realise: sum(db.ventes.filter((v) => v.date_vente.startsWith(key)), (v) => v.montant),
      contractualise: sum(echeancesAnnee.filter((e) => e.mois === i + 1), (e) => e.montant),
    }
  })
  const ytd = sum(months, (m) => m.realise)
  const ecoules = annee === today().getFullYear() ? moisEcoules() : 12
  return {
    months,
    projection_annuelle: Math.round((ytd / ecoules) * 12),
    contractualise_annuel: sum(months, (m) => m.contractualise),
    quarterly: [0, 1, 2, 3].map((q) => ({ trimestre: `T${q + 1} ${annee}`, valeur: sum(months.slice(q * 3, q * 3 + 3), (m) => m.realise) })),
    par_vendeur: db.users.map((u) => {
      const s = statsUser(u)
      return { nom: u.nom, ca_ytd: s.ca_ytd, forecast: s.forecast, objectif: s.objectif_annuel, ecart: s.forecast - s.objectif_annuel }
    }),
  }
}

function actions() {
  const t = today()
  const alertes = []
  db.clients.map(clientView).forEach((c) => {
    if (c.statut !== 'Actif' || !c.derniere_vente) return
    const j = Math.round((t - parseDate(c.derniere_vente)) / 86400000)
    if (j > 60) alertes.push({ key: `inactif:${c.id}`, cat: 'Client inactif', niveau: j > 90 ? 'rouge' : 'orange', msg: `${c.nom} n'a rien commandé depuis ${j} jours`, valeur: Math.round(c.ca_total / 14), owner_nom: c.vendeur_nom })
  })
  db.ventes.filter((v) => v.statut_paiement !== 'Paye').forEach((v) => {
    const j = Math.round((t - parseDate(v.date_echeance)) / 86400000)
    if (j > 30) alertes.push({ key: `creance:${v.id}`, cat: 'Créance en retard', niveau: j > 90 ? 'rouge' : 'orange', msg: `${v.client_nom} · ${v.numero} impayée depuis ${j} jours`, valeur: Math.round(v.montant - totalVerse('vente', v.id)), owner_nom: userNom(v.vendeur_id) })
  })
  db.users.forEach((u) => {
    const s = statsUser(u)
    if (s.objectif_annuel && s.taux_atteinte < 80) alertes.push({ key: `objectif:${u.id}`, cat: 'Objectif sous cible', niveau: s.taux_atteinte < 70 ? 'rouge' : 'orange', msg: `${u.nom} à ${Math.round(s.taux_atteinte)} % de son objectif au prorata`, valeur: Math.abs(s.ecart), owner_nom: u.nom })
  })
  alertes.forEach((a) => { a.traitee = !!db.alertes_traitees[a.key] })
  alertes.sort((a, b) => (a.niveau === b.niveau ? b.valeur - a.valeur : a.niveau === 'rouge' ? -1 : 1))
  return {
    alertes,
    stats: {
      total: alertes.length,
      traitees: alertes.filter((a) => a.traitee).length,
      a_traiter: alertes.filter((a) => !a.traitee).length,
      rouges_actives: alertes.filter((a) => !a.traitee && a.niveau === 'rouge').length,
    },
  }
}

// Transactions encaissables (ventes, échéances de contrats, dépôts, contrats paddy)
function transactions() {
  const ventes = db.ventes.map((v) => ({
    id: v.id, type: 'vente', numero: v.numero, date: v.date_vente, client_nom: v.client_nom,
    montant_total: v.montant, total_verse: totalVerse('vente', v.id), statut: v.statut_paiement,
    date_echeance: v.date_echeance, produit: v.produit, quantite: v.quantite, prix_unitaire: v.prix_unitaire,
  }))
  const ech = db.echeances.map(echeanceView).map((e) => ({
    id: e.id, type: 'echeance', numero: `${e.contrat_numero}/${String(e.mois).padStart(2, '0')}`, date: e.date_paiement_prevue,
    client_nom: e.client_nom, montant_total: e.montant, total_verse: e.total_verse, statut: e.statut_paiement,
  }))
  const depots = db.depots.map(depotView).map((d) => ({
    id: d.id, type: 'depot', numero: d.numero, date: d.date_depot, client_nom: d.client_nom,
    montant_total: d.montant_du, total_verse: d.total_verse, statut: d.statut_paiement,
  }))
  const paddy = db.contrats_paddy.map((p) => ({
    id: p.id, type: 'paddy', numero: p.numero, date: p.date_debut, client_nom: p.producteur_nom,
    montant_total: p.quantite_kg * p.prix_kg, total_verse: totalVerse('paddy', p.id), statut: p.statut,
  }))
  return [...ventes, ...ech, ...depots, ...paddy]
}

function enregistrerVersement(type, refId, body) {
  const montant = Number(body.montant)
  if (!(montant > 0)) fail(400, 'Le montant doit être positif')
  const tx = transactions().find((x) => x.type === type && x.id === refId)
  if (!tx) notFound()
  const reste = tx.montant_total - tx.total_verse
  if (montant > reste + 0.5) fail(400, `Le montant dépasse le reste à encaisser (${Math.round(reste).toLocaleString('fr-FR')} F)`)
  db.versements.push({ id: newId(), type, ref_id: refId, client_nom: tx.client_nom, montant, mode: body.mode || 'Espèces', date: body.date || todayIso() })
  const solde = reste - montant <= 0.5
  if (type === 'vente') {
    const v = byId(db.ventes, refId)
    if (solde) v.statut_paiement = 'Paye'
    else if (body.prochaine_echeance) { v.date_echeance = body.prochaine_echeance; v.statut_paiement = 'En cours' }
  }
  if (type === 'echeance') {
    const e = byId(db.echeances, refId)
    if (solde) e.statut_paiement = 'Paye'
    else if (body.prochaine_echeance) e.date_paiement_prevue = body.prochaine_echeance
  }
  return { ok: true }
}

// Rattache une vente/contrat/dépôt à un client existant, ou le crée s'il est nouveau.
function clientPourNom(nom, vendeurId) {
  const trimmed = String(nom || '').trim()
  if (!trimmed) fail(400, 'Le nom du client est requis')
  let c = db.clients.find((x) => x.nom.toLowerCase() === trimmed.toLowerCase())
  if (!c) {
    c = { id: newId(), nom: trimmed, type: 'Boutique', statut: 'Actif', segment: 'Proximité', region: '', zone: '', potentiel_annuel: 0, telephone: '', produits_interet: [], vendeur_id: vendeurId, created_at: todayIso() }
    db.clients.push(c)
  }
  if (c.statut === 'Prospect') c.statut = 'Actif'
  return c
}

const pickFields = (body, fields) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))

// ── Routes ──────────────────────────────────────────────────
const routes = []
const route = (method, pattern, handler) => {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '$')
  routes.push({ method, re, keys, handler })
}

// Auth
route('post', '/api/auth/login', () => ({ token: 'demo-token', user: DEMO_USER }))
route('get', '/api/auth/me', () => DEMO_USER)
route('patch', '/api/auth/me/password', ({ body }) => {
  if (!body.new_password || body.new_password.length < 12) fail(400, 'Le nouveau mot de passe doit contenir au moins 12 caractères')
  return { ok: true, message: 'Mode démo : aucun mot de passe réel n’est modifié' }
})

// Tableaux de bord
route('get', '/api/dashboard', () => dashboard())
route('get', '/api/rentabilite', ({ params }) => rentabilite(params))
route('get', '/api/forecast', ({ params }) => forecast(params))
route('post', '/api/forecast', ({ body }) => {
  db.objectifs[`${Number(body.annee)}-${Number(body.mois)}`] = Number(body.objectif_montant) || 0
  return { ok: true }
})
route('get', '/api/actions', () => actions())
route('patch', '/api/actions/traiter', ({ body }) => {
  if (body.traitee) db.alertes_traitees[body.key] = todayIso()
  else delete db.alertes_traitees[body.key]
  return { ok: true }
})

// Produits
route('get', '/api/produits', () => [...db.produits].sort((a, b) => a.nom.localeCompare(b.nom)))
route('post', '/api/produits', ({ body }) => {
  if (!body.ref || !body.nom) fail(400, 'Référence et nom requis')
  if (db.produits.some((p) => p.ref === body.ref)) fail(409, 'Cette référence existe déjà')
  const p = { id: newId(), tendance: 'stable', ...pickFields(body, ['ref', 'nom', 'prix_kg', 'cout_kg', 'tendance']) }
  db.produits.push(p)
  return p
})
route('put', '/api/produits/:id', ({ id, body }) => Object.assign(byId(db.produits, id) || notFound(), pickFields(body, ['ref', 'nom', 'prix_kg', 'cout_kg', 'tendance'])))
route('delete', '/api/produits/:id', ({ id }) => { db.produits = db.produits.filter((p) => p.id !== id); return { ok: true } })

// Clients
const CLIENT_FIELDS = ['nom', 'type', 'statut', 'zone', 'region', 'segment', 'potentiel_annuel', 'telephone', 'volume_estime', 'valorise', 'horaire', 'produits_interet']
const normTel = (t) => String(t || '').replace(/\D/g, '').slice(-9)
function checkDoublonTel(body, exceptId) {
  const tel = normTel(body.telephone)
  if (!tel) return
  const dup = db.clients.find((c) => c.id !== exceptId && normTel(c.telephone) === tel)
  if (dup) fail(409, 'client_existe', { message: 'Un client avec ce numéro de téléphone existe déjà.', client: { nom: dup.nom, telephone: dup.telephone, assigne_a: userNom(dup.vendeur_id) } })
}
route('get', '/api/clients', () => db.clients.map(clientView))
route('post', '/api/clients', ({ body }) => {
  if (!body.nom) fail(400, 'Le nom est requis')
  checkDoublonTel(body)
  const c = { id: newId(), vendeur_id: DEMO_USER.id, created_at: todayIso(), produits_interet: [], ...pickFields(body, CLIENT_FIELDS) }
  db.clients.push(c)
  return clientView(c)
})
route('put', '/api/clients/:id', ({ id, body }) => {
  const c = byId(db.clients, id) || notFound()
  checkDoublonTel(body, id)
  Object.assign(c, pickFields(body, CLIENT_FIELDS))
  return clientView(c)
})
route('patch', '/api/clients/:id/statut', ({ id, body }) => { (byId(db.clients, id) || notFound()).statut = body.statut; return { ok: true } })
route('delete', '/api/clients/:id', ({ id }) => {
  db.clients = db.clients.filter((c) => c.id !== id)
  return { ok: true }
})

// Prospection
const PROSPECT_FIELDS = ['nom', 'type_client', 'zone', 'region', 'source', 'telephone', 'statut', 'priorite', 'date_contact', 'note', 'valeur_estimee']
const prospectView = (p) => ({ ...p, vendeur_nom: userNom(p.vendeur_id) })
route('get', '/api/prospection', ({ params }) => db.prospects
  .filter((p) => !params.statut || p.statut === params.statut)
  .sort((a, b) => String(b.date_contact || '').localeCompare(String(a.date_contact || '')))
  .map(prospectView))
route('post', '/api/prospection', ({ body }) => {
  if (!body.nom) fail(400, 'Le nom est requis')
  const p = { id: newId(), vendeur_id: DEMO_USER.id, created_at: todayIso(), ...pickFields(body, PROSPECT_FIELDS) }
  db.prospects.push(p)
  return prospectView(p)
})
route('put', '/api/prospection/:id', ({ id, body }) => prospectView(Object.assign(byId(db.prospects, id) || notFound(), pickFields(body, PROSPECT_FIELDS))))
route('patch', '/api/prospection/:id/statut', ({ id, body }) => {
  const p = byId(db.prospects, id) || notFound()
  p.statut = body.statut
  if (body.statut === 'Gagné' && !db.clients.some((c) => c.nom.toLowerCase() === p.nom.toLowerCase())) {
    db.clients.push({ id: newId(), nom: p.nom, type: p.type_client || 'Boutique', statut: 'Actif', segment: '', region: p.region, zone: p.zone, telephone: p.telephone, potentiel_annuel: p.valeur_estimee, produits_interet: [], vendeur_id: p.vendeur_id, created_at: todayIso() })
  }
  return { ok: true }
})
route('delete', '/api/prospection/:id', ({ id }) => { db.prospects = db.prospects.filter((p) => p.id !== id); return { ok: true } })

// Ventes
route('get', '/api/ventes', ({ params }) => {
  const prefix = params.annee && params.mois ? `${params.annee}-${String(params.mois).padStart(2, '0')}` : null
  return db.ventes
    .filter((v) => (!prefix || v.date_vente.startsWith(prefix)) && (!params.statut || v.statut_paiement === params.statut))
    .sort((a, b) => b.date_vente.localeCompare(a.date_vente) || b.numero.localeCompare(a.numero))
    .map(venteView)
})
route('post', '/api/ventes', ({ body }) => {
  const quantite = Number(body.quantite)
  const prix = Number(body.prix_unitaire)
  if (!(quantite > 0) || !(prix > 0)) fail(400, 'Quantité et prix unitaire doivent être positifs')
  if (!body.produit) fail(400, 'Le produit est requis')
  const client = clientPourNom(body.client_nom, DEMO_USER.id)
  const date = body.date_vente || todayIso()
  const year = date.slice(0, 4)
  const seq = db.ventes.filter((v) => v.numero.startsWith(`V-${year}-`)).length + 1
  const conditions = body.conditions_paiement || 'Comptant'
  const v = {
    id: newId(), numero: `V-${year}-${String(seq).padStart(4, '0')}`,
    date_vente: date, client_id: client.id, client_nom: client.nom,
    produit: body.produit, quantite, prix_unitaire: prix, montant: Math.round(quantite * prix),
    conditions_paiement: conditions, vendeur_id: client.vendeur_id || DEMO_USER.id,
    date_echeance: isoDate(addDays(parseDate(date), DELAIS_PAIEMENT[conditions] ?? 30)),
    statut_paiement: body.statut_paiement || 'En cours', mode: 'Espèces', nb_relances: 0, derniere_relance: null,
  }
  db.ventes.push(v)
  if (v.statut_paiement === 'Paye') db.versements.push({ id: newId(), type: 'vente', ref_id: v.id, client_nom: v.client_nom, montant: v.montant, mode: 'Espèces', date })
  return venteView(v)
})
route('patch', '/api/ventes/:id/statut', ({ id, body }) => {
  const v = byId(db.ventes, id) || notFound()
  v.statut_paiement = body.statut_paiement
  if (body.statut_paiement === 'Paye') {
    const reste = v.montant - totalVerse('vente', v.id)
    if (reste > 0) db.versements.push({ id: newId(), type: 'vente', ref_id: v.id, client_nom: v.client_nom, montant: reste, mode: v.mode || 'Espèces', date: todayIso() })
  }
  return { ok: true }
})
route('post', '/api/ventes/:id/relances', ({ id }) => {
  const v = byId(db.ventes, id) || notFound()
  v.nb_relances = (v.nb_relances || 0) + 1
  v.derniere_relance = todayIso()
  return { ok: true }
})
route('get', '/api/ventes/:id/versements', ({ id }) => versementsDe('vente', id).sort((a, b) => b.date.localeCompare(a.date)))
route('delete', '/api/ventes/:id', ({ id }) => {
  db.ventes = db.ventes.filter((v) => v.id !== id)
  db.versements = db.versements.filter((v) => !(v.type === 'vente' && v.ref_id === id))
  return { ok: true }
})

// Encaissements
route('get', '/api/encaissements/search', ({ params }) => {
  const q = String(params.q || '').trim().toLowerCase()
  if (!q) return []
  return transactions()
    .filter((tx) => tx.numero?.toLowerCase().includes(q) || tx.client_nom?.toLowerCase().includes(q))
    .sort((a, b) => (a.montant_total - a.total_verse > 0 ? 0 : 1) - (b.montant_total - b.total_verse > 0 ? 0 : 1) || String(b.date).localeCompare(String(a.date)))
    .slice(0, 40)
})
route('get', '/api/encaissements/mois', () => {
  const m = todayIso().slice(0, 7)
  return { total: sum(db.versements.filter((v) => v.date.startsWith(m) && v.type !== 'paddy'), (v) => v.montant) }
})
route('get', '/api/encaissements/:type/:id/versements', ({ type, id }) => versementsDe(type, id).sort((a, b) => b.date.localeCompare(a.date)))
route('post', '/api/encaissements/:type/:id/versements', ({ type, id, body }) => enregistrerVersement(type, id, body))

// Journal
route('get', '/api/journal', ({ params }) => {
  const from = params.from || todayIso()
  const to = params.to || todayIso()
  const inRange = (d) => d >= from && d <= to
  return {
    ventes: db.ventes.filter((v) => inRange(v.date_vente)).sort((a, b) => b.date_vente.localeCompare(a.date_vente)).map(venteView),
    versements: db.versements.filter((v) => inRange(v.date) && v.type !== 'paddy').sort((a, b) => b.date.localeCompare(a.date)),
  }
})

// Contrats clients
const CONTRAT_FIELDS = ['client_nom', 'produits', 'quantite_mensuelle', 'prix_unitaire', 'date_debut', 'date_fin', 'statut', 'note']
route('get', '/api/contrats/clients', () => db.contrats_clients.map(contratView).sort((a, b) => b.date_debut.localeCompare(a.date_debut)))
route('post', '/api/contrats/clients', ({ body }) => {
  const client = clientPourNom(body.client_nom, DEMO_USER.id)
  if (!body.produits?.length) fail(400, 'Sélectionnez au moins un produit')
  const debut = body.date_debut || todayIso()
  const year = debut.slice(0, 4)
  const c = {
    id: newId(), numero: `CC-${year}-${String(db.contrats_clients.filter((x) => x.numero.includes(`-${year}-`)).length + 1).padStart(3, '0')}`,
    vendeur_id: client.vendeur_id || DEMO_USER.id, client_id: client.id,
    ...pickFields(body, CONTRAT_FIELDS), client_nom: client.nom, produit: body.produits[0], date_debut: debut, statut: body.statut || 'Actif',
  }
  db.contrats_clients.push(c)
  db.echeances.push(...genererEcheances(c, newId))
  return contratView(c)
})
route('put', '/api/contrats/clients/:id', ({ id, body }) => {
  const c = byId(db.contrats_clients, id) || notFound()
  const avant = `${c.date_debut}|${c.date_fin}|${c.quantite_mensuelle}|${c.prix_unitaire}`
  Object.assign(c, pickFields(body, CONTRAT_FIELDS))
  if (body.produits?.length) c.produit = body.produits[0]
  if (`${c.date_debut}|${c.date_fin}|${c.quantite_mensuelle}|${c.prix_unitaire}` !== avant) {
    // Régénère uniquement les échéances non encore payées
    const payees = db.echeances.filter((e) => e.contrat_id === id && e.statut_paiement === 'Paye')
    const cles = new Set(payees.map((e) => `${e.annee}-${e.mois}`))
    db.echeances = db.echeances.filter((e) => e.contrat_id !== id || e.statut_paiement === 'Paye')
    db.echeances.push(...genererEcheances(c, newId).filter((e) => !cles.has(`${e.annee}-${e.mois}`)))
  }
  return contratView(c)
})
route('delete', '/api/contrats/clients/:id', ({ id }) => {
  db.contrats_clients = db.contrats_clients.filter((c) => c.id !== id)
  db.echeances = db.echeances.filter((e) => e.contrat_id !== id)
  return { ok: true }
})
route('get', '/api/contrats/clients/:id/echeances', ({ id }) => db.echeances
  .filter((e) => e.contrat_id === id)
  .sort((a, b) => a.annee - b.annee || a.mois - b.mois)
  .map(echeanceView))
route('put', '/api/contrats/clients/:id/echeances/:eid', ({ eid, body }) => {
  const e = byId(db.echeances, eid) || notFound()
  e.quantite = Number(body.quantite) || 0
  e.prix_unitaire = Number(body.prix_unitaire) || 0
  e.montant = e.quantite * e.prix_unitaire
  if (body.date_paiement_prevue) e.date_paiement_prevue = body.date_paiement_prevue
  return echeanceView(e)
})
route('get', '/api/contrats/echeances', ({ params }) => {
  // Seules les échéances déjà exigibles (mois en cours ou passés) comptent comme créances
  const limite = isoDate(addDays(today(), 35))
  return db.echeances
    .filter((e) => (!params.statut || e.statut_paiement === params.statut) && e.date_paiement_prevue <= limite)
    .map(echeanceView)
})

// Contrats paddy
const PADDY_FIELDS = ['producteur_nom', 'zone', 'telephone', 'variete', 'quantite_kg', 'prix_kg', 'date_debut', 'date_fin', 'statut', 'note']
route('get', '/api/contrats/paddy', () => [...db.contrats_paddy].sort((a, b) => String(b.date_debut).localeCompare(String(a.date_debut))))
route('post', '/api/contrats/paddy', ({ body }) => {
  if (!body.producteur_nom) fail(400, 'Le nom du producteur est requis')
  const year = String(body.date_debut || todayIso()).slice(0, 4)
  const p = { id: newId(), numero: `CP-${year}-${String(db.contrats_paddy.length + 1).padStart(3, '0')}`, statut: 'Actif', ...pickFields(body, PADDY_FIELDS) }
  db.contrats_paddy.push(p)
  return p
})
route('put', '/api/contrats/paddy/:id', ({ id, body }) => Object.assign(byId(db.contrats_paddy, id) || notFound(), pickFields(body, PADDY_FIELDS)))
route('delete', '/api/contrats/paddy/:id', ({ id }) => { db.contrats_paddy = db.contrats_paddy.filter((p) => p.id !== id); return { ok: true } })

// Dépôts-vente
const DEPOT_FIELDS = ['produit', 'quantite_deposee', 'prix_unitaire', 'date_depot', 'note']
route('get', '/api/depots', () => db.depots.map(depotView).sort((a, b) => b.date_depot.localeCompare(a.date_depot)))
route('get', '/api/depots/:id', ({ id }) => {
  const d = byId(db.depots, id) || notFound()
  return { ...depotView(d), mouvements: db.mouvements.filter((m) => m.depot_id === id).sort((a, b) => b.date.localeCompare(a.date)) }
})
route('post', '/api/depots', ({ body }) => {
  if (!(Number(body.quantite_deposee) > 0)) fail(400, 'La quantité déposée doit être positive')
  const client = clientPourNom(body.client_nom, DEMO_USER.id)
  const date = body.date_depot || todayIso()
  const d = {
    id: newId(), numero: `DV-${date.slice(0, 4)}-${String(db.depots.length + 1).padStart(3, '0')}`,
    client_id: client.id, client_nom: client.nom, vendeur_id: client.vendeur_id || DEMO_USER.id,
    ...pickFields(body, DEPOT_FIELDS), date_depot: date,
  }
  db.depots.push(d)
  return depotView(d)
})
route('put', '/api/depots/:id', ({ id, body }) => {
  const d = byId(db.depots, id) || notFound()
  Object.assign(d, pickFields(body, DEPOT_FIELDS))
  if (body.client_nom && body.client_nom !== d.client_nom) {
    const c = clientPourNom(body.client_nom, d.vendeur_id)
    d.client_id = c.id; d.client_nom = c.nom
  }
  return depotView(d)
})
route('post', '/api/depots/:id/mouvements', ({ id, body }) => {
  const d = depotView(byId(db.depots, id) || notFound())
  const q = Number(body.quantite)
  if (!(q > 0)) fail(400, 'La quantité doit être positive')
  if (q > d.solde_restant) fail(400, `Quantité supérieure au stock restant chez le distributeur (${d.solde_restant} kg)`)
  db.mouvements.push({ id: newId(), depot_id: id, type: body.type === 'retour' ? 'retour' : 'vente', quantite: q, date: body.date || todayIso(), note: body.note || '' })
  return { ok: true }
})
route('delete', '/api/depots/:id', ({ id }) => {
  db.depots = db.depots.filter((d) => d.id !== id)
  db.mouvements = db.mouvements.filter((m) => m.depot_id !== id)
  return { ok: true }
})

// Équipe & managers
route('get', '/api/equipe', () => db.users.map(equipeView))
route('get', '/api/managers', () => managersView())
route('put', '/api/equipe/:id', ({ id, body }) => Object.assign(byId(db.users, id) || notFound(), pickFields(body, ['nom', 'email', 'telephone'])))
route('patch', '/api/equipe/:id/password', ({ body }) => {
  if (!body.new_password || body.new_password.length < 12) fail(400, 'Le mot de passe doit contenir au moins 12 caractères')
  return { ok: true }
})
route('patch', '/api/equipe/:id/force-password-change', ({ id }) => { (byId(db.users, id) || notFound()).must_change_password = true; return { ok: true } })
route('patch', '/api/equipe/:id/manager', ({ id, body }) => { (byId(db.users, id) || notFound()).parent_id = body.manager_id; return { ok: true } })
route('patch', '/api/equipe/:id/role', ({ id, body }) => {
  const u = byId(db.users, id) || notFound()
  u.role = body.role
  if (body.role === 'manager') u.parent_id = null
  return { ok: true }
})
route('delete', '/api/equipe/:id', ({ id }) => {
  db.users.forEach((u) => { if (u.parent_id === id) u.parent_id = null })
  db.users = db.users.filter((u) => u.id !== id)
  db.emplois.forEach((e) => { if (e.user_account_id === id) { e.user_account_id = null; e.role_plateforme = null } })
  return { ok: true }
})

// RH
const EMPLOI_FIELDS = ['nom', 'poste', 'type_contrat', 'date_embauche', 'salaire', 'telephone', 'note', 'periode_rizao', 'date_naissance', 'lieu_naissance', 'sexe', 'nationalite', 'piece_identite_type', 'piece_identite_numero', 'adresse']
route('get', '/api/emplois', () => [...db.emplois].sort((a, b) => a.nom.localeCompare(b.nom)))
route('post', '/api/emplois', ({ body }) => {
  if (!body.nom) fail(400, 'Le nom est requis')
  const e = { id: newId(), user_account_id: null, role_plateforme: null, compte_suspendu: false, ...pickFields(body, EMPLOI_FIELDS) }
  db.emplois.push(e)
  return e
})
route('put', '/api/emplois/:id', ({ id, body }) => Object.assign(byId(db.emplois, id) || notFound(), pickFields(body, EMPLOI_FIELDS)))
route('delete', '/api/emplois/:id', ({ id }) => { db.emplois = db.emplois.filter((e) => e.id !== id); return { ok: true } })
route('patch', '/api/emplois/:id/affecter', ({ id, body }) => {
  const e = byId(db.emplois, id) || notFound()
  if (e.user_account_id) fail(400, 'Cet employé a déjà un compte sur la plateforme')
  if (!body.email && !body.telephone) fail(400, 'Un email ou un téléphone est requis')
  if (!body.password || body.password.length < 12) fail(400, 'Le mot de passe doit contenir au moins 12 caractères')
  const u = {
    id: `u-${newId().slice(0, 8)}`, nom: e.nom, role: body.role_plateforme || 'vendeur', parent_id: null, zone: '',
    email: body.email || '', telephone: body.telephone || e.telephone, objectif_annuel: Number(body.objectif_annuel) || 0, must_change_password: true,
  }
  // Un comptable n'a pas d'objectif commercial et n'apparaît pas dans l'équipe de vente
  if (u.role !== 'comptable') db.users.push(u)
  e.user_account_id = u.id
  e.role_plateforme = u.role
  return { ok: true }
})

// Activités
route('get', '/api/activites', () => [...db.activites]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((a) => ({ ...a, vendeur_nom: userNom(a.vendeur_id) })))
route('post', '/api/activites', ({ body }) => {
  const a = { id: newId(), vendeur_id: DEMO_USER.id, ...pickFields(body, ['date', 'type', 'cible', 'resultat', 'note']) }
  db.activites.push(a)
  return a
})

// Planning semaine
route('get', '/api/pilotage/:semaine', ({ semaine }) => db.pilotage[semaine] || [])
route('put', '/api/pilotage/:semaine', ({ semaine, body }) => { db.pilotage[semaine] = body.jours || []; return { ok: true } })
route('get', '/api/pilotage/:semaine/actions', ({ semaine }) => ({ contenu: db.pilotage_actions[semaine] || '' }))
route('put', '/api/pilotage/:semaine/actions', ({ semaine, body }) => { db.pilotage_actions[semaine] = body.contenu || ''; return { ok: true } })
route('get', '/api/pilotage/:semaine/visites', ({ semaine }) => db.visites.filter((v) => v.semaine === semaine).map((v) => {
  const c = v.client_id ? db.clients.find((x) => x.id === v.client_id) : null
  const p = v.prospect_id ? db.prospects.find((x) => x.id === v.prospect_id) : null
  const cv = c ? clientView(c) : null
  return {
    ...v,
    client_nom: cv?.nom ?? null, client_statut: cv?.statut ?? null, client_zone: cv?.zone ?? null,
    client_telephone: cv?.telephone ?? null, client_type: cv?.type ?? null,
    client_ca_total: cv?.ca_total ?? null, client_derniere_vente: cv?.derniere_vente ?? null,
    prospect_nom: p?.nom ?? null, prospect_statut: p?.statut ?? null, prospect_zone: p?.zone ?? null,
    prospect_telephone: p?.telephone ?? null, prospect_valeur_estimee: p?.valeur_estimee ?? null, prospect_priorite: p?.priorite ?? null,
  }
}))
route('post', '/api/pilotage/:semaine/visites', ({ semaine, body }) => {
  const v = { id: newId(), semaine, jour: body.jour, client_id: body.client_id || null, prospect_id: body.prospect_id || null, commentaire: body.commentaire || '' }
  db.visites.push(v)
  return v
})
route('put', '/api/pilotage/visites/:id', ({ id, body }) => { (byId(db.visites, id) || notFound()).commentaire = body.commentaire || ''; return { ok: true } })
route('delete', '/api/pilotage/visites/:id', ({ id }) => { db.visites = db.visites.filter((v) => v.id !== id); return { ok: true } })

// ── Adaptateur axios ────────────────────────────────────────
function parseBody(data) {
  if (!data) return {}
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return {} } }
  return data
}

export default async function demoAdapter(config) {
  loadDb()
  const method = (config.method || 'get').toLowerCase()
  const path = String(config.url || '').replace(/^https?:\/\/[^/]+/, '').split('?')[0]
  const params = { ...Object.fromEntries(new URLSearchParams(String(config.url || '').split('?')[1] || '')), ...(config.params || {}) }
  const body = parseBody(config.data)

  // Petite latence pour que les indicateurs de chargement restent visibles, comme en vrai
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180))

  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} })
  try {
    if (path.startsWith('/api/admin') || path.startsWith('/api/comptabilite')) {
      fail(403, 'Fonction réservée à l’administration PFS : non disponible en mode démo')
    }
    for (const r of routes) {
      if (r.method !== method) continue
      const m = path.match(r.re)
      if (!m) continue
      const named = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]))
      const data = r.handler({ ...named, params, body })
      if (method !== 'get') saveDb()
      return respond(method === 'post' ? 201 : 200, JSON.parse(JSON.stringify(data ?? { ok: true })))
    }
    fail(404, `Endpoint non simulé en mode démo : ${method.toUpperCase()} ${path}`)
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    const data = err instanceof HttpError ? err.data : { error: err.message || 'Erreur interne du mode démo' }
    if (!(err instanceof HttpError)) console.error('[demo]', err)
    throw new AxiosError(data.error, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, respond(status, data))
  }
}
