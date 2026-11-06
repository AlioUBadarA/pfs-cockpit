import { useState } from 'react'
import PageTabs from '../components/PageTabs'
import { useAuth } from '../context/AuthContext'

const sectionsRizier = [
  {
    titre: '1. Démarrer la journée',
    contenu: [
      { q: 'Direction', r: 'La page d\'accueil donne la photo du jour : CA, encaissements, alertes prioritaires. C\'est le premier écran à consulter chaque matin.' },
      { q: 'Planning semaine', r: 'Dans "Clients & Ventes → Planning semaine", organisez les visites de vos commerciaux jour par jour : quel client ou prospect voir, avec quelle action à mener.' },
    ]
  },
  {
    titre: '2. Catalogue Produits',
    contenu: [
      { q: 'Créer un produit', r: '"Clients & Ventes → Produits" : ajoutez chaque référence (riz brisé 25%, riz entier...) avec son prix de vente et son coût de revient. La marge se calcule automatiquement.' },
      { q: 'Utilisation', r: 'Ce catalogue alimente ensuite la liste déroulante "Produit" lors de la création d\'une vente ou d\'un contrat. Plus de saisie libre source d\'erreurs.' },
    ]
  },
  {
    titre: '3. Clients et ventes',
    contenu: [
      { q: 'Portefeuille (Clients)', r: 'Liste de tous vos clients avec leur score RFM (récence, fréquence, montant). Vous pouvez y associer les "produits suivis" pour chaque client.' },
      { q: 'Créer une vente', r: 'Dans "Ventes", chaque nouvelle vente génère automatiquement un numéro de transaction (ex: V-2026-0007). Si le client n\'existe pas encore dans le Portefeuille, il est créé automatiquement ; s\'il existe déjà, ses informations sont mises à jour.' },
      { q: 'Contrats clients / paddy', r: 'Les contrats récurrents (clients aval, producteurs paddy amont) ont eux aussi un numéro de contrat pour les suivre dans le temps. Un contrat se clôture en passant son statut à "Terminé".' },
      { q: 'Clôture d\'une vente', r: 'Une vente est automatiquement marquée "Payée" (clôturée) dès que le total des encaissements couvre son montant. Aucune action manuelle n\'est nécessaire.' },
    ]
  },
  {
    titre: '4. Encaissements et recouvrement',
    contenu: [
      { q: 'Encaisser un paiement', r: 'Dans "Encaissements", recherchez la transaction par son numéro ou par le nom du client, puis enregistrez le montant reçu. Un client peut payer en plusieurs tranches : chaque versement vient s\'ajouter à l\'historique.' },
      { q: 'Recouvrement (Créances)', r: 'Suivez les impayés par ancienneté (1-30j, 31-60j...) et relancez les clients en retard directement depuis cette page.' },
    ]
  },
  {
    titre: '5. Pilotage de l\'activité',
    contenu: [
      { q: 'Prospection', r: 'Le pipeline de prospects (anciennement "Pipeline") suit chaque opportunité de Nouveau jusqu\'à Gagné/Perdu.' },
      { q: 'Journal du jour', r: 'Vue caisse : ventes et encaissements du jour, filtrable par période.' },
      { q: 'Rentabilité / Prévisions', r: 'Suivez la marge réelle par produit et comparez aux objectifs mensuels.' },
      { q: 'Emplois', r: 'Gérez la liste des employés de la rizerie (poste, contrat, salaire). La masse salariale se calcule automatiquement.' },
    ]
  },
]

const sectionsCommercial = [
  {
    titre: '1. Vos outils au quotidien',
    contenu: [
      { q: 'Planning semaine', r: 'Dans "Planning semaine", organisez vos visites jour par jour : quel client ou prospect voir, avec quelle action à mener. C\'est votre feuille de route terrain.' },
      { q: 'Ventes', r: 'Enregistrez chaque vente : client, produit (sélectionné dans le catalogue), quantité et prix. Le client est automatiquement ajouté ou mis à jour dans le Portefeuille.' },
      { q: 'Prospection', r: 'Suivez vos prospects étape par étape (Nouveau → Qualifié → Proposition → Négociation → Gagné/Perdu) pour ne jamais perdre une opportunité de vue.' },
      { q: 'Activités', r: 'Notez chaque visite, appel ou relance. C\'est votre mémoire de terrain, utile pour préparer la prochaine visite.' },
    ]
  },
  {
    titre: '2. Encaisser un client',
    contenu: [
      { q: 'Retrouver une transaction', r: 'Dans "Encaissements", recherchez par le numéro donné au client (ex: V-2026-0007) ou par son nom.' },
      { q: 'Paiement en plusieurs fois', r: 'Si le client paie en plusieurs tranches, enregistrez chaque versement séparément. Le solde restant se met à jour automatiquement.' },
    ]
  },
  {
    titre: '3. Bien vendre',
    contenu: [
      { q: 'Argumentaire de vente', r: 'Scripts d\'accroche, réponses aux objections courantes et techniques de closing. Consultez cette page avant chaque tournée client.' },
      { q: 'Recouvrement', r: 'Si un de vos clients est en retard de paiement, vous pouvez le voir et enregistrer une relance directement depuis la page Recouvrement.' },
    ]
  },
]

function SectionList({ sections }) {
  const [open, setOpen] = useState(0)
  return (
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
  )
}

export default function Guide() {
  const { isVendeur } = useAuth()
  const [tab, setTab] = useState('rizier')

  if (isVendeur) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Guide d'utilisation</h2>
          <p className="text-sm text-gray-500 mt-1">Comment utiliser la plateforme au quotidien.</p>
        </div>
        <SectionList sections={sectionsCommercial} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Guide d'utilisation</h2>
        <p className="text-sm text-gray-500 mt-1">Comment utiliser la plateforme au quotidien, selon votre rôle.</p>
      </div>

      <PageTabs
        tabs={[{ key: 'rizier', label: 'Pour le rizier' }, { key: 'commercial', label: 'Pour le commercial' }]}
        active={tab}
        setActive={(t) => setTab(t)}
      />

      <SectionList sections={tab === 'rizier' ? sectionsRizier : sectionsCommercial} />
    </div>
  )
}
