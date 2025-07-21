// src/pages/Config/components/UsersManagement.tsx
import React, { useState, useEffect } from "react";
import { apiClient } from "../../../api";
import { Button } from "../../../components/ui/Button";
import { UserModal } from "../../Users/components/UserModal";
import { PasswordModal } from "../../Users/components/PasswordModal";
import {
  Search,
  UserPlus,
  MoreVertical,
  Edit2,
  Lock,
  Trash2,
  User,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: string;
  created_at: string;
}

export const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  const fetchUsers = async () => {
    try {
      setError("");
      const response = await apiClient.get("/users/list.php");
      console.log("Usuarios recibidos:", response.data); // Debug

      // Asegurarnos de que tenemos un array
      const usersData = Array.isArray(response.data) ? response.data : [];

      // Normalizar los datos por si vienen con diferentes formatos
      const normalizedUsers = usersData.map((user: any) => ({
        id: user.id || 0,
        username: user.username || "",
        email: user.email || "",
        nombre: user.nombre || "",
        apellidos: user.apellidos || "",
        rol: user.rol || "Usuario",
        created_at: user.created_at || new Date().toISOString(),
      }));

      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("Error al cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      await apiClient.delete(`/users/delete.php?id=${userId}`);
      await fetchUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setError("Error al eliminar el usuario");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.nombre.toLowerCase().includes(searchLower) ||
      user.apellidos.toLowerCase().includes(searchLower) ||
      user.rol.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (rol: string) => {
    const rolLower = rol.toLowerCase();
    if (rolLower.includes("admin")) return "bg-purple-100 text-purple-800";
    if (rolLower.includes("editor")) return "bg-green-100 text-green-800";
    if (rolLower.includes("usuario")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getInitials = (user: User) => {
    if (user.nombre && user.apellidos) {
      return `${user.nombre[0]}${user.apellidos[0]}`.toUpperCase();
    } else if (user.nombre) {
      return user.nombre.substring(0, 2).toUpperCase();
    } else {
      return user.username.substring(0, 2).toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <Button onClick={fetchUsers} size="sm" className="ml-auto">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const adminCount = users.filter((u) =>
    u.rol.toLowerCase().includes("admin")
  ).length;
  const lastUserDate =
    users.length > 0
      ? new Date(
          Math.max(...users.map((u) => new Date(u.created_at).getTime()))
        )
      : new Date();

  const daysSinceLastUser = Math.floor(
    (new Date().getTime() - lastUserDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <User className="w-8 h-8 text-primary-dark opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 opacity-20"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Último Registro</p>
              <p className="text-sm font-medium text-gray-900">
                {daysSinceLastUser === 0
                  ? "Hoy"
                  : `Hace ${daysSinceLastUser} días`}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredUsers.length} de {users.length} usuarios
            </span>
            <Button
              onClick={() => {
                setSelectedUser(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <UserPlus size={18} />
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No se encontraron usuarios con ese criterio de búsqueda"
                      : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-dark/10 rounded-full flex items-center justify-center">
                          <span className="text-primary-dark font-medium">
                            {getInitials(user)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.nombre || user.apellidos
                              ? `${user.nombre} ${user.apellidos}`.trim()
                              : "Sin nombre completo"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {user.email || "Sin email"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.rol
                        )}`}
                      >
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(
                              activeDropdown === user.id ? null : user.id
                            );
                          }}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsUserModalOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Edit2 size={16} />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsPasswordModalOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Lock size={16} />
                              Cambiar Contraseña
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleDeleteUser(user.id);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug info - quitar en producción */}
      {users.length === 0 && !loading && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> No se recibieron usuarios del servidor.
            Verifica la consola para más detalles.
          </p>
        </div>
      )}

      {/* Modales */}
      {isUserModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => setIsUserModalOpen(false)}
          onSave={() => {
            fetchUsers();
            setIsUserModalOpen(false);
          }}
        />
      )}

      {isPasswordModalOpen && selectedUser && (
        <PasswordModal
          userId={selectedUser.id}
          username={selectedUser.username}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};
