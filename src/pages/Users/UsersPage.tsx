import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  User,
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

  // Solo admins pueden acceder - verificamos ambos formatos
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
      console.log("Usuarios recibidos:", response.data);
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

  // Ordenar usuarios por rol (usando el orden definido en la configuración)
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
    <div className="p-6">
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
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
            />
          </div>
        </Card>

        {/* Lista de usuarios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark"></div>
          </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchUsers}>Reintentar</Button>
            </div>
          </Card>
        ) : sortedUsers.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              {searchTerm 
                ? "No se encontraron usuarios con ese criterio de búsqueda"
                : "No hay usuarios registrados"
              }
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Encabezado de la lista */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Usuario</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Rol</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Lista de usuarios como filas */}
            {sortedUsers.map((user) => {
              const roleInfo = getRoleConfig(user.rol);
              const RoleIcon = roleInfo.icon;

              return (
                <Card
                  key={user.id}
                  className="p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Usuario */}
                    <div className="col-span-12 lg:col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.username}
                          </h3>
                          {user.nombre && (
                            <p className="text-sm text-gray-600">
                              {user.nombre} {user.apellidos}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-12 lg:col-span-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={16} className="text-gray-400 lg:hidden" />
                        <span className="text-sm">{user.email || 'Sin email'}</span>
                      </div>
                    </div>

                    {/* Rol */}
                    <div className="col-span-12 lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <RoleIcon size={16} />
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}
                        >
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="col-span-12 lg:col-span-2">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={16} className="text-gray-400 lg:hidden" />
                        <span className="text-sm">
                          {new Date(user.created_at).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-12 lg:col-span-1">
                      <div className="flex gap-2 lg:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="flex items-center gap-1"
                          title="Editar usuario"
                        >
                          <Edit size={16} />
                          <span className="lg:hidden">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangePassword(user)}
                          className="flex items-center gap-1"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                          <span className="lg:hidden">Contraseña</span>
                        </Button>
                        {user.id !== currentUser?.id ? (
                          <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex items-center gap-1 text-secondary hover:bg-light-accent/20 hover:text-primary-dark"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                          <span className="lg:hidden">Eliminar</span>
                        </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                            title="No puedes eliminarte a ti mismo"
                          >
                            <Trash2 size={16} />
                            <span className="lg:hidden">Eliminar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
    </div>
  );
};
