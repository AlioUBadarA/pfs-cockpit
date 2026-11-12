import { useState } from 'react'
import PageTabs from '../components/PageTabs'
import { useAuth } from '../context/AuthContext'

const sectionsRizier = [
  {
    titre: '1. Démarrer la journée',
    contenu: [
      { q: 'Direction', r: 'La page d\'accueil montre la photo du jour. Vous y voyez le CA, les encaissements et les alertes. Consultez-la chaque matin.' },
      { q: 'Planning semaine', r: 'Ouvrez "Clients & Ventes → Planning semaine". Organisez les visites de vos commerciaux jour par jour. Indiquez le client ou le prospect à voir. Indiquez aussi l\'action à mener.' },
    ]
  },
  {
    titre: '2. Catalogue Produits',
    contenu: [
      { q: 'Créer un produit', r: 'Ouvrez "Clients & Ventes → Produits". Ajoutez chaque référence (riz brisé 25%, riz entier...). Saisissez son prix de vente et son coût de revient. La marge se calcule seule.' },
      { q: 'Utilisation', r: 'Le catalogue remplit la liste "Produit" des ventes et des contrats. Vous ne tapez plus le nom à la main. Vous évitez ainsi les erreurs.' },
    ]
  },
  {
    titre: '3. Clients et ventes',
    contenu: [
      { q: 'Portefeuille (Clients)', r: 'Cette page liste tous vos clients. Chaque client a un score RFM (récence, fréquence, montant). Vous pouvez lui associer des "produits suivis".' },
      { q: 'Créer une vente', r: 'Ouvrez "Ventes". Chaque nouvelle vente reçoit un numéro (ex : V-2026-0007). Un client absent du Portefeuille est créé seul. Un client existant est mis à jour.' },
      { q: 'Contrats clients / paddy', r: 'Les contrats récurrents ont aussi un numéro. Ils concernent les clients aval et les producteurs de paddy. Pour clôturer un contrat, passez son statut à "Terminé".' },
      { q: 'Clôture d\'une vente', r: 'Une vente passe seule au statut "Payée" quand les encaissements couvrent son montant. Vous n\'avez rien à faire.' },
    ]
  },
  {
    titre: '4. Encaissements et recouvrement',
    contenu: [
      { q: 'Encaisser un paiement', r: 'Ouvrez "Encaissements". Cherchez la vente par son numéro ou par le nom du client. Saisissez le montant reçu. Un client peut payer en plusieurs fois. Chaque versement s\'ajoute à l\'historique.' },
      { q: 'Recouvrement (Créances)', r: 'Cette page classe les impayés par ancienneté (1-30j, 31-60j...). Vous pouvez relancer les clients en retard depuis cette page.' },
    ]
  },
  {
    titre: '5. Pilotage de l\'activité',
    contenu: [
      { q: 'Prospection', r: 'Cette page suit chaque prospect. Il passe de l\'étape Nouveau à l\'étape Gagné ou Perdu.' },
      { q: 'Journal du jour', r: 'Cette page montre les ventes et les encaissements du jour. Vous pouvez changer la période.' },
      { q: 'Rentabilité / Prévisions', r: 'Suivez la marge réelle par produit. Comparez-la aux objectifs du mois.' },
      { q: 'Emplois', r: 'Gérez la liste des employés de la rizerie. Saisissez le poste, le contrat et le salaire. La masse salariale se calcule seule.' },
    ]
  },
]

const sectionsCommercial = [
  {
    titre: '1. Vos outils au quotidien',
    contenu: [
      { q: 'Planning semaine', r: 'Organisez vos visites jour par jour. Indiquez le client ou le prospect à voir. Indiquez aussi l\'action à mener. C\'est votre feuille de route.' },
      { q: 'Ventes', r: 'Enregistrez chaque vente. Saisissez le client, le produit, la quantité et le prix. Le client est ajouté ou mis à jour dans le Portefeuille.' },
      { q: 'Prospection', r: 'Suivez vos prospects étape par étape : Nouveau, Qualifié, Proposition, Négociation, Gagné ou Perdu. Vous ne perdez aucune piste.' },
      { q: 'Activités', r: 'Notez chaque visite, chaque appel et chaque relance. Ces notes vous aident à préparer la visite suivante.' },
    ]
  },
  {
    titre: '2. Encaisser un client',
    contenu: [
      { q: 'Retrouver une transaction', r: 'Ouvrez "Encaissements". Cherchez par le numéro donné au client (ex : V-2026-0007). Vous pouvez aussi chercher par son nom.' },
      { q: 'Paiement en plusieurs fois', r: 'Le client peut payer en plusieurs fois. Enregistrez chaque versement à part. Le reste à payer se met à jour seul.' },
    ]
  },
  {
    titre: '3. Bien vendre',
    contenu: [
      { q: 'Argumentaire de vente', r: 'Cette page donne des phrases d\'accroche. Elle donne aussi des réponses aux objections. Lisez-la avant chaque tournée.' },
      { q: 'Recouvrement', r: 'Un client est en retard de paiement ? Vous le voyez sur la page Recouvrement. Vous pouvez y noter une relance.' },
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
        <p className="text-sm text-gray-500 mt-1">Utilisez la plateforme au quotidien. Le guide change selon votre rôle.</p>
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
