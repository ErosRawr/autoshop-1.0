import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }     from './context/AuthContext'
import { ThemeProvider }             from './context/ThemeContext'
import { LocationProvider }          from './context/LocationContext'
import DashboardPage   from './pages/DashboardPage'
import LoginPage       from './pages/LoginPage'
import CustomersPage   from './pages/CustomersPage'
import VehiclesPage    from './pages/VehiclesPage'
import WorkOrdersPage  from './pages/WorkOrdersPage'
import AppointmentsPage from './pages/AppointmentsPage'
import MechanicsPage from './pages/MechanicsPage'
import InvoicesPage    from './pages/InvoicesPage'
import InventoryPage   from './pages/InventoryPage'
import LocationsPage from './pages/LocationsPage'
import SuppliersPage from './pages/SuppliersPage'
import PartsPage from './pages/PartsPage'

/**
 * Basic authentication guard
 */
function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

/**
 * Role-based permission guard
 * Redirects to dashboard if the user doesn't have the required role
 */
function RoleRoute({ children, roles }) {
  const { user } = useAuth()
  
  if (!user) return <Navigate to="/login" />
  
  return roles.includes(user?.role) 
    ? children 
    : <Navigate to="/" />
}

function AppRoutes() {
  const { token } = useAuth()
  
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage />} />
      
      {/* Publicly accessible for all authenticated users */}
      <Route path="/" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      
      <Route path="/customers" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin', 'receptionist']}>
            <CustomersPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/vehicles" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin', 'receptionist', 'mechanic']}>
            <VehiclesPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/workorders" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin', 'receptionist', 'mechanic']}>
            <WorkOrdersPage />
          </RoleRoute>
        </ProtectedRoute>
      } />

      <Route path="/appointments" element={
        <ProtectedRoute>
          <AppointmentsPage />
        </ProtectedRoute>
      } />

      <Route path="/mechanics" element={
        <ProtectedRoute>
          <MechanicsPage />
        </ProtectedRoute>
      } />

      {/* Restricted to Office Staff */}
      <Route path="/invoices" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin', 'receptionist']}>
            <InvoicesPage />
          </RoleRoute>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin', 'receptionist']}>
            <InventoryPage />
          </RoleRoute>
        </ProtectedRoute>
      } />

      <Route path="/parts" element={
        <ProtectedRoute>
          <PartsPage />
        </ProtectedRoute>
      } />

      <Route path="/suppliers" element={
        <ProtectedRoute>
          <SuppliersPage />
        </ProtectedRoute>
      } />

      {/* Strictly Admin Only */}
      <Route path="/locations" element={
        <ProtectedRoute>
          <RoleRoute roles={['admin']}>
            <LocationsPage />
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function AuthenticatedApp() {
  return (
    <LocationProvider>
      <AppRoutes />
    </LocationProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}