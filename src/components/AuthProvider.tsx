import React, { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { AuthContext } from "../hooks/useAuth";

interface User {
  id: number;
  username: string;
  rol: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  created_at?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await apiClient.get("/check-session.php");
      console.log("Check session response:", response.data); // Debug temporal

      if (response.data.authenticated && response.data.user) {
        // IMPORTANTE: Asegurarse de que se guarden TODOS los campos
        const userData = response.data.user;
        setUser({
          id: userData.id,
          username: userData.username,
          rol: userData.rol,
          email: userData.email || "",
          nombre: userData.nombre || "",
          apellidos: userData.apellidos || "",
          created_at: userData.created_at || "",
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error verificando sesión:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/login", { username, password });
      if (response.data && response.data.user) {
        // Guardar TODOS los campos del usuario
        const userData = response.data.user;
        setUser({
          id: userData.id,
          username: userData.username,
          rol: userData.rol,
          email: userData.email || "",
          nombre: userData.nombre || "",
          apellidos: userData.apellidos || "",
          created_at: userData.created_at || "",
        });
        navigate("/", { replace: true });
        return true;
      }
      return false;
    } catch (error) {
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/logout.php");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  const updateUserInfo = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      console.log("Usuario actualizado en contexto:", newUser); // Debug
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
