import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ── Configuration par pays ────────────────────────────────────
// adj    : adjectif national (ex. "sénégalaise")
// devise : unité monétaire affichée dans les exemples de calcul
// prix   : exemple de prix de vente au kg
// cout   : exemple de coût de revient au kg
// marge  : exemple de marge brute au kg
const PAYS_CONFIG = {
  'Sénégal':         { adj: 'sénégalaise',   devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Côte d\'Ivoire':  { adj: 'ivoirienne',    devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Mali':            { adj: 'malienne',       devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Burkina Faso':    { adj: 'burkinabè',      devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Niger':           { adj: 'nigérienne',     devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Bénin':           { adj: 'béninoise',      devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Togo':            { adj: 'togolaise',      devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Cameroun':        { adj: 'camerounaise',   devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Guinée':          { adj: 'guinéenne',      devise: 'GNF',   prix: '9 000 GNF/kg', cout: '7 200 GNF/kg', marge: '1 800 GNF/kg' },
  'Guinée-Bissau':   { adj: 'bissau-guinéenne', devise: 'F CFA', prix: '350 F/kg', cout: '280 F/kg', marge: '70 F/kg' },
  'Mauritanie':      { adj: 'mauritanienne',  devise: 'MRU',   prix: '80 MRU/kg', cout: '64 MRU/kg', marge: '16 MRU/kg' },
  'Gambie':          { adj: 'gambienne',      devise: 'GMD',   prix: '45 GMD/kg', cout: '36 GMD/kg', marge: '9 GMD/kg' },
  'Sierra Leone':    { adj: 'sierra-léonaise', devise: 'SLL',  prix: '7 000 SLL/kg', cout: '5 600 SLL/kg', marge: '1 400 SLL/kg' },
  'Libéria':         { adj: 'libérienne',     devise: 'LRD',   prix: '35 LRD/kg', cout: '28 LRD/kg', marge: '7 LRD/kg' },
}

const DEFAULT_CONFIG = { adj: 'locale', devise: 'FCFA', prix: '350/kg', cout: '280/kg', marge: '70/kg' }

function getSections(pays, cfg) {
  return [
    {
      titre: 'Script de vente - Accroche',
      contenu: [
        {
          q: 'Première phrase d\'accroche',
          r: '"Bonjour, je suis [Nom] de la rizerie [Rizerie]. Nous produisons du riz local de qualité supérieure et je souhaitais vous présenter nos tarifs et avantages."',
        },
        {
          q: 'Qualifier le besoin',
          r: '"Quelle quantité de riz achetez-vous par mois ? Avez-vous un fournisseur habituel ? Êtes-vous satisfait de sa qualité et de ses délais ?"',
        },
        {
          q: 'Présenter la valeur',
          r: `"Notre riz est produit localement, livré frais, et nous garantissons la constance de la qualité. En plus, vous contribuez à soutenir l'agriculture ${cfg.adj}."`,
        },
      ],
    },
    {
      titre: 'Réponses aux objections courantes',
      contenu: [
        {
          q: '"Votre riz est plus cher que les importés"',
          r: '"Le riz importé a des coûts cachés : transport long, stockage, perte de qualité. Notre riz local est frais, livré rapidement, et son prix global est compétitif. De plus, vous fidélisez vos clients avec un produit local certifié."',
        },
        {
          q: '"Je travaille déjà avec un autre fournisseur"',
          r: '"C\'est très bien. Est-ce qu\'il vous arrive d\'avoir des ruptures de stock ? Nous pouvons être votre fournisseur de secours, ou vous proposer un produit complémentaire. Commençons avec une petite commande test."',
        },
        {
          q: '"La qualité du riz local n\'est pas constante"',
          r: '"C\'est une préoccupation légitime. C\'est pourquoi nous appliquons un contrôle qualité strict à chaque lot. Je peux vous donner un échantillon gratuit pour que vous jugiez par vous-même."',
        },
        {
          q: '"Je veux payer à crédit et vous ne l\'acceptez pas"',
          r: '"Nous comprenons les contraintes de trésorerie. Après une première commande payée comptant, nous pouvons étudier un délai de paiement de 15 jours pour les clients réguliers."',
        },
        {
          q: '"Je n\'ai pas de place pour stocker"',
          r: '"Pas de problème. Nous livrons en petites quantités et fréquemment selon vos besoins. Vous n\'avez pas à constituer un grand stock."',
        },
      ],
    },
    {
      titre: 'Techniques de closing',
      contenu: [
        { q: 'Closing par alternative', r: '"Vous préférez commencer avec 50 sacs ou 100 sacs pour tester ?"' },
        { q: 'Closing par urgence', r: '"Nous avons une promotion valable jusqu\'à la fin de la semaine. Si vous commandez maintenant, je peux vous garantir ce prix."' },
        { q: 'Closing par récapitulatif', r: '"Donc vous souhaitez [produit] à [prix], livré [délai]. Je vous prépare le bon de commande ?"' },
        { q: 'Si le client hésite encore', r: '"Qu\'est-ce qui vous empêche de prendre la décision aujourd\'hui ? Y a-t-il une information que je n\'ai pas donnée ?"' },
      ],
    },
    {
      titre: 'Règles d\'or du vendeur PFS',
      contenu: [
        { q: '1. Écouter avant de parler', r: 'Laissez le client exprimer ses besoins. Posez des questions ouvertes. Ne coupez jamais la parole.' },
        { q: '2. Tenir ses engagements', r: 'Si vous promettez une livraison à J+2, tenez-le. La confiance se construit sur la fiabilité, pas sur le discours.' },
        { q: '3. Relancer sans harceler', r: 'Un suivi après 3 jours, puis après 7 jours. Au-delà, laissez une porte ouverte et passez au prochain prospect.' },
        { q: '4. Enregistrer chaque visite', r: 'Notez dans votre pilotage : qui vous avez vu, ce qui a été dit, la prochaine étape. La mémoire flanche, le carnet non.' },
        {
          q: '5. Valoriser le riz local',
          r: `Vous ne vendez pas juste du riz. Vous vendez un emploi local, une traçabilité, une fraîcheur et un impact sur l'économie ${cfg.adj}.`,
        },
      ],
    },
    {
      titre: 'Formules de calcul utiles',
      contenu: [
        {
          q: 'Marge brute',
          r: `Marge = Prix de vente - Coût de revient. Ex : vente à ${cfg.prix}, coût ${cfg.cout} → marge = ${cfg.marge}`,
        },
        {
          q: 'Taux de marge',
          r: 'Taux = (Marge / Prix vente) × 100. Ex : 70/350 × 100 = 20 %',
        },
        { q: 'CA prévisionnel mensuel', r: 'CA = Nbre clients × Quantité moyenne × Prix unitaire' },
        { q: 'Taux de recouvrement', r: 'Taux = (Montant encaissé / Montant facturé) × 100. Objectif : > 90 %' },
        { q: 'Taux de transformation prospects', r: 'Taux = (Prospects convertis / Prospects contactés) × 100' },
      ],
    },
  ]
}

export default function Argumentaire() {
  const { user } = useAuth()
  const [open, setOpen] = useState(0)
  const [pays, setPays] = useState(user?.pays || null)

  // Si le pays n'est pas encore dans le contexte (token ancien), on le récupère via /me
  useEffect(() => {
    if (!pays) {
      api.get('/api/auth/me').then(({ data }) => setPays(data.pays || null)).catch(() => {})
    }
  }, [pays])

  const cfg = PAYS_CONFIG[pays] || DEFAULT_CONFIG
  const sections = getSections(pays, cfg)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Argumentaire &amp; Entretien de vente</h2>
        <p className="text-sm text-gray-500 mt-1">
          Scripts, réponses aux objections et bonnes pratiques pour vos visites commerciales
          {pays ? ` — adapté pour le marché ${pays}` : ''}.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(open === idx ? -1 : idx)}
            >
              <span className="font-semibold text-gray-800 text-sm">{section.titre}</span>
              <span className={`text-gray-400 transition-transform duration-200 ${open === idx ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {open === idx && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {section.contenu.map((item, i) => (
                  <div key={i} className="px-4 py-4">
                    <p className="text-xs font-bold text-[#1b75bc] uppercase tracking-wide mb-2">{item.q}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.r}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
