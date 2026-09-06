import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import PilotageSemaine from './pages/Pilotage'
import Argumentaire from './pages/Argumentaire'
import Ventes from './pages/Ventes'
import Clients from './pages/Clients'
import Prospection from './pages/Prospection'
import Creances from './pages/Creances'
import Rentabilite from './pages/Rentabilite'
import Forecast from './pages/Forecast'
import Actions from './pages/Actions'
import Insights from './pages/Insights'
import ContratsClients from './pages/ContratsClients'
import ContratsPaddy from './pages/ContratsPaddy'
import Equipe from './pages/Equipe'
import Emplois from './pages/Emplois'
import Managers from './pages/Managers'
import Journal from './pages/Journal'
import Activites from './pages/Activites'
import Produits from './pages/Produits'
import Encaissements from './pages/Encaissements'
import Comptabilite from './pages/Comptabilite'
import Guide from './pages/Guide'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminAudit from './pages/admin/AdminAudit'
import AdminImpactRizao from './pages/admin/AdminImpactRizao'
import AdminConnexions from './pages/admin/AdminConnexions'

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

// Accessible au manager, directeur, rizier — pas au vendeur ni à l'admin
function ManagerRoute({ children }) {
  const { user, isAdmin, isVendeur } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  if (isVendeur) return <Navigate to="/journal" replace />
  return children
}

// Validation des encaissements : comptable et superadmin uniquement (même règle que le
// backend, voir middleware/permissions.js — 'encaissements:valider').
function ComptableRoute({ children }) {
  const { user, isComptable, isSuperadmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isComptable && !isSuperadmin) return <Navigate to="/" replace />
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
        <Route path="pilotage"    element={<ManagerRoute><PilotageSemaine /></ManagerRoute>} />
        <Route path="argumentaire" element={<Argumentaire />} />
        <Route path="clients"     element={<Clients />} />
        <Route path="prospection" element={<Prospection />} />
        <Route path="creances"    element={<Creances />} />
        <Route path="rentabilite" element={<Rentabilite />} />
        <Route path="forecast"    element={<Forecast />} />
        <Route path="actions"     element={<Actions />} />
        <Route path="insights"    element={<Insights />} />
        <Route path="contrats-clients" element={<ContratsClients />} />
        <Route path="contrats-paddy"   element={<ContratsPaddy />} />
        <Route path="equipe"     element={<ManagerRoute><Equipe /></ManagerRoute>} />
        <Route path="emplois"    element={<ManagerRoute><Emplois /></ManagerRoute>} />
        <Route path="managers"   element={<ManagerRoute><Managers /></ManagerRoute>} />
        <Route path="journal"    element={<Journal />} />
        <Route path="activites"  element={<Activites />} />
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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
