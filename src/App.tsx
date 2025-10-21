import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/Login/LoginPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { ConfigPage } from "./pages/Config/ConfigPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OrdersPage } from './pages/Orders/OrdersPage';
import ManufacturingOrdersPage from './pages/ManufacturingOrders/ManufacturingOrdersPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/manufacturing-orders" element={<ManufacturingOrdersPage />} />
        <Route path="/configuracion" element={<ConfigPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        
      </Route>
    </Routes>
  );
}

export default App;
