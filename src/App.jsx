import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ConfirmHost from './components/ConfirmHost'
import Login from './pages/Login'
import ServiceIndisponible from './pages/ServiceIndisponible'
import { isDemoMode } from './demo/demoMode'
import { probeServer, useServerStatus } from './services/serverStatus'
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const PilotageSemaine = lazy(() => import('./pages/Pilotage'))
const Argumentaire = lazy(() => import('./pages/Argumentaire'))
const Ventes = lazy(() => import('./pages/Ventes'))
const NouvelleVente = lazy(() => import('./pages/NouvelleVente'))
const Parametres = lazy(() => import('./pages/Parametres'))
const Clients = lazy(() => import('./pages/Clients'))
const ClientCompte = lazy(() => import('./pages/ClientCompte'))
const ProspectCompte = lazy(() => import('./pages/ProspectCompte'))
const ProducteurCompte = lazy(() => import('./pages/ProducteurCompte'))
const Producteurs = lazy(() => import('./pages/Producteurs'))
const PaiementsProducteurs = lazy(() => import('./pages/PaiementsProducteurs'))
const AgentCompte = lazy(() => import('./pages/AgentCompte'))
const Prospection = lazy(() => import('./pages/Prospection'))
const Creances = lazy(() => import('./pages/Creances'))
const Rentabilite = lazy(() => import('./pages/Rentabilite'))
const Forecast = lazy(() => import('./pages/Forecast'))
const Actions = lazy(() => import('./pages/Actions'))
const Insights = lazy(() => import('./pages/Insights'))
const ContratsClients = lazy(() => import('./pages/ContratsClients'))
const ContratsPaddy = lazy(() => import('./pages/ContratsPaddy'))
const DepotVente = lazy(() => import('./pages/DepotVente'))
const Equipe = lazy(() => import('./pages/Equipe'))
const Emplois = lazy(() => import('./pages/Emplois'))
const Managers = lazy(() => import('./pages/Managers'))
const Journal = lazy(() => import('./pages/Journal'))
const Activites = lazy(() => import('./pages/Activites'))
const Taches = lazy(() => import('./pages/Taches'))
const Produits = lazy(() => import('./pages/Produits'))
const Encaissements = lazy(() => import('./pages/Encaissements'))
const Comptabilite = lazy(() => import('./pages/Comptabilite'))
const Guide = lazy(() => import('./pages/Guide'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'))
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'))
const AdminImpactRizao = lazy(() => import('./pages/admin/AdminImpactRizao'))
const AdminConnexions = lazy(() => import('./pages/admin/AdminConnexions'))

const CHANGE_PASSWORD_PATH = '/profil/mot-de-passe'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />
  if (user.must_change_password && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

function RootRedirect() {
  const { isAdmin, isVendeur, isComptable } = useAuth()
  if (isAdmin)     return <Navigate to="/admin"        replace />
  if (isComptable) return <Navigate to="/comptabilite" replace />
  if (isVendeur)   return <Navigate to="/journal"      replace />
  return <Dashboard />
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

// Accessible au manager, directeur, rizier, pas au vendeur ni à l'admin
function ManagerRoute({ children }) {
  const { user, isAdmin, isVendeur } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  if (isVendeur) return <Navigate to="/journal" replace />
  return children
}

// Validation des encaissements : comptable, manager, directeur, rizier et superadmin (même
// règle que le backend, voir middleware/permissions.js, 'encaissements:valider').
function ComptableRoute({ children }) {
  const { user, isComptable, isSuperadmin, isManager, isDirecteur, isRizier } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isComptable && !isSuperadmin && !isManager && !isDirecteur && !isRizier) return <Navigate to="/" replace />
  return children
}

function ServerGuard({ children }) {
  const serverDown = useServerStatus()
  const { isDemo } = useAuth()

  // Vérifie l'API dès l'ouverture du site (même si l'utilisateur n'est pas connecté),
  // pour afficher la page personnalisée au lieu de la page « suspendue » de Render.
  useEffect(() => {
    if (isDemoMode()) return
    probeServer()
  }, [])

  if (serverDown && !isDemo) return <ServiceIndisponible />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index              element={<RootRedirect />} />
        <Route path="ventes"      element={<Ventes />} />
        <Route path="ventes/nouvelle" element={<NouvelleVente />} />
        <Route path="parametres"  element={<Parametres />} />
        <Route path="pilotage"    element={<ManagerRoute><PilotageSemaine /></ManagerRoute>} />
        <Route path="argumentaire" element={<Argumentaire />} />
        <Route path="clients"     element={<Clients />} />
        <Route path="clients/:id" element={<ClientCompte />} />
        <Route path="prospects/:id" element={<ProspectCompte />} />
        <Route path="producteurs" element={<Producteurs />} />
        <Route path="paiements-producteurs" element={<PaiementsProducteurs />} />
        <Route path="producteurs/:id" element={<ProducteurCompte />} />
        <Route path="agents/:id" element={<AgentCompte />} />
        <Route path="prospection" element={<Prospection />} />
        <Route path="creances"    element={<Creances />} />
        <Route path="rentabilite" element={<Rentabilite />} />
        <Route path="forecast"    element={<Forecast />} />
        <Route path="actions"     element={<Actions />} />
        <Route path="insights"    element={<Insights />} />
        <Route path="contrats-clients" element={<ContratsClients />} />
        <Route path="contrats-paddy"   element={<ContratsPaddy />} />
        <Route path="depots-vente"     element={<DepotVente />} />
        <Route path="equipe"     element={<ManagerRoute><Equipe /></ManagerRoute>} />
        <Route path="emplois"    element={<ManagerRoute><Emplois /></ManagerRoute>} />
        <Route path="managers"   element={<ManagerRoute><Managers /></ManagerRoute>} />
        <Route path="journal"    element={<Journal />} />
        <Route path="activites"  element={<Activites />} />
        <Route path="taches"     element={<Taches />} />
        <Route path="produits"   element={<Produits />} />
        <Route path="encaissements" element={<Encaissements />} />
        <Route path="comptabilite" element={<ComptableRoute><Comptabilite /></ComptableRoute>} />
        <Route path="guide"      element={<Guide />} />
        <Route path="profil/mot-de-passe" element={<ChangePassword />} />

        {/* Redirects anciens liens (anciens onglets groupés) */}
        <Route path="crm" element={<Navigate to="/clients" replace />} />

        {/* Admin */}
        <Route path="admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/impact-rizao"   element={<AdminRoute><AdminImpactRizao /></AdminRoute>} />
        <Route path="admin/users/:id"      element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
        <Route path="admin/audit"          element={<AdminRoute><AdminAudit /></AdminRoute>} />
        <Route path="admin/connexions"     element={<AdminRoute><AdminConnexions /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ServerGuard>
          <AppRoutes />
          <ConfirmHost />
        </ServerGuard>
      </AuthProvider>
    </BrowserRouter>
  )
}
