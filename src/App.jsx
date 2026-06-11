import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Ventes from './pages/Ventes'
import Creances from './pages/Creances'
import Clients from './pages/Clients'
import Pilotage from './pages/Pilotage'
import Forecast from './pages/Forecast'
import Actions from './pages/Actions'
import Prospection from './pages/Prospection'
import Rentabilite from './pages/Rentabilite'
import Equipe from './pages/Equipe'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminAudit from './pages/admin/AdminAudit'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

function RootRedirect() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function RizierRoute({ children }) {
  const { user, isAdmin, isVendeur } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  if (isVendeur) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index           element={<RootRedirect />} />
        <Route path="ventes"      element={<Ventes />} />
        <Route path="creances"    element={<Creances />} />
        <Route path="clients"     element={<Clients />} />
        <Route path="pilotage"    element={<Pilotage />} />
        <Route path="forecast"    element={<Forecast />} />
        <Route path="actions"     element={<Actions />} />
        <Route path="prospection" element={<Prospection />} />
        <Route path="rentabilite" element={<Rentabilite />} />
        <Route path="equipe"      element={<RizierRoute><Equipe /></RizierRoute>} />

        {/* Admin */}
        <Route path="admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="admin/users/:id"    element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
        <Route path="admin/audit"        element={<AdminRoute><AdminAudit /></AdminRoute>} />
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
