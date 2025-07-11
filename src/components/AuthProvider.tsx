import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';

// Definimos la forma que tendrá la información del usuario
interface User {
  id: number;
  nombre: string;
}

// Definimos qué valores va a proveer nuestro contexto de autenticación
interface AuthContextType {
  user: User | null;
  login: (credentials: object) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Este es el componente proveedor
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para saber si estamos verificando la sesión inicial
  const navigate = useNavigate();

  // Función para verificar la sesión al cargar la app
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Hacemos una llamada al endpoint /api/session que creamos en el backend
        const response = await apiClient.get('/session');
        if (response.data.status === 'success') {
          setUser(response.data.user);
        }
      } catch (error) {
        // Si hay un error (ej. 401), el interceptor de axios nos redirigirá.
        console.error("No active session", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (credentials: object) => {
    const response = await apiClient.post('/login', credentials);
    if (response.data.status === 'success') {
      setUser(response.data.user);
      navigate('/'); // Redirigir al dashboard tras un login exitoso
    }
  };

  const logout = async () => {
    await apiClient.post('/logout');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Un hook personalizado para usar fácilmente el contexto en otros componentes
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}