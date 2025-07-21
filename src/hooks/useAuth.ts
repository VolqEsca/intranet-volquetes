import { createContext, useContext } from "react";

interface User {
  id: number;
  username: string;
  rol: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (user: Partial<User>) => void; // <-- Sin el ? opcional
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
