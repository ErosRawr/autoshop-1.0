import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }   from './context/AuthContext'
import { ThemeProvider }           from './context/ThemeContext'
import DashboardPage   from './pages/DashboardPage'
import LoginPage       from './pages/LoginPage'
import CustomersPage   from './pages/CustomersPage'
import VehiclesPage    from './pages/VehiclesPage'
import WorkOrdersPage  from './pages/WorkOrdersPage'
import InvoicesPage    from './pages/InvoicesPage'
import InventoryPage   from './pages/InventoryPage'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login"      element={token ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers"  element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/vehicles"   element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
      <Route path="/workorders" element={<ProtectedRoute><WorkOrdersPage /></ProtectedRoute>} />
      <Route path="/invoices"   element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/inventory"  element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}