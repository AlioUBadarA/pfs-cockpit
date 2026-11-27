// Champs facultatifs tirés de la formation commerciale PFS (cohorte 3). Même liste que
// l'API (gcr/utils/champsFormation.js). Chaque groupe a un titre et ses champs.

export const TRANSPORT = ['Vendeur', 'Acheteur', 'Partagé']
const MODES = ['Espèces', 'Mobile Money', 'Virement', 'Chèque']

export const GROUPES = {
  produits: {
    titre: 'Fiche produit chiffrée (facultatif)',
    aide: 'Jamais d\'adjectif sans chiffre. Ces chiffres s\'affichent sur les documents.',
    champs: [
      { cle: 'variete', libelle: 'Variété', exemple: 'Sahel 108' },
      { cle: 'brisure_pct', libelle: 'Brisure (%)', type: 'nombre', exemple: '5' },
      { cle: 'humidite_pct', libelle: 'Humidité (%)', type: 'nombre', exemple: '11' },
      { cle: 'proprete', libelle: 'Propreté', exemple: '100 %, sans cailloux' },
      { cle: 'poids_sac_kg', libelle: 'Poids du sac (kg)', type: 'nombre', exemple: '50' },
    ],
  },
  ventes: {
    titre: 'Livraison (facultatif)',
    champs: [
      { cle: 'livraison_date', libelle: 'Date de livraison', type: 'date' },
      { cle: 'livraison_heure', libelle: 'Heure', exemple: 'avant 10 h' },
      { cle: 'livraison_lieu', libelle: 'Lieu de livraison', exemple: 'Boutique, marché Colobane' },
      { cle: 'transport_charge', libelle: 'Transport payé par', type: 'choix', liste: TRANSPORT },
    ],
  },
  contrats_clients: {
    titre: 'Les 6 éléments de l\'accord (facultatif)',
    aide: 'Parties, produit, quantité et fréquence, prix, livraison, paiement.',
    champs: [
      { cle: 'frequence_livraison', libelle: 'Fréquence de livraison', exemple: '10 sacs chaque vendredi' },
      { cle: 'clause_revision_pct', libelle: 'Prix révisé si le paddy varie de plus de (%)', type: 'nombre', exemple: '10' },
      { cle: 'livraison_lieu', libelle: 'Lieu de livraison' },
      { cle: 'livraison_moment', libelle: 'Jour et heure de livraison', exemple: 'vendredi avant 9 h' },
      { cle: 'transport_charge', libelle: 'Transport payé par', type: 'choix', liste: TRANSPORT },
      { cle: 'paiement_mode', libelle: 'Mode de paiement', type: 'choix', liste: MODES },
      { cle: 'paiement_delai', libelle: 'Date ou délai de paiement', exemple: '15 jours après livraison' },
      { cle: 'penalite_retard', libelle: 'Pénalité de retard', exemple: '2 % par semaine de retard' },
    ],
  },
  contrats_paddy: {
    titre: 'Les 5 éléments du contrat de paddy (facultatif)',
    aide: 'Parties, qualité, volume, prix, calendrier et paiement.',
    champs: [
      { cle: 'humidite_max_pct', libelle: 'Humidité maximale (%)', type: 'nombre', exemple: '14' },
      { cle: 'corps_etrangers_max_pct', libelle: 'Corps étrangers maximum (%)', type: 'nombre', exemple: '1' },
      { cle: 'controle_qualite', libelle: 'Qui contrôle et comment', exemple: 'Test humidimètre à la remise' },
      { cle: 'tolerance_pct', libelle: 'Tolérance sur le volume (%)', type: 'nombre', exemple: '5' },
      { cle: 'type_prix', libelle: 'Type de prix', type: 'choix', liste: ['Fixe', 'Indexé sur le marché', 'Plancher garanti'] },
      { cle: 'acompte_pct', libelle: 'Acompte (%)', type: 'nombre', exemple: '20' },
      { cle: 'lieu_remise', libelle: 'Lieu de remise' },
      { cle: 'transport_charge', libelle: 'Transport payé par', type: 'choix', liste: TRANSPORT },
      { cle: 'calendrier', libelle: 'Calendrier des livraisons', exemple: 'Décembre et janvier' },
    ],
  },
}

// Valeurs d'un enregistrement existant, prêtes pour un formulaire.
export function valeursDe(groupe, item) {
  return Object.fromEntries(GROUPES[groupe].champs.map((c) => {
    const v = item?.[c.cle]
    if (v === null || v === undefined) return [c.cle, '']
    if (c.type === 'date') return [c.cle, String(v).slice(0, 10)]
    if (c.type === 'nombre') return [c.cle, String(Number(v))]
    return [c.cle, v]
  }))
}
