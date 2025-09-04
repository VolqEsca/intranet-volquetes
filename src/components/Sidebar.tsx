import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Truck, Settings, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";


const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "operador", "viewer"],
  },
  {
    path: "/orders",  // Cambiado de "/ordenes" a "/orders"
    label: "Órdenes",
    icon: Truck,
    roles: ["admin", "operador", "viewer"],
  },
  {
    path: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["admin", "operador", "viewer"],
  },
];


export const Sidebar = () => {
  const { user } = useAuth();


  // Filtrar items según el rol
  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.rol || "viewer")
  );


  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <img
          src="https://medios.volquetesescalante.com/verso/logo_verso.svg"
          alt="Logo Verso"
          className="h-10 w-auto"
        />
      </div>


      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {visibleItems.map((item) => {
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
                      ? "bg-primary-dark text-white shadow-md"
                      : "text-gray-600 hover:bg-light-accent/20 hover:text-primary-dark hover:border-l-4 hover:border-secondary"
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
                          : "text-gray-400 group-hover:text-secondary transition-colors"
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
          })}
        </div>
      </nav>


      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-3 bg-light-accent/10 rounded-lg border border-light-accent/20">
          <p className="text-xs font-medium text-primary-dark">VERSO v1.0</p>
          <p className="text-xs text-gray-500 mt-1">
            © 2025 Volquetes Escalante
          </p>
        </div>
      </div>
    </div>
  );
};
