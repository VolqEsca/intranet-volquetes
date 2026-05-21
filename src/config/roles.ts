// src/config/roles.ts
import { Shield, UserCheck, UserX } from "lucide-react";

export const ROLES_CONFIG = {
  admin: {
    value: "admin",
    label: "Administrador",
    color: "bg-[#1162a6] text-white",
    icon: Shield,
    order: 1,
  },
  Administrador: {
    value: "Administrador",
    label: "Administrador",
    color: "bg-[#1162a6] text-white",
    icon: Shield,
    order: 1,
  },
  operador: {
    value: "operador",
    label: "Operador",
    color: "bg-[#a2bade]/30 text-[#1162a6]",
    icon: UserCheck,
    order: 2,
  },
  viewer: {
    value: "viewer",
    label: "Solo Consulta",
    color: "bg-gray-100 text-gray-800",
    icon: UserX,
    order: 3,
  },
};

// Array ordenado de roles para selects
export const ROLES_OPTIONS = Object.values(ROLES_CONFIG)
  .filter((role, index, self) => 
    index === self.findIndex((r) => r.label === role.label)
  )
  .sort((a, b) => a.order - b.order)
  .map(role => ({
    value: role.value,
    label: role.label,
  }));

// Función helper para obtener la configuración de un rol
export const getRoleConfig = (rol: string) => {
  const rolLower = rol.toLowerCase();
  
  // Buscar coincidencia exacta primero
  if (rol in ROLES_CONFIG) return ROLES_CONFIG[rol as keyof typeof ROLES_CONFIG];
  
  // Buscar por coincidencia parcial
  if (rolLower.includes('admin')) return ROLES_CONFIG.admin;
  if (rolLower.includes('operador')) return ROLES_CONFIG.operador;
  if (rolLower.includes('viewer')) return ROLES_CONFIG.viewer;
  
  // Default
  return {
    value: rol,
    label: rol,
    color: "bg-gray-100 text-gray-800",
    icon: UserCheck,
    order: 99,
  };
};
