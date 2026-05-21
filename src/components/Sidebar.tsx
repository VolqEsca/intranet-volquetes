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
  Star,
  Grid3X3,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";

interface ModuleDefinition {
  path: string;
  label: string;
  icon: React.ElementType;
  module: string;
}

const allModules: ModuleDefinition[] = [
  { path: "/orders",               label: "Órdenes de Reparación",  icon: Wrench,   module: "orders" },
  { path: "/manufacturing-orders", label: "Órdenes de Fabricación", icon: Factory,  module: "manufacturing-orders" },
  { path: "/employees",            label: "Empleados",              icon: Users,    module: "employees" },
  { path: "/vacations",            label: "Gestión de Vacaciones",  icon: Calendar, module: "vacations" },
];

const fixedDashboard = { path: "/", label: "Dashboard",       icon: LayoutDashboard };
const fixedConfig    = { path: "/configuracion", label: "Configuración", icon: Settings };

type NavItem = { path: string; label: string; icon: React.ElementType };

const renderNavItem = (item: NavItem) => {
  const Icon = item.icon;
  return (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm
         transition-all duration-200 relative
         ${isActive
           ? "bg-[#1162a6] text-white shadow-md"
           : "text-gray-600 hover:bg-[#f8fafc] hover:text-[#1162a6]"
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            className={isActive ? "text-white" : "text-gray-400 group-hover:text-[#1162a6] transition-colors"}
          />
          <span className="flex-1 truncate" title={item.label}>{item.label}</span>
          {isActive && <ChevronRight size={16} className="text-white/70" />}
        </>
      )}
    </NavLink>
  );
};

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { user } = useAuth();
  const { favorites } = useFavorites();

  // Función pura (no hook) que comprueba permiso usando el user del contexto
  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    return user.permissions.includes(`${module}:access`);
  };

  const accessibleModules = allModules.filter(m => hasPermission(m.module));

  const favoriteItems = favorites
    .map(favPath => accessibleModules.find(m => m.path === favPath))
    .filter((item): item is ModuleDefinition => item !== undefined);

  // Módulos accesibles no marcados como favorito
  const nonFavoriteModules = accessibleModules.filter(
    m => !favorites.includes(m.path)
  );

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-[#e2e8f0]">
      {/* Logo */}
      <div className="relative flex items-center justify-center h-16 border-b border-[#e2e8f0]">
        <img
          src="https://medios.volquetesescalante.com/verso/logo_verso.svg"
          alt="Logo Verso"
          className="h-10 w-auto"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">

          {/* 1. Dashboard — siempre visible */}
          {renderNavItem(fixedDashboard)}

          {/* 2. Favoritos — accesibles y marcados por el usuario */}
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

          {/* 3. Módulos disponibles — accesibles y no en favoritos */}
          {nonFavoriteModules.length > 0 && (
            <div className="py-3">
              <div className="px-4 text-xs font-semibold text-[#5487c0] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Grid3X3 size={12} className="text-[#5487c0]" />
                <span>Módulos</span>
              </div>
              <div className="space-y-1">
                {nonFavoriteModules.map(item => renderNavItem(item))}
              </div>
            </div>
          )}

          {/* 4. Configuración — solo admin */}
          {user?.rol === 'admin' && (
            <div className="pt-3 mt-3 border-t border-[#e2e8f0]">
              {renderNavItem(fixedConfig)}
            </div>
          )}

        </div>
      </nav>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-[#e2e8f0]">
        <p className="text-xs font-medium text-[#1162a6]">VERSO v2.1.0</p>
        <p className="text-xs text-gray-400 mt-0.5">Sistema Integral</p>
      </div>
    </div>
  );
};
