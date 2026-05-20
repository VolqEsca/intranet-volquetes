import { Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { LoginPage } from "./pages/Login/LoginPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { ConfigPage } from "./pages/Config/ConfigPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { ForbiddenPage } from "./pages/Forbidden/ForbiddenPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ModuleRoute } from "./components/ModuleRoute";
import { OrdersPage } from './pages/Orders/OrdersPage';
import { ManufacturingOrdersPage } from './pages/ManufacturingOrders/ManufacturingOrdersPage';
import { EmployeesPage } from './pages/Employees/EmployeesPage';
import { VacationsPage } from './pages/Vacations/VacationsPage';

function App() {
  return (
    <>
      {/* ✅ TOASTER GLOBAL CON CONFIGURACIÓN CORPORATIVA VERSO */}
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
        theme="light"
        toastOptions={{
          style: {
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '0.875rem',
            borderRadius: '0.75rem',
          },
          className: 'shadow-lg border-0',
          duration: 4000,
          closeButton: true,
        }}
      />

      {/* Estructura de rutas existente sin cambios */}
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
          <Route path="/orders" element={<ModuleRoute module="orders"><OrdersPage /></ModuleRoute>} />
          <Route path="/manufacturing-orders" element={<ModuleRoute module="manufacturing-orders"><ManufacturingOrdersPage /></ModuleRoute>} />
          <Route path="/employees" element={<ModuleRoute module="employees"><EmployeesPage /></ModuleRoute>} />
          <Route path="/vacations" element={<ModuleRoute module="vacations"><VacationsPage /></ModuleRoute>} />
          <Route path="/configuracion" element={<ConfigPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/sin-acceso" element={<ForbiddenPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
