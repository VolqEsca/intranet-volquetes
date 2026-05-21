import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Key,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../api";
import { UserModal } from "./components/UserModal";
import { PasswordModal } from "./components/PasswordModal";
import { getRoleConfig } from "../../config/roles";
import { dialog } from "../../services/dialog.service";

interface User {
  id: number;
  username: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  rol: string;
  created_at: string;
}

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const canManageUsers = currentUser?.rol === "admin" || currentUser?.rol === "Administrador";

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/users/list.php");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("Error al cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreating(true);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsCreating(false);
    setIsUserModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    const userName = userToDelete?.username || 'este usuario';

    const confirmed = await dialog.confirm(
      `¿Estás seguro de que quieres eliminar a "${userName}"? Esta acción no se puede deshacer.`,
      'Eliminar Usuario',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'warning'
      }
    );

    if (!confirmed) return;

    try {
      await apiClient.delete(`/users/delete.php?id=${userId}`);
      await dialog.success(`Usuario "${userName}" eliminado correctamente`);
      fetchUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      await dialog.error(
        'No se pudo eliminar el usuario. Por favor, inténtalo de nuevo.',
        'Error al eliminar'
      );
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (isCreating) {
        await apiClient.post("/users/create.php", userData);
        await dialog.success('Usuario creado correctamente');
      } else if (selectedUser) {
        await apiClient.put("/users/update.php", {
          ...userData,
          id: selectedUser.id,
        });
        await dialog.success('Usuario actualizado correctamente');
      }
      fetchUsers();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      throw error;
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!selectedUser) return;

    try {
      await apiClient.put("/users/password.php", {
        id: selectedUser.id,
        password,
      });
      await dialog.success(`Contraseña actualizada correctamente para "${selectedUser.username}"`);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      throw error;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const roleA = getRoleConfig(a.rol);
    const roleB = getRoleConfig(b.rol);
    return roleA.order - roleB.order;
  });

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            No tienes permisos para gestionar usuarios.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleCreateUser} className="flex items-center gap-2">
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1162a6]"></div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 border-l-4 border-[#dc2626] bg-[#dc2626]/5 px-4 py-3 text-[#dc2626]">
          <span className="text-sm leading-snug">{error}</span>
          <Button onClick={fetchUsers} variant="subtle" className="ml-auto flex-shrink-0">Reintentar</Button>
        </div>
      ) : sortedUsers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            {searchTerm
              ? "No se encontraron usuarios con ese criterio de búsqueda"
              : "No hay usuarios registrados"}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-xl border border-[#e2e8f0] shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2e8f0]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
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
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e2e8f0]">
                {sortedUsers.map((user) => {
                  const roleInfo = getRoleConfig(user.rol);
                  const RoleIcon = roleInfo.icon;
                  return (
                    <tr key={user.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#1162a6] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            {user.nombre && (
                              <div className="text-sm text-gray-500">
                                {user.nombre} {user.apellidos}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || 'Sin email'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <RoleIcon size={16} />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                            className="text-gray-400 hover:text-[#1162a6] hover:bg-[#a2bade]/10"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleChangePassword(user)}
                            title="Cambiar contraseña"
                            className="text-gray-400 hover:text-[#1162a6] hover:bg-[#a2bade]/10"
                          >
                            <Key size={16} />
                          </Button>
                          {user.id !== currentUser?.id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Eliminar usuario"
                              className="text-gray-400 hover:text-[#dc2626] hover:bg-[#dc2626]/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              title="No puedes eliminarte a ti mismo"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modales */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        isCreating={isCreating}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
        username={selectedUser?.username || ""}
      />
    </div>
  );
};
