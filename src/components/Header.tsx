import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LogOut, User, ChevronDown, Menu } from "lucide-react";
import { Button } from "./ui/Button";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
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
    <header className="h-16 bg-white border-b border-[#e2e8f0] px-4 lg:px-8">
      <div className="h-full flex items-center justify-between lg:justify-end">

        {/* Hamburger — solo móvil/tablet */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1162a6] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        {/* Dropdown de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
            >
              <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-white font-medium">
                {/* Solución robusta al error TypeScript */}
                {(user?.nombre || user?.username || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.nombre && user?.apellidos
                    ? `${user.nombre} ${user.apellidos}`
                    : user?.username || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.rol || "Usuario"}
                </p>
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
                      : user?.username || "Usuario"}
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
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-[#dc2626]/10 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
      </div>
    </header>
  );
};