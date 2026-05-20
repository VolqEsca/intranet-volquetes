import { createContext, useContext } from "react";

interface User {
  id: number;
  username: string;
  rol: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  created_at?: string;
  permissions: string[]; // ["orders:access", "employees:access", ...]
}

export type LoginResult =
  | { success: true }
  | { success: false; errorType: 'credentials' | 'network' | 'unknown' };

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUserInfo: (user: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
