/*
 * Configuration centralisée de la navigation.
 * Toute la hiérarchie des menus, les icônes et les règles de visibilité par rôle
 * vivent ici : Sidebar, fil d'Ariane et recherche de navigation s'appuient dessus.
 */

const USER_NAVIGATION = [
  {
    key: 'pilotage',
    title: 'Pilotage',
    items: [
      { key: 'direction', to: '/', label: 'Direction', icon: 'dashboard', end: true, managerOnly: true },
      {
        key: 'performance',
        label: 'Performance',
        icon: 'users',
        children: [
          { key: 'managers', to: '/managers', label: 'Managers', managerOnly: true },
          { key: 'equipe', to: '/equipe', label: 'Commerciaux', managerOnly: true },
          { key: 'emplois', to: '/emplois', label: 'RH', managerOnly: true },
        ],
      },
      {
        key: 'planning',
        label: 'Planning & suivi',
        icon: 'calendar',
        children: [
          { key: 'pilotage-semaine', to: '/pilotage', label: 'Planning semaine', managerOnly: true },
          { key: 'journal', to: '/journal', label: 'Journal du jour' },
          { key: 'activites', to: '/activites', label: 'Activités' },
        ],
      },
    ],
  },
  {
    key: 'clients-ventes',
    title: 'Clients & Ventes',
    items: [
      { key: 'clients', to: '/clients', label: 'Portefeuille', icon: 'folder' },
      { key: 'prospection', to: '/prospection', label: 'Prospection', icon: 'target' },
      {
        key: 'ventes-contrats',
        label: 'Ventes & contrats',
        icon: 'cart',
        children: [
          { key: 'ventes', to: '/ventes', label: 'Ventes' },
          { key: 'contrats-clients', to: '/contrats-clients', label: 'Contrats clients' },
          { key: 'contrats-paddy', to: '/contrats-paddy', label: 'Contrats paddy' },
          { key: 'depots-vente', to: '/depots-vente', label: 'Dépôt-vente' },
        ],
      },
      { key: 'produits', to: '/produits', label: 'Produits', icon: 'package' },
      {
        key: 'finances',
        label: 'Finances',
        icon: 'wallet',
        children: [
          { key: 'encaissements', to: '/encaissements', label: 'Encaissements' },
          { key: 'creances', to: '/creances', label: 'Recouvrement' },
        ],
      },
    ],
  },
  {
    key: 'analyse',
    title: 'Analyse',
    items: [
      { key: 'rentabilite', to: '/rentabilite', label: 'Rentabilité', icon: 'trending' },
      { key: 'forecast', to: '/forecast', label: 'Prévisions', icon: 'chart' },
      { key: 'insights', to: '/insights', label: 'Analyses & Actions', icon: 'sparkles' },
    ],
  },
  {
    key: 'decision',
    title: 'Décision',
    items: [
      { key: 'actions', to: '/actions', label: 'Alertes', icon: 'alert' },
    ],
  },
  {
    key: 'referentiel',
    title: 'Référentiel',
    items: [
      { key: 'argumentaire', to: '/argumentaire', label: 'Argumentaire de vente', icon: 'book' },
      { key: 'guide', to: '/guide', label: "Guide d'utilisation", icon: 'help' },
    ],
  },
]

const ADMIN_NAVIGATION = [
  {
    key: 'administration',
    title: 'Administration',
    items: [
      { key: 'admin-overview', to: '/admin', label: "Vue d'ensemble", icon: 'shield', end: true },
      { key: 'admin-impact', to: '/admin/impact-rizao', label: 'Impact RIZAO', icon: 'globe' },
      { key: 'admin-audit', to: '/admin/audit', label: "Journal d'audit", icon: 'clipboard' },
      { key: 'admin-connexions', to: '/admin/connexions', label: 'Connexions', icon: 'monitor' },
    ],
  },
]

const COMPTABLE_NAVIGATION = [
  {
    key: 'comptabilite',
    title: 'Comptabilité',
    items: [
      { key: 'comptabilite-validation', to: '/comptabilite', label: 'Validation des encaissements', icon: 'checkSquare', end: true },
    ],
  },
]

/** Rôle de navigation, dérivé des permissions existantes d'AuthContext. */
export function resolveRoleKey({ isAdmin, isComptable, isVendeur }) {
  if (isAdmin) return 'admin'
  if (isComptable) return 'comptable'
  if (isVendeur) return 'vendeur'
  return 'manager'
}

/** Menu visible pour un rôle (mêmes permissions que les routes protégées). */
export function getNavigationForRole(role) {
  if (role === 'admin') return ADMIN_NAVIGATION
  if (role === 'comptable') return COMPTABLE_NAVIGATION

  if (role === 'vendeur') {
    // Le vendeur n'a accès ni au pilotage global ni aux pages ManagerRoute.
    return USER_NAVIGATION.flatMap((section) => {
      const items = section.items.flatMap((item) => {
        if (item.managerOnly) return []
        if (!item.children) return [item]
        const children = item.children.filter((child) => !child.managerOnly)
        return children.length ? [{ ...item, children }] : []
      })
      return items.length ? [{ ...section, items }] : []
    })
  }

  return USER_NAVIGATION
}

export function isItemActive(item, pathname) {
  if (!item?.to) return false
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

/** Sous-menus à déplier automatiquement pour la page courante. */
export function getActiveParentKeys(pathname, navigation) {
  const keys = []
  navigation.forEach((section) => {
    section.items.forEach((item) => {
      if (item.children?.some((child) => isItemActive(child, pathname))) keys.push(item.key)
    })
  })
  return keys
}

/** Fil d'Ariane contextuel (section > sous-menu > page). */
export function getBreadcrumb(pathname, role) {
  const navigation = getNavigationForRole(role)

  for (const section of navigation) {
    for (const item of section.items) {
      if (item.children) {
        const child = item.children.find((entry) => isItemActive(entry, pathname))
        if (child) {
          return [
            { label: section.title },
            { label: item.label },
            { label: child.label, to: child.to },
          ]
        }
      } else if (isItemActive(item, pathname)) {
        return [
          { label: section.title },
          { label: item.label, to: item.to },
        ]
      }
    }
  }

  if (pathname === '/profil/mot-de-passe') {
    return [{ label: 'Mon compte' }, { label: 'Mot de passe' }]
  }
  if (pathname.startsWith('/admin/users/')) {
    return [{ label: 'Administration', to: '/admin' }, { label: 'Détail utilisateur' }]
  }
  if (pathname === '/crm') {
    return [{ label: 'Clients & Ventes' }, { label: 'Portefeuille', to: '/clients' }]
  }
  return [{ label: 'Sales Cockpit' }]
}

/** Entrées indexées pour la recherche de navigation du Header. */
export function getSearchEntries(role) {
  const navigation = getNavigationForRole(role)
  const entries = []

  navigation.forEach((section) => {
    section.items.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          entries.push({ label: child.label, to: child.to, section: section.title, parent: item.label })
        })
      } else {
        entries.push({ label: item.label, to: item.to, section: section.title })
      }
    })
  })

  entries.push({ label: 'Changer le mot de passe', to: '/profil/mot-de-passe', section: 'Mon compte' })

  return entries
}
