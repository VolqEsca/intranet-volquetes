import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/Login/LoginPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { ConfigPage } from "./pages/Config/ConfigPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const OrdersPage = () => (
  <h1 className="text-2xl font-bold">Módulo de Órdenes</h1>
);

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
        <Route path="/ordenes" element={<OrdersPage />} />
        <Route path="/configuracion" element={<ConfigPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
