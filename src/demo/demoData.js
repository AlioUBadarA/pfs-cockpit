// Génère le jeu de données fictif du compte démo.
// Tout est calculé relativement à la date du jour pour que la démo reste "vivante"
// (ventes d'aujourd'hui, créances en retard, échéances à venir...). Le générateur
// aléatoire est seedé : deux réinitialisations produisent exactement les mêmes données.

export const DEMO_USER = {
  id: 'demo-rizier',
  nom: 'Compte Démo',
  email: 'demo@cockpit-pfs.test',
  telephone: '+221 77 000 00 00',
  role: 'rizier',
  rizerie: 'Rizerie Démo du Fleuve',
  ville: 'Richard-Toll',
  pays: 'Sénégal',
  must_change_password: false,
}

// ── Utilitaires ──────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad2 = (n) => String(n).padStart(2, '0')
export const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
export const parseDate = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const todayDate = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }

let uidCounter = 0
export function uid(rand = Math.random) {
  const hex = () => Math.floor(rand() * 16).toString(16)
  uidCounter += 1
  const s = Array.from({ length: 28 }, hex).join('') + (uidCounter % 65536).toString(16).padStart(4, '0')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}

export const DELAIS_PAIEMENT = {
  'Comptant': 0, 'J+15': 15, 'J+30': 30, 'J+45': 45, 'J+60': 60, 'J+90': 90,
  '50% comptant / 50% J+15': 15, '50% comptant / 50% J+30': 30,
}

// ── Référentiels ─────────────────────────────────────────────
const PRODUITS = [
  { ref: 'RIZ-BR25',  nom: 'Riz blanc brisé 25%',  prix_kg: 350, cout_kg: 280, tendance: 'stable' },
  { ref: 'RIZ-BL5',   nom: 'Riz blanc entier 5%',  prix_kg: 450, cout_kg: 340, tendance: 'hausse' },
  { ref: 'RIZ-PARF',  nom: 'Riz parfumé local',    prix_kg: 550, cout_kg: 400, tendance: 'hausse' },
  { ref: 'RIZ-BR100', nom: 'Riz brisé 100%',       prix_kg: 300, cout_kg: 262, tendance: 'déclin' },
  { ref: 'RIZ-ETU',   nom: 'Riz étuvé',            prix_kg: 480, cout_kg: 360, tendance: 'stable' },
  { ref: 'SON-RIZ',   nom: 'Son de riz (bétail)',  prix_kg: 90,  cout_kg: 45,  tendance: 'stable' },
]

// [id, nom, role, parent, zone, email, téléphone, taux d'atteinte visé]
const EQUIPE = [
  ['u-mgr-fatou',   'Fatou Ndiaye',   'manager', null,            'Dakar',       'fatou.ndiaye',   '77 210 45 12', 0.95],
  ['u-mgr-ibra',    'Ibrahima Sow',   'manager', null,            'Nord',        'ibrahima.sow',   '77 318 22 90', 1.05],
  ['u-vd-moussa',   'Moussa Diop',    'vendeur', 'u-mgr-fatou',   'Dakar',       'moussa.diop',    '78 455 10 21', 1.12],
  ['u-vd-awa',      'Awa Fall',       'vendeur', 'u-mgr-fatou',   'Thiès',       'awa.fall',       '76 120 33 47', 0.92],
  ['u-vd-cheikh',   'Cheikh Sarr',    'vendeur', 'u-mgr-ibra',    'Saint-Louis', 'cheikh.sarr',    '77 640 81 05', 0.86],
  ['u-vd-mariama',  'Mariama Ba',     'vendeur', 'u-mgr-ibra',    'Louga',       'mariama.ba',     '70 902 14 66', 0.64],
  ['u-vd-ousmane',  'Ousmane Kane',   'vendeur', null,            'Kaolack',     'ousmane.kane',   '78 233 70 19', 0.74],
]

// [nom, type, segment, région, zone, vendeur, potentiel annuel, cmd/mois, kg/cmd, inactif depuis (j), produits préférés, conditions]
const CLIENTS = [
  ['Grossiste Touba Commerce',      'Grossiste',           'Grand compte', 'Diourbel',    'Touba Marché Ocass',  'u-vd-awa',     60e6, 2.2, 9000, 0,   [0, 3, 0, 1], 'J+30'],
  ['Ets Diallo & Frères',           'Grossiste',           'Grand compte', 'Dakar',       'Marché Tilène',       'u-vd-moussa',  55e6, 2.5, 7500, 0,   [0, 1, 0, 4], 'J+30'],
  ['Comptoir Commercial du Fleuve', 'Grossiste',           'Grand compte', 'Saint-Louis', 'Sor',                 'u-vd-cheikh',  48e6, 2.0, 7000, 0,   [0, 1, 4, 5], 'J+45'],
  ['Sénégal Distribution SARL',     'Grossiste',           'Grand compte', 'Dakar',       'Zone industrielle',   'u-mgr-fatou',  45e6, 1.4, 8000, 0,   [1, 2, 0], 'J+30'],
  ['Kaolack Céréales',              'Grossiste',           'Grand compte', 'Kaolack',     'Marché central',      'u-vd-ousmane', 35e6, 1.6, 6000, 5,   [0, 3], 'J+30'],
  ['Grossiste Ndiaye Louga',        'Grossiste',           'Grand compte', 'Louga',       'Marché Louga',        'u-vd-mariama', 30e6, 1.0, 5000, 75,  [0, 3], 'J+30'],
  ['Marché Castors - Mme Sy',       'Detaillant marche',   'PME',          'Dakar',       'Castors',             'u-vd-moussa',  9e6,  3.2, 900,  0,   [0, 1, 2], 'Comptant'],
  ['Marché Sandaga - Pape Gaye',    'Detaillant marche',   'PME',          'Dakar',       'Sandaga',             'u-vd-moussa',  8e6,  2.8, 800,  2,   [0, 3], 'J+15'],
  ['Marché Thiès - Aïda Mbengue',   'Detaillant marche',   'PME',          'Thiès',       'Marché central',      'u-vd-awa',     7e6,  2.4, 700,  0,   [0, 1], 'Comptant'],
  ['Marché Sor - Daouda Faye',      'Detaillant marche',   'PME',          'Saint-Louis', 'Sor',                 'u-vd-cheikh',  6e6,  2.0, 650,  10,  [0, 4], 'J+15'],
  ['Marché Kaolack - Binta Cissé',  'Detaillant marche',   'PME',          'Kaolack',     'Guedj',               'u-vd-ousmane', 5e6,  1.5, 600,  130, [0, 3], 'Comptant'],
  ['Boutique Keur Serigne',         'Boutique',            'Proximité',    'Dakar',       'Médina',              'u-vd-moussa',  4e6,  3.0, 250,  1,   [2, 1], 'Comptant'],
  ['Supérette Sacré-Cœur',          'Boutique',            'Proximité',    'Dakar',       'Sacré-Cœur 3',        'u-mgr-fatou',  4.5e6, 2.6, 300, 4,   [2, 1, 4], 'J+15'],
  ['Boutique Chez Aliou',           'Boutique',            'Proximité',    'Thiès',       'Randoulène',          'u-vd-awa',     2.5e6, 2.2, 200, 25,  [0, 1], 'Comptant'],
  ['Épicerie Mbour Plage',          'Boutique',            'Proximité',    'Thiès',       'Mbour',               'u-vd-awa',     3e6,  1.8, 220,  45,  [2, 0], 'Comptant'],
  ['Boutique Louga Centre',         'Boutique',            'Proximité',    'Louga',       'Centre-ville',        'u-vd-mariama', 2e6,  1.2, 180,  95,  [0], 'Comptant'],
  ['Mini-market Darou Salam',       'Boutique',            'Proximité',    'Saint-Louis', 'Darou',               'u-vd-cheikh',  2.2e6, 2.0, 180, 3,   [0, 1, 2], 'Comptant'],
  ['Restaurant Le Lagon',           'Restauration',        'CHR',          'Dakar',       'Plateau',             'u-vd-moussa',  6e6,  2.0, 300,  12,  [2, 1], 'J+15'],
  ['Hôtel Teranga Restauration',    'Restauration',        'CHR',          'Dakar',       'Plateau',             'u-mgr-fatou',  12e6, 1.2, 600,  20,  [2], 'J+30'],
  ['Dibiterie Chez Fatim',          'Restauration',        'CHR',          'Thiès',       'Grand Thiès',         'u-vd-awa',     2e6,  1.6, 150,  65,  [0], 'Comptant'],
  ['Restaurant La Linguère',        'Restauration',        'CHR',          'Saint-Louis', 'Île de Saint-Louis',  'u-mgr-ibra',   4e6,  1.5, 220,  8,   [2, 4], 'J+15'],
  ['Cantine Université Gaston Berger', 'Cantine/Institution', 'Institution', 'Saint-Louis', 'Sanar',             'u-mgr-ibra',   40e6, 0.5, 4000, 30,  [0], 'J+60'],
  ['Groupe scolaire Les Pédagogues', 'Cantine/Institution', 'Institution', 'Dakar',       'Liberté 6',           'u-vd-moussa',  10e6, 0.4, 1500, 50,  [0, 4], 'J+45'],
  ['Hôpital régional de Louga',     'Cantine/Institution', 'Institution', 'Louga',       'Louga',               'u-vd-mariama', 15e6, 0.8, 2000, 140, [0, 4], 'J+60'],
  ['Ferme avicole de Sangalkam',    'Grossiste',           'Agro',         'Dakar',       'Sangalkam',           'u-vd-ousmane', 6e6,  1.0, 5000, 15,  [5], 'J+15'],
  ['Élevage Ndiambour',             'Grossiste',           'Agro',         'Louga',       'Ndiambour',           'u-vd-mariama', 4e6,  0.8, 4000, 35,  [5], 'Comptant'],
]

const PROSPECTS = [
  ['Auchan Sénégal - centrale achats', 'Grossiste',          'Dakar',       'Almadies',     'Réseau',          'Négociation', 'Haute',   90e6, 'u-mgr-fatou',  'Test qualité validé, discussion sur les volumes mensuels.'],
  ['Carrefour Market Sea Plaza',       'Boutique',           'Dakar',       'Corniche',     'Recommandation',  'Proposition', 'Haute',   35e6, 'u-vd-moussa',  'Proposition tarifaire envoyée pour le riz parfumé.'],
  ['Armée - Intendance Thiès',         'Cantine/Institution','Thiès',       'Thiès',        'Appel entrant',   'Qualifié',    'Haute',   70e6, 'u-vd-awa',     'Appel d’offres prévu au prochain trimestre.'],
  ['Restaurant Chez Loutcha',          'Restauration',       'Dakar',       'Médina',       'Visite terrain',  'Négociation', 'Normale', 5e6,  'u-vd-moussa',  'Souhaite J+30, à valider par la direction.'],
  ['Grossiste Ziguinchor Import',      'Grossiste',          'Ziguinchor',  'Boucotte',     'Marché',          'Nouveau',     'Normale', 25e6, 'u-vd-ousmane', ''],
  ['Lycée Ameth Fall',                 'Cantine/Institution','Saint-Louis', 'Saint-Louis',  'Réseau',          'Proposition', 'Normale', 12e6, 'u-vd-cheikh',  'Échantillons livrés.'],
  ['Boutique Keur Massar',             'Boutique',           'Dakar',       'Keur Massar',  'Visite terrain',  'Nouveau',     'Basse',   1.5e6, 'u-vd-moussa', ''],
  ['Marché Kaolack - Aliou Ndao',      'Detaillant marche',  'Kaolack',     'Médina Baye',  'Marché',          'Qualifié',    'Normale', 4e6,  'u-vd-ousmane', 'Achète actuellement du riz importé.'],
  ['Hôtel Royal Saly',                 'Restauration',       'Thiès',       'Saly',         'Recommandation',  'Gagné',       'Haute',   9e6,  'u-vd-awa',     'Premier contrat signé.'],
  ['Supermarché Thiès Ville',          'Boutique',           'Thiès',       'Thiès',        'Visite terrain',  'Perdu',       'Normale', 6e6,  'u-vd-awa',     'A choisi un fournisseur importateur moins cher.'],
  ['Coopérative d’éleveurs Linguère',  'Grossiste',          'Louga',       'Linguère',     'Autre',           'Qualifié',    'Basse',   3e6,  'u-vd-mariama', 'Intéressée par le son de riz.'],
  ['Cantine EPT Thiès',                'Cantine/Institution','Thiès',       'Thiès',        'Appel entrant',   'Gagné',       'Normale', 8e6,  'u-mgr-fatou',  ''],
  ['Grossiste Matam Négoce',           'Grossiste',          'Matam',       'Ourossogui',   'Réseau',          'Perdu',       'Normale', 15e6, 'u-mgr-ibra',   'Trop éloigné pour les livraisons hebdomadaires.'],
  ['Restaurant Le Ngor',               'Restauration',       'Dakar',       'Ngor',         'Visite terrain',  'Nouveau',     'Normale', 3e6,  'u-vd-moussa',  ''],
]

const EMPLOYES = [
  ['Abdoulaye Gueye',  'Chef d’usine',              'CDI',          450000, 'Avant RIZAO', 'Homme', null],
  ['Ndèye Sène',       'Comptable',                 'CDI',          350000, 'Avec RIZAO',  'Femme', null],
  ['Lamine Faye',      'Opérateur décortiqueuse',   'CDI',          180000, 'Avant RIZAO', 'Homme', null],
  ['Khady Diouf',      'Trieuse',                   'Journalier',   90000,  'Avec RIZAO',  'Femme', null],
  ['Babacar Mbaye',    'Magasinier',                'CDD',          150000, 'Avec RIZAO',  'Homme', null],
  ['Aminata Thiam',    'Assistante commerciale',    'Stage',        75000,  'Avec RIZAO',  'Femme', null],
  ['Seydou Camara',    'Chauffeur-livreur',         'CDI',          160000, 'Avec RIZAO',  'Homme', null],
  ['Fatou Ndiaye',     'Responsable commerciale Dakar', 'CDI',      400000, 'Avec RIZAO',  'Femme', 'u-mgr-fatou'],
  ['Ibrahima Sow',     'Responsable commercial Nord',   'CDI',      400000, 'Avec RIZAO',  'Homme', 'u-mgr-ibra'],
  ['Moussa Diop',      'Commercial terrain',        'CDI',          250000, 'Avec RIZAO',  'Homme', 'u-vd-moussa'],
  ['Awa Fall',         'Commerciale terrain',       'CDI',          250000, 'Avec RIZAO',  'Femme', 'u-vd-awa'],
  ['Cheikh Sarr',      'Commercial terrain',        'CDD',          220000, 'Avec RIZAO',  'Homme', 'u-vd-cheikh'],
  ['Mariama Ba',       'Commerciale terrain',       'CDD',          220000, 'Avec RIZAO',  'Femme', 'u-vd-mariama'],
  ['Ousmane Kane',     'Commercial terrain',        'Temps partiel', 150000, 'Avec RIZAO', 'Homme', 'u-vd-ousmane'],
]

const MODES_PAR_TYPE = {
  'Grossiste':           ['Virement', 'Virement', 'Chèque', 'Espèces'],
  'Detaillant marche':   ['Espèces', 'Espèces', 'Mobile Money'],
  'Boutique':            ['Mobile Money', 'Espèces', 'Mobile Money'],
  'Restauration':        ['Mobile Money', 'Virement', 'Espèces'],
  'Cantine/Institution': ['Virement', 'Chèque'],
}

// ── Génération ───────────────────────────────────────────────
export function buildDemoDb() {
  const rand = mulberry32(20260414)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const id = () => uid(rand)
  const today = todayDate()
  const year = today.getFullYear()
  const moisEcoules = today.getMonth() + 1

  const produits = PRODUITS.map((p) => ({ id: id(), ...p }))

  const users = EQUIPE.map(([uidv, nom, role, parent_id, zone, mail, tel]) => ({
    id: uidv, nom, role, parent_id, zone,
    email: `${mail}@rizerie-demo.test`, telephone: `+221 ${tel}`,
    objectif_annuel: 0, must_change_password: false,
  }))

  const clients = CLIENTS.map(([nom, type, segment, region, zone, vendeur_id, potentiel, , , , prefs]) => ({
    id: id(), nom, type, segment, region, zone, vendeur_id,
    statut: 'Actif',
    potentiel_annuel: potentiel,
    telephone: `+221 7${pick(['7', '8', '6', '0'])} ${100 + Math.floor(rand() * 899)} ${10 + Math.floor(rand() * 89)} ${10 + Math.floor(rand() * 89)}`,
    volume_estime: Math.round(potentiel / 12 / 1e5) * 1e5,
    valorise: pick(['Prix', 'Régularité des livraisons', 'Qualité constante', 'Délais de paiement', 'Riz local']),
    horaire: pick(['Lundi 9h–11h', 'Mardi matin', 'Mercredi 15h–17h', 'Jeudi 10h', 'Vendredi après la prière', 'Samedi matin']),
    produits_interet: Array.from(new Set(prefs)).map((i) => PRODUITS[i].nom),
    created_at: isoDate(addDays(today, -420)),
  }))

  // ── Ventes et versements (14 mois d'historique) ──
  const ventes = []
  const versements = []
  const debut = new Date(year - 1, today.getMonth() - 1, 1)

  CLIENTS.forEach((row, ci) => {
    const [, type, , , , vendeur_id, , freq, kg, inactifDepuis, prefs, conditions] = row
    const client = clients[ci]
    const derniereDatePossible = addDays(today, -inactifDepuis)
    for (let m = new Date(debut); m <= today; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      const nb = Math.floor(freq + rand() * 1.2 - 0.3)
      const joursMois = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
      for (let k = 0; k < nb; k++) {
        const d = new Date(m.getFullYear(), m.getMonth(), 1 + Math.floor(rand() * joursMois))
        if (d > derniereDatePossible) continue
        const produit = PRODUITS[pick(prefs)]
        const quantite = Math.max(50, Math.round((kg * (0.6 + rand() * 0.8)) / 50) * 50)
        const prix_unitaire = Math.round((produit.prix_kg * (0.97 + rand() * 0.05)) / 5) * 5
        ventes.push({
          id: id(), date_vente: isoDate(d), client_id: client.id, client_nom: client.nom,
          produit: produit.nom, quantite, prix_unitaire, montant: quantite * prix_unitaire,
          conditions_paiement: conditions, vendeur_id,
          mode: pick(MODES_PAR_TYPE[type]),
          statut_paiement: 'En cours', nb_relances: 0, derniere_relance: null,
        })
      }
    }
  })

  // Quelques ventes du jour pour que le "Journal du jour" ne soit jamais vide
  ;[[6, 1], [11, 2], [8, 0], [1, 0]].forEach(([ci, pi]) => {
    const c = CLIENTS[ci]
    const produit = PRODUITS[c[10][pi % c[10].length]]
    const quantite = Math.round((c[8] * 0.8) / 50) * 50
    ventes.push({
      id: id(), date_vente: isoDate(today), client_id: clients[ci].id, client_nom: clients[ci].nom,
      produit: produit.nom, quantite, prix_unitaire: produit.prix_kg, montant: quantite * produit.prix_kg,
      conditions_paiement: c[11], vendeur_id: c[5], mode: pick(MODES_PAR_TYPE[c[1]]),
      statut_paiement: 'En cours', nb_relances: 0, derniere_relance: null,
    })
  })

  ventes.sort((a, b) => a.date_vente.localeCompare(b.date_vente))
  const seqParAnnee = {}
  ventes.forEach((v) => {
    const y = v.date_vente.slice(0, 4)
    seqParAnnee[y] = (seqParAnnee[y] || 0) + 1
    v.numero = `V-${y}-${String(seqParAnnee[y]).padStart(4, '0')}`
    const dv = parseDate(v.date_vente)
    const echeance = addDays(dv, DELAIS_PAIEMENT[v.conditions_paiement] ?? 30)
    v.date_echeance = isoDate(echeance)
    const retard = Math.round((today - echeance) / 86400000)
    const addVersement = (montant, date) => versements.push({
      id: id(), type: 'vente', ref_id: v.id, client_nom: v.client_nom,
      montant, mode: v.mode, date: isoDate(date > today ? today : date),
    })

    if (v.conditions_paiement === 'Comptant' && rand() < 0.93) {
      addVersement(v.montant, dv)
      v.statut_paiement = 'Paye'
    } else if (retard > 0) {
      // Échéance passée : la grande majorité est soldée, le reste part en retard
      const tauxImpaye = retard > 150 ? 0.03 : retard > 60 ? 0.12 : 0.25
      if (rand() > tauxImpaye) {
        const payeLe = addDays(echeance, Math.floor(rand() * 12) - 6)
        addVersement(v.montant, payeLe < dv ? dv : payeLe)
        v.statut_paiement = 'Paye'
      } else {
        v.statut_paiement = 'En retard'
        if (rand() < 0.5) addVersement(Math.round((v.montant * (0.2 + rand() * 0.4)) / 1000) * 1000, addDays(dv, Math.floor(rand() * 10)))
        if (rand() < 0.6) {
          v.nb_relances = 1 + Math.floor(rand() * 3)
          v.derniere_relance = isoDate(addDays(today, -Math.floor(rand() * 20)))
        }
      }
    } else {
      v.statut_paiement = 'En cours'
      if (v.conditions_paiement.startsWith('50%')) addVersement(Math.round(v.montant / 2), dv)
      else if (rand() < 0.25) addVersement(Math.round((v.montant * 0.3) / 1000) * 1000, dv)
    }
  })

  // ── Contrats clients récurrents ──
  const clientByNom = Object.fromEntries(clients.map((c) => [c.nom, c]))
  const contratsDef = [
    ['Cantine Université Gaston Berger', ['Riz blanc brisé 25%'], 8000, 340, -6, 6, 'Actif', 'Livraison le 1er lundi du mois.'],
    ['Hôtel Teranga Restauration', ['Riz parfumé local', 'Riz blanc entier 5%'], 1500, 530, -4, 8, 'Actif', ''],
    ['Groupe scolaire Les Pédagogues', ['Riz blanc brisé 25%'], 3000, 345, -7, 3, 'Suspendu', 'Suspendu pendant les vacances scolaires.'],
    ['Restaurant Le Lagon', ['Riz parfumé local'], 600, 545, -12, -1, 'Terminé', 'Contrat annuel arrivé à terme, renouvellement à négocier.'],
  ]
  const contrats_clients = []
  const echeances = []
  contratsDef.forEach(([nom, prods, qte, prix, debutM, finM, statut, note], i) => {
    const c = clientByNom[nom]
    const dDebut = new Date(year, today.getMonth() + debutM, 1)
    const dFin = new Date(year, today.getMonth() + finM + 1, 0)
    const contrat = {
      id: id(), numero: `CC-${dDebut.getFullYear()}-${String(i + 1).padStart(3, '0')}`,
      client_id: c.id, client_nom: nom, produits: prods, produit: prods[0],
      quantite_mensuelle: qte, prix_unitaire: prix,
      date_debut: isoDate(dDebut), date_fin: isoDate(dFin), statut, note,
      vendeur_id: c.vendeur_id,
    }
    contrats_clients.push(contrat)
    echeances.push(...genererEcheances(contrat, id, rand, versements, today))
  })

  // ── Contrats paddy (achats aux producteurs) ──
  const paddyDef = [
    ['GIE Bokk Jom Ross Béthio', 'Ross Béthio', 'Sahel 108', 180000, 145, -5, 4, 'Actif'],
    ['Coopérative agricole de Ndiaye', 'Ndiaye', 'Sahel 134', 120000, 150, -3, 6, 'Actif'],
    ['Union des producteurs de Podor', 'Podor', 'Sahel 177 (parfumé)', 75000, 175, -2, 7, 'Actif'],
    ['Mamadou Diallo (producteur)', 'Dagana', 'Sahel 108', 25000, 142, -10, -2, 'Terminé'],
  ]
  const contrats_paddy = paddyDef.map(([producteur_nom, zone, variete, quantite_kg, prix_kg, dm, fm, statut], i) => {
    const dDebut = new Date(year, today.getMonth() + dm, 1)
    const p = {
      id: id(), numero: `CP-${dDebut.getFullYear()}-${String(i + 1).padStart(3, '0')}`,
      producteur_nom, zone, telephone: `+221 77 ${500 + i * 37} ${20 + i * 11} ${30 + i * 7}`, variete,
      quantite_kg, prix_kg,
      date_debut: isoDate(dDebut), date_fin: isoDate(new Date(year, today.getMonth() + fm + 1, 0)),
      statut, note: statut === 'Terminé' ? 'Campagne précédente, intégralement livrée.' : 'Préfinancement des intrants inclus.',
    }
    const total = quantite_kg * prix_kg
    const part = statut === 'Terminé' ? 1 : 0.35 + i * 0.1
    versements.push({ id: id(), type: 'paddy', ref_id: p.id, client_nom: producteur_nom, montant: Math.round((total * part) / 1000) * 1000, mode: 'Virement', date: isoDate(addDays(dDebut, 20)) })
    return p
  })

  // ── Dépôts-vente ──
  const depotsDef = [
    ['Boutique Keur Serigne', 'Riz parfumé local', 2000, 550, -40, [[-30, 'vente', 500], [-18, 'vente', 400], [-5, 'vente', 300]], 330000],
    ['Supérette Sacré-Cœur', 'Riz blanc entier 5%', 1000, 450, -25, [[-12, 'vente', 350], [-3, 'vente', 250]], 0],
    ['Épicerie Mbour Plage', 'Riz parfumé local', 800, 545, -90, [[-70, 'vente', 300], [-50, 'vente', 400], [-40, 'retour', 100]], 381500],
  ]
  const depots = []
  const mouvements = []
  depotsDef.forEach(([nom, produit, qte, prix, dj, movs, verse], i) => {
    const c = clientByNom[nom]
    const dDepot = addDays(today, dj)
    const dep = {
      id: id(), numero: `DV-${dDepot.getFullYear()}-${String(i + 1).padStart(3, '0')}`,
      client_id: c.id, client_nom: nom, produit, quantite_deposee: qte, prix_unitaire: prix,
      date_depot: isoDate(dDepot), note: '', vendeur_id: c.vendeur_id,
    }
    depots.push(dep)
    movs.forEach(([j, type, q]) => mouvements.push({ id: id(), depot_id: dep.id, type, quantite: q, date: isoDate(addDays(today, j)), note: type === 'retour' ? 'Sacs abîmés repris' : 'Rapport hebdomadaire' }))
    if (verse) versements.push({ id: id(), type: 'depot', ref_id: dep.id, client_nom: nom, montant: verse, mode: 'Mobile Money', date: isoDate(addDays(today, -2 - i)) })
  })

  // ── Prospects ──
  const prospects = PROSPECTS.map(([nom, type_client, region, zone, source, statut, priorite, valeur_estimee, vendeur_id, note]) => ({
    id: id(), nom, type_client, region, zone, source, statut, priorite, valeur_estimee, vendeur_id, note,
    telephone: `+221 7${pick(['7', '8', '6'])} ${100 + Math.floor(rand() * 899)} ${10 + Math.floor(rand() * 89)} ${10 + Math.floor(rand() * 89)}`,
    date_contact: isoDate(addDays(today, -Math.floor(rand() * 40))),
    created_at: isoDate(addDays(today, -Math.floor(40 + rand() * 200))),
  }))

  // ── Employés (RH) ──
  const emplois = EMPLOYES.map(([nom, poste, type_contrat, salaire, periode_rizao, sexe, compte]) => ({
    id: id(), nom, poste, type_contrat, salaire, periode_rizao, sexe,
    date_embauche: isoDate(addDays(today, -Math.floor(periode_rizao === 'Avant RIZAO' ? 900 + rand() * 1500 : 60 + rand() * 600))),
    telephone: compte ? users.find((u) => u.id === compte).telephone : `+221 77 ${300 + Math.floor(rand() * 600)} ${10 + Math.floor(rand() * 89)} ${10 + Math.floor(rand() * 89)}`,
    note: '', nationalite: 'Sénégalaise', lieu_naissance: pick(['Saint-Louis', 'Dakar', 'Richard-Toll', 'Podor', 'Thiès']),
    date_naissance: isoDate(new Date(1975 + Math.floor(rand() * 25), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))),
    piece_identite_type: 'CNI', piece_identite_numero: `1${Math.floor(1e11 + rand() * 9e11)}`, adresse: '',
    user_account_id: compte, role_plateforme: compte ? users.find((u) => u.id === compte).role : null, compte_suspendu: false,
  }))

  // ── Activités terrain (12 dernières semaines) ──
  const TYPES_ACT = ['Visite client', 'Visite client', 'Appel', 'Appel', 'Relance', 'Réunion', 'Démonstration', 'Négociation', 'Contrat signé']
  const activites = []
  const cibles = [...clients.map((c) => [c.nom, c.vendeur_id]), ...prospects.map((p) => [p.nom, p.vendeur_id])]
  for (let i = 0; i < 90; i++) {
    const [cible, vendeur_id] = pick(cibles)
    const type = pick(TYPES_ACT)
    activites.push({
      id: id(), date: isoDate(addDays(today, -Math.floor(rand() * 84))), type, cible, vendeur_id,
      resultat: type === 'Contrat signé' ? 'Positif' : pick(['Positif', 'Positif', 'Neutre', 'Neutre', 'Négatif']),
      note: '',
    })
  }

  // ── Objectifs : calés pour que chaque commercial ait un taux d'atteinte différent ──
  const caYtd = {}
  ventes.forEach((v) => { if (v.date_vente.startsWith(String(year))) caYtd[v.vendeur_id] = (caYtd[v.vendeur_id] || 0) + v.montant })
  EQUIPE.forEach(([uidv, , , , , , , taux]) => {
    const u = users.find((x) => x.id === uidv)
    const annualise = ((caYtd[uidv] || 0) / moisEcoules) * 12
    u.objectif_annuel = Math.max(1e6, Math.round(annualise / taux / 1e6) * 1e6)
  })
  const objectifTotal = users.reduce((s, u) => s + u.objectif_annuel, 0)
  const SAISON = [0.9, 0.85, 0.95, 1.05, 1.1, 1.0, 0.9, 0.85, 0.95, 1.1, 1.15, 1.2]
  const saisonTotal = SAISON.reduce((a, b) => a + b, 0)
  const objectifs = {}
  ;[year - 1, year].forEach((y) => {
    SAISON.forEach((f, i) => { objectifs[`${y}-${i + 1}`] = Math.round((objectifTotal * f) / saisonTotal / 1e5) * 1e5 })
  })

  // ── Planning de la semaine en cours ──
  const pilotage = {}
  const pilotage_actions = {}
  const visites = []

  return {
    version: 1,
    produits, users, clients, ventes, versements, prospects,
    contrats_clients, echeances, contrats_paddy, depots, mouvements,
    emplois, activites, objectifs, pilotage, pilotage_actions, visites,
    alertes_traitees: {},
  }
}

// Échéancier mensuel d'un contrat client : une ligne par mois couvert, paiement prévu le 5 du mois suivant.
export function genererEcheances(contrat, id, rand, versements, today = todayDate()) {
  const out = []
  const debut = parseDate(contrat.date_debut)
  const fin = contrat.date_fin ? parseDate(contrat.date_fin) : new Date(debut.getFullYear() + 1, debut.getMonth(), 0)
  for (let m = new Date(debut.getFullYear(), debut.getMonth(), 1); m <= fin; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const prevue = new Date(m.getFullYear(), m.getMonth() + 1, 5)
    const e = {
      id: id(), contrat_id: contrat.id,
      mois: m.getMonth() + 1, annee: m.getFullYear(),
      quantite: contrat.quantite_mensuelle, prix_unitaire: contrat.prix_unitaire,
      montant: contrat.quantite_mensuelle * contrat.prix_unitaire,
      date_paiement_prevue: isoDate(prevue), statut_paiement: 'En cours',
    }
    if (versements && rand && prevue < today) {
      const retard = Math.round((today - prevue) / 86400000)
      if (contrat.statut === 'Suspendu' && retard < 60) {
        e.statut_paiement = 'En retard'
      } else if (retard > 25 || rand() < 0.5) {
        const payeLe = addDays(prevue, Math.floor(rand() * 8))
        versements.push({ id: id(), type: 'echeance', ref_id: e.id, client_nom: contrat.client_nom, montant: e.montant, mode: 'Virement', date: isoDate(payeLe > today ? today : payeLe) })
        e.statut_paiement = 'Paye'
      } else {
        e.statut_paiement = 'En retard'
      }
    }
    out.push(e)
  }
  return out
}
