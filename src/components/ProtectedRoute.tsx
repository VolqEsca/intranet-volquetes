import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Si todavía estamos cargando y verificando la sesión, mostramos un mensaje.
  if (isLoading) {
    return <div>Cargando...</div>; // O un componente de spinner más elegante
  }

  // Si no estamos autenticados, redirigimos al login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si todo está bien, mostramos la página solicitada.
  return <>{children}</>;
}