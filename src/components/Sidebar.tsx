// src/components/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  ChevronRight, 
  Wrench, 
  Factory, 
  Users, 
  Calendar,
  Star 
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";

// ✅ Catálogo completo de módulos (solo para mapear favoritos)
const allModules = [
  {
    path: "/orders",
    label: "Órdenes de Reparación",
    icon: Wrench,
    roles: ["admin", "operador", "viewer"],
  },
  {
    path: "/manufacturing-orders",
    label: "Órdenes de Fabricación",
    icon: Factory,
    roles: ["admin", "operador", "viewer"],
  },
  {
    path: "/employees",
    label: "Empleados",
    icon: Users,
    roles: ["admin", "operador", "viewer"],
  },
  {
    path: "/vacations",
    label: "Gestión de Vacaciones",
    icon: Calendar,
    roles: ["admin", "operador", "viewer"],
  },
];

// ✅ Items fijos (siempre visibles)
const fixedItems = {
  dashboard: {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "operador", "viewer"],
  },
  config: {
    path: "/configuracion",
    label: "Configuración", 
    icon: Settings,
    roles: ["admin", "operador", "viewer"],
  }
};

export const Sidebar = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites(); // ✅ Hook sincronizado v14.3.1

  // ✅ Mantener orden FIFO (orden de marcado) usando el array favorites como referencia
  const favoriteItems = favorites
    .map(favPath => allModules.find(m => m.path === favPath))
    .filter(item => item && item.roles.includes(user?.rol || "viewer")) as typeof allModules;

  // Helper para renderizar items con paleta VERSO estricta
  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/"}
        className={({ isActive }) => `
          group flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm
          transition-all duration-200 relative
          ${
            isActive
              ? "bg-[#1162a6] text-white shadow-md" // ✅ Paleta VERSO Primary
              : "text-gray-600 hover:bg-[#f8fafc] hover:text-[#1162a6]"
          }
        `}
      >
        {({ isActive }) => (
          <>
            <Icon
              size={20}
              className={
                isActive
                  ? "text-white"
                  : "text-gray-400 group-hover:text-[#1162a6] transition-colors"
              }
            />
            <span className="flex-1">{item.label}</span>
            {isActive && (
              <ChevronRight size={16} className="text-white/70" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-[#e2e8f0]">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-[#e2e8f0]">
        <img
          src="https://medios.volquetesescalante.com/verso/logo_verso.svg"
          alt="Logo Verso"
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          
          {/* ✅ 1. Dashboard (siempre primero y fijo) */}
          {renderNavItem(fixedItems.dashboard)}

          {/* ✅ 2. Sección favoritos (solo si hay favoritos) */}
          {favoriteItems.length > 0 && (
            <div className="py-3">
              <div className="px-4 text-xs font-semibold text-[#1162a6] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Star size={12} className="text-[#1162a6]" />
                <span>Favoritos</span>
              </div>
              <div className="space-y-1">
                {favoriteItems.map(item => renderNavItem(item))}
              </div>
            </div>
          )}

          {/* ✅ 3. Configuración (siempre al final y fijo) */}
          <div className="pt-3 mt-3 border-t border-[#e2e8f0]">
            {renderNavItem(fixedItems.config)}
          </div>

        </div>
      </nav>

      {/* ✅ Footer actualizado v14.3.1 */}
      <div className="p-4 border-t border-[#e2e8f0]">
        <div className="px-4 py-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
          <p className="text-xs font-medium text-[#1162a6]">VERSO v14.3.1</p>
          <p className="text-xs text-gray-500 mt-1">
            Sistema Integral • Command Center
          </p>
        </div>
      </div>
    </div>
  );
};
