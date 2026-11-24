// Argumentaire de vente, mis à jour avec la formation commerciale PFS, cohorte 3 (novembre 2026).
// Même contenu dans l'app mobile : sales-cockpit-mobile/src/lib/argumentaireC3.ts.
// Une diapositive : un titre, puis des points, un tableau, un exemple ou une règle.

export const MODULES = [
  {
    titre: 'Mon produit et mon offre',
    slides: [
      {
        titre: 'Les 4 questions de votre acheteur',
        points: [
          'Puis-je lui faire confiance ? Il veut un riz qui cuit toujours pareil et un sac qui pèse son poids.',
          'Puis-je le revendre facilement ? Donnez-lui des arguments pour ses propres clients.',
          'Ce vendeur connaît-il son produit ? « C\'est du bon riz » ne rassure pas. Un chiffre rassure.',
          'Le prix est-il justifié ? Un attribut bien expliqué justifie le prix.',
        ],
      },
      {
        titre: 'Décrire son riz avec des chiffres',
        points: [
          'La variété : le nom exact, par exemple IR 841 ou Sahel 108.',
          'Le taux de brisure : il fixe la qualité perçue et le rendement à la cuisson.',
          'L\'humidité : elle décide de la conservation.',
          'La propreté : aucun caillou, aucun déchet.',
        ],
        regle: 'Jamais d\'adjectif sans chiffre.',
      },
      {
        titre: 'Caractéristique, avantage, bénéfice',
        tableau: {
          entetes: ['Caractéristique', 'Avantage', 'Bénéfice pour l\'acheteur'],
          lignes: [
            ['Brisure de 5 à 10 %', 'Peu de grains cassés', 'Plus de riz utile par kilo'],
            ['Humidité de 10 à 11 %', 'Le riz se conserve bien', 'Moins de pertes en stock'],
            ['Propreté à 100 %', 'Ni cailloux ni déchets', 'Aucune plainte de ses clients'],
            ['Variété connue', 'Cuisson prévisible', 'Il sait ce qu\'il revend'],
            ['Livraison le mercredi avant 9 h', 'Le stock arrive avant l\'ouverture', 'Pas de rupture dans la journée'],
          ],
        },
      },
      {
        titre: 'Ma proposition de valeur',
        points: ['Je propose [produit] pour [client cible] afin de [bénéfice], grâce à [élément différent].'],
        exemple: 'Je propose du riz étuvé à 5 % de brisure aux restaurateurs de Saint-Louis. Ils perdent moins à la cuisson, grâce au contrôle de chaque lot.',
        regle: 'Deux phrases au plus. Tout ce que vous dites doit être vrai.',
      },
    ],
  },
  {
    titre: 'Mes acheteurs et ma zone',
    slides: [
      {
        titre: 'Les 5 profils d\'acheteurs de riz',
        tableau: {
          entetes: ['Acheteur', 'Volume', 'Ce qu\'il regarde'],
          lignes: [
            ['Grossiste', '5 à 50 t par mois', 'Prix, régularité, volume garanti'],
            ['Détaillant de marché', '100 à 500 kg par semaine', 'Aspect du riz, délai de paiement'],
            ['Boutique', '50 à 200 kg par semaine', 'Livraison, crédit court, proximité'],
            ['Restaurant', '50 à 300 kg par semaine', 'Goût, régularité'],
            ['Cantine, institution', '500 kg à 5 t par mois', 'Qualité, certificat, facture'],
          ],
        },
      },
      {
        titre: 'Quand les visiter',
        points: [
          'Grossistes : de 6 h à 9 h, avant leurs livraisons.',
          'Détaillants : de 10 h à 12 h, entre deux clients.',
          'Restaurants : de 9 h à 11 h ou de 15 h à 17 h, hors du service.',
        ],
      },
      {
        titre: 'Préparer sa sortie',
        points: [
          'Une seule zone par sortie. Le circuit fait une boucle.',
          '5 à 8 visites par demi-journée au plus.',
          'Emportez un échantillon, des bons de commande et les factures à encaisser.',
          'Fixez un objectif chiffré : X sacs ou X F CFA.',
          'Rangez les visites selon les horaires des clients.',
        ],
        regle: 'Planifiez vos visites la veille dans Planning et tâches.',
      },
      {
        titre: 'Ce que vous ramenez du terrain',
        points: [
          'Une commande, ou un engagement pour la semaine suivante.',
          'Une information : offre d\'un concurrent, besoin non couvert, nouveau point de vente.',
          'Un contact : un nom, un numéro WhatsApp, une adresse.',
          'Un compte rendu saisi le soir même. Un contact non noté est perdu.',
        ],
      },
    ],
  },
  {
    titre: 'Prospecter',
    slides: [
      {
        titre: '20 % du temps pour prospecter',
        points: [
          'Prospectez aussi les bonnes semaines. Vous ne dépendez alors d\'aucun client.',
          'Le marché : qui achète chez votre concurrent ?',
          'Les recommandations : demandez à chaque client satisfait un autre nom.',
          'Les axes de livraison : un arrêt de plus par tournée.',
          'Les nouvelles zones : un marché qui ouvre, une école qui recrute.',
        ],
      },
      {
        titre: 'L\'accroche de 30 secondes',
        exemple: 'Bonjour, je m\'appelle Ibrahima. Je transforme du riz local à Saint-Louis. Je cherche des détaillants sérieux à Dakar pour un riz long grain à faible brisure. Vous achetez combien de sacs par semaine ?',
        points: [
          'Je me présente. Je dis pourquoi je viens. Je finis par une question.',
          'À éviter : « Je vends du riz, vous êtes intéressé ? »',
        ],
        regle: 'Aucun prix avant d\'avoir posé une question.',
      },
      {
        titre: 'Après la visite',
        points: [
          'Il commande : confirmez le volume, la date et le paiement avant de partir.',
          'Il veut réfléchir : laissez un échantillon et fixez une date de retour.',
          'Il refuse : demandez pourquoi. Repassez dans 6 semaines.',
        ],
        regle: 'Chaque visite se termine par une action suivante datée.',
      },
    ],
  },
  {
    titre: 'L\'entretien de vente',
    slides: [
      {
        titre: 'Les 5 étapes',
        points: [
          'Contact : bref, avec une raison claire.',
          'Découverte : des questions ouvertes pour trouver le besoin.',
          'Argumentation : 3 arguments chiffrés avec la méthode CAB.',
          'Objections : écouter, reformuler, répondre par un chiffre.',
          'Conclusion : volume, prix, date et paiement confirmés.',
        ],
        regle: 'Le soir même, envoyez un WhatsApp et notez le compte rendu.',
      },
      {
        titre: 'Écouter d\'abord',
        points: [
          'Reformulez : « Si je comprends bien, vous cherchez… »',
          'Posez des questions ouvertes : « Qu\'est-ce qui compte pour vous dans ce riz ? »',
          'Laissez finir. Attendez 2 secondes avant de répondre.',
          'Montrez que vous comprenez : « La régularité est essentielle pour vous. »',
          'Prenez des notes. Le client se sent pris au sérieux.',
        ],
      },
      {
        titre: 'Répondre aux objections',
        tableau: {
          entetes: ['Le client dit', 'Vous répondez'],
          lignes: [
            ['« C\'est trop cher. »', 'Trop cher par rapport à quoi ? Avec 5 % de brisure, le kilo utile revient moins cher.'],
            ['« Mon fournisseur est moins cher. »', 'Son riz est-il aussi propre ? Livre-t-il à la date ? Est-il toujours disponible ?'],
            ['« Je vais réfléchir. »', 'Qu\'est-ce qui vous ferait décider aujourd\'hui ?'],
            ['« Faites-moi un prix. »', 'Quel volume cherchez-vous ? Je préfère comprendre votre besoin d\'abord.'],
          ],
        },
      },
    ],
  },
  {
    titre: 'Négocier',
    slides: [
      {
        titre: 'Mon prix plancher',
        points: [
          'Additionnez : paddy, décorticage, transport, emballage, pertes et charges fixes.',
          'Vous obtenez le coût de revient du sac.',
          'Prix plancher = coût de revient + marge minimale.',
          'En dessous, vous travaillez à perte.',
        ],
        regle: 'Écrivez votre prix plancher sur papier avant chaque négociation.',
      },
      {
        titre: 'Les 3 leviers',
        points: [
          'Le volume : « 10 sacs au lieu de 5, je fais un geste. »',
          'Le délai de paiement : « Comptant, je vous fais ce prix. À 7 jours, c\'est le tarif normal. »',
          'La régularité : « 4 sacs chaque semaine pendant un mois, on peut discuter. »',
        ],
        regle: 'Aucune baisse de prix sans contrepartie.',
      },
      {
        titre: 'Penser marge totale',
        tableau: {
          entetes: ['Offre', 'Volume', 'Prix du sac', 'Marge par sac', 'Marge totale'],
          lignes: [
            ['A', '5 sacs', '18 000 F', '3 000 F', '15 000 F'],
            ['B', '10 sacs', '16 000 F', '1 000 F', '10 000 F'],
          ],
        },
        points: ['L\'offre B vend plus de sacs. Elle rapporte 5 000 F de moins.'],
      },
    ],
  },
  {
    titre: 'Encaisser et sécuriser',
    slides: [
      {
        titre: 'Vendre n\'est pas encaisser',
        points: [
          'L\'argent compte quand il est dans votre main ou sur votre compte.',
          'Comptant : la règle pour tout nouveau client.',
          'Mobile Money : vérifiez la réception sur votre téléphone avant de livrer.',
          'Crédit : limite, date et suivi écrits avant la livraison.',
        ],
        regle: 'Pas de deuxième livraison si la première n\'est pas payée.',
      },
      {
        titre: 'Mes règles de crédit',
        points: [
          'Nouveau client : comptant, ou acompte de 50 %.',
          'Crédit à 7 jours : après 3 achats payés comptant.',
          'Crédit à 15 jours : pour les gros clients réguliers.',
          'Notez la créance le soir même. Relancez 2 jours avant l\'échéance.',
        ],
      },
      {
        titre: 'Relancer un impayé sans perdre le client',
        points: [
          'Relancez tôt, par un WhatsApp calme : le montant et la date convenue.',
          'Écoutez la raison. Proposez un paiement partiel daté.',
          'Aucune nouvelle livraison avant le règlement.',
          'Un client qui paie de plus en plus tard finit par ne plus payer. Agissez avant.',
        ],
      },
      {
        titre: 'Un accord écrit en 6 éléments',
        points: [
          'Les parties : le vendeur et l\'acheteur.',
          'Le produit : variété, poids du sac, brisure maximale.',
          'La quantité et la fréquence : 10 sacs chaque vendredi.',
          'Le prix, avec une clause si le prix du paddy change.',
          'La livraison : lieu, heure, qui paie le transport.',
          'Le paiement : date, mode, pénalité de retard.',
        ],
        exemple: 'Je confirme : 6 sacs de 50 kg à 17 000 F, livraison mercredi avant 10 h, comptant. C\'est bien ça ?',
      },
    ],
  },
  {
    titre: 'Piloter et grandir',
    slides: [
      {
        titre: 'Le back-to-back avec les producteurs',
        points: [
          'Étape 1 : le client s\'engage sur un volume, un prix et une date.',
          'Étape 2 : vous commandez le paddy au producteur sur ce volume.',
          'Étape 3 : vous transformez et livrez à la date promise.',
          'Le contrat de paddy fixe 5 éléments : parties, qualité, volume, prix, calendrier et paiement.',
        ],
        regle: 'Sécurisez la vente avant d\'acheter le paddy.',
      },
      {
        titre: 'Mes 4 chiffres de la semaine',
        points: [
          'Le chiffre d\'affaires encaissé.',
          'Le volume vendu, en sacs.',
          'L\'encours : ce qui est vendu et pas encore payé.',
          'Le taux de réalisation de l\'objectif.',
          'Sous 70 % en milieu de semaine : ajoutez des visites et relancez vos meilleurs clients.',
        ],
        regle: 'Environ 20 % de vos clients font 80 % de vos ventes. Servez-les en premier.',
      },
      {
        titre: 'Vendre beaucoup n\'est pas gagner beaucoup',
        tableau: {
          entetes: ['', 'Situation A', 'Situation B'],
          lignes: [
            ['Sacs vendus par mois', '100', '60'],
            ['Prix du sac', '17 000 F', '19 000 F'],
            ['Coût de revient', '14 500 F', '14 500 F'],
            ['Marge totale', '250 000 F', '270 000 F'],
          ],
        },
        points: ['Une remise de 17 000 F à 15 500 F sur 100 sacs coûte 150 000 F de marge.'],
      },
      {
        titre: 'Classer mes clients',
        tableau: {
          entetes: ['', 'Très rentable', 'Peu rentable'],
          lignes: [
            ['Gros volume', 'Prioritaire : à garder', 'À retravailler : prix, crédit, livraison'],
            ['Petit volume', 'À développer : plus de commandes', 'À reconsidérer'],
          ],
        },
      },
      {
        titre: 'Recruter un vendeur',
        points: [
          'Recrutez quand 2 signaux sur 4 apparaissent : clients non visités, livraisons ratées, ventes qui stagnent, zones non couvertes.',
          'Définissez la zone, le nombre de visites et l\'objectif avant le premier jour.',
          'Payez un fixe et une commission sur l\'encaissé, jamais sur les commandes.',
          'Exemple : 50 000 F + 2 % au-delà de 500 000 F encaissés. Pour 800 000 F, il reçoit 56 000 F.',
        ],
      },
    ],
  },
]

export const SOURCE = 'Formation commerciale PFS, cohorte 3, séances 1 à 4 (novembre et décembre 2026).'
