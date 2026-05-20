import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../hooks/useAuth';

interface ModuleRouteProps {
  module: string;
  children: React.ReactNode;
}

export const ModuleRoute = ({ module, children }: ModuleRouteProps) => {
  const { isLoading } = useAuth();
  const hasPermission = usePermission(module);

  // Esperar a que la sesión cargue antes de decidir
  if (isLoading) return null;

  if (!hasPermission) return <Navigate to="/sin-acceso" replace />;

  return <>{children}</>;
};
