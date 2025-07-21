import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Bell, Search, LogOut, User, Key, ChevronDown } from "lucide-react";
import { Button } from "./ui/Button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    setIsProfileOpen(false);
    navigate("/perfil");
  };

  const handleChangePassword = () => {
    setIsProfileOpen(false);
    navigate("/perfil");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8">
      <div className="h-full flex items-center justify-between">
        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar órdenes, clientes..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center gap-4 ml-8">
          {/* Notificaciones */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Separador */}
          <div className="h-8 w-px bg-gray-200"></div>

          {/* Dropdown de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
            >
              <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-white font-medium">
                {(
                  user?.nombre?.charAt(0) || user?.username.charAt(0)
                ).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.nombre && user?.apellidos
                    ? `${user.nombre} ${user.apellidos}`
                    : user?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombre && user?.apellidos
                      ? `${user.nombre} ${user.apellidos}`
                      : user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || "Sin email"}
                  </p>
                </div>

                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} />
                  Mi Perfil
                </button>

                <div className="h-px bg-gray-200 my-1"></div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
