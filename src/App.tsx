import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/Login/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import OrdersPage from './pages/Orders/OrdersPage'
import ClientsPage from './pages/Clients/ClientsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="ordenes" element={<OrdersPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        {/* Futuras rutas de configuración irían aquí */}
        <Route path="configuracion" element={<div>Página de Configuración</div>} />
      </Route>
       <Route path="*" element={<div>Página 404 - No Encontrada</div>} />
    </Routes>
  )
}

export default App